/**
 * Created by weixing on 15/11/8.
 */

var conn = require("../orm/connection.js").mysqlConn;

var friendRoomPrefix = "pri_";

function getRoomname(uid,fuid){
    return friendRoomPrefix+[uid,fuid].sort(function(a,b){ return a > b ? 1 : 0;}).join('_');
};

function checkRoom(uid,fuid){
    conn.query("select id from gr_chat_private_rooms where ? and ?  ",[{fr:uid},{tid:fuid}],function(error,result){
        if(error) throw error;
        if(result[0]){
            return;
        }else{
            conn.query("insert into gr_chat_private_rooms set ? ",{fr:uid,tid:fuid}); //非好友聊天关系
        }
    });
};

function getUserByName(username,cb){
    conn.query("select id,username from gr_users where username like "+conn.escape("%"+username+"%"),function(error,records){
        if(error) throw error;
        cb(records);
    })
}

function getUserChatRooms(uid,cb){
    conn.query("select r.fr,r.tid,r.unread,user.id,user.username from gr_chat_private_rooms as r join gr_users as user" +
        " on user.id = r.fr  where tid = ?",uid,function(error,records){
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

exports.checkRoom = checkRoom;
exports.getFriendRoom = getRoomname;
exports.getUserByName = getUserByName;
exports.userChatRooms = getUserChatRooms;
exports.hasUnreadMessage = hasUnreadMessage;//设置未读消息
exports.readMessage = readMessage; //设置未读消息为已读
exports.getFriendById = getFriendById;