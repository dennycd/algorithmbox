var util = require('util');
var assert = require('assert');
var defineClass = require('class/defineClass.js');
var Class = require('class/Class.js');


var OSolution = defineClass({
	name : "OSolution",
	construct : function(data, fitness){
		this.data = data;
		this.fitness = fitness;
	},
	variables : {
		data : null,  //internal raw data representing the solution
		fitness : null //the fitness value / solution quality of this solution
	},
	statics : {
		/**
		 consumes a raw string and returns a solution data.
		 subclass can implement it to define their custom parser for loading problem instance data
		**/
		parseData : function(raw){ assert.ok(null,"not implemented"); }	
	},
	methods : {

	
		/**
		check if two solutions are indeed identical solution 
		- identical means two solution's content composition are the same, not their fitness value 
		subclass shall define equality within its own implementation
		@param solution - the other solution
		**/
		identical : function(sol){ 
			assert.ok(false, "not implemented");
		}		
	}
});
module.exports = exports = OSolution;