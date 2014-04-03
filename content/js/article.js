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
	
	};
//---------------------------------------------------------------------
	var genElements = function(data){
		if(typeof(data) !== 'object') return null;

		var article = $('<section/>');

		// create the title element and article body
		article.append($('<h2/>').text(data.title);
		article.append($('<article/>').html(data.content));
		article.children('article').append('<div style="clear:both"/>');

		// build the tag collection
		var nav  = $('<nav class="out-left"/>');
		var tags = $('<ol/>');
		if(data.tags){
			data.tags.forEach(function(tag){
				// todo make tags links
				tags.append($('<li/>').text(tag));
			});
			nav.append(tags);
		}

		// build time element
		var time = $('<time/>').attr('datetime', params.posted.toDateString())
				       .text(params.posted.toDateString());
	
		// append to the article element.
		article.append(nav);
		article.append(time);
		return article;
	};
//---------------------------------------------------------------------
	$.ajax({
		type: 'GET',
		url: genRequest(params),
		datatype: 'json',
		success: function(data){
			var article = genElement(data);
		}
	});
};
