var util = require('util');
var assert = require('assert');
var defineClass = require('simple-cls').defineClass;
var OSolution = require('./OSolution.js');
var OProblem = require('./OProblem.js');
var SLS = require('./SLS.js');



/**
 Generic Definition for Iternative Improvement Algorithm
**/
var IIA = defineClass({
	name : "IIA",
	extend : SLS, 
	construct : function(){
		SLS.apply(this,arguments);
	},
	
	variables : {
	
	}, 
	
	methods : {
		
		/**
		 basic iterative improvement 
		 - takes the best neighborhood solution and move into it 
		 Runtime: O(K) - K is total of neighborhood count
		**/
		step : function(step){
			assert(!this.lo_trap,"local optima trapped, no steps");
							
			var self = this;
			var neighbors = this.neighbors(this.cur_sol);
			var bestNei = neighbors[0];
			neighbors.forEach(function(neighbor) {
				if(self._better(neighbor,bestNei))
					bestNei = neighbor;
			});
			
			//if previous found solution is better than best neighbor, we reached local optima
			if (this._better(this.cur_sol,bestNei)) 
				this.lo_trap = true;
			//if best neighbor is same as previous found, and platau move not allowed, consider as trapped as well
			else if(this._equal(this.cur_sol,bestNei) && !this.plateu_move)
				this.lo_trap = true;
			else 
				this.cur_sol = bestNei;
		}
	}
});
module.exports = exports = IIA;
