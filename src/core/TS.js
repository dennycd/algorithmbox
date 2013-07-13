var util = require('util');
var assert = require('assert');
var defineClass = require('simple-cls').defineClass;
var OSolution = require('./OSolution.js');
var OProblem = require('./OProblem.js');
var SLS = require('./SLS.js');
/**
 Tabu Search 
 Reference http://en.wikipedia.org/wiki/Tabu_search
**/
var TABU = defineClass({
	name: "TABU",
	extend: SLS,
/**
	configuration		
	- tabu_tenure  : length of the tabu list 
	**/
	construct: function(problem, config) {
		SLS.apply(this, arguments);
		if (config && config.tabu_tenure != undefined) this.tabu_tenure = config.tabu_tenure;
	},
	variables: {
		//length of short term tabu list
		tabu_tenure: 20,
		//short term tabu memory structure simply contains recently K visisted solutions 
		short_mem: null,
		// current tabu item to be expired. the index cycled throug [0 ~ tabu_tenure-1]
		_cur_expire_index: 0
	},
	methods: {
/**
		 Initializing a tabu list 
		**/
		init_tabu: function() {
			this.short_mem = new Array(this.tabu_tenure);
			this._cur_expire_index = 0;
		},
/**
		update tabu with the newly added solution
		expires old ones
		**/
		update_tabu: function(new_sol) {
			this.short_mem[this._cur_expire_index] = new_sol;
			this._cur_expire_index = (this._cur_expire_index + 1) % this.tabu_tenure;
		},
		//return true if the given solution is forbidden by the tabu definition
		tabued: function(sol) {
			var forbidden = false;
			this.short_mem.forEach(function(elem) {
				if (elem.identical(sol)) forbidden = true;
			});
			return forbidden;
		},
		//Overriding Methods 
		init: function() {
			SLS.prototype.init.apply(this, arguments);
			this.init_tabu();
			this.update_tabu(this.init_sol); //add the initial solution
		},
		step: function(step) {
			var self = this;
			var neis = this.neighbors(this.cur_sol); //unfiltered neighbors
			//candidates filtered by tabu 
			var cans = [];
			var bestNei = null;
			neis.forEach(function(nei) {
				if (!self.tabued(nei)) {
					cans.push(nei);
					if (!bestNei || self._better(nei, bestNei)) bestNei = nei;
				}
			});
			//choose the best solution and move into it 
			//note we alwasy move into a new neighbor, regardless whether it is a better solution than the current one 
			if (bestNei) this.cur_sol = bestNei;
			this.update_tabu(this.cur_sol);
		}
	}
});
module.exports = exports = TABU;