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

Array.prototype.each = function(cb){
	for(var i = this.length; i--;){
		var res = cb(this[i]);
		if(res){ this[i] = res; }
	}
}

Array.prototype.split = function(delimiter){
	var arr = [];
	this.each(function(el){
		if(typeof(el) == 'string'){
			el.split(delimiter).each(function(split){
				arr.push(split);
			});
		}
	});

	return arr;
};
