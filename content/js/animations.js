function pageReady(){
	$('.out-left, .out-right').css('left', 0);

	setTimeout(
		function(){ $('.out-transparent').css('opacity', 1) },
		1500
	);
}