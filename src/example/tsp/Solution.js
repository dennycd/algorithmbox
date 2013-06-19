var util = require('util');
var assert = require('assert');
var defineClass = require('class/defineClass.js');
var Class = require('class/Class.js');
var sprintf = require("util/sprintf.js").sprintf;

var Matrix = require('sylvester').Matrix;
var Vector = require('sylvester').Vector;
var OSolution = require('core/OSolution.js');


/**
 TSP solution is a vector treated as an ordered node list, in which each city node exists at least once and only once 
 value is the index of the node in the problem's instance matrix 
 x = [n1,n2,n3,...]
**/
var TSPSolution = defineClass({
	name : "TSPSolution",
	extend : OSolution,
	construct : function(){
		OSolution.apply(this,arguments);
	},
	
	methods : {

		//OVERRIDe
		identical : function(sol){ 
			assert.ok(Class.isInstanceOfClass(sol,"TSPSolution"));
			
			if(sol.dimension() != this.dimension()) return false;
			for(var i=0;i<this.dimension();i++)
				if(sol.data.elements[i] != this.data.elements[i] ) return false;
			return true;
		},
				
		dimension: function() {
			return this.data.elements.length;
		},
		
		toString : function(){
			return sprintf("[%s](%s)",this.data.elements, this.fitness);
		}
			
		
	}
});
module.exports = exports = TSPSolution;