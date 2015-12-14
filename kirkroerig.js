var express = require('express');
var exphbs  = require('express-handlebars');
var mysql   = require('mysql');
var marked  = require('marked');
var app     = express();
var events  = require('events');
var emitter = new events.EventEmitter();
var fs      = require('fs');
var md      = require('./markdown.js');
var con = mysql.createConnection({
	host:     'localhost',
	user:     'root',
	password: ''
});
var activityMon;

// configure express a bit
app.use(express.static(__dirname + '/content'));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

Date.prototype.format = function(){
	var now = new Date();
	var year = (this.getYear() - now.getYear()) > 0 ? ', ' + this.getYear() : '';
	var str =['January', 'Febuary', 'March',     'April',   'May',      'June', 
	          'July',    'August',  'September', 'October', 'November', 'December'][this.getMonth()];

	return str + ' ' + (this.getDay() + 1) + year;
};

String.prototype.sqlParams = [];
String.prototype.withParams = function(params){
	if(params.length){
		this.sqlParams = this.sqlParams.concat(params);
	}
	else{
		this.sqlParams.push(params);
	}
};
String.prototype.append = function(statement){
	var comp = this + statement
	comp.sqlParams = this.sqlParams.concat(statement.sqlParams);
	return comp
};
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

		// newest articles first
		if(opts.latest){
			sql += ' ORDER BY posted DESC';
		}
		else if(opts.oldest){
			sql += ' ORDER BY posted ASC';
		}
	}

	sql += ' LIMIT ' + (opts.articles || 5);

	console.log(sql);

	con.query(sql, function(err, results){
		if(err) respondInError(res, err.message);

		var articleMarkups = [];
		for(var i = 0; i < results.length; ++i){
			articleMarkups.push({
				odd:     i % 2,
				even:    !(i % 2),
				delay:   i + 3,
				content: marked(md(results[i].file).content), // tODO
				posted:  results[i].posted.format()
			});
		}

		res.render('articles', {articles: articleMarkups});
	});
});

emitter.on('dbConnected', function(){
	app.listen(8080);
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

app.get('/articles/:category?', function(req, res){
	// present articles from a specific category
	if(typeof(req.params.category) !== 'string'){
		respondInError(res, 'Request for category is not valid');
	}

	emitter.emit('getArticles', res, {
		id: con.escape(req.params.id),
		categories: [ con.escape(req.params.category) ]
	});
});

app.get('/categories', function(req, res){
	// present a list of categories 
}); 

app.get('/', function(req, res){
	var md = require('fs').readFileSync('articles/libNEMA.md', 'utf8');
	res.render('home', {
		contents: [{content: marked(md)},{content:marked(md)},{content:marked(md)}],
		posted: (new Date()).format()
	});
});

//-----------------------------------------------------------------------------
con.query('USE KirkRoerig', function(err){
	if(err){
		console.log("No database...");
	}
	else{
		emitter.emit('dbConnected');
		activityMon = require('./activityMon.js')(con);
	}		
});
