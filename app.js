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
        if(loginedUser[data.userid]){
            loginedUser[data.userid].push(socket.id);
        }else{
            loginedUser[data.userid] = [socket.id];
        }
    });

    socket.on('chatWithFriend',function(data){
        var room = friendChat.getFriendRoom(socket,data);
        socket.join(room);
        if(loginedUser[data.id]){
            loginedUser[data.id].forEach(function(ele){
                io.sockets.socket(ele).join(room);
            })
        }
    });

    socket.on('sendFriendMessage',function(data){
        var room = friendChat.getFriendRoom(socket,data.friend);
        socket.broadcast.to(room).emit('sendFriendMessage',data.message);
    });

    socket.on('disconnect',function(){
        var socketindex;
        var currentUserSockets = loginedUser[socket.currentUser.userid];
        for(i in currentUserSockets ){
            if(currentUserSockets[i] === socket.id){
                socketindex = i;
            }
        }
        if(socketindex) currentUserSockets.splice(socketindex,1);
    })


});

