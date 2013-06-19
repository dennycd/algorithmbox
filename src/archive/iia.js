var util = require('util');
var assert = require('assert');
var defineClass = require('./class/defineClass.js');
var Matrix = require('sylvester').Matrix;
var Vector = require('sylvester').Vector;
var Problem = require('./tsp.js');
var Solution = require('./tsp.js').Solution;
/**
 Iterative Improvement Algorithm 

 2-exchange Iterative Improvement Algorithm 


**/
var IIA = defineClass({
	construct: function(problem) {
		this.problem = problem;
	},
	variables: {
	
		problem: null,
		//the problem instance 
		initial_solution: null,
		//initial solution 
		current_solution: null,
		//the currently searched candidate solution 
		isLocalOptima: false //flag if current solution is local optima
	},

	
	methods: {
/**
		  transient operator that given a candidate solution, produces the neighborhood set 
		  
		  a 2-k neighborhood gives N*(N-1) candidates where N is number of nodes 
		  
		  @return an array of candidate solutions that is direct neighbors of the candicate
		**/
		neighbors: function(candidate) {
			assert(this.problem.valid(candidate));
			var self = this;
			var neighbors = [];
			var N = this.problem.dimension(); //number of city nodes
			var E = N; //number of travel paths 
			//enumerate all possible pair of edges to remove 
			var origin = candidate.data().slice(0);
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
					neighbors.push(new Solution($V(arr)));
				}
			}
			//filter identical set  O(n^2) time 
			var unique_neighbors = [];
			neighbors.forEach(function(neighbor) {
				var duplicate = unique_neighbors.some(function(elem) {
					return neighbor.equals(elem);
				});
				//consider candiate itself 
				duplicate = duplicate || candidate.equals(neighbor);
				if (!duplicate) {
					neighbor.fitness = self.problem.fitness(neighbor); //make sure we evaluate the neighbor before returning
					unique_neighbors.push(neighbor);
				}
			});
			
			assert(unique_neighbors.length > 0, "unique neighborhood set is empty!");
			return unique_neighbors;
		},
/**
		 initial step of the algorithm 
		 here we produce a random initial solution 
		**/
		init: function() {
			//produce a random solution 
			var sol = [];
			for (var i = 1; i <= this.problem.dimension(); i++)
			sol.push(i);
			fisher_yates_permute(sol);
			this.initial_solution = new Solution($V(sol));
			this.initial_solution.fitness = this.problem.fitness(this.initial_solution);
			this.current_solution = this.initial_solution;
			this.isLocalOptima = false;
			//console.log("init solution [%s] with fitness %s", this.initial_solution.data(), this.initial_solution.fitness);
		},
/*
		  A 2-opt single local search step exmaines all its neighbors and pick the best one to move into 
		 
		*/
		step: function() {
			if (this.isLocalOptima) {
				console.log("WARNING: local optima reached, no further steps");
				return;
			}
			var neighbors = this.neighbors(this.current_solution);
			var bestNei = neighbors[0];
			neighbors.forEach(function(neighbor) {
				if (neighbor.fitness < bestNei.fitness) bestNei = neighbor;
			});
			//if best neighbor is worse than current, we reached local optima
			if (bestNei.fitness > this.current_solution.fitness) this.isLocalOptima = true;
			else this.current_solution = bestNei;
		}
	}
});
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
}
module.exports = exports = IIA;