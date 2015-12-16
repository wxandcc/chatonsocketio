/**
 * Created by weixing on 2015/11/6.
 */

angular.module('chat',[
    'btford.socket-io',
    'angularSocket'
    ]).factory('btford-socket', function (socketFactory) {
            return socketFactory();
    }).filter('trimFilter',function(){
        /**
         *  trim spaces
         */
        return function(string){
            return  typeof string === "string" ? string.replace(/(^\s+)|(\s+$)/g, "") : '';
        }
    })
    .filter('numberLike',function(){
        return function(testvalue){
            return !/\D+/.test(testvalue);
        }
    })
    .service('pagination',function(){
    var pagination = function(pager,pagesize){
        this.fromid = pager.startid;
        this.totalMessage = pager.total;
        this.total = 0;
        this.preview = 0;
        this.next = 1;
        this.current = 0;
        this.loaded = 0;
        if(!pagesize) pagesize=10;
        this.pagesize = pagesize;
        if(pager.total) this.total = Math.ceil(pager.total/pagesize);
        if(this.total>1) this.next=1;
    }
    pagination.prototype.hasNext = function(){
        if(this.current< this.total) return true;
        return false;
    }
    pagination.prototype.nextPage = function(){
        if(this.current< this.total){
            if( this.current>0) this.preview = this.current-1;
            this.current = this.next;
            if(this.total> this.next) this.next++;
        }
        return this.current;
    }

    this.getPagination = function(pager,pagesize){
        if(!pagesize) pagesize=10;
        return new pagination(pager,pagesize);
    }
})
    .controller('chatCtrl',['grSocket','pagination','$filter',function(socket,pagination,$filter){
        var vm = this;
        vm.formModel = {};
        vm.formModel.needLogin = true;

        vm.login = login;
        vm.userMesage = {};//chat record
        vm.cFriend = {};// 当前聊天的朋友
        vm.messagePager={};//record pagination
        vm.friends = {};//all chat friend id=>obj
        vm.teams = {};//群聊模块
        vm.cTeam = {};//当前team room

        vm.addFriend = function(friend){
            if(typeof vm.userMesage[friend.room] === "undefined"){
                vm.friends[friend.id] = friend;
                vm.userMesage[friend.chatRoom] = [];
            }
            return false;
        }

        function login(){
            if(!vm.formModel.uid) return;
            var uid = $filter('trimFilter')(vm.formModel.uid);
            if($filter('numberLike')(uid)){
                socket.emit('client:get:friends',{ uid : uid});
                socket.emit("client:team:rooms",{uid:uid});
                vm.formModel.needLogin = false;

            }else{
                alert("请输入id，例如1,2,11等")
            }

        };
        socket.on('server:send:friends',function(data){
            if(data){
                angular.forEach(data,function(ele){
                    vm.userMesage[ele.room] = [];
                    vm.friends[ele.id] = ele;
                })
            };
            socket.emit('client:get:rooms',{uid: vm.formModel.uid});
        });

        //获取聊天的room数据
        socket.on("server:send:rooms",function(data){
            if(data){
                angular.forEach(data,function(ele){
                    if(typeof vm.friends[ele.fr] === "undefined"){
                        vm.friends[ele.fr] = ele;
                        vm.userMesage[ele.room] = [];
                    }
                });
            };
        });

        vm.chatWithFriend = function(friend){
            vm.cTeam = {};//私聊和群聊互斥
            if(vm.cFriend.room !== friend.room){
                if(!angular.isArray(vm.userMesage[friend.room]) || vm.userMesage[friend.room].length == 0 ){
                    socket.emit('client:chat:friend',friend);
                }
                vm.cFriend = friend;
            }
            friend.newMsgArrv = false;
        }
        vm.send = function(user){
            if(vm.formModel.gotosend){
                socket.emit('client:friend:msg',{friend:user,message:vm.formModel.gotosend});
                if(typeof vm.userMesage[user.room] === "undefined") vm.userMesage[user.room]=[];
                vm.userMesage[user.room].push(
                    {
                        fr:vm.formModel.uid,
                        msg: vm.formModel.gotosend,
                        created_at: (new Date()).getTime()
                    }
                );
            }
        }

        socket.on('server:friend:msg',function(data){

            if(vm.userMesage[data.room]){
                vm.userMesage[data.room].push(data);
                angular.forEach(vm.friends,function(ele){
                    if(ele.room == data.room){
                        ele.newMsgArrv = true; //set new message arrive
                    }
                });
            }else{
                vm.userMesage[data.room] = [data];
                socket.emit("client:get:new:friend",{uid:data.fr}); //获取新聊天
                socket.on("server:send:new:friend",function(friend){
                    vm.friends[friend.id] = friend;
                    friend.newMsgArrv = true;
                    console.log(vm.friends);
                });
            }
        });

        vm.recordNextPage = function(room){
            var pagination = vm.messagePager[room];
            var data = {
                room: room,
                page: pagination.nextPage(),
                pagesize : pagination.pagesize,
                total: pagination.totalMessage,
                startid: pagination.fromid
            };
            socket.emit('client:get:friend:record',data);
        };
         socket.on('server:send:friend:record',function(data){
                if(data.length>0){
                    var room = data[0].room;
                    angular.forEach(data,function(ele){
                        vm.userMesage[room].unshift(ele);
                    });
                }
            });

        socket.on("server:first:5:message",function(data){
                if(data.length > 0 ) {
                    var room = data[0].room;
                    vm.userMesage[room] = data.reverse();
                    var maxrecordid = data[0].id;
                    socket.emit("client:get:pagination",{room:room,id:maxrecordid});
                };
        });

        socket.on('server:send:pagination',function(pager){
            if(typeof vm.messagePager[pager.room] === "undefined") vm.messagePager[pager.room] = pagination.getPagination(pager,10);
        });
        /**
         *  以上为私聊部分
         *  群聊事件如下
         */

        socket.on("server:team:rooms",function(data){
            vm.teams = data;
        });

        vm.teamChat = function(team){
            vm.cFriend = {};
            vm.cTeam = team;
            if(!angular.isArray(vm.userMesage[team.teamRoom]) || vm.userMesage[team.teamRoom].length == 0 ){
                socket.emit('client:team:chat',team);
            }
        };

        vm.sendTeam = function(team){
            if(!vm.formModel.gotosend) return;
            if(typeof vm.userMesage[team.teamRoom] === "undefined") vm.userMesage[team.teamRoom]=[];
            vm.userMesage[team.teamRoom].push(
                {
                    fr:vm.formModel.uid,
                    msg: vm.formModel.gotosend,
                    created_at: (new Date()).getTime()
                }
            );
            socket.emit("client:team:msg",{
                team:team,
                message: vm.formModel.gotosend
            });
        };

        socket.on("server:team:msg",function(data){
            if(typeof vm.userMesage[data.room] === "undefined") vm.userMesage[data.room]=[];
            vm.userMesage[data.room].push(data);
        });

        socket.on("server:team:teamMember",function(users){
            vm.cTeam.teamMember = users;
        });


        socket.on("server:team:first:5:message",function(data){
            if(data.length > 0 ) {
                var room = data[0].room;
                vm.userMesage[room] = data.reverse();
                var maxrecordid = data[0].id;
                socket.emit("client:team:get:pagination",{room:room,id:maxrecordid});
            };
        });

        socket.on('server:team:send:pagination',function(pager){
            if(typeof vm.messagePager[pager.room] === "undefined") vm.messagePager[pager.room] = pagination.getPagination(pager,10);
            console.log( vm.messagePager[pager.room]);
        });


        vm.teamRecordNextPage = function(room){
            var pagination = vm.messagePager[room];
            var data = {
                room: room,
                page: pagination.nextPage(),
                pagesize : pagination.pagesize,
                total: pagination.totalMessage,
                startid: pagination.fromid
            };
            socket.emit('client:team:get:friend:record',data);
        };
        socket.on('server:team:send:friend:record',function(data){
            if(data.length>0){
                var room = data[0].room;
                angular.forEach(data,function(ele){
                    vm.userMesage[room].unshift(ele);
                });
            }
        });


        socket.on('reconnect',function(info){
            if(!vm.formModel.uid) return;
            var uid = $filter('trimFilter')(vm.formModel.uid);
            if($filter('numberLike')(uid)) {
                socket.emit('client:get:friends', {uid: vm.formModel.uid});
            };
        });

}])
    .controller("chatFindUserCtrl",['grSocket',function(socket){
        var vm = this;
        vm.formModel = {};
        vm.formModel.username = '';
        vm.findUser = function(){
            if(vm.formModel.username){
                socket.emit("client:find:username",{username: vm.formModel.username});
            }
        };
        socket.on("server:find:username:result",function(data){
            if(data.length > 0){
                vm.filterUser = data;
            }else{
                alert("no matched user!");
            }
        })
    }]);
