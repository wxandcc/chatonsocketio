/**
 * Created by weixing on 2015/11/23.
 */

var crypto = require("crypto");
module.exports.md5hashRoom = function(roomString){
    if(!roomString || typeof roomString !== "string") throw new Error("roomString should be a string ");
    var md5sum = crypto.createHash("md5");
    md5sum.update(roomString);
    return md5sum.digest("hex");
};