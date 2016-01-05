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