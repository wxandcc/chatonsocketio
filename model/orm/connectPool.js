/**
 * Created by weixing on 15/11/21.
 */


var mysql = require('mysql');
var pool  = mysql.createPool({
    connectionLimit : 10,
    host            : '127.0.0.1',
    user            : 'root',
    password        : '',
    database        : "gamerule",
    debug: true
});

pool.on("connection",function(connection){
    console.log("get connection called!");
});

exports.mysqlConnPool = pool;

