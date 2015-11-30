// A Session with users
function ReplicatorSession(replicator) {
  this.variables = {};
  this.users = [];
  this.replicator = replicator;
  this.eventListener = {}; // holds functions which will be executed if a related event fires
}

// Create a session and register it on connection broker
ReplicatorSession.prototype.create = function(password) {
  this.password = password
  this.host = true;
  this._sequenceNumber = 0;
  var self = this;
  this.replicator.socket.emit('create-session', this.replicator.id, this.password, function(id) {
    self.id = id;
    self.replicator.mySessions[id] = self;
  });
}

// Join a session that is registered on the connection broker
ReplicatorSession.prototype.join = function(sessionId) {
  var session = this;
  var idOwner = this.replicator.sessions[sessionId].owner;
  var idSession = this.replicator.sessions[sessionId].id;
  this.id = idSession;
  this.owner = idOwner;
  console.log('the owner of this session is', idOwner)
  this.joined = false;

  // connect to server peer, if there is not data stream yet
  console.log('I want to join, connection to server: ', this.replicator.unreliableConnections[idOwner])
  if (!this.replicator.unreliableConnections[idOwner]) {
    this.replicator.connectToPeer(idOwner);
  }

  this.initConnectionInfo(idOwner);

  var self = this;
  // request to join the session
  window.setTimeout(function() {
    console.log(self.replicator.unreliableConnections[idOwner]);
    self.sendReliableMessage(self.replicator.unreliableConnections[idOwner], {
      type: MESSAGE_REQUEST_JOIN
    });
  }, 1000);

  this.replicator.mySessions[idSession] = this;
}

// Register a variable within a session
ReplicatorSession.prototype.registerVariable = function(variable) {
  if (!this.host) {

    this.variables[variable.identifier] = variable;
    var setVariable = variable;

    if (setVariable.type == REPLICATE_RELIABLE) {
      var session = this;

      setVariable.parent.watch(setVariable.name, function(i, o, n) {
        // no changes recognized
        if (o == n) {
          return n;
        }

        if (setVariable.destination == REPLICATE_CLSV && setVariable.owner == this.replicator.id) {
          // send to host
          session.sendReliableMessage(this.replicator.unreliableConnections[session.owner], {
            type: MESSAGE_SET_VARIABLE_RELIABLE,
            id: setVariable.identifier,
            val: n
          })
        }
        return n;
      });
    }
  } else {
    this.variables[variable.identifier] = variable;

    if (variable.type == REPLICATE_RELIABLE) {
      var session = this;

      variable.parent.watch(variable.name, function(i, o, n) {
        // no changes recognized
        if (o == n) {
          return n;
        }

        // set up reliable variable change watcher because we are the owner and send our changes to the server if we are not the server
        if ((variable.destination == REPLICATE_CLSVCL || variable.destination == REPLICATE_SVCL) && this.owner) {
          console.log('a reliable was changed, send a reliable message to all other peers!')
          for (var user of session.users) {
            console.log('to', this.replicator.unreliableConnections[user])
            session.sendReliableMessage(this.replicator.unreliableConnections[user], {
              type: MESSAGE_SET_VARIABLE_RELIABLE,
              id: variable.identifier,
              val: n
            })
          }
        }

        return n;
      });
    }
  }
  return this.variables[variable.identifier]
}

// send a reliable message to the other data channel
ReplicatorSession.prototype.sendReliableMessage = function(other, message) {
  if (!this.host) {
    other = this.replicator.unreliableConnections[this.owner];
  }

  console.log(other)

  other.connectionInfo[this.id].unackedReliableMessages.push(message);

}

// send for each peer-authorized variable its information to that peer
ReplicatorSession.prototype.sendResponsibleVariables = function(peerId) {
  if (!this.host) {
    return;
  }

  var variables = [];
  for (var variableIndex in this.variables) {
    var variable = this.variables[variableIndex];
    // send owner's variables and variables shared by everyone (server's variables)
    if (variable.owner == peerId || variable.owner == this.replicator.id) {
      variables.push({
        identifier: variable.identifier,
        type: variable.type,
        destination: variable.destination,
      });
    }
  }

  this.sendReliableMessage(this.replicator.unreliableConnections[peerId], {
    type: MESSAGE_NOTICE_RESPONSIBLE_VARIABLES,
    variables: variables
  });
}

