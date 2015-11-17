/**
 * Created by weixing on 2015/11/9.
 */


var user = require('../orm/friends');
var friendChat = require('./friendChat');
var friendChatRecord = require('../orm/record.js');
var loginedUser = {};

exports.socketEvent = function(io){
    io.on('connection', function (socket) {
        socket.on('getFriends',function(data){
            user.friends(data.userid,function(error,friends){
                if(error) throw error;

                friends.forEach(function(fr){
                    fr.chatRoom = friendChat.getFriendRoom(data.userid,fr.id);
                });
                socket.emit('getFriends',friends);
            });
            socket.currentUser = data;
            if(loginedUser[data.userid]){
                loginedUser[data.userid].push(socket.id);
            }else{
                loginedUser[data.userid] = [socket.id];
            }
        });

        socket.on('getChatRooms',function(data){
            var cb = function(socket){
                return function(chatRooms){
                    chatRooms.forEach(function(chat){
                        chat.room = friendChat.getFriendRoom(chat.fr,chat.tid);
                    });
                    socket.emit("chatRooms",chatRooms);
                }
            }
            friendChat.userChatRooms(data.userid,cb(socket));
        });

        socket.on('chatWithFriend',function(data){

            var room = friendChat.getFriendRoom(socket.currentUser.userid,data.id);
            friendChat.checkRoom(socket.currentUser.userid,data.id); //check friend relationship
            friendChat.checkRoom(data.id,socket.currentUser.userid); //check friend relationship

            friendChat.readMessage(data.id,socket.currentUser.userid);//set unread message to false

            socket.join(room);

            //todo  多次join room 有待优化

            if(loginedUser[data.id]){
                loginedUser[data.id].forEach(function(ele){
                    io.sockets.socket(ele).join(room); //friends' socket join the chat room
                })
            }

            if(loginedUser[socket.currentUser.userid]){
                loginedUser[socket.currentUser.userid].forEach(function(ele){
                    io.sockets.socket(ele).join(room); //self sockets join the chat room
                });
            }

            var firstCB = function(socket){
                return function(records){
                    socket.emit('first5message',records);
                }
            }

            friendChatRecord.firt5Message(room,firstCB(socket));//聊天默认显示最近5条聊天记录

        });

        socket.on('sendFriendMessage',function(data){
            var room = friendChat.getFriendRoom(socket.currentUser.userid,data.friend.id);
            var record = {room:room,msg: data.message,fr: socket.currentUser.userid,created_at:new Date()};
            friendChatRecord.pushChatRecord(record);

            if(typeof loginedUser[data.friend.id] === "undefined"){
                friendChat.hasUnreadMessage(socket.currentUser.userid,data.friend.id);
            }

            socket.broadcast.to(room).emit('sendFriendMessage',record);
        });


        socket.on('friendChatRecord',function(data){
            var end = data.total-1- (data.page-1) * data.pagesize;
            var start =  data.total -  data.page * data.pagesize;
            if(start<0) start=0;
            friendChatRecord.getChatRecord(data.room,start,end,function(records){
                socket.emit('sendFriendChatRecord',records);
            })
        });

        socket.on("findUserByName",function(data){
            var cb = function(socket){
                return function(users){
                    users.forEach(function(fr){
                        fr.chatRoom = friendChat.getFriendRoom(socket.currentUser.userid,fr.id);
                    });
                    socket.emit("usernameResult",users);
                }
            };
            friendChat.getUserByName(data.username,cb(socket));
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

var getRecordCountCb = function(socket,room){
    var rt = {room:room};
    return function(recordPagination){
        socket.emit('pagination',recordPagination);
    }
}



