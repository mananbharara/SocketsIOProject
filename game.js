var util = require('util'), io = require('socket.io'), Player = require('./Player').Player, connect = require('connect');

var socket, players;

connect.createServer(connect.static(__dirname)).listen(8080);

function init() {
  players = [];
}

function playerById(id) {
  var i;
  for (i = 0; i < players.length; i++) {
    if (players[i].id == id)
      return players[i];
  }

  return false;
}

init();

var setEventHandlers = function () {
  socket.sockets.on("connection", onSocketConnection);
};

function onClientDisconnect() {
  util.log("Player has disconnected: " + this.id);
  var playerToBeRemoved = playerById(this.id);

  if (!playerToBeRemoved) {
    util.log("Player not found: " + this.id);
    return;
  }

  players.splice(players.indexOf(playerToBeRemoved), 1);
  this.broadcast.emit("remove player", {id: this.id});
}

function onNewPlayer(data) {
  var newPlayer = new Player(data.x, data.y);
  newPlayer.id = this.id;
  this.broadcast.emit('new player', {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY()});

  var i, existingPlayer;
  for (i = 0; i < players.length; i++) {
    existingPlayer = players[i];
    this.emit("new player", {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY()});
  }
  players.push(newPlayer);
}

function onMovePlayer(data) {
  var playerToBeMoved = playerById(this.id);
  if (!playerToBeMoved) {
    util.log('Player not found: ' + this.id);
  }

  playerToBeMoved.setX(data.x);
  playerToBeMoved.setY(data.y);

  this.broadcast.emit("move player", {id: playerToBeMoved.id, x: playerToBeMoved.getX(), y: playerToBeMoved.getY()});
}

function onSocketConnection(client) {
  util.log('New player has connected: ' + client.id);
  client.on('disconnect', onClientDisconnect);
  client.on('new player', onNewPlayer);
  client.on('move player', onMovePlayer);
}

socket = io.listen(8000);

setEventHandlers();

socket.configure(function () {
  socket.set('transports', ['websocket']);
  socket.set('log level', 2);
})