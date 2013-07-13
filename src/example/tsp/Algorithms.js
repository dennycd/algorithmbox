var util = require('util');
var assert = require('assert');
var defineClass = require('simple-cls').defineClass;
var Matrix = require('sylvester').Matrix;
var Vector = require('sylvester').Vector;

var TSPSolution = require('./Solution.js');

var IIA = require('../../core/IIA.js');
var SA = require('../../core/SA.js');
var TS = require('../../core/TS.js');

/**
a 2-k neighborhood gives N*(N-1) candidates where N is number of nodes 
@return an array of candidate solutions that is direct neighbors of the candicate

 MAKE SURE evaluate neighbor's fitness before returning !!
**/
function neighbors(candidate) {
	assert(this.problem.valid(candidate));
	var self = this;
	var neighbors = [];
	var N = this.problem.dimension(); //number of city nodes
	var E = N; //number of travel paths 
	//enumerate all possible pair of edges to remove 
	var origin = candidate.data.elements.slice(0);
	// E*(E-1)/2 elements in total  
	for (var i = 0; i < E - 1; i++) {
		for (var j = i + 1; j < E; j++) {
			//remove edge i connecting node i and i+1
			//remove edge j connecting node j and j+1
			//connect node i and j 
			//connect node i+1 and j+1 to form the new circle
			//new arrya is //  n1 ... ni  nj n(j-1) ... n(i+1) n(j+1) ... nn 		
			var arr = [];
			arr = arr.concat(origin.slice(0, i + 1)); //  n1 ... ni
			arr = arr.concat(origin.slice(i + 1, j + 1).reverse()); // nj, n(j-1) ... n(i+1)
			arr = arr.concat(origin.slice(j + 1, E)); //  n(j+1) .. nn 
			/* 					console.log("remove edge %d %d   ==>  %s", i, j, arr);*/
			neighbors.push(new TSPSolution($V(arr)));
		}
	}
	//filter identical set  O(n^2) time 
	var unique_neighbors = [];
	neighbors.forEach(function(neighbor) {
		var duplicate = unique_neighbors.some(function(elem) {
			return neighbor.identical(elem);
		});
		//consider candiate itself 
		duplicate = duplicate || candidate.identical(neighbor);
		if (!duplicate) {
			neighbor.fitness = self.problem.fitness(neighbor); //make sure we evaluate the neighbor before returning
			unique_neighbors.push(neighbor);
		}
	});
	
	assert(unique_neighbors.length > 0, "unique neighborhood set is empty!");
	return unique_neighbors;
}
		
/**
 return a random neighbor from candidate's 2-k neighborhood
 MAKE SURE evaluate neighbor's fitness before returning !!
**/
function neighbor(candidate){
	assert(this.problem.valid(candidate));
	var N = this.problem.dimension(); //number of city nodes
	var E = N; //number of travel paths 
	var origin = candidate.data.elements.slice(0);
	
	var i = Math.round( Math.random() * (E-2));
	var j = i+1+ Math.round( Math.random() * (E-1-(i+1)) );
	var arr = [];
	arr = arr.concat(origin.slice(0, i + 1)); //  n1 ... ni
	arr = arr.concat(origin.slice(i + 1, j + 1).reverse()); // nj, n(j-1) ... n(i+1)
	arr = arr.concat(origin.slice(j + 1, E)); //  n(j+1) .. nn 		

	var nei = new TSPSolution($V(arr));
	assert.ok(this.problem.valid(nei));
	nei.fitness = this.problem.fitness(nei);
	return nei;
}


// === ALGORITHM

/**
 Tabu Search for SAT 
**/
var TSP_TS = defineClass({
	name : "TSP_TS",
	extend : TS, 
	methods : {
		'neighbors': neighbors,
		'neighbor' : neighbor
	}	
});

var TSP_IIA = defineClass({
	name : "TSP_IIA",
	extend : IIA, 
	methods : {
		'neighbors' : neighbors,
		'neighbor' : neighbor
	}
});

var TSP_SA = defineClass({
	name : "TSP_SA",
	extend : SA,
	methods : {
		'neighbors' : neighbors,
		'neighbor' : neighbor
	}
});

module.exports.TSP_TS = TSP_TS;
module.exports.TSP_SA = TSP_SA;
module.exports.TSP_IIA = TSP_IIA;