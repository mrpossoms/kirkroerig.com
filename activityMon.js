var watchr   = require('watchr');
var readline = require('readline');
var fs       = require('fs');

String.prototype.isExt = function(str){
	var arr =this.split('.');
	if(arr.length < 2) return false;
	return arr[arr.length - 1] == str;
};

module.exports = function(con){
	console.log('Activity Mon starting...');

	function refreshTags(articleId, tags){
		// delete category tags for this article
		console.log('Refreshing tags for ' + articleId);
		con.query('DELETE FROM Categories WHERE id = ?', [articleId], function(err, results){
			if(err){
				console.log('An error occurred while deleting tags for ' + articleId, err);
				return;
			}

			// re-add all the tags
			for(var i = tags.length; i--;){
				con.query('INSERT INTO Categories SET id=?, name=?', [articleId, tags[i].trim()], function(){});
			}
		});
	}

	function updateArticle(path, depth){
		var indent = '';
		if(!depth) depth = 0;
		for(var i = depth; i--; indent += '\t');

		// see if this article has been added to the database or not
		con.query('SELECT * FROM Articles WHERE file LIKE ?', [path], function(err, articles){
			if(err) return
	
			// load the first line which will contain the categories that
			// the article belongs to		
			var lr = readline.createInterface({input:fs.createReadStream(path)});
			var gotFirst = false;
			lr.on('line', function(line){
				if(gotFirst) return;
				gotFirst = true;

				var cats = line.split(',');
				console.log(indent  + path + ' - ' + cats.toString());
				lr.pause();
				lr.close();

				// there should only be a single article, if not
				// there is something very wrong
				if(articles.length > 1){
					return;
				}
				else if(articles.length == 0){
					var q = 'INSERT INTO Articles SET posted=NOW(), file=?';
					con.query(q, [path], function(err, articles){
						if(err) return;
						updateArticle(path);
					});
				}
				else{
					console.log(indent + "Refreshing tags");
					refreshTags(articles[0].id, cats);					
				}

			});
		});
	};

	function examine(watcher, depth){
		var indent = '';
		if(!depth) depth = 0;
		for(var i = depth; i--; indent += '\t');
		
		if(watcher.isDirectory()){
			console.log(indent + watcher.path + ' is a directory');
		}
		else{
			if(watcher.path.isExt('md')){
				updateArticle(watcher.path, depth);
			}
		}

		for(var name in watcher.children){
			examine(watcher.children[name], depth + 1);
		}
	}

	watchr.watch({
		paths: ['articles'],
		listeners: {
			change: function(changeType, filePath, fileCurrentStat, filePreviousStat){
				console.log('Sumpin\' happened!\n\t' + changeType + '\n\t' + filePath);
				updateArticle(filePath);
			}
		},
		next: function(err,watchers){
			if (err){
				return console.log("watching everything failed with error", err);
			} else {
				for(var i = watchers.length; i--;){
					examine(watchers[i]);
				}
			}
		}
	})
};