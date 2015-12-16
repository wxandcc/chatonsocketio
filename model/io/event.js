/**
 * Created by weixing on 2015/11/9.
 */


var user = require('../orm/friends');
var friendChat = require('./../orm/friendChat');
var teamChat = require("./../orm/teamChat.js");
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
            //��ȡ����ķ�����Ϣ
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

            //todo  ���join room �д��Ż�

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

            friendChatRecord.firt5Message(room,firstCB(socket));//����Ĭ����ʾ���5�������¼

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
            //todo ��ֹ�û�δ��¼�������û�
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

        /**
         * ����Ϊ˽�Ĳ���
         */

        socket.on("client:team:rooms",function(userInfo){
            var cb = function(teamRooms){
                if(teamRooms){
                    teamRooms.forEach(function(ele){
                        ele.teamRoom = teamChat.teamRoom(ele.team_id);
                    });
                    socket.emit("server:team:rooms",teamRooms);
                }
            };
            teamChat.getTeams(userInfo.uid,cb);
        });

        socket.on("client:team:msg",function(data){
            var room = data.team.teamRoom;
            var record = {room:room,msg: data.message,fr: socket.cUser.uid,created_at:new Date()};
            teamChat.pushTeamChatRecord(record);
            socket.broadcast.to(room).emit('server:team:msg',record);
        });

        socket.on("client:team:chat",function(team){
            //todo �Ż����еĶ�Ա��client����team.teamRoom

            var teamMemberCb = function(users,team){
                if(loginedUser[socket.cUser.uid]){
                    loginedUser[socket.cUser.uid].push(socket.id);
                }else{
                    loginedUser[socket.cUser.uid] = [socket.id];
                }
                if(users){
                    users.forEach(function(user){
                        if(loginedUser[user.id]){
                            loginedUser[user.id].forEach(function(ele){
                                io.sockets.socket(ele).join(team.teamRoom); //self sockets join the chat room
                            });
                        }
                    })
                };
                socket.emit("server:team:teamMember",users);
            };
            teamChat.getTeamsMembers(team,teamMemberCb);

            teamChat.first5TeamMessage(team.teamRoom,function(message){
                socket.emit("server:team:first:5:message",message);
            });//����Ĭ����ʾ���5�������¼

        });

        socket.on("client:team:get:pagination",function(data){
            var cb = function(total){
                    socket.emit('server:team:send:pagination',total);
                };
            teamChat.getTeamRecordCount(data.room,data.id,cb);
        });

        socket.on('client:team:get:friend:record',function(data){
            var start = (data.page-1) * data.pagesize;
            var offset = data.pagesize;
            var fromid = data.startid;
            if(start < 0) start = 0;
            teamChat.getTeamChatRecord(data.room,start,offset,fromid,function(records){
                socket.emit('server:team:send:friend:record',records);
            })
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




