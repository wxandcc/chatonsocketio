/**
 * Created by weixing on 2015/11/6.
 */

angular.module('chat',[
    'btford.socket-io'
]).factory('socket', function (socketFactory) {
        return socketFactory();
}).controller('testCtr',function(socket){
    var vm = this;
    socket.emit('getFriends',{ userid : 11});
    socket.on('getFriends',function(data){
        console.log(data);
    });
    socket.emit('testEvent',{ uid :"11"});
    socket.on('news',function(data){
        vm.name = data;
    });
});
