Array.prototype.forEach = function(cb){
	for(var k in this) cb(this[k]);
};

function detectSystemTheme() {
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return 'dark';
	} else {
		return 'light';
	}
}