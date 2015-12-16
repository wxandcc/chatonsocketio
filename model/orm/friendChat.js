/**
 * Created by weixing on 15/11/8.
 */

//var conn = require("./connection.js").mysqlConn;
var conn = require("./connectPool.js").mysqlConnPool;


var friendRoomPrefix = "pri_";

var md5hashRoom = require("./roomName.js").md5hashRoom;

function getRoomname(uid,fuid){
    var roomName = friendRoomPrefix+[uid,fuid].sort(function(a,b){ return a > b ? 1 : 0;}).join('_');
    return roomName;
    //return md5hashRoom(roomName);
};

function checkRoom(uid,fuid){
    conn.query("select id from gr_chat_private_rooms where ? and ?  ",[{fr:uid},{tid:fuid}],function(error,result){
        if(error) throw error;
        console.log(result);
        if(result[0]){
            return;
        }else{
            conn.query("insert into gr_chat_private_rooms set ? ",{fr:uid,tid:fuid});
        }
    });
};

function getUserByName(username,id,cb){
    conn.query("select id,username from gr_users where id !="+id+" and  username like "+conn.escape("%"+username+"%"),function(error,records){
        if(error) throw error;
        cb(records);
    })
}

function getUserChatRooms(uid,cb){
    conn.query("select r.fr,r.tid,r.unread,user.id,user.username from gr_chat_private_rooms as r join gr_users as user" +
        " on user.id = r.fr  where  ? ",{tid:uid},function(error,records){
        if(error) throw  error;
        cb(records);
    });
}

function getFriendById(data,cb){
    conn.query("select id,username from gr_users where ? ",{id:data.uid},function(error,user){
        if(error) throw  error;
        cb(user[0]);
    });
}


function hasUnreadMessage(fr,tid){
    conn.query("update gr_chat_private_rooms set unread = 1 where ? and ? ",[{fr:fr},{tid:tid}]);
}

function readMessage(fr,tid){
    conn.query("update gr_chat_private_rooms set unread = 0 where ? and ? ",[{fr:fr},{tid:tid}]);
}

module.exports = {
     checkRoom          :  checkRoom
    ,getFriendRoom     : getRoomname
    ,getUserByName     : getUserByName
    ,userChatRooms     : getUserChatRooms
    ,hasUnreadMessage  :  hasUnreadMessage
    ,readMessage        : readMessage
    ,getFriendById     : getFriendById
}