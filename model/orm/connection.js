/**
 * Created by weixing on 2015/11/13.
 */


var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : '',
    database : 'gamerule'
    //, debug : true
});

//todo ��Ӷ������������Լ�������
connection.connect();

connection.on("error",function(error){
    console.log(error);
});


exports.mysqlConn = connection;