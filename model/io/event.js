/**
 * Created by weixing on 2015/11/9.
 */


var user = require('../mysqlUser');
var friendChat = require('./friendChat');
var loginedUser = {};

exports.socketEvent = function(io){
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
            var sendMessage = {fromid:socket.currentUser.userid,message: data.message};
            socket.broadcast.to(room).emit('sendFriendMessage',sendMessage);
        });

        socket.on('disconnect',function(){
            var socketindex;
            if(!socket.currentUser) return;
            var currentUserSockets = loginedUser[socket.currentUser.userid];
            for(i in currentUserSockets ){
                if(currentUserSockets[i] === socket.id){
                    socketindex = i;
                }
            }
            if(socketindex) currentUserSockets.splice(socketindex,1);
        })
    });
}


