let pg = require('./pg');

let puck_theta = pg.randmat(2, 6);

console.log('epoch,reward');
let avg_ret = 0;
for(let epoch = 0; true; epoch++) {
	let T = pg.puck.sample_trajectory(puck_theta);
	let ret = T.R.reduce((acc, val) => acc + val, 0);
	
	avg_ret += ret;

    	puck_theta = pg.optimize(pg.puck.pi, puck_theta, T, {
    		pi_pr: (theta, x, a) => {
    			let y = pg.puck.pi(theta, x);
    			return y.pr[0][a[0]] * y.pr[1][a[1]];
    		}
    	});

	if (epoch > 0 && epoch % 100 == 0) {
		console.log(epoch + ',' + avg_ret/100);
		avg_ret = 0;
	}
}
