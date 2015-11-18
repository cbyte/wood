// A Session with users
function ReplicatorSession() {
  this.variables = {};
}

// Create a session and register it on connection broker
ReplicatorSession.prototype.create = function(password) {
  this.password = password
  this.host = true;
  this.users = [];
  this._sequenceNumber = 0;
  var self = this;
  Replicator.socket.emit('create-session', Replicator.id, this.password, function(id) {
    self.id = id;
    Replicator.mySessions[id] = self;
  });
}

// Join a session that is registered on the connection broker
ReplicatorSession.prototype.join = function(sessionId) {
  var session = this;
  var idOwner = Replicator.sessions[sessionId].owner;
  var idSession = Replicator.sessions[sessionId].id;
  this.id = idSession;
  this.owner = idOwner;
  this.joined = false;

  // connect to server peer, if there is not data stream yet
  console.log('I want to join, connection to server: ', Replicator.unreliableConnections[idOwner])
  if (!Replicator.unreliableConnections[idOwner]) {
    Replicator.connectToPeer(idOwner);
  }

  var self = this;
  // request to join the session
  window.setTimeout(function() {
    console.log(Replicator.unreliableConnections[idOwner]);
    self.sendReliableMessage(null, {
      type: MESSAGE_REQUEST_JOIN
    });
  }, 1000);

  Replicator.mySessions[idSession] = this;
}

