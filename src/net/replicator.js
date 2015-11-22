const REPLICATE_RELIABLE = 1
const REPLICATE_UNRELIABLE = 2

const REPLICATE_SVCL = 1
const REPLICATE_CLSV = 2
const REPLICATE_CLSVCL = 3

const REPLICATE_PEER_IS_SERVER = 1;
const REPLICATE_PEER_IS_CLIENT = 2;

const MESSAGE_REQUEST_JOIN = 1;
const MESSAGE_GRANT_JOIN = 2;
const MESSAGE_SET_VARIABLE_RELIABLE = 3;
const MESSAGE_DATA = 4;
const MESSAGE_NOTICE_RESPONSIBLE_VARIABLES = 5;

// Get to know other peers and handle data connections
var Replicator = new(function Replicator() {
  this.SERVER_IP = "127.0.0.1"
  this.FAKE_LAG = 0;

  this.users = []; // users connected to the broker server
  this.sessions = []; // available replication sessions
  this.sessionsJoined = [] // indizes of sessions we have joined
  this.mySessions = {}; // self-hosted sessions that this peer owns, holds more data than the sessions array
  this._session = null;

  //this.reliableConnections = {};
  this.unreliableConnections = {}; // data streams to other peers

  var eventBinding = {};
  this.peer = null; // peer instance
  this.socket = io('http://' + this.SERVER_IP);
  var self = this;

  var _uniqueNumber = 0;

  this.socket.on('info-connected-clients', function(users) {
    self.users = users;
    console.log(new Date(), users)
  });

  this.socket.on('info-open-sessions', function(sessions) {
    console.log('info-open-sessions', sessions);
    self.sessions = sessions;
  });

  // todo: queue a message which will be send internally by sendPacket
  Replicator.prototype.sendMessage = function(message) {

  }

  // send messages snapshot to the spezified peer
  Replicator.prototype.sendPacket = function(session, peerId, packet) {

    // console.log(this.id, 'wants to send a package to ', peerId, 'with', messages)
    // compress messages
    // 
    packet.sessionId = session.id;

    //console.log(this.id, 'wants to send a package to ', peerId, 'with', packet)

    this.unreliableConnections[peerId].send(packet);
  }

  Replicator.prototype.onReceivePacket = function(other, data) {

    // console.log('received a packet: ', data)
    var session = this.mySessions[data.sessionId];

    // todo: delete duplicated packets
    // todo: ignore older packets?

    session.onReceive(other, data)
  }

  // connect to connection broker and handle new peer connections
  Replicator.prototype.connectToBroker = function() {
    this.peer = new Peer({
      host: this.SERVER_IP,
      port: 9000,
      path: '/peer'
    });

    var self = this;

    // connection with broker established
    this.peer.on('open', function(id) {
      self.id = id;
    })

    // other peer establishes connection
    this.peer.on('connection', function(other) {
      console.log('another peer connected!', other);

      self.setupConnection(other);
    })
  }

  Replicator.prototype.connectToPeer = function(peerId) {
    var connection = this.peer.connect(peerId, {
      reliable: false
    });

    this.setupConnection(connection);
  }

  Replicator.prototype.setupConnection = function(peer) {
    var self = this;

    // other peer sends data
    peer.on('data', function(data) {
      self.onReceivePacket(peer, data);
    });

    peer.unackedReliableMessages = []; // holds a list of event messages that have been sent but still are not acknowledged
    peer.unackedReliableMessagesFirstNumber = -1; // the number of the first reliable message that is unacked
    peer.lastReceivedGameTime = 0;
    peer.lastReceivedReliableAck = -1;
    peer.lastSentReliableAck = -1;

    this.unreliableConnections[peer.peer] = peer;
  }

  Replicator.prototype.disconnect = function() {

  }

  Replicator.prototype.setSession = function(session) {
    this._session = session;
  }

  Replicator.prototype.getSession = function() {
    return this._session;
  }

  // source: http://stackoverflow.com/a/105074
  Replicator.prototype.getUniqueNumber = function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  this.connectToBroker();
})()
