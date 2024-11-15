window.requestAnimFrame = function(callback) {
	window.requestAnimationFrame = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;

	if(!window.requestAnimationFrame)
		window.setTimeout(callback, 1000 / 60);
	else
		window.requestAnimationFrame(callback);
};


function doodleInit(cvs){
	if(!cvs){
		console.log("Canvas object was null. Must be a valid canvas instance");
	}

	var time = 0;
	var frame = 0;
	var ctx = cvs.getContext('2d');
	var centerX = cvs.clientWidth / 2;
	var centerY = cvs.clientHeight / 2;

	ctx.fillStyle = 'rgba(0, 0, 0, 1)';
	ctx.fillRect(0, 0, cvs.clientWidth, cvs.clientHeight);


	ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
	ctx.strokeStyle = 'rgba(255, 255, 255, 1)';

	function draw(){
		var scale = 8;//(-Math.cos(time / 10 + time / 100) + 1) * 8 + 0.1;

		// Epicycloid path
		var r = 1, R = 3;
		var t = time / 10;
		var x = (r + R) * Math.cos(t) - R * Math.cos((r + R) * t / r);
		var y = (r + R) * Math.sin(t) - R * Math.sin((r + R) * t / r);

		if(frame++ % 15 == 0)
			ctx.fillRect(0, 0, cvs.clientWidth, cvs.clientHeight);

		ctx.save();
		ctx.translate(centerX + x * 15, centerY + y * 15);
		ctx.rotate(time);
		ctx.strokeRect(-1 * scale, -1 * scale, 2 * scale, 2 * scale);

		ctx.restore();

		time += 0.1;

		requestAnimFrame(draw);
	};

	draw();
}
