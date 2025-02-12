
function fin_diff(f, x, h)
{
	return (f(x + h) - f(x - h)) / (2 * h);
}

let rows = (A) => { return A.length; }
let cols = (A) => { return A[0].length; }
let rnd = () => { return Math.random() * 2 - 1; };

let zeros = (r, c) => { 
	let z = Array(r);

	for (let i = 0; i < r; i++) {
		z[i] = Array(c).fill(0);
	}

	return z;
};

function matmul(A, B)
{
	if (cols(A) != rows(B)) { throw "Matrix dimensions do not match"; }

	let C = [];
	for (let r = 0; r < rows(A); r++)
	{
		C.push([]);
		for (let c = 0; c < cols(B); c++)
		{
			let sum = 0;
			for (let k = 0; k < cols(A); k++)
			{
				sum += A[r][k] * B[k][c];
			}
			C[r].push(sum);
		}
	}
	return C;
}

function matadd(A, B)
{
	if (rows(A) != rows(B) || cols(A) != B[0].length) { throw "Matrix dimensions do not match"; }

	let C = [];
	for (let i = 0; i < rows(A); i++)
	{
		C.push([]);
		for (let j = 0; j < cols(A); j++)
		{
			C[i].push(A[i][j] + B[i][j]);
		}
	}
	return C;
}

function matscl(A, s)
{
	let B = [];
	for (let i = 0; i < rows(A); i++)
	{
		B.push([]);
		for (let j = 0; j < cols(A); j++)
		{
			B[i].push(A[i][j] * s);
		}
	}
	return B;
}

function vecsub(a, b)
{
	if (a.length != b.length) { throw "Vector dimensions do not match"; }
	let c = [];
	for (let i = 0; i < a.length; i++)
	{
		c.push(a[i] - b[i]);
	}
	return c;
}

function vecscl(a, s)
{
	let b = [];
	for (let i = 0; i < a.length; i++)
	{
		b.push(a[i] * s);
	}
	return b;
}

function randmat(rows, cols)
{
	let A = [];
	for (let i = 0; i < rows; i++)
	{
		A.push([]);
		for (let j = 0; j < cols; j++)
		{
			A[i].push(Math.random() - 0.5);
		}
	}
	return A;
}

function softmax(z)
{
	let sum = z.reduce((acc, val) => acc + Math.exp(val), 0);
	return z.map(val => Math.exp(val) / sum);
}

function softermax(z)
{
	let y = softmax(z);
	let max_idx = y.argmax();
	if (y[max_idx] > 0.9) {
		let rem = y[max_idx] - 0.9;
		y[max_idx] = 0.9;
		let b = 0;
		for (let i = 0; i < y.length; i++) { if (i != max_idx) { b += y[i]; } }
		for (let i = 0; i < y.length; i++) {
			if (i == max_idx) continue;
			y[i] += (y[i]/b) * rem;
		}
	}

	return y;
}

function leaky_relu(z)
{
	return z.map(row => row.map(val => val > 0 ? val : 0.01 * val));
}

function dist(p0, p1)
{
	return Math.sqrt(Math.pow(p0[0] - p1[0], 2) + Math.pow(p0[1] - p1[1], 2));
}

function sample_multinomial(p)
{
	let r = Math.random();
	let sum = 0;
	for (let i = 0; i < p.length; i++)
	{
		sum += p[i];
		if (r < sum) { return i; }
	}
}