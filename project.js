var fs = require('fs');

module.exports = function(path){
	var temp = fs.readdirSync(path);
	var indexMarkup = fs.readFileSync(path + '/index.html').toString();

	if(!indexMarkup) return null;

	// make sure that
	var projectArticles = [];
	for(var i = temp.length; i--;){
		
		// make sure the path is to a markdown file
		var parts = temp[i].split('.');
		if(parts[parts.length - 1] == 'md'){
			projectArticles.push(temp[i]);
		}
	}

	return {
		snippet: indexMarkup,
		articles: projectArticles
	};
};
