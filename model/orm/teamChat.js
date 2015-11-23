/**
 * Created by weixing on 2015/11/23.
 */

var pool = require("./connectPool.js").mysqlConnPool;
var md5hashRoom = require("./roomName.js").md5hashRoom;
var teamChatRoomPre = "teamChat_";


module.exports = {
    getTeams: function(uid,cb){
                pool.query("select member.user_id as uid,team.team_name,team.id as team_id from gr_club_team as team join gr_club_team_member as member on member.team_id = team.id where member.user_id = ? "
                    ,uid,function(error,datas){
                        if(error) throw  error;
                        cb(datas);
                    }
                );
            },
    getTeamsMembers: function(team,cb){
                pool.query("select users.id,users.username from gr_users as users join gr_club_team_member as member on member.user_id = users.id where member.team_id= ? "
                    ,[team.team_id],function(error,users){
                        if(error) throw error;
                        cb(users,team);
                });
            },
    pushTeamChatRecord : function(record,cb){
        pool.query("insert into gr_chat_team_records set ?", record,function(error,result){
            if(error) throw error;
            if(cb) cb(result.insertId);
        });
    },
    first5TeamMessage : function(room,cb){
        pool.query("select * from gr_chat_team_records where room= ? order by id desc limit 5 ",room,function(error,records){
            if(error) throw error;
            cb(records);
        })
    },
    getTeamRecordCount : function(room,id,cb){
        pool.query("select count(*) as count from gr_chat_team_records where ? and id < ? ",[{room:room},id],function(error,result){
            if(error) throw error;
            var rt = {
                    startid:id,
                    total:result[0].count,
                    room:room
            };
            cb(rt);
        });
    },
    getTeamChatRecord : function(room,start,offset,startid,cb){
        pool.query("select * from gr_chat_team_records where ? and id < ? order by id desc limit ? , ?",[{room:room},startid,start,offset],
            function(error,result){
                if(error) throw error;
                cb(result);
            });
    },
    teamRoom: function(team_id){
        return md5hashRoom(teamChatRoomPre+team_id);
    }
};
