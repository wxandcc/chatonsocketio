/**
 * Created by weixing on 2015/11/6.
 */

angular.module('chat',[
    'btford.socket-io',
    'angularSocket'
]).factory('btford-socket', function (socketFactory) {
        return socketFactory();
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
    .controller('chatCtrl',['grSocket','pagination',function(socket,pagination){
        var vm = this;
        vm.formModel = {};
        vm.formModel.needLogin = true;

        vm.login = login;
        vm.userMesage = {};//chat record
        vm.cFriend = {};// 当前聊天的朋友
        vm.messagePager={};//record pagination
        vm.friends = {};//all chat friend id=>obj

        vm.addFriend = function(friend){
            if(typeof vm.userMesage[friend.room] === "undefined"){
                vm.friends[friend.id] = friend;
                vm.userMesage[friend.chatRoom] = [];
            }
            return false;
        }

        function login(){
            if(!vm.formModel.uid) return;
            socket.emit('client:get:friends',{ uid : vm.formModel.uid});
            vm.formModel.needLogin = false;
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
            socket.emit('client:chat:friend',friend);
            vm.cFriend = friend;
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
        socket.on('reconnect',function(info){
            socket.emit('client:get:friends',{ uid : vm.formModel.uid});
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
