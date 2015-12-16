#!/bin/bash

CMD="node ./app.js "
PID="./gamrule-chat.node.pid"
LOG="./gamrule-chat.node.log"

# ---------------------------------------------------

# 启动函数
function start {
	$CMD >> $LOG 2>&1 &
	mypgmpid=$!
	echo $mypgmpid > $PID
	echo "start [ok]"
}

# 停止函数
function stop {
	kill `cat $PID`
	rm $PID
	echo "stop [ok]"
}

# --------------------------------------------------


echo "$CMD $1"

case "$1" in
start)
	start
;;
restart)
	if [ -f $PID ] ; then
		stop
		sleep 4
	fi
	start
;;
stop)
	stop
	exit 0
;;
esac


for (( c=0 ; ; c++ ))
do
	if [ -f $PID ] ; then
		mypgmpid=`cat $PID`
		cmdex="ps uh -p$mypgmpid"
		psrtn=`$cmdex`
		if [ -z "$psrtn" ]; then
			# 进程挂掉自动重启
			echo "`date '+%Y/%m/%d %H:%M:%S'` FATALERROR RESTART SERVICE" >> $LOG
			start
		elif (( $c%20 == 0 )); then
			# 记录进程运行状态
			echo "`date '+%Y/%m/%d %H:%M:%S'` PSINFO $psrtn" >> $LOG
			c=0
		fi
		sleep 3
	else
		break
	fi
done