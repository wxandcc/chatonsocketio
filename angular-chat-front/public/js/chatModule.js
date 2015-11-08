/**
 * Created by weixing on 2015/11/6.
 */

angular.module('chat',[
    'btford.socket-io'
]).factory('socket', function (socketFactory) {
        return socketFactory();
}).controller('chatCtrl',function(socket){
    var vm = this;
    socket.emit('getFriends',{ userid : 11});
    socket.on('getFriends',function(data){
        vm.friends = data;
    });

    vm.chatWithFriend = function(friend){
        socket.emit('chatWithFriend',friend);
        vm.currentChatUser = friend;
    }
});
