var util = require('util');
var assert = require('assert');
var defineClass = require('../../class/defineClass.js');
var Class = require('../../class/Class.js');
var sprintf = require("../../util/sprintf.js").sprintf;
var Matrix = require('sylvester').Matrix;
var Vector = require('sylvester').Vector;
var OSolution = require('../../core/OSolution.js');

/**
 A value assignemnt for all variables x1,x2 ... xk
 1 - true 
 -1 - false
 
 e.g.   (1,-1,-1,1,1,1)
**/
var SATSolution = defineClass({
	name : "SATSolution",
	extend : OSolution, 
	construct : function(){
		OSolution.apply(this,arguments);
	},
	
	methods : {
		
		//OVERRIDe
		identical : function(sol){ 
			assert.ok(Class.isInstanceOfClass(sol,"SATSolution"));  //same type 
			if(sol.dimension() != this.dimension()) return false;  //dimension match 
			for(var i=0;i<this.dimension();i++)
				if(sol.data.elements[i] != this.data.elements[i] ) return false;  //value match
			return true;		
		},
		
		toString : function(){
			return sprintf("[%s](%s)",this.data.elements, this.fitness);
		},
		
		// K variables 
		dimension: function() {
			return this.data.elements.length;
		},
		
		value : function(idx){
			assert.ok(idx >= 0 && idx < this.dimension());
			return this.data.elements[idx];
		}
	}
});
module.exports = exports = SATSolution;