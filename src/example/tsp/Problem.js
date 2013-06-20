var util = require('util');
var assert = require('assert');
var defineClass = require('../../class/defineClass.js');
var Class = require('../../class/Class.js');
var Matrix = require('sylvester').Matrix;
var Vector = require('sylvester').Vector;
var xml2js = require('xml2js');
var fisher_yates_permute = require('../../util/permute.js');

var OProblem = require('../../core/OProblem.js');
var TSPSolution = require('./Solution.js');

/**
 http://www.iwr.uni-heidelberg.de/groups/comopt/software/TSPLIB95/XML-TSPLIB/instances/
**/
var TSP = defineClass({
	name : "TSP",
	extend : OProblem, 
	construct : function(data){
		if(data instanceof Array) data = $M(data);
		OProblem.call(this,data,true); //tsp is a minimization problem 
	},

	methods : {

		
		
		/**
		return true if the candidate solution satifies problem constraints , otherwise false
		a solution is valid if all the following are satisfied 
		- contains each city node once and only once 		   
		Time Complexity :  O(n)
		**/
		//Override
		valid: function(candidate) {
			assert(Class.isInstanceOfClass(candidate, "TSPSolution"));
			
			var val = {}; //index from node index to occurance count 
			for (var i = 1; i <= candidate.data.elements.length; i++) {
				var idx = candidate.data.e(i);
				if (!val[idx]) val[idx] = 1;
				else val[idx] += 1;
			}
			//once and only once
			var nodeCount = this.data.elements.length;
			for (var i = 1; i <= nodeCount; i++)
			if (val[i] != 1) return false;
			return true;
		},
		
		/**
		The objective function 
		Given a solution candidate, evaluate its fitness value 
		
		Runtime Complexity : O(n) - n is # of city nodes
		@param sol - a solution to the TSP problem 
		**/
		//Override
		fitness: function(candidate) {
			var total_dist = 0;
			var pre = candidate.data.e(1), cur;
			for (var i = 2; i <= candidate.data.elements.length; i++) {
				cur = candidate.data.e(i); //console.log("%d => %d (+%d)",pre, cur, this.instance.e(pre,cur));
				total_dist += this.data.e(pre, cur);
				pre = cur;
			}
			total_dist += this.data.e(cur, candidate.data.e(1)); //final stop to start
			return total_dist;
		}, 
		
		/**
		 utility function for generating a random solution 
		 @return a solution instance
		**/
		//Override
		randsol : function(){
			//produce a random solution 
			var sol = [];
			for (var i = 1; i <= this.dimension(); i++) sol.push(i);
			fisher_yates_permute(sol);			
			var ret = new TSPSolution($V(sol));
			ret.fitness = this.fitness(ret);
			return ret;		
		}, 


		//number of city nodes 
		dimension : function(){
			return this.data.elements.length; //an array of arrays
		}, 
						
	},

	statics : {

		/**
		 raw is the data content containing the problem instance definition 
		 return an data object for TSP problem instance
		 TSP data is a matrix wrapping a 2d array 
		**/
		parseData : function(raw){
			var parser = new xml2js.Parser();
			var data = null;
	
			parser.on('end', function(result) {
			 	var instance = result['travellingSalesmanProblemInstance']; 
			 	assert.ok(instance.graph.length > 0, "no valid tsp data");
			 	var vertexes = instance.graph[0]["vertex"];
			 	assert.ok(vertexes instanceof Array);
			 	assert.ok(vertexes.length >= 2);
			 	
			 	console.log("reading %d city nodes", vertexes.length);
			 	
			 	//the NxN matrix representing this problem 
			 	data = new Array(vertexes.length); 	
			 	for(var i=0;i<data.length;i++) data[i] = []; 	
			 	
			 	vertexes.forEach(function(vertex, i){
			 		var edges = vertex.edge;
			 		
			 		//assert.ok( edges.length == vertexes.length-1, "inconsistent edge/vertext  edges=" + edges.length + ", vertexs=" + vertexes.length);
			 		
			 		edges.forEach(function(edge){
			 			var city = parseInt(edge['_']);  //linking target city's index 
			 			var cost = parseFloat( edge['$']['cost'] ); //attributes on an edge, usually the cost 
			 			
			 			assert.ok(!isNaN(city) && city >=0 && city < vertexes.length, "city index invalid " + city);  //must be a valid city node index
			 			assert.ok(!isNaN(cost) && cost >= 0, "cost invalid " + cost); 
			 			
			 			data[i][city] = cost;
			 		});
			 			 		
			 		data[i][i] = 0;
			 	});
			 	
			 	
			});

			parser.parseString(raw); //blocking call here
			assert.ok(data);
			return $M(data);
		},
		
		/**	
		//make usre the problem intance is valid
		//must be a N by N matrix, with  P_ij = 0 where i==j
		**/
		validData : function(data){
			assert.ok(data instanceof Matrix); 
			var d1 = data.elements;
			var N = d1.length; 
			
			for(var i=0;i<N;i++){
				if(d1[i].length != N){ 
					console.log("dimension not matching");
					return false;
				}
				if(d1[i][i] != 0)
				{	
					console.log("(%d,%d) not zero", i,i, d1[i][i]);
					return false;  //self path must be zero
				}
				
				for(var j=0;j<N;j++){
					if(d1[i][j] < 0){
						console.log("(%d,%d) has val %s", i,j,d1[i][j]);
						return false; //no negative 
					}
				}
			}
			
			return true;
		}
		
	}
});





module.exports = exports = TSP;