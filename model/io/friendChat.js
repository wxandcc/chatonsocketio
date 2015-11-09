/**
 * Created by weixing on 15/11/8.
 */

var friendRoomPrefix = "friend";

exports.getFriendRoom = function(socket,friend){
    return friendRoomPrefix+[socket.currentUser.userid,friend.id].sort().join('_');
}