// (server only) Register a variable within a session
ReplicatorSession.prototype.registerVariable = function(variable) {
  if (!this.host) {
    return;
  }

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
          console.log('to', Replicator.unreliableConnections[user])
          session.sendReliableMessage(Replicator.unreliableConnections[user], {
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

// send a reliable message to the other data channel
ReplicatorSession.prototype.sendReliableMessage = function(other, message) {
  if (!this.host) {
    other = Replicator.unreliableConnections[this.owner];
  }

  console.log(other)

  other.unackedReliableMessages.push(message);
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
    if (variable.owner == peerId || variable.owner == Replicator.id) {
      variables.push({
        identifier: variable.identifier,
        type: variable.type,
        destination: variable.destination,
      });
    }
  }

  this.sendReliableMessage(Replicator.unreliableConnections[peerId], {
    type: MESSAGE_NOTICE_RESPONSIBLE_VARIABLES,
    variables: variables
  });
}

ReplicatorSession.prototype.bindReplicationVariable = function(identifier, parentObject, variableName, deserializeReadFn, serializeWriteFn) {
  var variable = this.variables[identifier]

  if (!variable) {
    variable = {};
  }
  variable.parent = parentObject;
  variable.name = variableName;
  variable.deserializeFn = deserializeReadFn;
  variable.serializeFn = serializeWriteFn;

  if (variable.type == REPLICATE_RELIABLE) {
    var session = this;

    variable.parent.watch(variable.name, function(i, o, n) {
      // no changes recognized
      if (o == n) {
        return n;
      }

      if (variable.destination == REPLICATE_CLSV && variable.owner == Replicator.id) {
        // send to host
        session.sendReliableMessage(Replicator.unreliableConnections[session.owner], {
          type: MESSAGE_SET_VARIABLE_RELIABLE,
          id: variable.identifier,
          val: n
        })
      }
      return n;
    });
  }
}

// at 20hz rate send the unreliable registered state snapshots
ReplicatorSession.prototype.serverTick = function() {
  // send an unreliable snapshot of the variables

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

  // send to all users TODO: EXCEPT the owner who has modified it???
  for (var i = 0; i < this.users.length; i++) {
    var user = this.users[i];
    // console.log('checking', user)
    // skip not connected peers
    if (!Replicator.unreliableConnections[user].open) {
      continue;
    }

    // console.log('sending to', user);

    var other = Replicator.unreliableConnections[user];

    Replicator.sendPacket(this, user, {
      ts: new Date().getTime(),
      nr: this._sequenceNumber,
      messages: [{
        type: MESSAGE_DATA,
        data: variables,
      }],
      reliable: other.unackedReliableMessages,
      reliableId: other.unackedReliableMessagesFirstNumber,
      reliableLn: other.unackedReliableMessages.length,
      lastReceivedReliableAck: other.lastSentReliableAck
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

  // console.log('sending', variables)
  // send to server
  var other = Replicator.unreliableConnections[this.owner];
  Replicator.sendPacket(this, this.owner, {
    ts: new Date().getTime(),
    //sequence: this.count
    messages: [{
      type: MESSAGE_DATA,
      data: variables,
    }],
    reliable: other.unackedReliableMessages,
    reliableId: other.unackedReliableMessagesFirstNumber,
    reliableLn: other.unackedReliableMessages.length,
    lastReceivedReliableAck: other.lastSentReliableAck
  });

}

ReplicatorSession.prototype.onPeerJoined = function(peerId) {
  console.log(peerId, 'joined');
}

ReplicatorSession.prototype.onResponsibleVariablesNotice = function() {

}

// 
ReplicatorSession.prototype.onMessage = function(other, data) {
  switch (data.type) {

    case MESSAGE_REQUEST_JOIN:
      console.log('peer', other.peer, 'wants to join', this.id);
      if (this.users.indexOf(other.peer) < 0) {
        this.users.push(other.peer);
      }

      // send join-granted message
      this.sendReliableMessage(other, {
        type: MESSAGE_GRANT_JOIN,
        sessionId: this.id
      });

      // execute session's *new-client-joined* listener function, for example to register new responsible variables for the client
      this.onPeerJoined(other.peer);

      // then send the responsible variables to the client
      this.sendResponsibleVariables(other.peer);
      break;

      // after a join request: receive the information about the session
    case MESSAGE_GRANT_JOIN:
      console.log('granted join ', data.sessionId, '!');
      this.joined = true;
      break;

    case MESSAGE_NOTICE_RESPONSIBLE_VARIABLES:
      console.log('received MESSAGE_NOTICE_RESPONSIBLE_VARIABLES', data.variables);

      for (var i = 0; i < data.variables.length; i++) {
        var variable = data.variables[i];

        if (!this.variables[variable.identifier]) {
          this.variables[variable.identifier] = {}
        }

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
          // console.log(data)
          variable.parent[variable.name] = variable.deserializeFn(data.val);
        }
      }
      break;

    default:
      console.log('Could not handle', data.type);
      break;
  }
}

ReplicatorSession.prototype.onReceive = function(other, data) {

  // If server: Order the snapshot's variables after the snapshot sequence number, store historically
  // If client: Update variables with snapshot if snapshot is newer than old one

  // console.log('received', data)

  if (data.ts >= other.lastReceivedGameTime) {
    other.lastReceivedGameTime = data.ts; // the time of the last received snapshot

    // handle unreliable messages
    var messages = data.messages;
    // console.log('**unreliable**')
    for (var i = 0; i < messages.length; i++) {
      var message = messages[i];

      this.onMessage(other, message);
    }
  }

  // acknowledge reliable message and handle them, if they are new!

  // console.log('I received a few reliable messages from my counterpart', data.reliable)
  // console.log('Starting with number', data.reliableId, 'with an array size of', data.reliableLn)


  // confirm that we got new messages
  var newReceivedNumber = data.reliableId + data.reliableLn;
  // console.log('newReceivedNumber', newReceivedNumber)
  // console.log('other.lastSentReliableAck', other.lastSentReliableAck)

  if (newReceivedNumber > other.lastSentReliableAck) {
    other.lastSentReliableAck = newReceivedNumber; // to send later the number I got

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

  if (data.lastReceivedReliableAck > other.lastReceivedReliableAck || data.lastReceivedReliableAck < 0) {
    other.lastReceivedReliableAck = data.lastReceivedReliableAck;

    // console.log('I have unacked messages of this client, namely', other.unackedReliableMessages, 'starting with number', other.unackedReliableMessagesFirstNumber);
    // console.log('But I just got that the other has received number', data.lastReceivedReliableAck, ', so adjust my not acked list:')

    var cut = data.lastReceivedReliableAck - other.unackedReliableMessagesFirstNumber;
    // console.log('I have to cut', cut, 'entries')

    // console.log('Before I have this unacked messages:', other.unackedReliableMessages)
    other.unackedReliableMessages = other.unackedReliableMessages.splice(cut);
    // console.log('Afterwards these: ', other.unackedReliableMessages)
    other.unackedReliableMessagesFirstNumber += cut;
  }

}
