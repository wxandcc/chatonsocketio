/**
 * Created by weixing on 2015/11/13.
 */

//var mysql = require("./connection");

var conn = require("./connectPool.js").mysqlConnPool;

module.exports ={
    //call back with array of friends {id,username,avatar_file}
    friends: function(uid,callback){
                var uid = parseInt(uid,10);
                if(isNaN(uid)){
                    callback(null,[]);
                }
                conn.query('select user.id,user.username from gr_users as user inner join gr_user_follow ' +
                    'as follow on follow.fid = user.id where follow.uid='+parseInt(uid, 10),
                    function(err,friends){
                        if(err) throw  err;
                        if(typeof callback === "function")  callback(null,friends);
                    }
                );
            }
    };
