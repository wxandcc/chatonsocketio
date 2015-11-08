/**
 * Created by weixing on 2015/11/6.
 */

angular.module('chat',[
    'btford.socket-io'
]).factory('socket', function (socketFactory) {
        return socketFactory();
}).controller('chatCtrl',function(socket){
    var vm = this;
    vm.formModel = {};
    vm.formModel.needLogin = true;
    vm.login = login;

    function login(){
        if(!vm.formModel.userid) return;
        socket.emit('getFriends',{ userid : vm.formModel.userid});
        vm.formModel.needLogin = false;
        vm.message = '';
    }
    socket.on('getFriends',function(data){
        vm.friends = data;
    });

    vm.chatWithFriend = function(friend){
        socket.emit('chatWithFriend',friend);
        vm.currentChatUser = friend;
    }
    vm.send = function(user){
        if(vm.formModel.gotosend){
            socket.emit('sendFriendMessage',{friend:user,message:vm.formModel.gotosend});
            vm.message+='<p>'+vm.formModel.gotosend+'</p>';
        }
    }

    socket.on('sendFriendMessage',function(message){
        console.log(message);
        vm.message += "<p>"+message+"</p>";
    });

});
