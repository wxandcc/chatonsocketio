/**
 * Created by weixing on 2015/11/6.
 */
var express = require('express');
var app = express();
var server = require('http').Server(app);
var socketEvent = require('./model/io/event')
var io = require('socket.io');
var io = io.listen(server);
server.listen(8080);

socketEvent.socketEvent(io);

app.use(express.static('angular-chat-front'));

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});






