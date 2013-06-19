var util = require('util');
var assert = require('assert');
var Matrix = require('sylvester').Matrix;
var Vector = require('sylvester').Vector;
var defineClass = require('./class/defineClass.js');
var sprintf = require("./util/sprintf.js").sprintf;
var xml2js = require('xml2js');
var fs = require('fs');


/**
 A Symetric TSP Problem 
**/
var Problem = defineClass({
	construct: function(p) {
		assert(p instanceof Matrix);
		this.instance = p;
	},
	
	variables: {
/**
		 A TSP problem instance is encoded in a matrix of nodes , where cell value represent the weight in-between two city nodes 
		**/
		instance: null
	},

	methods: {
	
		data : function(){
			return this.instance.elements;
		}, 
	
		//number of city nodes 
		dimension : function(){
			return this.instance.elements.length; //an array of arrays
		}, 
	
/**
		 return true if the candidate solution satifies problem constraints , otherwise false
		  a solution is valid if all the following are satisfied 
		   - contains each city node once and only once 		   
		   Time Complexity :  O(n)
		**/
		valid: function(candidate) {
			assert(candidate instanceof Solution);
			//if(!(candidate instanceof Solution)) return false;
		
			var val = {}; //index from node index to occurance count 
			for (var i = 1; i <= candidate.s.elements.length; i++) {
				var idx = candidate.s.e(i);
				if (!val[idx]) val[idx] = 1;
				else val[idx] += 1;
			}
			//once and only once
			var nodeCount = this.instance.elements.length;
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
		fitness: function(candidate) {
			var total_dist = 0;
			var pre = candidate.s.e(1),
				cur;
			for (var i = 2; i <= candidate.s.elements.length; i++) {
				cur = candidate.s.e(i);
				//console.log("%d => %d (+%d)",pre, cur, this.instance.e(pre,cur));
				total_dist += this.instance.e(pre, cur);
				pre = cur;
			}
			total_dist += this.instance.e(cur, candidate.s.e(1)); //final stop to start
			return total_dist;
		}
	},

	statics: {
	
		//make usre the problem intance is valid
		//must be a N by N matrix, with  P_ij = 0 where i==j
		valid : function(instance){
			
			var d1 = instance.data();
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
			
		},
	
	
		newFromXMLFile : function(filepath, fn){

			var parser = new xml2js.Parser();
				
			parser.on('end', function(result) {
			 	var instance = result['travellingSalesmanProblemInstance']; 
			 	assert.ok(instance.graph.length > 0, "no valid tsp data");
			 	var vertexes = instance.graph[0]["vertex"];
			 	assert.ok(vertexes instanceof Array);
			 	assert.ok(vertexes.length >= 2);
			 	console.log("reading %d city nodes", vertexes.length);
			 	
			 	//the NxN matrix representing this problem 
			 	var data = new Array(vertexes.length); 	
			 	for(var i=0;i<data.length;i++) data[i] = []; 	
			 	
			 	vertexes.forEach(function(vertex, i){
			 		var edges = vertex.edge;
			 		
			 		assert.ok( edges.length == vertexes.length-1);
			 		
			 		
			 		edges.forEach(function(edge){
			 			var city = parseInt(edge['_']);  //linking target city's index 
			 			var cost = parseFloat( edge['$']['cost'] ); //attributes on an edge, usually the cost 
			 			
			 			assert.ok(!isNaN(city) && city >=0 && city < vertexes.length, "city index invalid " + city);  //must be a valid city node index
			 			assert.ok(!isNaN(cost) && cost >= 0, "cost invalid " + cost); 
			 			
			 			data[i][city] = cost;
			 		});
			 			 		
			 		data[i][i] = 0;
			 	});
			 	
			 	console.log("checking instance ");
			 	var instance = new Problem($M(data));
			 	fn(instance);
			});
			
			
			//async read 
			fs.readFile(filepath, function(err, data) {
			  parser.parseString(data);
			});
			
	
		}	
	}
	
});
/**
 TSP solution is an ordered node list, in which each city node exists at least once and only once 
 value is the index of the node in the problem's instance matrix 
 x = [n1,n2,n3,...]
**/
var Solution = defineClass({
	construct: function(s, fit) {
		assert(s instanceof Vector);
		this.s = s;
		this.fitness = fit;
	},
	variables: {
		s: null, //TSP solution vector
		fitness : null //fitness function value
	},
	methods: {
		
		//euqality test if two solution is identical
		equals : function(sol){
			if(sol.dimension() != this.dimension()) return false;
			for(var i=0;i<this.dimension();i++)
				if(sol.data()[i] != this.data()[i] ) return false;
			return true;
		}, 
		
		//return the array data
		data : function(){
			return this.s.elements;
		},
	
		dimension: function() {
			return this.s.elements.length;
		},
		
		toString : function(){
			return sprintf("[%s](%s)",this.s.elements, this.fitness);
		}
	}
});
Problem.Solution = Solution;
module.exports = exports = Problem;