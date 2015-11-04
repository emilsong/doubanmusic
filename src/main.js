$(document).ready(function(){

	var options = Settings.getObject("options");
	if(options==undefined){
		options = {
			showLike:false,
			showDel:true,
			showPrev:true,
			showNext:true,
			showLyric:true
		};
		Settings.setObject("options",options);
	}
	if(options.showDel)
		$(".jp-del").show();
	if(options.showPrev)
		$(".jp-previous").show();
	if(options.showNext)
		$(".jp-next").show();


	var douban = {};

	var playing = false;
	var playLyric = {};
	var portLink = chrome.extension.connect({name:"dbstyle"});
	
	//加载上次播放的专辑信息
	var playData = getPlayData();
	try{
		var song = playData.playList[playData.playIndex];
		if(song.public_time==undefined)
			song.public_time = "";
		if(song.like=="1"){
			$(".jp-like").addClass("jp-liked").attr("data-liked","1");
		}
		$(".jp-like").attr("data-sid",song.sid);
		$("#songChannel").attr("data-sid",song.sid);

		$("#singer").text(song.artist);
		$("#album").text("<"+song.albumtitle+"> "+song.public_time);
		$("#cover").attr("src",song.picture);
		$("#coverlink").attr("href","http://music.douban.com"+song.album).attr("target","_blank");
		$("#song").text(song.title);
		
		if(playData.channelInfo.title){
			$(".header").attr("data-id",playData.channelInfo.id);
			$("#channel_cover").attr("src",playData.channelInfo.cover);
			$("#channel_title").text(playData.channelInfo.title);
		}
		
	}catch(ex){
		
	}
	
	
	//收到background发来信息的事件处理
	portLink.onMessage.addListener(function (msg) {
		switch(msg.act){
			case "info":
				var song = msg.data;
				$("#cover").attr("src",song.picture);
				if(song.album!="")
					$("#coverlink").attr("href","http://music.douban.com"+song.album).attr("target","_blank");
				else
					$("#coverlink").removeAttr("href");
				$("#singer").text(song.artist);
				if(song.public_time==undefined)
					song.public_time = "";
				if(song.albumtitle!=undefined&&song.albumtitle!="")
					$("#album").text("<"+song.albumtitle+"> "+song.public_time);
				
				$("#song").text(song.title);
				if(song.like==1){
					$(".jp-like").addClass("jp-liked").attr("data-liked","1");
				}else{
					$(".jp-like").removeClass("jp-liked");
				}
				$(".jp-like").attr("data-sid",song.sid);
				$("#songChannel").attr("data-sid",song.sid);

				lists.getLyric(song);
			break;
			case "playing":
				playData = getPlayData();
				var song = playData.playList[playData.playIndex];
				if(!playing){
					playing = true;
					$(".header").attr("data-id",playData.channelInfo.id);
					$("#channel_status").removeClass("waiting").addClass("playing");
					$(".jp-play").hide();
					$(".jp-pause").show();
					playLyric = getPlayLyric();
					if(playLyric!=undefined){
						if(playLyric.title!=song.title)
							lists.getLyric(song);
					}
					
				}
				$(".jp-current-time").text(msg.data.time);
				$(".jp-play-bar").css({width:msg.data.percent*100+"%"});
				playLyric = getPlayLyric();
				if(playLyric!=undefined){
					if(playLyric.lyric&&playLyric.lyric[msg.data.now]!=undefined){
						//console.log(playLyric);
						//console.log(song);
						if(playLyric.title==song.title)
							$(".lyric").text(playLyric.lyric[msg.data.now]);
						//else
							//console.log("error:"+song.title);
					}
				}
					
			break;
			case "connected":
			break;
			
			
		}
		
	});
	
	
	douban.bind = function(){
		//绑定事件
		shareTool.init();

		$(".tag ul li a").click(function(){
			$(".tag ul li a").removeClass("hover");
			var a = $(this);
			a.addClass("hover");
			var type = a.attr("data-type");
			switch(type){
				case "cate":
					$("#cate").show();
					$("#lists").hide();
				break;
				case "fav":
					lists.getFav();
				break;
				default:
					lists.get(type,0);
				break;
			}
			
		});

		$(".header").hover(function(){
			var id = $(this).attr("data-id");
			if(id&&id>0){
				var btn = $(".header s");
				btn.unbind("click");
				if(id&&douban.fav.check(id)){
					btn.removeClass("fav").addClass("faved").attr("title","点击取消收藏");
					btn.bind("click",function(){douban.fav.remove(id);showtip("取消收藏")});
				}else{
					btn.removeClass("faved").addClass("fav").attr("title","点击收藏");
					btn.bind("click",function(){douban.fav.add(id);showtip("收藏成功")});
				}
				btn.show();
			}
		},function(){
			$(".header s").hide();
		});

		$(".header s").bind("click",function(){
			var id = $(this).attr("data-id");
			douban.fav.set(id);
		});
		
		$("#cate li").bind("click",function(){
			$("#cate li").removeClass("hover");
			var li = $(this);
			li.addClass("hover");
			lists.get("cate",0,li.attr("data-id"));
		});

		$("#lists").delegate("li div img","click",function(){
			var div = $(this).parent("div");
			var cid = div.attr("data-id");
			var cover = div.children("img").attr("src");
			var title = div.parent("li").children("a").text();

			var channel = {
				title:title,
				cover:cover,
				id:cid
			};
			$(".arrow").trigger("click");
			login.needLogin = false;
			$(".login").css("left","300px");
			lists.playChannel(channel);
			
		});

		$("#lists").delegate("li div i","click",function(){
			var div = $(this).parent("div");
			var cid = div.attr("data-id");
			div.parent("li").fadeOut().remove();
			douban.fav.remove(cid);
		});
		
		$("#keyword").bind("keydown",function(){
			if(event.keyCode==13)
				$(".search").trigger("click");
		});
		$("#keyword").focusin(function(){
			$("#keyword").css({width:'90px'});
		}).focusout(function(){
			$("#keyword").css({width:'70px'});
		});

		$(".search").bind("click",function(){
			$(".tag ul li a").removeClass("hover");
			var key = $("#keyword").val();
			if(key!=""){
				lists.get("search",0,key);
			}
		});
		
		$(".arrow").bind("click",function(){
			var arrow = $(this);
			var cates = $(".cates");
			if (cates.offset().left != 0){
				if($(".login").offset().left ==20)
					$(".login").animate({left:'300px'});
				cates.animate({left:'0px'},function(){
					arrow.addClass("arrow-back");
					$(".lyric").removeClass("lyric-normal").addClass("lyric-hover");
				});
			}
			else{
				if(login.needLogin)
					$(".login").animate({left:'0px'});
				cates.animate({left:'-280px'},function(){
					arrow.removeClass("arrow-back");
					$(".lyric").removeClass("lyric-hover").addClass("lyric-normal");
				});
			}
		});
		
		
		$(".jp-next").bind("click",function(){
			playData = getPlayData();
			playData.playIndex+=1;
			portLink.postMessage({act:"next"});
			$("#channel_status").addClass("playing").removeClass("waiting");
			$(".jp-pause").show();
			$(".jp-play").hide();
			//console.log(playData,"next");
		});
		$(".jp-del").bind("click",function(){
			playData = getPlayData();
			var song = playData.playList[playData.playIndex];
			lists.del(song.sid);
		});
		$(".jp-previous").bind("click",function(){
			playData = getPlayData();
			if(playData.playIndex>=1){
				playData.playIndex-=1;
				portLink.postMessage({act:"prev"});
			}
			//console.log(playData,"prev");
		});
		$(".jp-pause").bind("click",function(){
			portLink.postMessage({act:"pause"});
			$("#channel_status").addClass("waiting").removeClass("playing");
			$(".jp-play").show();
			$(".jp-pause").hide();
		});
		$(".jp-play").bind("click",function(){
			$("#channel_status").addClass("playing").removeClass("waiting");
			portLink.postMessage({act:"play"});
			$(".jp-pause").show();
			$(".jp-play").hide();
		});
		$(".jp-mute").bind("click",function(){
			portLink.postMessage({act:"mute"});
			$(".jp-mute").hide();
			$(".jp-unmute").show();
		});
		$(".jp-unmute").bind("click",function(){
			portLink.postMessage({act:"unmute"});
			$(".jp-unmute").hide();
			$(".jp-mute").show();
		});
		$("#user_status").bind("click",function(){
			if(login.status){
				$("#user_menu").toggle();
			}
			else
				login.init();
			setTimeout(function(){
				if($("#user_menu").is(":visible")){
					$("body").bind("click",function(){
						$("#user_menu").hide();
						$("body").unbind("click");
					});
				}
			},0);
			
		});
		$(".logout").click(function(){
			login.logout();
		});
		$("#radio_private").click(function(){lists.playChannel("0");$("#user_menu").hide();});
		$("#radio_red").click(function(){lists.playChannel("-3");$("#user_menu").hide();});
		$(".jp-like").click(function(){
			
			var sid = $(this).attr("data-sid");
			var cid = playData.channelInfo.id;
			
			lists.red(sid,cid);
		});
		var volTimer;
		$(".jp-volume-bar").bind("click",function(event){
			var width = event.offsetX+1; 
			if(width>50){width=50}; 
			Settings.setValue("volume",width);
			$(".jp-volume-bar-value").width(width);
			Settings.setValue("volume",width);
			portLink.postMessage({act:"volume",data:width});
			clearTimeout(volTimer);
			volTimer = setTimeout(function(){
				$(".jp-volume").hide();
			},4000);
		});
		$(".jp-seek-bar").bind("click",function(event){
			var width = event.offsetX+1; 
			if(width>240){width=240}; 
			console.log(width);
			var percent = width/240;
			portLink.postMessage({act:"playTo",data:percent});
		});
		$(".jp-mute,.jp-unmute").bind("mouseover",function(){
			var volume = Settings.getValue("volume","40");
			$(".jp-volume-bar-value").width(volume);
			$(".jp-volume").show();
		});
		$(".jp-volume").bind("mouseover",function(){
			clearTimeout(volTimer);
		});
		$(".jp-volume").bind("mouseout",function(){
			clearTimeout(volTimer);
			volTimer = setTimeout(function(){
				$(".jp-volume").hide();
			},4000);
		});

		//初始化电台
		if(playData.playList!=undefined&&playData.playList.length==0){
			lists.get("hot",0,function(){$(".arrow").trigger("click");});
		}else{
			lists.get("hot",0);
		}

		$(".cycle").bind("click",function(){
			var cycle = $(this);
			cycle.toggleClass("cycle1");
			if(cycle.hasClass("cycle1")){
				Settings.setValue("cycle",1);
				cycle.attr("title","单曲循环");
			}else{
				Settings.setValue("cycle",0);
				cycle.attr("title","顺序播放");
			}
		});

		if(Settings.getValue("cycle",0)==1){
			$(".cycle").addClass("cycle1");
		}
		

		$("#songChannel").bind("click",function(){
			var sid = $(this).attr("data-sid");
			sid = 3635044;
			
			
			
			var playData = getPlayData();
			//console.log(playData);
			//console.log(playData.playList[playData.playIndex]);
			var songData = playData.playList[playData.playIndex];
			var channel = {
				title:songData.title,
				cover:songData.picture,
				id:sid,
				sid:sid
			};
			
			$.getJSON("http://douban.fm/j/change_channel?fcid="+playData.channelInfo.id+"&tcid="+sid+"&area=songchannel",function(result){
				lists.playChannel(channel);
			});
			

		});


	};
	
	
	//列表以及歌词操作相关方法
	var lists = {
		hotChannels:[],
		upChannels:[],
		comChannels:[],
		config:{
			hotUrl:"http://douban.fm/",
			searchUrl:"http://douban.fm/j/explore/search?query=",
			cateUrl:"http://douban.fm/j/explore/genre?gid=",
			tmpl:"<li>\
					<div data-id='$id$'>\
						<img src='$img$' title='$intro$'/>\
					</div>\
					<a>$name$</a>\
				</li>",
			tmpl_fav:"<li>\
					<div data-id='$id$'>\
						<img src='$img$' title='$intro$'/>\
						<i title='取消收藏'>×</i>\
					</div>\
					<a>$name$</a>\
				</li>"
		},
		getFav:function(){
			var url = "http://douban.fm/j/fav_channels";
			$.getJSON(url,function(result){
				
				var favids = new Array();

				var tmpl = lists.config.tmpl_fav;
				var reHtml = "";
				
				for(var i=0;i<result.channels.length;i++){
					var info = result.channels[i];
					var name = info.name;
					var id = info.id;
					var cover = info.cover;
					var intro = info.intro;
					favids.push(id);
					var r = tmpl.replace("$img$",cover);
						r = r.replace("$name$",name);
						r = r.replace("$id$",id);
						r = r.replace("$intro$",intro);
						reHtml += r;
				}
				$("#cate").hide();
				$("#lists").empty().show().append(reHtml);

				Settings.setObject("favids",favids);
				//console.log(div.getElementById("record_viewer"));

			});
		},
		getHot:function(type){
			var tmpl = lists.config.tmpl;
			var html = "";
			var url = lists.config.hotUrl;
			var func = function(){
				var channels = [];
				switch(type){
					case "hot":
						channels = lists.hotChannels;
					break;
					case "up":
						channels = lists.upChannels;
					break;
					case "com":
						channels = lists.comChannels;
					break;
				}
				
				for(i=0;i<channels.length;i++){
					var c = channels[i];
					var r = tmpl.replace("$img$",c.cover);
					r = r.replace("$name$",c.name);
					r = r.replace("$id$",c.id);
					r = r.replace("$intro$",c.intro);
					html+=r;
				}
				$("#cate").hide();
				$("#lists").empty().show().append(html);
				$("#lists li a").bind("click",function(){
					$(this).siblings("div").trigger("click");
				});
			}
			
			if(lists.hotChannels.length>0){
				func();
				
			}else{
				$.get(url,function(result){
					
					var match = result.match(/window\.hot_channels_json\s\=(.*);/);
					lists.hotChannels = JSON.parse(match[1]);
					
					var match2 = result.match(/window\.fast_channels_json\s\=(.*);/);
					lists.upChannels = JSON.parse(match2[1]);
					
					var match3 = result.match(/window\.com_channels_json\s\=(.*);/);
					lists.comChannels = JSON.parse(match3[1]);
					
					func();
					
					
				});
			}			
		},
		get:function(type,page,fn){
			var url = "";
			var tmpl = lists.config.tmpl;
			var html = "";
			
			switch(type){
				case "com":
				case "hot":
				case "up":
					lists.getHot(type);					
				break;
				case "search":
					url = lists.config.searchUrl+encodeURIComponent(arguments[2])+"&start="+page+"&limit=24";
				break;
				case "cate":
					url = lists.config.cateUrl+arguments[2]+"&start="+page+"&limit=24"
				break;
			}
			
			if(url!=""){
				$.getJSON(url,function(result){
					//console.log(result);
					$(".lists").scrollTop(0);
					if(result.data&&result.data.channels){
						for(i=0;i<result.data.channels.length;i++){
							var c = result.data.channels[i];
							var r = tmpl.replace("$img$",c.cover);
							r = r.replace("$name$",c.name);
							r = r.replace("$id$",c.id);
							r = r.replace("$intro$",c.intro);
							html+=r;
						}
						$("#cate").hide();
						$("#lists").empty().show().append(html);
						$("#lists li a").bind("click",function(){
							$(this).siblings("div").trigger("click");
						});

						if(fn&&typeof(fn)=="function"){
							fn();
						}
					}else{

					}

				});
			}
			
		},
		playChannel:function(channel){
			var ch = channel;
			
			if(channel=="-3"){
				ch = {title:"红心电台",cover:"douban/red.gif",id:"-3"};
			}else if(channel=="0"){
				ch = {title:"私人电台",cover:"douban/private.gif",id:"0"};
			}
			
			$("#channel_cover").attr("src",ch.cover);
			$("#channel_title").text(ch.title);
			
			$(".jp-play").hide();
			$(".jp-pause").show();
			$("#channel_status").addClass("playing").removeClass("waiting");
			$(".header").attr("data-id",ch.id);
			portLink.postMessage({
				act: 'playList',
				data:ch
			});
		},
		getLyric:function(song){
			var loaded = false;
			if(options.showLyric){
			$(".lyric").text("正在加载歌词");
			var url1 = "http://sug.music.baidu.com/info/suggestion?format=json&word=";
			var url2 = "http://music.baidu.com/data/music/fmlink?songIds=";
			var url3 = "http://music.baidu.com";//data2/lrc/13839726/13839726.lrc
			url1 = url1+encodeURIComponent(song.artist+" "+song.title);
			$.getJSON(url1,function(result){
				if(result.song.length>0){
					url2 += result.song[0].songid;
					$.getJSON(url2,function(result2){
						if(result2.data.songList.length>0){
							url3 += result2.data.songList[0].lrcLink;
							$.get(url3,function(lrc){								
								lrc = lrc.split('\n');
								var filter = /^((?:\[[\d.:]+?\])+?)([^\[\]]*)$/;
								var lyricArray = {};
								for (var i = 0, len = lrc.length; i < len; i += 1) {
									var res = lrc[i].match(filter);
									var time;
									if (res) {
										time = res[1].slice(1, -1).split('][');
										for (var j = 0, jLen = time.length, tmp ; j < jLen ; j += 1) {
											tmp = time[j].split(':');
											lyricArray[Number(tmp[0])*60+Math.floor(tmp[1])] = res[2];
										}
									}
								}
								playLyric.lyric = lyricArray;
								playLyric.title = song.title;
								Settings.setObject("lyric",playLyric);
								loaded = true;
								$(".lyric").text(song.title);//加载完毕
							});
						}
					});
				}
			});
			}
			if(!loaded){
				$(".lyric").html(song.title);//加载完毕
			}
		},
		del:function(id){
			playData.playList.splice(playData.playIndex,1);
			playData.playIndex -=1;
			Settings.setObject("playData",playData);
			$(".jp-next").trigger("click");
			var delUrl = "http://douban.fm/j/mine/playlist?type=b&sid="+id+"&pt=100&channel="+playData.channelInfo.id+"&pb=64&from=mainsite";
			$.get(delUrl);	
		},
		red:function(id,cid){
			var redUrl = "http://douban.fm/j/mine/playlist?type=r&sid="+id+"&pt=100&channel="+cid+"&pb=64&from=mainsite";
			var unRedUrl = "http://douban.fm/j/mine/playlist?type=u&sid="+id+"&pt=100&channel="+cid+"&pb=64&from=mainsite";
			var url = redUrl;
			var likeBtn = $(".jp-like");
			playData = getPlayData();
			if(likeBtn.attr("data-liked")=="1"){
				url = unRedUrl;
				likeBtn.attr("data-liked","0");
				playData.playList[playData.playIndex].like = 0;
			}else{
				likeBtn.attr("data-liked","0");
				playData.playList[playData.playIndex].like = 1;
			}
			Settings.setObject("playData",playData);
			//console.log(playData);
			likeBtn.toggleClass("jp-liked");
			//console.log(id+""+cid,"fm");
			$.get(url,function(r){
				//console.log(r);
			});	
			//console.log(playData);
		},

	};


	//收藏相关
	douban.fav = {
		check:function(id){
			var favids = Settings.getObject("favids");
			if(favids==undefined){
				return false;
			}
			if(favids.length>0){
				for (var i = favids.length - 1; i >= 0; i--) {
					if(favids[i]==id)
						return true;
				};
				return false;
			}
			
		},
		add:function(id){
			var url = "http://douban.fm/j/explore/fav_channel?cid="+id;
			$.getJSON(url,function(result){
				//{"status":true,"data":{"res":1}}
				if(result.status){
					var favids = Settings.getObject("favids");
					if(favids==undefined){
						favids = new Array();
					}
					favids.push(id);
					Settings.setObject("favids",favids);
				}
			});
		},
		remove:function(id){
			var url = "http://douban.fm/j/explore/unfav_channel?cid="+id;
			$.getJSON(url,function(result){
				if(result.status){
					var favids = Settings.getObject("favids");
					if(favids==undefined){
						favids = new Array();
					}
					if(favids.length>0){
						for (var i = favids.length - 1; i >= 0; i--) {
							if(favids[i]==id){
								favids.splice(i,1);
								Settings.setObject("favids",favids);
								break;
							}
						}
					}
				}
			});
		}
	};


	//登录相关操作
	var login = {
		config:{
			verficIdUrl:"http://douban.fm/j/new_captcha",
			verficImage:"http://douban.fm/misc/captcha?size=m&id=",
			loginUrl:"http://douban.fm/j/login"
		},
		status:false,
		isPro:false,
		verfic:function(){
			$.ajax({
				type: "GET",
				url: login.config.verficIdUrl,
				dataType: "text",
				success:function(result){
					var verficImage = login.config.verficImage;
					var verficId = result.replace('"','').replace('"','');
					$("#captcha_id").val(verficId);
					var captcha = $("#captcha");
					captcha.attr("src",verficImage+verficId);
					captcha.click(function(){
						login.verfic();
					});

				}
		});

		},
		init:function(){
			if($(".cates").offset().left==0){
				$(".arrow").trigger("click");
			}
			$(".login").animate({left:'0px'});
			$("#btn-cancel").click(function(){
				$(".login").animate({left:'300px'});
			});
			login.verfic();
			var btn = $("#btn-submit");
			var submiting = false;
			btn.unbind("click");
			btn.bind("click",function(){
				
				if(!submiting){
					submiting = true;

					$.ajax({
						type: "POST",
						url: login.config.loginUrl,
						data: $("#login_form").serialize(),
						success: function(msg){
							//console.log(msg);
							if(msg.r==0){
								//{"user_info":{"ck":"_dt9","play_record":{"liked":26,"banned":1,"played":726},"uid":"em
								//{"il","third_party_info":null,"url":"http:\/\/www.douban.com\/people\/emil\/","is_dj":
								//{"false,"id":"1060313","is_pro":true,"name":"emil"},"r":0}
								Settings.setObject("userInfo",msg.user_info);
								var userInfo = msg.user_info;
								//localStorage.userInfo = JSON.stringify(msg.user_info);
								$("#login_password,#captcha_solution").val("");
								$(".login").animate({left:'300px'});
								$("#user_menu").show();
								$("#tag_fav").show();
								$("body").bind("click",function(){
									$("#user_menu").hide();
									$("body").unbind("click");
								});
								login.needLogin = false;
								login.status = true;
								login.isPro = userInfo.is_pro;
								$("#user_status span").text(userInfo.name);
								if(login.isPro){
									Settings.setValue("vipkbps",192);
									$("#user_pro").show();
									$("#user_status").attr("title","PRO用户，享受192K高清音质");
								}
								else{
									$("#user_pro").hide();
									$("#user_status").attr("title","");
								}

							}else{
								alert(msg.err_msg);
								login.verfic();
							}
							submiting = false;
						}
					});

				}

			});

		},
		checkLogin:function(){
			chrome.cookies.get({
				url: 'http://douban.fm',
				name: 'dbcl2'
				}, function (c) {
					//console.log(c, 'fm');
					if(c!=null){//已经登录
						login.status = true;
						var userInfo = Settings.getObject("userInfo")||{};
						//{"user_info":{"ck":"_dt9","play_record":{"liked":26,"banned":1,"played":726},"uid":"em
						//{"il","third_party_info":null,"url":"http:\/\/www.douban.com\/people\/emil\/","is_dj":
						//{"false,"id":"1060313","is_pro":true,"name":"emil"},"r":0}
						if(userInfo.name)
							$("#user_status span").attr("title",userInfo.name);
						$("#tag_fav").show();
						if(userInfo!=undefined&&userInfo.is_pro){
							login.isPro = true;
							$("#user_status").attr("title","PRO用户/192K高清音质");
							$("#user_pro").show();
						}else{
							$("#user_pro").hide();
							$("#user_status").attr("title","");
						}
					}else{//未登录
						$("#user_status span").text("登录");
						$("#user_pro").hide();
						$("#tag_fav").hide();
						$("#user_status").attr("title","");
						var cid = playData.channelInfo.id;
						if(cid=="-3"||cid=="0"){
							//红心电台和私人电台显示登录
							login.needLogin = true;
							login.init();
						}
					}
			});
		},
		logout:function(){
			chrome.cookies.remove({
				url: 'http://douban.fm',
				name: 'dbcl2'
			});
			login.status = false;
			$("#user_status span").text("登录");
			$("#user_pro").hide();
			$("#user_menu").hide();
			var cid = playData.channelInfo.id;
			if(cid=="-3"||cid=="0"){
				//红心电台和私人电台显示登录
				login.needLogin = true;
				login.init();
			}
			
		}


	};

	var timeout = null;
	var showtip = function(msg){
			$(".tips").fadeIn().text(msg);
			clearTimeout(timeout);
			timeout = setTimeout(function(){
				$(".tips").fadeOut();
			},1000);
		};
	
	//快捷键设置
	douban.hotkey = function(){
		
		
		$("body").bind("keydown",function(){
			var a=window.event.keyCode;
			//right 39 left 37 up 38 down 40
			switch(a){
				case 70:
					$(".jp-like").trigger("click");
					showtip("红心");
				break;
				case 68:
					$(".jp-del").trigger("click");
					showtip("删除");
				break;
				case 39:
					$(".jp-next").trigger("click");
					showtip("下一首");
				break;
				case 37:
					$(".jp-previous").trigger("click");
					showtip("上一首");
				break;
				case 38://增加音量
					var volume = Settings.getValue("volume",50);
					volume+=5;
					if(volume>50)
						volume = 50;
					portLink.postMessage({act:"volume",data:volume});
					showtip("音量"+(volume*2)+"%");
				break;
				case 40://降低音量
					var volume = Settings.getValue("volume",50);
					volume-=5;
					if(volume<0)
						volume = 0;
					portLink.postMessage({act:"volume",data:volume});
					showtip("音量"+(volume*2)+"%");
				break;
				case 80://播放暂停
					if($(".jp-play").is(":visible")){
						$(".jp-play").trigger("click");
						showtip("播放");
					}	
					else{
						$(".jp-pause").trigger("click");
						showtip("暂停");
					}
						

				break;
			}

			
		});
	};



	douban.init = function(){
		douban.bind();
		login.checkLogin();
		douban.hotkey();
	};


	douban.init();
	
		
});