// at 20hz rate send the unreliable registered state snapshots
ReplicatorSession.prototype.serverTick = function() {
  // send an unreliable snapshot of the variables
  // console.log('srv tick')
  // set sequence number
  this._sequenceNumber++;

  // gather variables
  var variables = [];
  for (var variableIndex in this.variables) {
    var variable = this.variables[variableIndex];

    if ((variable.destination == REPLICATE_SVCL || variable.destination == REPLICATE_CLSVCL) && variable.type == REPLICATE_UNRELIABLE) {
      var varData = {
        id: variable.identifier,
        val: variable.serializeFn(variable.parent[variable.name]),
      };
      variables.push(varData)
    }
  }

  // console.log(variables)
  // console.log(this)

  // send to all users TODO: EXCEPT the owner who has modified it???
  for (var i = 0; i < this.users.length; i++) {
    var user = this.users[i];
    // console.log('checking', user)
    // TODO: skip not connected peers but do send to local sessions
    // if (!this.replicator.unreliableConnections[user].open) {
    //   continue;
    // }

    // console.log('sending to client', user);

    var other = this.replicator.unreliableConnections[user];

    this.replicator.sendPacket(this, user, {
      ts: new Date().getTime(),
      nr: this._sequenceNumber,
      messages: [{
        type: MESSAGE_DATA,
        data: variables,
      }],
      reliable: other.connectionInfo[this.id].unackedReliableMessages,
      reliableId: other.connectionInfo[this.id].unackedReliableMessagesFirstNumber,
      reliableLn: other.connectionInfo[this.id].unackedReliableMessages.length,
      lastReceivedReliableAck: other.connectionInfo[this.id].lastSentReliableAck
    });
  }
}

// at 60hz send unreliable client input
ReplicatorSession.prototype.clientTick = function() {
  // gather variables
  var variables = [];
  for (var variableIndex in this.variables) {
    var variable = this.variables[variableIndex];

    if ((variable.destination == REPLICATE_CLSV || variable.destination == REPLICATE_CLSVCL) && variable.type == REPLICATE_UNRELIABLE) {
      /*if (typeof variable.name === 'undefined' || typeof variable.parent[variable.name] === 'undefined') {
        console.log('Warning: Wrong bound variable')
        continue;
      }*/

      var varData = {
        id: variable.identifier,
        val: variable.serializeFn(variable.parent[variable.name]),
      };
      variables.push(varData)
    }
  }


  // console.log('sending to server', variables)
  // send to server
  var other = this.replicator.unreliableConnections[this.owner];
  this.replicator.sendPacket(this, this.owner, {
    ts: new Date().getTime(),
    //sequence: this.count
    messages: [{
      type: MESSAGE_DATA,
      data: variables,
    }],
    reliable: other.connectionInfo[this.id].unackedReliableMessages,
    reliableId: other.connectionInfo[this.id].unackedReliableMessagesFirstNumber,
    reliableLn: other.connectionInfo[this.id].unackedReliableMessages.length,
    lastReceivedReliableAck: other.connectionInfo[this.id].lastSentReliableAck
  });

}

ReplicatorSession.prototype.onPeerJoined = function(peerId) {
  console.log(peerId, 'joined');
}

ReplicatorSession.prototype.onResponsibleVariablesNotice = function() {

}

// this will be executed when data had been received and the variables were set
ReplicatorSession.prototype.onMessageDataUpdated = function() {

}

// add an event listener function
ReplicatorSession.prototype.on = function(eventName, listenerFn) {
  if (!this.eventListener[eventName]) {
    this.eventListener[eventName] = []
  }
  this.eventListener[eventName].push(listenerFn);
}

// 
ReplicatorSession.prototype.onMessage = function(other, data) {
  // console.log('message', data, ', from', other.peer)
  // console.log(this)
  switch (data.type) {

    case MESSAGE_REQUEST_JOIN:
      console.log('peer', other.peer, 'wants to join', this.id);
      console.log('current users', this.users)
      if (this.users.indexOf(other.peer) < 0) {
        this.users.push(other.peer);

        this.initConnectionInfo(other.peer);

        // send join-granted message
        this.sendReliableMessage(other, {
          type: MESSAGE_GRANT_JOIN,
          sessionId: this.id
        });

        // execute session's *new-client-joined* listener function, for example to register new responsible variables for the client
        this.onPeerJoined(other.peer);

        // then send the responsible variables to the client
        console.log('sending responsible variables to', other.peer)
        this.sendResponsibleVariables(other.peer);

      }
      break;

      // after a join request: receive the information about the session
    case MESSAGE_GRANT_JOIN:
      console.log('received MESSAGE_GRANT_JOIN ', data.sessionId, '!');
      this.joined = true;
      break;

    case MESSAGE_NOTICE_RESPONSIBLE_VARIABLES:
      console.log('received MESSAGE_NOTICE_RESPONSIBLE_VARIABLES', data.variables);

      for (var i = 0; i < data.variables.length; i++) {
        var variable = data.variables[i];

        if (!this.variables[variable.identifier]) {
          this.variables[variable.identifier] = {}
        }
        console.log(variable.identifier)
        this.variables[variable.identifier].identifier = variable.identifier;
        this.variables[variable.identifier].type = variable.type;
        this.variables[variable.identifier].destination = variable.destination;
      }

      this.onResponsibleVariablesNotice();

      break;

    case MESSAGE_SET_VARIABLE_RELIABLE:
      if (this.variables[data.id]) {
        console.log('set reliable', data.id, data.val)

        var variable = this.variables[data.id];
        variable.parent[variable.name] = variable.deserializeFn(data.val);
      }
      break;

    case MESSAGE_DATA:
      var allData = data.data;
      // console.log('received from', other.peer, 'the data', allData)

      for (var i = 0; i < allData.length; i++) {
        var data = allData[i];
        var variable = this.variables[data.id];

        // todo: Check if the other peer was allowed to change the local data
        if (variable) {
          if (variable.destination != REPLICATE_CLSVCL && variable.destination != REPLICATE_SVCL) {
            continue;
          }

          // skip if we own the variable and we receive the servers old version of it
          if (variable.destination == REPLICATE_CLSVCL && variable.owner == this.replicator.id) {
            continue;
          }

          // console.log(data)
          if (typeof variable.deserializeFn == 'undefined') {
            // console.log(variable.identifier, 'error: no deserializeFn specified');
          } else {
            var value = variable.deserializeFn(data.val);
            variable.parent[variable.name] = value;
            variable.history = value;
            variable.shouldUpdate = true;
          }
        }
      }

      this.onMessageDataUpdated();
      break;

    default:
      console.log('Could not handle', data.type);
      break;
  }

  // call listening functions
  var eventListener = this.eventListener[data.type];
  if (eventListener) {
    for (var i = 0; i < eventListener.length; i++) {
      eventListener[i](data);
    }
  }
}

