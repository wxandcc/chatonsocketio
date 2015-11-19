/**
 * Created by weixing on 2015/11/9.
 */


var user = require('../orm/friends');
var friendChat = require('./../orm/friendChat');
var friendChatRecord = require('../orm/record.js');
var loginedUser = {};

/**
 *  all client events format with client:{action}:{desc}
 *  all server client format with server:{action}:{desc}
 */

exports.socketEvent = function(io){
    io.on('connection', function (socket) {
        socket.on('client:get:friends',function(data){
            user.friends(data.uid,function(error,friends){
                if(error) throw error;
                friends.forEach(function(fr){
                    fr.room = friendChat.getFriendRoom(data.uid,fr.id);
                });
                socket.emit('server:send:friends',friends);
            });
            socket.cUser = data; //current user

            if(loginedUser[data.uid]){
                loginedUser[data.uid].push(socket.id);
            }else{
                loginedUser[data.uid] = [socket.id];
            }
        });

        socket.on('client:get:rooms',function(data){
            var cb = function(socket){
                return function(chatRooms){
                    chatRooms.forEach(function(chat){
                        chat.room = friendChat.getFriendRoom(chat.fr,chat.tid);
                    });
                    socket.emit("server:send:rooms",chatRooms);
                }
            }
            friendChat.userChatRooms(data.uid,cb(socket));
        });

        socket.on('client:chat:friend',function(data){
            console.log(socket.cUser);
            var room = friendChat.getFriendRoom(socket.cUser.uid,data.id);
            friendChat.checkRoom(socket.cUser.uid,data.id); //check friend relationship
            friendChat.checkRoom(data.id,socket.cUser.uid); //check friend relationship

            friendChat.readMessage(data.id,socket.cUser.uid);//set unread message to false

            socket.join(room);

            //todo  多次join room 有待优化

            if(loginedUser[data.id]){
                loginedUser[data.id].forEach(function(ele){
                    io.sockets.socket(ele).join(room); //friends' socket join the chat room
                })
            }

            if(loginedUser[socket.cUser.uid]){
                loginedUser[socket.cUser.uid].forEach(function(ele){
                    io.sockets.socket(ele).join(room); //self sockets join the chat room
                });
            }

            var firstCB = function(socket){
                return function(records){
                    socket.emit('server:first:5:message',records);
                }
            }

            friendChatRecord.firt5Message(room,firstCB(socket));//聊天默认显示最近5条聊天记录

        });

        socket.on('client:friend:msg',function(data){
            var room = friendChat.getFriendRoom(socket.cUser.uid,data.friend.id);
            var record = {room:room,msg: data.message,fr: socket.cUser.uid,created_at:new Date()};
            friendChatRecord.pushChatRecord(record);

            if(typeof loginedUser[data.friend.id] === "undefined"){
                friendChat.hasUnreadMessage(socket.cUser.uid,data.friend.id);
            }

            socket.broadcast.to(room).emit('server:friend:msg',record);
        });


        socket.on('client:get:friend:record',function(data){
            var start = (data.page-1) * data.pagesize;
            var offset = data.pagesize;
            var fromid = data.startid;
            if(start < 0) start = 0;
            friendChatRecord.getChatRecord(data.room,start,offset,fromid,function(records){
                socket.emit('server:send:friend:record',records);
            })
        });

        socket.on("client:find:username",function(data){
            var cb = function(socket){
                return function(users){
                    users.forEach(function(fr){
                        fr.room = friendChat.getFriendRoom(socket.cUser.uid,fr.id);
                    });
                    socket.emit("server:find:username:result",users);
                }
            };
            //todo 禁止用户未登录就搜索用户
            if(typeof socket.cUser === "undefined" ){
                cb(socket)([]);//fix error
                return;
            }

            friendChat.getUserByName(data.username,socket.cUser.uid,cb(socket));
        });

        socket.on("client:get:new:friend",function(data){
            var cb = function(socket){
                return function(friend){
                    friend.room = friendChat.getFriendRoom(socket.cUser.uid,friend.id);
                    socket.emit("server:send:new:friend",friend);
                }
            };
            friendChat.getFriendById(data,cb(socket));
        });

        socket.on("client:get:pagination",function(data){
            var cb = function(socket){
                return function(total){
                    socket.emit('server:send:pagination',total);
                }
            };
            friendChatRecord.getRecordCount(data.room,data.id,cb(socket));
        });


        socket.on('disconnect',function(){
            var socketindex;
            if(!socket.cUser) return;
            var currentUserSockets = loginedUser[socket.cUser.uid];
            for(i in currentUserSockets ){
                if(currentUserSockets[i] === socket.id){
                    socketindex = i;
                }
            }
            if(socketindex) currentUserSockets.splice(socketindex,1);
        })
    });
}




