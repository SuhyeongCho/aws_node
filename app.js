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
password: "Whtngud2074!",
database: "project"
});


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
		connection.connect(function(){
				var sql = 'INSERT INTO modify (SENTENCE) VALUES (?)';
				var txt = req.body.text;
				var param = [txt];
				console.log(sql+txt);
				connection.query(sql,param,function(err,results,fields){
						if(err) throw err;
						extractNoun(txt,req,res);
						res.redirect(req.headers.host);
						});
				});
		});

router.route('/modify').post(function(req,res){
		var id = req.body.id;
		var before = req.body.before;
		var after = req.body.after;
		var sql = `UPDATE modify SET before_modify='${before}' after_modify='${after}' WHERE sentence='${id}'`;
		console.log(sql);
		connection.query(sql,function(err,results,fields){
				if(err) throw err;
				});
		});

function extractNoun(txt,req,res){
	result = mecab.parseSync(txt);
	var str = "";
	for(var i=0;i<result.length;i++){
		console.log(result[i][0]+" : "+result[i][1]);
		if(result[i][1]=='NNG'||result[i][1]=='NNP'||result[i][1]=='NNB'||result[i][1]=='NNBC'||result[i][1]=='NR'||result[i][1]=='NP'){
			str = str + result[i][0] + " ";
		}
	}
	var sql = `UPDATE modify SET extract_noun='${str}' WHERE sentence='${txt}'`;
	console.log(sql);
	connection.query(sql,function(err,results,fields){
			if(err) throw err;
<<<<<<< HEAD
			res.redirect(req.headers.host);
=======
>>>>>>> 8430d25e298bfcbe6e6ca99a1661dc5c593d34ea
			});
}
