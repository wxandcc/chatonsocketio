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

var getRecordCount = function(room,cb){
    redisClient.llen(room,function(error,recordCount){
        if(error) throw error;
        var rt = {
            room:room,
            total: recordCount
        }
        cb(rt);
    })
}


exports.recordCount = getRecordCount;
exports.getChatRecord = getFriendChatRecord;
exports.pushChatRecord = pushFriendChatRecord;
