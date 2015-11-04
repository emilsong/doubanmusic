
var ver = Settings.getValue("ver"); 
	if(ver!="4.0"){
		Settings.setValue("ver","4.0");
		chrome.tabs.create({url: "options.html"});
	}
	

var getOptions = function(){
	var options = Settings.getObject("options");
	if(options==undefined){
		options = {
			showLike:false,
			showDel:true,
			showPrev:true,
			showNext:true,
			showLyric:true,
			showNotify:true,
			notifySpan:3,
			blockad:true
		};
		Settings.setObject("options",options);
	}
	if(options.showNotify==undefined)
		options.showNotify = true;
	if(options.blockad==undefined)
		options.blockad = true;
	return options;
}



//过滤专辑
var replaceAlbum = function(songList){
	if(getOptions().blockad){
		for(i=0;i<songList.length;i++){
			if(songList[i].adtype!=undefined){
			//if(songList[i].albumtitle=="豆瓣FM"){
				//console.log(songList[i],"ad checked "+songList[i].title);
				songList.splice(i,1);
				break;
			}
		}
	}
	return songList;
}

var douban = {};
douban.data = {duration:0};


//连接对象
var portLink;

//监控连接事件
chrome.extension.onConnect.addListener(function(port) {
portLink = port;
if(port.name=="dbstyle"){
	port.postMessage({act:"connected"});
	port.onDisconnect.addListener(function(){
		portLink = null;
	});
	port.onMessage.addListener(function(msg, port){
		//port.postMessage("hello");
		//msg.act操作类型 playList(channelId)/play(time)/pause/next/prev/
		//get(channelId)/mute/unmate/volumn(num)
		//msg.data操作数据
		//playData = msg.playData;
		switch(msg.act){
			case "playList":
				player.playList(msg.data);
			break;
			case "play":
				player.play();
			break;
			case "playTo":
				player.playTo(msg.data);
			break;
			case "pause":
				player.pause();
			break;
			case "next":
				player.playNext();
			break;
			case "prev":
				player.playPrev();
			break;
			case "mute":
				player.mute();
			break;
			case "unmute":
				player.unmute();
			break;
			case "volume":
				Settings.setValue("volume",msg.data);
				var vol = msg.data/50;
				player.volume(vol);
			break;
			case "channel":
				player.channel(msg.data);
			break;
		}
		
	});

};

});


$('<div id="jquery_jplayer_1" class="jp-jplayer"></div>').appendTo("body");
$("#jquery_jplayer_1").jPlayer({
		ready: function (event) {},
		ended: function (event) {
			//发送请求记录
			player.playEnd();
			player.playNext();
		},
		timeupdate:function(event){	
			douban.data.duration = event.jPlayer.status.duration;
			if(portLink!=null){
				var left = event.jPlayer.status.duration - event.jPlayer.status.currentTime;
				left = $.jPlayer.convertTime(left);
				var percent = event.jPlayer.status.currentTime/event.jPlayer.status.duration;
				portLink.postMessage({act:"playing",data:{time:left,percent:percent,now:Math.floor(event.jPlayer.status.currentTime)}});
			}
		},
		supplied: "mp3,flv",
		solution:"html"
});


