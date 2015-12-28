Array.prototype.forEach = function(cb){
	for(var k in this) cb(this[k]);
};
