/**
 * Created by weixing on 2015/11/6.
 */

angular.module('chat',[
    'btford.socket-io'
]).factory('socket', function (socketFactory) {
        return socketFactory();
}).service('pagination',function(){
    var pagination = function(pager,pagesize){
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
    .controller('chatCtrl',function(socket,pagination){
    var vm = this;
    vm.formModel = {};
    vm.formModel.needLogin = true;
    vm.login = login;
    vm.userMesage = {};//chat record
    vm.currentChatUser = {};
    vm.messagePager={};//record pagination
    vm.frindMap = {}; //frind id=>name map

    function login(){
        if(!vm.formModel.userid) return;
        socket.emit('getFriends',{ userid : vm.formModel.userid});
        vm.formModel.needLogin = false;
        vm.frindMap[vm.formModel.userid] = {
            id: vm.formModel.userid,
            username: "me"
        }
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
            vm.userMesage[user.chatRoom].push(
                {
                    from:vm.formModel.userid,
                    message: vm.formModel.gotosend,
                    timestamp: (new Date()).getTime()
                }
            );
        }
    }

    socket.on('sendFriendMessage',function(data){
        vm.userMesage[data.chatRoom].push(data);
        angular.forEach(vm.friends,function(ele){
            if(ele.chatRoom == data.chatRoom){
                ele.newMsgArrv = true;
            }
        });
    });
    socket.on('recordCount',function(data){
        console.log('recordCount',data);
    });
    socket.on('pagination',function(pager){
        if(typeof vm.messagePager[pager.room] === "undefined") vm.messagePager[pager.room] = pagination.getPagination(pager,10);
    });
    vm.recordNextPage = function(room){
        var pagination = vm.messagePager[room];
        var data = {
            room: room,
            page: pagination.nextPage(),
            pagesize : pagination.pagesize,
            total: pagination.totalMessage
        };
        socket.emit('friendChatRecord',data);
    }
        socket.on('sendFriendChatRecord',function(data){
            if(data.length>0){
                data.reverse();
                angular.forEach(data,function(ele){
                    var message = JSON.parse(ele);
                    vm.userMesage[message.chatRoom].unshift(message);
                });
            }
        });


});
