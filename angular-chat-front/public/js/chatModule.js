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
    vm.currentChatUser = {};

    function login(){
        if(!vm.formModel.userid) return;
        socket.emit('getFriends',{ userid : vm.formModel.userid});
        vm.formModel.needLogin = false;
        vm.userMesage[vm.formModel.userid] = [];
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
        friend.newMsgArrv = false;
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
        angular.forEach(vm.friends,function(ele){
            console.log(ele);
            if(ele.id == data.fromid){
                ele.newMsgArrv = true;
            }
        });
        console.log(vm.friends);
    });
    socket.on('recordCount',function(data){
        console.log('recordCount',data);
    })

});
