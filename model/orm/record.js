/**
 * Created by weixing on 2015/11/17.
 */


var conn = require('./connection').mysqlConn;

exports.pushChatRecord = function(record,cb){
    conn.query("insert into gr_chat_private_records set ?", record,function(error,result){
        if(error) throw error;
        if(cb) cb(result.insertId);
    });
};


exports.firt5Message = function(room,cb){
    conn.query("select * from gr_chat_private_records where room=? order by created_at desc limit 5 ",room,function(error,records){
        if(error) throw error;
        cb(records);
    })
}
