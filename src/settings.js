var Settings = {};//localstorage配置信息

Settings.configCache = {};

Settings.setValue = function setValue(key, value) {
    Settings.configCache[key] = value;

    var config = {};
    if (localStorage.config)
        config = JSON.parse(localStorage.config);

    config[key] = value;
    localStorage.config = JSON.stringify(config);
    return value;
};

Settings.getValue = function getValue(key, defaultValue) {
    if (!localStorage.config)
        return defaultValue;

    var config = JSON.parse(localStorage.config);
    if (typeof config[key] == "undefined")
        return defaultValue;

    Settings.configCache[key] = config[key];
    return config[key];
};

Settings.getCacheValue = function getValue(key, defaultValue) {
    if (typeof Settings.configCache[key] != "undefined")
        return Settings.configCache[key];

    if (!localStorage.config)
        return defaultValue;

    var config = JSON.parse(localStorage.config);
    if (typeof config[key] == "undefined")
        return defaultValue;

    Settings.configCache[key] = config[key];
    return config[key];
};

Settings.keyExists = function keyExists(key) {
    if (!localStorage.config)
        return false;

    var config = JSON.parse(localStorage.config);
    return (config[key] != undefined);
};

Settings.setObject = function setObject(key, object) {
    localStorage[key] = JSON.stringify(object);
    return object;
};

Settings.getObject = function getObject(key) {
    if (localStorage[key] == undefined)
        return undefined;

    return JSON.parse(localStorage[key]);
};

Settings.refreshCache = function refreshCache() {
    Settings.configCache = {};
};

//获取播放数据
var getPlayData = function(){
    var playData = Settings.getObject("playData");
    if(playData==undefined){
        playData = {
            playList: new Array(),
            playListDate:new Date(),
            playIndex:0,
            channelInfo:{}
        };
    }
    return playData;
}

var getPlayLyric = function(){
    var playLyric = Settings.getObject("lyric");
    if(playLyric==undefined){
        playLyric = {};
        Settings.setObject("lyric",playLyric);
    }
    return playLyric;
}

//获取码率 pro用户可设置
var getKbps = function(){
    var kbs = 64;
    var userInfo = Settings.getObject("userInfo");
    if(userInfo!=undefined){
        if(userInfo.is_pro){
            kbs = Settings.getValue("vipkbps",192);
            kbs = kbs+"&kbps="+kbs;
        }
    }
    return kbs;
}

var shareTool = {
    init:function(){
        shareTool.creat();
        shareTool.bind();
    },
    creat:function(){
        var tmpl = '\
        <div id="shareTool" class="hide">\
        <div class="sharetip"></div>\
        <div class="share">\
            <a class="sina">新浪微博</a>\
            <a class="renren">人人网</a>\
            <a class="qq">QQ好友</a>\
            <a class="qzone">QQ空间</a>\
            <a class="tencent">腾讯微博</a>\
            <a class="douban">豆瓣</a>\
        </div>\
        </div>';
        $("body").append(tmpl);

    },
    bind:function(){
        var shareData = {
            title:function(){
                songdata = getPlayData();
                return songdata.playList[songdata.playIndex].title;
            },
            desc:function(){
                songdata = getPlayData();
                return "分享来自豆瓣FM"+songdata.channelInfo.title+"MHz "+songdata.playList[songdata.playIndex].artist+"的歌曲"+songdata.playList[songdata.playIndex].title+"(来自豆瓣FM原味版Chrome扩展)";
            },
            image:function(){
                songdata = getPlayData();
                return songdata.playList[songdata.playIndex].picture;
            },
            url:function(){
                songdata = getPlayData();
                return "http://douban.fm/?start="+songdata.playList[songdata.playIndex].sid+"g"+songdata.playList[songdata.playIndex].ssid+"g"+songdata.channelInfo.id+"&cid="+songdata.channelInfo.id;
            },
            source:function(){
                return "来自豆瓣FM原味版Chrome扩展";
            }
        };
    
    $(".sharetip").hover(function(){
        $("#shareTool").addClass("show");
    });
    $("#shareTool").bind("mouseleave",function(){
        $("#shareTool").removeClass("show");
    });

    $(".share a").bind("click",function(){
        var This = $(this);
        var shareTo = This.attr("class");
        var url = "";
        var param ={
            title:"name",
            url :"href",
            desc:"text",
            image:"image",
            source:"desc"
        };
        switch(shareTo){
            case "douban":
                url = "http://www.douban.com/share/recommend?";
            break;
            case "sina":
                url = "http://v.t.sina.com.cn/share/share.php?";
                param.url = "url";
                param.desc = "title";
                param.image = "pic";
            break;
            case "renren":
                url = "http://widget.renren.com/dialog/share?";
                param.desc = "title";
                param.url = "resourceUrl";

                param.source = "description";
            break;
            case "qzone":
                url = "http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?";
                param.url = "url";
                param.title = "title";
                param.desc = "desc";
                param.source = "summary";
                param.image = "pics";
                break;
            case "qq":
                url = "http://connect.qq.com/widget/shareqq/index.html?";
                param.title = "title";
                param.desc = "desc";
                param.source = "site";
                param.url = "url";
                param.image = "pics";
            break;
            case "tencent":
                url = "http://share.v.t.qq.com/index.php?c=share&a=index&";
                param.url= "url";
                param.image = "pic";
                param.desc = "title";
                param.source = "site";
            break;
        }
        
        url+=[param.title,"=",encodeURIComponent(shareData.title()),
        "&",param.desc,"=",encodeURIComponent(shareData.desc()),
        "&",param.url,"=",encodeURIComponent(shareData.url()),
        "&",param.image,"=",encodeURIComponent(shareData.image()),
        "&",param.source,"=",encodeURIComponent(shareData.source()),
        ].join("");
        
        window.open(url,"_blank");

    });
    }
};