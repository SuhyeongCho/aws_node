var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');

var fs = require('fs');
var ejs = require('ejs');

var mecab = require('mecab-ffi');
var mysql = require('mysql');

var router = express.Router();
var app = express();

app.set('port',process.env.PORT||3000);

app.use(bodyParser.urlencoded({extended:false}));

app.use(bodyParser.json());

var server = http.createServer(app).listen(app.get('port'),function(){
		console.log('서버가 시작되었습니다. 포트 : '+app.get('port'));
		});

var connection = mysql.createConnection({
host: "localhost",
user: "root",
password: "whtngud2074",
database: "project"
});

app.use('/',router);

app.get('/',function(req,res){
		fs.readFile('modify.html','utf8',function(err,data){
				if(err) throw err;
				var sql = 'SELECT * FROM modify';
				connection.query(sql,function(err,results,fields){
						if(err) throw err;
						var obj = {prodList : results};
						var ejsRender = ejs.render(data,obj);
						res.send(ejsRender);
						});
				});
		});

router.route('/insert').post(function(req,res){
		var sql = 'INSERT INTO modify (SENTENCE) VALUES (?)';
		var txt = req.body.text;
		var param = [txt];
		console.log(sql+txt);
		connection.query(sql,param,function(err,results,fields){
				if(err) throw err;
				extractPart(txt,req,res);
				});
		});

router.route('/modify').post(function(req,res){
		var id = req.body.id;
		var before = req.body.before;
		var after = req.body.after;
		var sql = `UPDATE modify SET BEFORE_MODIFY='${before}', AFTER_MODIFY='${after}' WHERE ID=${id}`;
		console.log(sql);
		connection.query(sql,function(err,results,fields){
				if(err) throw err;
				res.redirect('http://'+req.headers.host);
				});
		});

var noun = [],josa = [];
function extractNoun(txt){
	var part,name;
	var result = mecab.parseSync(txt);
	for(var i=0;i<result.length;i++){
		console.log(result[i][0] + " : " + result[i][1]);
		name = result[i][0];
		part = result[i][1];
		if(part=='NNG'||part=='NNP'||part=='NNBC'||part=='NR'||part=='NP'||part=='SL'||part=='SN'||part=='XSN'||part=='XPN') noun.push(name);
		else if(part=='JKS'||part=='JKB'||part=='JX') josa.push(name);
	}
}

function extractPart(txt,req,res){
	noun = [];
	josa = [];
	txt = changeSynonym(txt);
	extractNoun(txt);
	noun = makeKeyWord(noun);
	console.log(noun);
	console.log(josa);
	var route = noun[noun.length-1];
	var str = "";
	if(route == '길'||route == '방법'||route == '안내'){
		var pos1 = txt.indexOf(josa[0]);
		var pos2 = txt.indexOf(route);
		var str1 = txt.slice(0,pos1);
		var str2 = txt.slice(pos1,pos2);
		noun = []; extractNoun(str1);
		for(var i=0;i<noun.length;i++) str = str + noun[i];
		str = str + " / ";
		noun = []; extractNoun(str2);
		for(var i=0;i<noun.length;i++) str = str + noun[i];
	}else{
		for(var i=0;i<noun.length;i++) str = str + noun[i];
	}
	var sql = `UPDATE modify SET extract_noun='${str}' WHERE sentence='${txt}'`;
	console.log(sql);
	connection.query(sql,function(err,results,fields){
		if(err) throw err;
		res.redirect('http://'+req.headers.host);
		});
}
function makeKeyWord(arr){
	var replaceArr = ['근처','주변','안','위치','검색','추천'];
	for(var i=0;i<arr.length;i++){
		for(var j=0;j<replaceArr.length;j++){
			if(arr[i] == replaceArr[j]){
				arr.splice(i,1);
				i--;
				continue;
			}
		}
	}
	return arr;
}

function changeSynonym(txt){
	return txt;
}
