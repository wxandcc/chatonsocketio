/**
 * Created by weixing on 2015/11/17.
 */


//var conn = require('./connection').mysqlConn;

var conn = require("./connectPool.js").mysqlConnPool;

exports.pushChatRecord = function(record,cb){
    conn.query("insert into gr_chat_private_records set ?", record,function(error,result){
        if(error) throw error;
        if(cb) cb(result.insertId);
    });
};


exports.firt5Message = function(room,cb){
    conn.query("select * from gr_chat_private_records where room=? order by id desc limit 5 ",room,function(error,records){
        if(error) throw error;
        cb(records);
    })
}


exports.getRecordCount = function(room,id,cb){
    conn.query("select count(*) as count from gr_chat_private_records where ? and id < ? ",[{room:room},id],function(error,result){
        if(error) throw error;
        var rt = {
            startid:id,
            total:result[0].count,
            room:room
        };
        cb(rt);
    });
};
exports.getChatRecord = function(room,start,offset,startid,cb){
    conn.query("select * from gr_chat_private_records where ? and id < ? order by id desc limit ? , ?",[{room:room},startid,start,offset],
        function(error,result){
        if(error) throw error;
        cb(result);
    });
};
