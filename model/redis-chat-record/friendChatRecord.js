/**
 * Created by weixing on 2015/11/10.
 */



var redisClient = require('./redis').redisClient;
/**
 *
 * @param params
 * object {
 *  roomid:
 *  start:
 *  offset:
 * }
 * @param cb callback function
 */
var getFriendChatRecord = function(room,start,end,cb){
    redisClient.lrange(room,start,end,function(error,records){
        if(error) throw error;
        cb(records);
    });
}

var pushFriendChatRecord = function(room,record,cb){
    var record = JSON.stringify(record);
    redisClient.rpush(room,record,function(error,recordCount){
        if(error) throw error;
        cb(recordCount);
    });
}

exports.getChatRecord = getFriendChatRecord;

exports.pushChatRecord = pushFriendChatRecord;
