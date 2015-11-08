/**
 * Created by weixing on 2015/11/6.
 */
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io');
var io = io.listen(server);
var user = require('./model/mysqlUser');
var friendChat = require('./model/friendChat');
var loginedUser = {};

server.listen(8080);


app.use(express.static('angular-chat-front'));

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    socket.on('getFriends',function(data){
        user.friends(data.userid,function(error,friends){
            if(error) throw error;
            socket.emit('getFriends',friends);
        });
        socket.currentUser = data;
    });

    socket.on('chatWithFriend',function(data){
        var room = friendChat.getFriendRoom(socket,data);
        socket.join(room);
    });

});

