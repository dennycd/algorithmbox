process.chdir("../src/");
var util = require('util');
var assert = require('assert');
var fs = require('fs');
var Matrix = require('sylvester').Matrix;
var Vector = require('sylvester').Vector;


var TSP = require('example/tsp/Problem.js');
var TSP_Solution = require('example/tsp/Solution.js');
var IIA = require('example/tsp/Algorithms.js').TSP_IIA;
var SA = require('example/tsp/Algorithms.js').TSP_SA;
var TS = require('example/tsp/Algorithms.js').TSP_TS;

//should do this before handle
module.exports = exports = {
	setUp: function(callback) {
		callback();
	},
	tearDown: function(callback) {
		callback();
	}
};



exports.testAlgs = function(test){

	var ALGS = [SA,IIA,TS];

	ALGS.forEach(function(ALG){

		//load data from file 
		var raw = fs.readFileSync('../test/tsplib/bayg29.xml');
		test.ok(raw!=undefined,"error reading file");
		
		//parse data
	 	var data = TSP.parseData(raw);
	 	test.ok(TSP.validData(data), "data invalid");
	
	 	//instatiate problem
	 	var instance = new TSP(data);
	
		var algs = new ALG(instance, {'terminate_ls_steps' : 1000});
		algs.run(function(step){
			//console.log("step %d [%s]", step, algs.best_sol);
		});	
		
		console.log("algorithm %s found best %s", algs.getClass().getSimpleName(), algs.best_sol);
		
	
	});

	test.done();
}


/**
 TSPLIb  http://comopt.ifi.uni-heidelberg.de/software/TSPLIB95/
 xml formatted tsp instance http://www.iwr.uni-heidelberg.de/groups/comopt/software/TSPLIB95/XML-TSPLIB/instances/
**/
exports.testLoadTSPInstance = function(test){
	test.expect(2);
	//async read 
	fs.readFile('../test/tsplib/bayg29.xml', function(err, raw) {		
		test.ok(raw!=undefined,"error reading file");
	 	var data = TSP.parseData(raw);
	 	test.ok(TSP.validData(data), "data invalid");
	 	test.done();
	});

}


exports.testFixStepRun = function(test){

	var problem = new TSP($M([
		[0, 20, 42, 35, 12, 12],
		[20, 0, 30, 34, 33, 45],
		[42, 30, 0, 12, 45, 45],
		[35, 34, 12, 0, 11, 19],
		[22, 34, 66, 33, 0, 22],
		[123, 31, 56, 71, 11, 0], 
	]));
	
	var algs = new IIA(problem);
	
	var run_steps = 100;	
	
	algs.init();
	for(var i=0;i<run_steps;i++)
	{
		algs.step();
		console.log("step %d: %s", i, algs.cur_sol);
		if(algs.lo_trap) break;
	}
	
	
	console.log("final solution %s", algs.cur_sol);
	test.done();
}

exports.testNeighborhoodSet = function(test){

	var problem = new TSP($M([
		[0, 20, 42, 35],
		[20, 0, 30, 34],
		[42, 30, 0, 12],
		[35, 34, 12, 0]
	]));
	
	var algs = new IIA(problem);


	//check for neighborhood set 
	algs.init();
	var neighbors = algs.neighbors(algs.init_sol);

		
	//the neighborhood shall be a unique set of valid solutions 
	neighbors.forEach(function(sol){
		test.ok( problem.valid(sol) ); //solution constraint 
		
		//non identical neighbors
		neighbors.forEach(function(other){
			if(sol === other) return;
			test.ok(!other.identical(sol), "[%s] identical to [%s]", sol, other);
		})
		
		test.ok(!sol.identical(algs.init_sol));				
	});
	
	test.done();
}


exports.testSolutionEquality = function(test){
	
	var sola = new TSP_Solution($V([1,2,3,4]));
	var solb = new TSP_Solution($V([1,2,3,4]));
	var solc = new TSP_Solution($V([3,4,5,7]));
	var sold = new TSP_Solution($V([3,5,7]));
	
	test.ok(sola.identical(solb) && solb.identical(sola));
	test.ok(!sola.identical(solc));
	test.ok(!sola.identical(sold));	
	
	test.done();
}

exports.testBasic = function(test) {

	/**
	  A symetric TSP with 4 cities 
	  REFERNECE http://en.wikipedia.org/wiki/Travelling_salesman_problem
	**/
	var p1 = $M([
		[0, 20, 42, 35],
		[20, 0, 30, 34],
		[42, 30, 0, 12],
		[35, 34, 12, 0]
	]);
	//a problem instance 
	var p = new TSP(p1);
	
	//a TSP solution is a vector of ordered node indexes 
	var sol1 = new TSP_Solution($V([1, 2, 3, 4]));
		
	//evaluate the solution
	test.ok(p.fitness(sol1)==97);
	test.ok(p.valid(sol1));
	test.done();
};