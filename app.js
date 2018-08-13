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
				extractNoun(txt,req,res);
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

function extractNoun(txt,req,res){
	modi_txt = makeKeyWord(txt);
	result = mecab.parseSync(modi_txt);
	var str = "";
	for(var i=0;i<result.length;i++){
		console.log(result[i][0]+" : "+result[i][1]);
		if(result[i][1]=='NNG'||result[i][1]=='NNP'||result[i][1]=='NNBC'||result[i][1]=='NR'||result[i][1]=='NP'||result[i][1]=='SL'||result[i][1]=='SN'||result[i][1]=='XSN'||result[i][1]=='XPN'){
			str = str + result[i][0] + " ";
		}
	}
	str = makeKeyWord(str);
	var sql = `UPDATE modify SET extract_noun='${str}' WHERE sentence='${txt}'`;
	console.log(sql);
	connection.query(sql,function(err,results,fields){
			if(err) throw err;
			res.redirect('http://'+req.headers.host);
			});
}

function makeKeyWord(str){
	var replaceArr = ['근처','주변','안','위치','검색','추천'];
	for(var i=0;i<replaceArr.length;i++){
		str = str.replace(replaceArr[i]+' ',"");
	}
	str = str.trim();
	return str;
}
