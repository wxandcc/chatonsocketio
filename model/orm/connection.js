/**
 * Created by weixing on 2015/11/13.
 */


var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : '',
    database : 'gamerule'
});

connection.connect();

exports.mysqlConn = connection;