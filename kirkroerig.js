var express = require('express');
var exphbs  = require('express-handlebars');
var mysql   = require('mysql');
var marked  = require('marked');
var app     = express();
var events  = require('events');
var emitter = new events.EventEmitter();
var fs      = require('fs');
var md      = require('./markdown.js');
require('./prototype.js');

var con = mysql.createConnection({
	host:     process.env.DB_HOST || 'localhost',
	user:     process.env.DB_USER || 'root',
	port:     process.env.DB_PORT,
	password: process.env.DB_PASSWORD || ''
});
var activityMon;
var dbName = process.env.DB_NAME || 'KirkRoerig';

// configure express a bit
app.use(express.static(__dirname + '/content'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//-----------------------------------------------------------------------------
//   _   _      _                     
//  | | | |    | |                    
//  | |_| | ___| |_ __   ___ _ __ ___ 
//  |  _  |/ _ \ | '_ \ / _ \ '__/ __|
//  | | | |  __/ | |_) |  __/ |  \__ \
//  \_| |_/\___|_| .__/ \___|_|  |___/
//               | |                  
//               |_|                  
function respondInError(res, msg){
	res.send({
		type: 'error',
		message: msg
	});
}

function queryAndRespond(sql, res){
	con.query(sql, function(err, results){
		if(err) respondInError(res, err.message);
		
		console.log(results);
		res.send(JSON.stringify(results || []));
	});
}
//-----------------------------------------------------------------------------
//   _____                _       
//  |  ___|              | |      
//  | |____   _____ _ __ | |_ ___ 
//  |  __\ \ / / _ \ '_ \| __/ __|
//  | |___\ V /  __/ | | | |_\__ \
//  \____/ \_/ \___|_| |_|\__|___/
//                                
//                                
emitter.on('getArticles', function(res, queryOptions){
	var opts = queryOptions || {};
	var sql = 'SELECT * FROM Articles ';

	if(queryOptions){
		if(opts.categories && opts.categories.length){
			sql += ' LEFT JOIN (Categories) ON (Articles.id = Categories.id) WHERE ';

			for(var i = opts.categories.length; i--;){
				var cat = opts.categories[i];
				sql +=  "Categories.name LIKE " + cat + " " + (i ? 'AND ' : '');
			}
		}
		else{
			if(opts.id){
				sql += 'WHERE id = ' + opts.id;
			}
		}
	}

	// newest articles first
	if(opts.oldest){
		sql += ' ORDER BY posted ASC';
	}
	else{
		sql += ' ORDER BY posted DESC';
	}

	sql += ' LIMIT ' + (opts.articles || 5);

	console.log(sql);

	con.query(sql, function(err, results){
		if(err) respondInError(res, err.message);

		var articleMarkups = [];
		var count = 0;
		for(var i = 0; i < results.length; ++i){
			var mdRes = md(results[i].file);

			// the article's markdown file couldn't be read. Remove it
			if(!mdRes){
				con.query('DELETE FROM Articles WHERE id = %', [results[i].id], function(){});
				continue;
			}

			articleMarkups.push({
				odd:     count % 2,
				even:    !(count % 2),
				delay:   count + 3,
				content: marked(mdRes.content), // tODO
				posted:  results[i].posted.format()
			});

			++count;
		}

		res.render('articles', {articles: articleMarkups});
	});
});

emitter.on('dbConnected', function(){
	app.listen(process.env.PORT || 8080);
});

emitter.on('getCategories', function(res, queryOptions){
	var opts = queryOptions || {};
	var sql = 'SELECT DISTINCT name FROM Categories';

	queryAndRespond(sql, res);	
});
//-----------------------------------------------------------------------------
//  ______            _            
//  | ___ \          | |           
//  | |_/ /___  _   _| |_ ___  ___ 
//  |    // _ \| | | | __/ _ \/ __|
//  | |\ \ (_) | |_| | ||  __/\__ \
//  \_| \_\___/ \__,_|\__\___||___/
//                                 
//                                 
app.get('/article/:id?', function(req, res){
	// present the content for a specific article
	if(isNaN(parseInt(req.params.id))){
		respondInError(res, 'Request for article is not valid');
	}

	emitter.emit('getArticles', res, {
		id: con.escape(req.params.id)
	});
});

app.get('/articles', function(req, res){
	// present all articles within a default limit
	emitter.emit('getArticles', res, null);
}); 

app.get('/articles/latest', function(req, res){
	// present teh newest articles
	emitter.emit('getArticles', res, {
		latest: true
	});	
});

app.get('/articles/oldest', function(req, res){
	// present oldest articles
	var cats = con.escape(req.params.category);
	emitter.emit('getArticles', res, {
		latest: false
	});	
});

app.get('/articles/category/:category?', function(req, res){
	// present articles from a specific category
	if(typeof(req.params.category) !== 'string'){
		respondInError(res, 'Request for category is not valid');
	}

	emitter.emit('getArticles', res, {
		id: con.escape(req.params.id),
		categories: [ con.escape(req.params.category) ]
	});
});

app.get('/about', function(req, res){
	res.render('about');
});

app.get('/contact', function(req, res){
	res.render('contact');
});

app.get('/categories', function(req, res){
	// present a list of categories 
}); 

app.get('/', function(req, res){
/*
	var md = require('fs').readFileSync('articles/libNEMA.md', 'utf8');
	res.render('home', {
		contents: [{content: marked(md)},{content:marked(md)},{content:marked(md)}],
		posted: (new Date()).format()
	});
*/
	emitter.emit('getArticles', res, null);	
});

//-----------------------------------------------------------------------------
con.query('USE ' + dbName, function(err){
	if(err){
		console.log("No database...");
	}
	else{
		emitter.emit('dbConnected');
		activityMon = require('./activityMon.js')(con);
	}		
});
