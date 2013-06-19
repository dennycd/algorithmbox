var assert = require('assert');

//randomly permutate a given set in place
//REFERENCE http://en.wikipedia.org/wiki/Knuth_shuffle
function fisher_yates_permute(arr) {
	assert(arr instanceof Array);
	var tmp;
	for (var i = arr.length - 1; i >= 1; i--) {
		var j = Math.round(Math.random() * i);
		tmp = arr[j];
		arr[j] = arr[i];
		arr[i] = tmp;
	}
};

module.exports = exports = fisher_yates_permute;