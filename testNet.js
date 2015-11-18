/*
  issues:
  - firefox version does not work without internet
  - chrome does not know var.watch
*/

// create a session, register a 'testVariable' and change its value
function testServer() {
  testSessionServer = new ReplicatorSession();
  testSessionServer.create('password');
  window.setInterval(function() {
    testSessionServer.serverTick();
  }, 1000 / 20); // 20hz

  testVariable = 123;
  testSessionServer.registerVariable(new ReplicatorVariable(REPLICATE_RELIABLE, REPLICATE_SVCL, null, 'testVariable1', window, 'testVariable', Serializer.writeNumber));

  // server-->client
  gameLobby = {
    players: ['spieler1', 'spieler2']
  };
  // server defines variables which are send to the client
  testSessionServer.registerVariable(new ReplicatorVariable(REPLICATE_RELIABLE, REPLICATE_SVCL, null, 'gameLobbyPlayers', gameLobby, 'players', Serializer.writeArray));

  // client-->server-->clients except owner peer
  playerinput = {}

  testSessionServer.onPeerJoined = function(peerId) {
    console.log(peerId, 'joined :)')
    playerinput[peerId] = {
        left: 0
      }
      // server defines variables which are received by the server from the client (60hz) and passed to the others (20hz)
    testSessionServer.registerVariable(new ReplicatorVariable(REPLICATE_UNRELIABLE, REPLICATE_CLSVCL, peerId, peerId + '_left', playerinput[peerId], 'left', Serializer.writeNumber, Serializer.readNumber));

    testClientOnly = 222;
    testSessionServer.registerVariable(new ReplicatorVariable(REPLICATE_RELIABLE, REPLICATE_CLSV, peerId, peerId + '_clientOnly', window, 'testClientOnly', Serializer.writeNumber, Serializer.readNumber));
  };

}

function testClient(id) {
  testSessionClient = new ReplicatorSession();
  testSessionClient.join(id)
  window.setInterval(function() {
    testSessionClient.clientTick();
  }, 1000 / 60); // 60hz

  gameLobby = {};
  playerinput = {
    left: 0
  };

  testVariable = 0;
  clientOnly = 0;

  testSessionClient.onResponsibleVariablesNotice = function() {
    // 'testVariable' should be created automatically and stay in sync
    testSessionClient.bindReplicationVariable('testVariable1', window, 'testVariable', Serializer.readNumber);
    testSessionClient.bindReplicationVariable(Replicator.id + '_clientOnly', window, 'clientOnly', Serializer.readNumber, Serializer.writeNumber);

    // clients can bind received variable values to a local variable, here: 'players' of gameLobby. doesn't matter if it already exists, will be created automatically
    testSessionClient.bindReplicationVariable('gameLobbyPlayers', gameLobby, 'players', Serializer.readArray);

    // every client receives REGISTER_VARIABLE and associates his clientside version of the variable, the owner is allowed to update this variable
    testSessionClient.bindReplicationVariable(Replicator.id + '_left', playerinput, 'left', Serializer.readNumber, Serializer.writeNumber);
  }

  //playerinput[0].left = 2; // should be synchronized with server and passed to other clients!
}
