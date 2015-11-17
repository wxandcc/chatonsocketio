/**
 * Created by weixing on 2015/11/13.
 */

var mysql = require("./connection");
exports.friends = function(uid,callback){
    mysql.mysqlConn.query('select user.id,user.username from gr_users as user inner join gr_user_follow as follow' +
        ' on follow.fid = user.id where follow.uid='+parseInt(uid, 10),
            function(err,rows){
                if(err) throw  err;
                callback(null,rows);
            });
};
