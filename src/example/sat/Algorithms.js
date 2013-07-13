var util = require('util');
var assert = require('assert');
var defineClass = require('simple-cls').defineClass;
var Class = require('simple-cls').Class;
var Matrix = require('sylvester').Matrix;
var Vector = require('sylvester').Vector;
var SATSolution = require('./Solution.js');


var IIA = require('../../core/IIA.js');
var SA = require('../../core/SA.js');
var TS = require('../../core/TS.js');


/**
  return a set of 1-flip neighbors of a candidate solution
  this gives N neighbors
**/
function neighbors(sol){
	var N = this.problem.variables(); 
	var neis = [];
	for(var i=0;i<N;i++){
	
		var data = sol.data.elements.slice(0); //a new vector copy 
		data[i] = -data[i]; //flip true/false 
			
		//make sure this neighbor satisfied the problem constraint 
		var nei = new SATSolution($V(data));
		if(this.problem.valid(nei))
		{
			nei.fitness = this.problem.fitness(nei);
			neis.push(nei);
		}
	}
	return neis;	
}

//produce a random neighborhood solution
function neighbor(sol){
	var N = this.problem.variables(); 
	var pos =  Math.round(Math.random() * (N-1));
	var data = sol.data.elements.slice(0);
	data[pos] = -data[pos];
	var nei = new SATSolution($V(data));
	nei.fitness = this.problem.fitness(nei);
	return nei;
}


//====== SLS Algorithm Instantiation ======

/**
 Tabu Search for SAT 
**/
var SAT_TS = defineClass({
	name : "SAT_TS",
	extend : TS, 
	methods : {
		'neighbors': neighbors,
		'neighbor' : neighbor
	}	
});

/**
 Basic GSAT algorithm based on IIA using 1-flip neighbourhood structure
**/
var GSAT_IIA = defineClass({
	name : "GSAT_IIA",
	extend : IIA,
	methods : {
		'neighbors': neighbors,
		'neighbor' : neighbor
	}
});

/**
 Simulated Annealing applied to SAT problem 
**/
var SAT_SA = defineClass({
	name : "SAT_SA",
	extend : SA, 
	methods : {
		'neighbors' : neighbors,
		'neighbor' : neighbor
	}
});

module.exports.SAT_TS = SAT_TS;
module.exports.SAT_SA = SAT_SA;
module.exports.GSAT_IIA = GSAT_IIA;
