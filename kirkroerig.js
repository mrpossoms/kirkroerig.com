var express = require('express');
var http    = require('http');
var mysql   = require('mysql');
var app     = express();
var events  = require('events');
var emitter = new events.EventEmitter();
var con = mysql.createConnection({
	host:     'localhost',
	user:     'root',
	password: 'E67CghKTS'
});

con.query('USE KirkRoerig');
app.use(express.static(__dirname + '/content'));
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
	queryAndRespond(sql, res);
});

emitter.on('getCategories', function(res, queryOptions){
	var opts = queryOptions || {};
	var sql = 'SELECT * FROM Categories';

	if(queryOptions){
		sql += 'WHERE ';
	}

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
	// todo
});
//-----------------------------------------------------------------------------
app.listen(8080);
