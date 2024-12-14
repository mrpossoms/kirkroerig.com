let pg = require('./pg');

// since rng seeding isn't possible, we start intentionally with a bad policy
let puck_theta = [
  [
    -0.06344286448017344,
    -0.013060742152890104,
    0.3612000714595811,
    -0.265469954891274,
    -0.25405646928285,
    -0.2317468792603885
  ],
  [
    -0.32516165515685724,
    -0.03432296246933131,
    0.383052435694907,
    0.2915076462546815,
    0.046673970000944864,
    -0.17635189577351218
  ]
];

let avg_ret = 0;
let epoch = 0;

console.log('epoch,reward');
setInterval(() => {
	let T = pg.puck.sample_trajectory(puck_theta);
	let ret = T.R.reduce((acc, val) => acc + val, 0);
	
	avg_ret += ret;

	puck_theta = pg.optimize(pg.puck.pi, puck_theta, T, {
		alpha: 0.1,
		pi_pr: (theta, x, a) => {
			let y = pg.puck.pi(theta, x);
			return y.pr[0][a[0]] * y.pr[1][a[1]];
		}
	});

	if (epoch > 0 && epoch % 10 == 0) {
		console.log(epoch + ',' + avg_ret/10);
		avg_ret = 0;
	}
	epoch++;
}, 0);


process.on('SIGINT', () => {
  console.log('theta: ', puck_theta);
  process.exit();
});