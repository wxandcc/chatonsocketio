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
    vm.currentChatUser = {};
    vm.messagePager={};//record pagination
    vm.frindMap = {}; //frind id=>name map

    vm.addFriend = function(friend){
        if(typeof vm.userMesage[friend.chatRoom] === "undefined"){
            vm.frindMap[friend.id] = friend;
            vm.userMesage[friend.chatRoom] = [];
            vm.friends.push(friend);
        }
        return false;
    }

    function login(){
        if(!vm.formModel.userid) return;
        socket.emit('getFriends',{ userid : vm.formModel.userid});
        vm.formModel.needLogin = false;
        vm.frindMap[vm.formModel.userid] = {
            id: vm.formModel.userid,
            username: "me"
        }
        socket.emit('getChatRooms',{userid: vm.formModel.userid});
    }
    socket.on('getFriends',function(data){
        vm.friends = data;
        if(data){
            angular.forEach(data,function(ele){
                vm.userMesage[ele.chatRoom] = [];
                vm.frindMap[ele.id] = ele;
            })
        }
    });

    vm.chatWithFriend = function(friend){
        socket.emit('chatWithFriend',friend);
        vm.currentChatUser = friend;
        friend.newMsgArrv = false;
    }
    vm.send = function(user){
        if(vm.formModel.gotosend){
            socket.emit('sendFriendMessage',{friend:user,message:vm.formModel.gotosend});
            console.log(user);
            vm.userMesage[user.chatRoom].push(
                {
                    fr:vm.formModel.userid,
                    msg: vm.formModel.gotosend,
                    created_at: (new Date()).getTime()
                }
            );
        }
    }

    socket.on('sendFriendMessage',function(data){
        vm.userMesage[data.room].push(data);
        angular.forEach(vm.friends,function(ele){
            if(ele.room == data.room){
                ele.newMsgArrv = true;
            }
        });
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
        socket.emit('friendChatRecord',data);
    };
     socket.on('sendFriendChatRecord',function(data){
            if(data.length>0){
                var room = data[0].room;
                angular.forEach(data,function(ele){
                    vm.userMesage[room].unshift(ele);
                });
            }
        });
    socket.on("chatRooms",function(data){
            if(data){
                angular.forEach(data,function(ele){
                    if(typeof vm.frindMap[ele.fr] === "undefined"){
                        ele.chatRoom = ele.room;
                        vm.friends.push(ele);
                        vm.frindMap[ele.fr] = ele;
                        vm.userMesage[ele.room] = [];
                    }
                });
            };
    });
    socket.on("first5message",function(data){
            if(data.length > 0 ) {
                var room = data[0].room;
                vm.userMesage[room] = data.reverse();
                var maxrecordid = data[0].id;
                socket.emit("getPagenation",{room:room,id:maxrecordid});
            };
    });

    socket.on('pagination',function(pager){
        if(typeof vm.messagePager[pager.room] === "undefined") vm.messagePager[pager.room] = pagination.getPagination(pager,10);
    });
    socket.on('reconnect',function(info){
        socket.emit('getFriends',{ userid : vm.formModel.userid});
        console.log("info");
    });

}])
    .controller("chatFindUserCtrl",['grSocket',function(socket){
        var vm = this;
        vm.formModel = {};
        vm.formModel.username = ''
        vm.findUser = function(){
            if(vm.formModel.username){
                socket.emit("findUserByName",{username: vm.formModel.username});
            }
        };
        socket.on("usernameResult",function(data){
            vm.filterUser = data;
        })
    }]);