var player = {
		init:function(){
			//设置监听
		},
		playPrev:function(){
			var playData = getPlayData();
			if(playData.playIndex>=1){
				playData.playIndex-=1;
				Settings.setObject("playData",playData);
				player.playSong(playData);
			}
		},
		playNext:function(){
			var playData = getPlayData();
			if(Settings.getValue("cycle",0)==0){
				playData.playIndex+=1;
			}
			Settings.setObject("playData",playData);
			player.playSong(playData);
		},
		play:function(){
			$("#jquery_jplayer_1").bind($.jPlayer.event.error, function(event) { 
				player.playList();
			});
			$("#jquery_jplayer_1").jPlayer("play");
			
		},
		playTo:function(percent){
			var jp = $("#jquery_jplayer_1");
			var sec = 0;
			if(douban.data.duration>0){
				sec = douban.data.duration*percent;
			}
			
			jp.jPlayer("play",sec);
		},
		volume:function(vol){
			$("#jquery_jplayer_1").jPlayer("volume", vol);
		},
		pause:function(){
			$("#jquery_jplayer_1").jPlayer("pause");
		},
		playSong:function(playData){
			//console.log(playData,"playsong");
			var song = playData.playList[playData.playIndex];

			if(song==undefined){
				player.getPlay(playData.channelInfo.id,playData.channelInfo.sid);
			}
			else{
				if(getOptions().showNotify){
					var ntfy = new window.notify();
					ntfy.show(song);
				}
				var url = song.url;
				$("#jquery_jplayer_1").jPlayer("setMedia", {
					mp3:url
				}).jPlayer("play");
				if (portLink!=null) {
					var msg = {};
					msg.act = "info";
					msg.data = song;
					portLink.postMessage(msg);
				}
			}
		},
		playList:function(channel){
			var playData = getPlayData();
			if(channel==undefined){
				channel = playData.channelInfo;
			}
			var kbs = getKbps();
			var id = channel.id;
			
			
			var url = "http://douban.fm/j/mine/playlist?type=n&pb="+kbs+"&from=mainsite&channel="+id;
			if(channel.sid!=undefined){
				url = "http://douban.fm/j/mine/playlist?type=n&sid="+channel.sid+"&channel="+channel.sid+"&pb="+kbs+"&from=mainsite";
			}
			
			$.get(url,function(result){
				$("#jquery_jplayer_1").jPlayer("clearMedia");
				playData.playListDate = new Date().getTime();
				playData.playList = replaceAlbum(result.song);
				playData.playIndex = 0;
				playData.channelInfo = channel;
				Settings.setObject("playData",playData);
				player.playSong(playData);
			});
		},
		playEnd:function(){
			var playData = getPlayData();
			var kbs = getKbps();
			var song = playData.playList[playData.playIndex];
			var url = "http://douban.fm/j/mine/playlist?type=e&sid="+song.sid+"&channel="+playData.channelInfo.id+"&pb="+kbs+"&from=mainsite&r="+Math.random();
			$.get(url);
		},
		getPlay:function(id,sid){
			var kbs = getKbps();
			var url = "http://douban.fm/j/mine/playlist?type=n&pb="+kbs+"&from=mainsite&channel="+id;
			if(sid!=undefined){
				url = "http://douban.fm/j/mine/playlist?type=n&sid="+sid+"&channel="+sid+"&pb="+kbs+"&from=mainsite";
			}
			$.get(url,function(result){
				var playData = getPlayData();
				var lastDate = playData.playListDate;
				if(lastDate==undefined){
					playData.playList = replaceAlbum(result.song);
					playData.playIndex = 0;
				}else{
					var span = new Date().getTime() - lastDate;
					var spanHour = new timeSpan(span);
					if(spanHour.getHourPart()>1){
						playData.playList = replaceAlbum(result.song);
						playData.playIndex = 0;
					}
					else{
						playData.playList = playData.playList.concat(replaceAlbum(result.song));
					}
				}
				playData.playListDate = new Date().getTime();
				Settings.setObject("playData",playData);
				//console.log(playData);
				player.playSong(playData);
			});
		},
		mute:function(){
			$("#jquery_jplayer_1").jPlayer("mute");
		},
		unmute:function(){
			$("#jquery_jplayer_1").jPlayer("unmute");
		}
		
};


window.notify = function () {
        var notify, visible = false, timer = null, self = this;
        return {
            show: function (song) {
				if(window.webkitNotifications)
				{
					//notify = webkitNotifications.createHTMLNotification('../notify.html');
					var icon = song.picture; //如果直接拷贝，这个地方URL路径可能会报错！
					var title = song.artist;
					var body = song.albumtitle + " "+song.title;
					notify = webkitNotifications.createNotification(icon, title, body);
					notify.show();
					visible = true;
					this.timer();
				}
            },
            hide: function () {
                notify.cancel();
                visible = false;
            },
            timer: function () {
				
                timer = setTimeout(function () {
                    this.hide();
                    timer = null;
                }.bind(this), ((getOptions().NotifySpan)||3)*1000);
            },
            clear: function () {
                clearTimeout(timer);
                timer = null;
            },
            isVisible: function () {
                return visible;
            }
        }
    };


//获取时间间隔数
function timeSpan(msec) {
    var milliseconds = msec;
    this.getDays = function () {
        return Math.floor(this.getHours() / 24);
    }
    this.getHours = function () {
        return Math.floor(this.getMinutes() / 60);
    }
    this.getMinutes = function () {
        return Math.floor(this.getSeconds() / 60);
    }
    this.getSeconds = function () {
        return Math.floor(milliseconds / 1000);
    }
    //以下是获取时间间隔的具体部分
    this.getMillisecondPart = function () {
        return milliseconds - this.getSeconds() * 1000;
    }
    this.getSecondPart = function () {
        return this.getSeconds() - 60 * this.getMinutes();
    }
    this.getMinutePart = function () {
        return this.getMinutes() - 60 * this.getHours();
    }
    this.getHourPart = function () {
        return this.getHours() - 24 * this.getDays();
    }
}