ReplicatorSession.prototype.initConnectionInfo = function(otherPeerId) {
  if (!this.replicator.unreliableConnections[otherPeerId].connectionInfo[this.id]) {
    this.replicator.unreliableConnections[otherPeerId].connectionInfo[this.id] = {
      unackedReliableMessages: [], // holds a list of event messages that have been sent but still are not acknowledged
      unackedReliableMessagesFirstNumber: -1, // the number of the first reliable message that is unacked
      lastReceivedGameTime: 0,
      lastReceivedReliableAck: -1,
      lastSentReliableAck: -1
    }
  }
}

ReplicatorSession.prototype.onReceive = function(other, data) {
  // If server: Order the snapshot's variables after the snapshot sequence number, store historically
  // If client: Update variables with snapshot if snapshot is newer than old one

  // console.log('received', other, data)
  var self = this;

  // track when the last update came to predict from this point of time to the future
  this.lastReceivedGameTime = window.performance.now();

  this.initConnectionInfo(other.peer);

  if (data.ts >= other.connectionInfo[this.id].lastReceivedGameTime) {
    other.connectionInfo[this.id].lastReceivedGameTime = data.ts; // the time of the last received snapshot

    // handle unreliable messages
    var messages = data.messages;
    // console.log('**unreliable**')
    for (var i = 0; i < messages.length; i++) {
      var message = messages[i];

      if (this.replicator.FAKE_LAG) {
        // fake lag
        window.setTimeout(function() {
          self.onMessage(other, message);
        }, this.replicator.FAKE_LAG)
      } else {
        self.onMessage(other, message);
      }
    }
  }

  // acknowledge reliable message and handle them, if they are new!

  // console.log('I received a few reliable messages from my counterpart', data.reliable)
  // console.log('Starting with number', data.reliableId, 'with an array size of', data.reliableLn)


  // confirm that we got new messages
  var newReceivedNumber = data.reliableId + data.reliableLn;
  // console.log('newReceivedNumber', newReceivedNumber)
  // console.log('other.lastSentReliableAck', other.lastSentReliableAck)

  if (newReceivedNumber > other.connectionInfo[this.id].lastSentReliableAck) {
    other.connectionInfo[this.id].lastSentReliableAck = newReceivedNumber; // to send later the number I got

    var reliable = data.reliable;
    // console.log('**reliable**')
    // reliable
    for (var i = 0; i < reliable.length; i++) {
      var rMessage = reliable[i];

      this.onMessage(other, rMessage);
    }
  }

  // console.log('data.lastReceivedReliableAck', data.lastReceivedReliableAck)
  // console.log('other.lastReceivedReliableAck', other.lastReceivedReliableAck)
  // check if the other got more of my messages

  if (data.lastReceivedReliableAck > other.connectionInfo[this.id].lastReceivedReliableAck || data.lastReceivedReliableAck < 0) {
    other.connectionInfo[this.id].lastReceivedReliableAck = data.lastReceivedReliableAck;

    // console.log('I have unacked messages of this client, namely', other.unackedReliableMessages, 'starting with number', other.unackedReliableMessagesFirstNumber);
    // console.log('But I just got that the other has received number', data.lastReceivedReliableAck, ', so adjust my not acked list:')

    var cut = data.lastReceivedReliableAck - other.connectionInfo[this.id].unackedReliableMessagesFirstNumber;
    // console.log('I have to cut', cut, 'entries')

    // console.log('Before I have this unacked messages:', other.unackedReliableMessages)
    other.connectionInfo[this.id].unackedReliableMessages = other.connectionInfo[this.id].unackedReliableMessages.splice(cut);
    // console.log('Afterwards these: ', other.unackedReliableMessages)
    other.connectionInfo[this.id].unackedReliableMessagesFirstNumber += cut;
  }

}
