var fs = require('fs');

module.exports = function(path, justTags){
	if(!fs.existsSync(path)) return null;

	var fd = fs.openSync(path, 'r');
	var tagStr = '', tags = [];

	// read until the first newline
	var buf = new Buffer(1);
	while(true){
		fs.readSync(fd, buf, 0, 1, null);
		tagStr += buf.toString()[0];
	
		if(buf[0] == '\n'.charCodeAt(0)){
			tags = tagStr.split(',');
			break;
		}
	}

	// trim all tags
	for(var i = tags.length; i--;){
		tags[i] = tags[i].trim();
	}

	// read the rest of the file, but only if it's requested 
	var stat = fs.statSync(path);
	var contentBuf = new Buffer(stat.size - tagStr.length);
	if(!justTags && contentBuf.length)
		fs.readSync(fd, contentBuf, 0, contentBuf.length, null);

	return {
		tags: tags,
		content: contentBuf.toString(),
	};
};
