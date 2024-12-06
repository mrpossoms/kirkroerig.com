function tensor(shape, fill, depth)
{
	depth = depth || 0;
	fill = fill || 0;
	if (depth+1 == shape.length) {
		return Array(shape[depth]).fill(fill);
	}

	let t = [];
	for (let i = 0; i < shape[depth]; i++) {
		let t_i = tensor(shape, fill, depth+1);
		t.push(t_i);
	}
	return t;
}

Array.prototype.shape = function()
{
	if (!this._shape) {
		let dim_fn = (arr) => {
			if (arr instanceof Array) {
				return [arr.length].concat(dim_fn(arr[0]));
			}

			return [];
		};

		this._shape = dim_fn(this);
	}
	return this._shape;
}

Array.prototype.size = function()
{
	if (!this._size) {
		this._size = this.shape().reduce((acc, val) => acc * val, 1);
	}
	return this._size;
}

Array.prototype.tensor_same_shape = function(B)
{
	let A_shape = this.shape();
	let B_shape = B.shape();
	return A_shape.length == B_shape.length && A_shape.every((val, i) => val == B_shape[i]);
}

Array.prototype.tensor_map = function(fn)
{
}

function tensor_map_op(A, B, fn)
{
	debugger
	if (A.tensor_same_shape(B)) { throw "Tensor dimension do not match"; }

	let tmap = (axis_a, axis_b) => {
		if (axis[0] instanceof Array) {
			for (let i = 0; i < axis_a.length; i++) {
				tmap(axis_a[i], axis_b[i]);
			}
		} else {
			for (let i = 0; i < axis.length; i++) {
				fn(axis_a, axis_b, i);
			}
		}
	};

	for (let i = 0; i < A.length; i++) {
		tmap(A[i], B[i]);
	}
}

Array.prototype.tensor_add = function(B)
{
	// Not exactly right, need to check each component
	if (!this.tensor_same_shape(B)) { throw "Tensor dimensions do not match"; }

	let C = tensor(this.shape());
	for (let i = 0; i < this.length; i++) {

	}
}

function tensor_test()
{
	console.log(tensor([1]));
	console.assert(tensor([1]).size() == 1);
	console.log(tensor([3, 3]));
	console.assert(tensor([3, 3]).size() == 9);
	console.log(tensor([3, 3, 3]));
	console.assert(tensor([3, 3, 3]).size() == 27);
	
	debugger
	let cum_sum = 0;
	let one = tensor([1, 1], 1);
	let two = tensor([1, 1], 2);
	tensor_map_op(one, two, (a, b, i) => {
		cum_sum += a[i] * b[i];
	});
	console.assert(cum_sum.size() * cum_sum);
}
tensor_test()
