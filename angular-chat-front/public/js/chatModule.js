/**
 * Created by weixing on 2015/11/6.
 */

angular.module('chat',[
    'btford.socket-io'
]).factory('socket', function (socketFactory) {
        return socketFactory();
}).controller('chatCtrl',function(socket){
    var userids = [11,1];
    var userid = userids[Math.floor(Math.random()*3)-1];
    if(!userid) userid = 1;

    console.log(userid);

    var vm = this;
    vm.m ={};
    socket.emit('getFriends',{ userid : userid});
    socket.on('getFriends',function(data){
        vm.friends = data;
    });

    vm.chatWithFriend = function(friend){
        socket.emit('chatWithFriend',friend);
        vm.currentChatUser = friend;
    }
    vm.send = function(user){
        console.log(vm.m);
        if(vm.m.gotosend){
            socket.emit('sendFriendMessage',{friend:user,message:vm.m.gotosend});
            vm.message+=vm.m.gotosend;
        }
    }

    socket.on('sendFriendMessage',function(message){
        vm.message += "<br/>"+message;
    });

});
