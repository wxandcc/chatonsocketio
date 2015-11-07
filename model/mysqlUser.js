/**
 * Created by weixing on 2015/11/6.
 */

var mysqlPool = require('./mysqlPool');

exports.friends = function(uid,callback){
    mysqlPool.dbpool.getConnection(function(err,connection){
        if(err) throw err;
        connection.query('select user.id,user.username from gr_users as user inner join gr_user_follow as follow' +
            ' on follow.fid = user.id where follow.uid='+parseInt(uid, 10),
            function(err,rows){
                if(err) throw  err;
                connection.release();
                callback(null,rows);
            });
    })
}

