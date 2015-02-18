// Cross-Origin Resource Sharing（CORS）
$.support.cors = true;

/* RDF名前空間のリソースを格納 */
var rdfDefineMap = {};

/**
 * 画面表示時のイベント
 */
$(function(){
	/* 結果クリアボタンのクリック */
	$("button#clear").on("click", function() {
		$("#response").html("");
	});
	
	/* 実行ボタンのクリック */
	$("button#send").on("click", function() {
		$("#response").html("");
		if ($("#url").val() == "") {
			alert("入力エラー", "URLが入力されていません。");
		} else {
			send($("#url").val());
		}
	});
});

/**
 * コマンドの実行
 */
function send(urlFull) {

	// URLからパラメータを取り出す
	var elm = document.createElement('a');
	elm.href = urlFull;
	var url = elm.protocol + "//" + elm.hostname + elm.pathname;
	var keys = elm.search.replace("?", "").split("&");
	keys = keys.map(function(e){return e.split("=")});
	var params = keys.reduce(function(p, e){name=e[0]; val=e[1]; p[name]=val; return p}, {})

	// サーバに送信
	var res = $.ajax({
		url: url,
		type: 'GET',
		headers: {
			"Accept": "application/rdf+xml"
		},
		data: params,
		dataType: 'xml',
		timeout: 60000
	})
	.done(function(data, textStatus, jqXHR) {
		// 成功
		queryCallBack(data, jqXHR);
	})
	.fail(function(jqXHR, textStatus, errorThrown) {
		// 失敗
		queryErrorCallBack(jqXHR, textStatus, errorThrown, url);
	})
	.always(function(arg1, arg2, arg3) {
	});
}

/**
 * 検索結果のコールバック
 */
function queryCallBack(data, jqXHR) {
	var html = "";
	if (data) {
		try {
			var ary = [];
			var root = data.documentElement;
			var attrs = root.attributes;
			var records = root.children;
			for(var i=0; i<records.length; i++){
				if(records[i].nodeName.match(/rdf:Description/i)){
					var s = records[i].attributes["rdf:about"].value;
					var props = records[i].children;
					for(var j=0; j<props.length; j++){
						var p = props[j].nodeName;
						var o = props[j].textContent;
						ary.push({"Subject": s, "Predicate": p, "Object": o});
					}
				}
			}
			html += "<p>検索結果は、" + records.length + "件でした</p>";
 			if(records.length == 0){
 				$("#response").html(html);
 				return;
 			}
 
 			// TODO:ResponseHeaderが取れない
 			var resAll = jqXHR.getAllResponseHeaders();
 			var res = jqXHR.getResponseHeader("Remains");
			if(res){
				html += "<p>limitにより、返せていないデータがあります。</p>";
			}

			// 名前空間URIとそれを表す接頭辞を取得
			var replace = [];
			for(var i=0; i<attrs.length; i++){
				var v = attrs[i].name.substring(attrs[i].name.indexOf(":") + 1) + ":";
				replace.push([v, attrs[i].value]);
				//if(!(v in rdfDefineMap)){
				//	getNsResource(v, attrs[i].value);
				//}
			}

			html += "<table border=\"1\">";
			
			html += "<thead>";
			html += "<tr>";
			for (var key in ary[0]) {
				html += "<th>";
				html += key;
				html += "</th>";
			}
			html += "</tr>";
			html += "</thead>";
			
			html += "<tbody>";
			for (var i = 0; i < ary.length; i++) {
				html += "<tr>";
				for (var key in ary[i]) {
					html += "<td>";
					// 接頭辞を名前空間のURIで置き換える
					var val = replaceNs(ary[i][key], replace);
					if(val.lastIndexOf("http://", 0) == 0){
						html += "<a href=\"" + val + "\">" + val + "</a>";
					}else{
						html += val;
					}
					
					html += "</td>";
				}
				html += "</tr>";
			}
			html += "</tbody>";
			
			html += "</table>";

		} catch (e) {
			html = "データが異常です。";
		}
		$("#response").html(html);
	} else {
		$("#response").text("データが０件です。");
	}
}

/**
 * 検索実行エラー時のコールバック
 */
function queryErrorCallBack(jqXHR, textStatus, errorThrown, url) {
	$("#response").html(("実行エラー(" + jqXHR.status + ")<br>" + textStatus + ":" + errorThrown + "<br>" + url));
}

/**
 * Namespaceで置き換え
 */
function replaceNs(target, replace) {
	for (i in replace) {
		target = target.replace(replace[i][0], replace[i][1]);
	}
	return target;
}

function getNsResource(key, url){
	$.get(url, function(data){
  		rdfDefineMap[key] = data;
	});
}
