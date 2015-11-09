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
    vm.userMesage = {};

    function login(){
        if(!vm.formModel.userid) return;
        socket.emit('getFriends',{ userid : vm.formModel.userid});
        vm.formModel.needLogin = false;
    }
    socket.on('getFriends',function(data){
        vm.friends = data;
        if(data){
            angular.forEach(data,function(ele){
                console.log(ele);
                vm.userMesage[ele.id] = [];
            })
        }
    });

    vm.chatWithFriend = function(friend){
        socket.emit('chatWithFriend',friend);
        vm.currentChatUser = friend;
    }
    vm.send = function(user){
        if(vm.formModel.gotosend){
            socket.emit('sendFriendMessage',{friend:user,message:vm.formModel.gotosend});
            vm.userMesage[user.id].push(vm.formModel.gotosend);
        }
    }

    socket.on('sendFriendMessage',function(data){
        console.log(data);
        vm.userMesage[data.fromid].push(data.message);
    });

});
