/**
 * Created by weixing on 2015/11/6.
 */
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io');
var io = io.listen(server);
server.listen(8080);

app.use(express.static('angular-chat-front'));

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('testEvent', function (data) {
        console.log(data.file);
    });
});

