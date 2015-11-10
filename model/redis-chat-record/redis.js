/**
 * Created by weixing on 2015/11/10.
 */

var config = {
    host: "127.0.0.1"
    ,port: 6379
    ,maxConnections:10
};

var redis = require('redis');

client = redis.createClient(config);

client.on("error", function (err) {
    console.log("redis Error " + err);
});

exports.redisClient = client;

