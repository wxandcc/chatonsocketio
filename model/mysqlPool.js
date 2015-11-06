/**
 * Created by weixing on 2015/11/6.
 */


var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit : 10,
    host     : '127.0.0.1',
    user     : 'root',
    password : '',
    database : 'gamerule',
    debug: true
});

exports.dbpool = pool;