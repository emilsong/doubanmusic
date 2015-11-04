$(document).ready(function(){
	
	var options = Settings.getObject("options");
	if(options==undefined){
		options = {
			showLike:false,
			showDel:true,
			showPrev:true,
			showNext:true,
			showLyric:true,
			showNotify:true,
			NotifySpan:3,
			blockad:true
		};
		Settings.setObject("options",options);
	}
	
	//console.log(options);
	
	if(options.showLike)
		document.getElementById("like").checked = true;
	if(options.showDel)
		document.getElementById("del").checked = true;
	if(options.showPrev)
		document.getElementById("prev").checked = true;
	if(options.showNext)
		document.getElementById("next").checked = true;
	if(options.showLyric)
		document.getElementById("lyric").checked = true;
	if(options.showNotify)
		document.getElementById("notify").checked = true;
	if(options.blockad||options.blockad==undefined)
		document.getElementById("blockad").checked = true;
		
	document.getElementById("notifySpan").value = options.NotifySpan||3;

	var kbs = Settings.getValue("vipkbps",192);
	document.getElementById("k"+kbs).checked = true;
	
	$("input:checkbox,input:radio").click(function(){saveOption()});
	
	$("#notifySpan").change(function(){saveOption()});
	
	function saveOption(){
		
		
		if(document.getElementById("del").checked == true)
			options.showDel = true;
		else
			options.showDel = false;
		
		if(document.getElementById("prev").checked == true)
			options.showPrev = true;
		else
			options.showPrev = false;
		
		if(document.getElementById("next").checked == true)
			options.showNext = true;
		else
			options.showNext = false;
		
		if(document.getElementById("lyric").checked == true)
			options.showLyric = true;
		else
			options.showLyric = false;

		if(document.getElementById("notify").checked == true)
			options.showNotify = true;
		else
			options.showNotify = false;
			
		if(document.getElementById("blockad").checked == true)
			options.blockad = true;
		else
			options.blockad = false;
		
		options.NotifySpan = document.getElementById("notifySpan").value; 
		
		var vipkbps = $(":radio:checked").attr("data-val");
		Settings.setValue("vipkbps",vipkbps);
		Settings.setObject("options",options);
	}
	
	$(".menu a").click(function(){
		$(".menu a").removeClass("hover");
		$(this).addClass("hover");
		$("dl").hide();
		$("."+$(this).attr("id")).show();
	});
});