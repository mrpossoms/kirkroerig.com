var article = function(id, params){
	var parent = $('#' + id);

	// bail if no parent element is found
	if(!parent.length) return;

//---------------------------------------------------------------------
	var spawn = function(data){
		// TODO create elements
	};
//---------------------------------------------------------------------
	var genRequest = function(params){
		var prefix = '';

		switch(params.plural){
			case true:
				prefix = '/articles';

				if(params.latest){
					prefix += '/latest';
				}

				if(params.categories){
					// TODO add allowance for multiple tags
					prefix += '/' + params.categories[0];
				}
				break;
			case false:
				if(!params.id) return null;
				prefix = '/article';
				prefix += '/' + params.id;
				break;
		}
		return prefix;
	};
//---------------------------------------------------------------------
	var genElements = function(data){
		if(typeof(data) !== 'object') return null;

		var article = $('<section/>');

		// create the title element and article body
		article.append($('<h2/>').text(data.title));
		article.append($('<article/>').html(data.content));
		article.children('article').append('<div style="clear:both"/>');

		// build the tag collection
		var nav  = $('<nav/>');
		var tags = $('<ol/>');
		if(data.tags){
			data.tags.forEach(function(tag){
				// todo make tags links
				tags.append($('<li/>').text(tag));
			});
			nav.append(tags);
		}

		// build time element
		data.posted = new Date(data.posted);
		var time = $('<time/>').attr('datetime', data.posted.toDateString())
		                       .text(data.posted.toDateString());

		// append to the article element.
		article.append(nav);
		article.append(time);

		article.append('<div style="clear:both"/>');

		return article;
	};
//---------------------------------------------------------------------
	$.ajax({
		type: 'GET',
		url: genRequest(params),
		datatype: 'json',
		success: function(data){
			data = JSON.parse(data);
			data.forEach(function(articleData){
				parent.append(genElements(articleData));
			});
		}
	});
};
