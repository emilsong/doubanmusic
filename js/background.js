var ver=Settings.getValue("ver");if(ver!="4.0"){Settings.setValue("ver","4.0");chrome.tabs.create({url:"options.html"})}var getOptions=function(){var e=Settings.getObject("options");if(e==undefined){e={showLike:false,showDel:true,showPrev:true,showNext:true,showLyric:true,showNotify:true,notifySpan:3,blockad:true};Settings.setObject("options",e)}if(e.showNotify==undefined)e.showNotify=true;if(e.blockad==undefined)e.blockad=true;return e};var replaceAlbum=function(e){if(getOptions().blockad){for(i=0;i<e.length;i++){if(e[i].adtype!=undefined){e.splice(i,1);break}}}return e};var douban={};douban.data={duration:0};var portLink;chrome.extension.onConnect.addListener(function(e){portLink=e;if(e.name=="dbstyle"){e.postMessage({act:"connected"});e.onDisconnect.addListener(function(){portLink=null});e.onMessage.addListener(function(e,t){switch(e.act){case"playList":player.playList(e.data);break;case"play":player.play();break;case"playTo":player.playTo(e.data);break;case"pause":player.pause();break;case"next":player.playNext();break;case"prev":player.playPrev();break;case"mute":player.mute();break;case"unmute":player.unmute();break;case"volume":Settings.setValue("volume",e.data);var a=e.data/50;player.volume(a);break;case"channel":player.channel(e.data);break}})}});$('<div id="jquery_jplayer_1" class="jp-jplayer"></div>').appendTo("body");$("#jquery_jplayer_1").jPlayer({ready:function(e){},ended:function(e){player.playEnd();player.playNext()},timeupdate:function(e){douban.data.duration=e.jPlayer.status.duration;if(portLink!=null){var t=e.jPlayer.status.duration-e.jPlayer.status.currentTime;t=$.jPlayer.convertTime(t);var a=e.jPlayer.status.currentTime/e.jPlayer.status.duration;portLink.postMessage({act:"playing",data:{time:t,percent:a,now:Math.floor(e.jPlayer.status.currentTime)}})}},supplied:"mp3,flv",solution:"html"});var player={init:function(){},playPrev:function(){var e=getPlayData();if(e.playIndex>=1){e.playIndex-=1;Settings.setObject("playData",e);player.playSong(e)}},playNext:function(){var e=getPlayData();if(Settings.getValue("cycle",0)==0){e.playIndex+=1}Settings.setObject("playData",e);player.playSong(e)},play:function(){$("#jquery_jplayer_1").bind($.jPlayer.event.error,function(e){player.playList()});$("#jquery_jplayer_1").jPlayer("play")},playTo:function(e){var t=$("#jquery_jplayer_1");var a=0;if(douban.data.duration>0){a=douban.data.duration*e}t.jPlayer("play",a)},volume:function(e){$("#jquery_jplayer_1").jPlayer("volume",e)},pause:function(){$("#jquery_jplayer_1").jPlayer("pause")},playSong:function(e){var t=e.playList[e.playIndex];if(t==undefined){player.getPlay(e.channelInfo.id,e.channelInfo.sid)}else{if(getOptions().showNotify){var a=new window.notify;a.show(t)}var n=t.url;$("#jquery_jplayer_1").jPlayer("setMedia",{mp3:n}).jPlayer("play");if(portLink!=null){var i={};i.act="info";i.data=t;portLink.postMessage(i)}}},playList:function(e){var t=getPlayData();if(e==undefined){e=t.channelInfo}var a=getKbps();var n=e.id;var i="http://douban.fm/j/mine/playlist?type=n&pb="+a+"&from=mainsite&channel="+n;if(e.sid!=undefined){i="http://douban.fm/j/mine/playlist?type=n&sid="+e.sid+"&channel="+e.sid+"&pb="+a+"&from=mainsite"}$.get(i,function(a){$("#jquery_jplayer_1").jPlayer("clearMedia");t.playListDate=(new Date).getTime();t.playList=replaceAlbum(a.song);t.playIndex=0;t.channelInfo=e;Settings.setObject("playData",t);player.playSong(t)})},playEnd:function(){var e=getPlayData();var t=getKbps();var a=e.playList[e.playIndex];var n="http://douban.fm/j/mine/playlist?type=e&sid="+a.sid+"&channel="+e.channelInfo.id+"&pb="+t+"&from=mainsite&r="+Math.random();$.get(n)},getPlay:function(e,t){var a=getKbps();var n="http://douban.fm/j/mine/playlist?type=n&pb="+a+"&from=mainsite&channel="+e;if(t!=undefined){n="http://douban.fm/j/mine/playlist?type=n&sid="+t+"&channel="+t+"&pb="+a+"&from=mainsite"}$.get(n,function(e){var t=getPlayData();var a=t.playListDate;if(a==undefined){t.playList=replaceAlbum(e.song);t.playIndex=0}else{var n=(new Date).getTime()-a;var i=new timeSpan(n);if(i.getHourPart()>1){t.playList=replaceAlbum(e.song);t.playIndex=0}else{t.playList=t.playList.concat(replaceAlbum(e.song))}}t.playListDate=(new Date).getTime();Settings.setObject("playData",t);player.playSong(t)})},mute:function(){$("#jquery_jplayer_1").jPlayer("mute")},unmute:function(){$("#jquery_jplayer_1").jPlayer("unmute")}};window.notify=function(){var e,t=false,a=null,n=this;return{show:function(a){if(window.webkitNotifications){var n=a.picture;var i=a.artist;var r=a.albumtitle+" "+a.title;e=webkitNotifications.createNotification(n,i,r);e.show();t=true;this.timer()}},hide:function(){e.cancel();t=false},timer:function(){a=setTimeout(function(){this.hide();a=null}.bind(this),(getOptions().NotifySpan||3)*1e3)},clear:function(){clearTimeout(a);a=null},isVisible:function(){return t}}};function timeSpan(e){var t=e;this.getDays=function(){return Math.floor(this.getHours()/24)};this.getHours=function(){return Math.floor(this.getMinutes()/60)};this.getMinutes=function(){return Math.floor(this.getSeconds()/60)};this.getSeconds=function(){return Math.floor(t/1e3)};this.getMillisecondPart=function(){return t-this.getSeconds()*1e3};this.getSecondPart=function(){return this.getSeconds()-60*this.getMinutes()};this.getMinutePart=function(){return this.getMinutes()-60*this.getHours()};this.getHourPart=function(){return this.getHours()-24*this.getDays()}}