process.chdir("../src/");
console.log("switching to directory " + process.cwd());

var util = require('util');
var assert = require('assert');
var fs = require('fs');

var SAT = require('example/sat/Problem.js');
var GSAT = require('example/sat/Algorithms.js').GSAT_IIA;
var SAT_SA = require('example/sat/Algorithms.js').SAT_SA;
var SAT_TS = require('example/sat/Algorithms.js').SAT_TS;


exports.testTS = function(test){

	//async read 
	fs.readFile('../test/satlib/uf20-01.cnf', {'encoding' : 'utf8'}, function(err, raw) {		
		test.ok(raw!=undefined,"error reading file");
		var data = SAT.parseData(raw);
		test.ok(SAT.validData(data), "data invalid");
		var p = new SAT($M(data));
		console.log("loaded problem with %d clauses %d variables", p.clauses(), p.variables());
		
	
		var algs = new SAT_TS(p, {
			'terminate_fitness' : p.clauses()
			});
		algs.run(function(step){
			//console.log("step %d: %s", step, algs.cur_sol);
		});	
		
		console.log("final solution %s", algs.cur_sol);
		if(algs.lo_trap) console.log("algs local optima trap");
	
	
		test.done();
			
	});
	
}

exports.testSA = function(test){

	//async read 
	fs.readFile('../test/satlib/uf20-01.cnf', {'encoding' : 'utf8'}, function(err, raw) {		
		test.ok(raw!=undefined,"error reading file");
		var data = SAT.parseData(raw);
		test.ok(SAT.validData(data), "data invalid");
		var p = new SAT($M(data));
		console.log("loaded problem with %d clauses %d variables", p.clauses(), p.variables());
		
	
		var algs = new SAT_SA(p, {
			'terminate_fitness' : p.clauses(),
			'coolingscheme' : 'geometric'
			});
		algs.run(function(step){
			//console.log("step %d: %s", step, algs.cur_sol);
		});
		
		
		console.log("final solution %s", algs.cur_sol);
		if(algs.lo_trap) console.log("algs local optima trap");
	
	
		test.done();
			
	});

}

exports.testGSAT_IIA = function(test){

	//async read 
	fs.readFile('../test/satlib/uf20-01.cnf', {'encoding' : 'utf8'}, function(err, raw) {		
		test.ok(raw!=undefined,"error reading file");
		var data = SAT.parseData(raw);
		test.ok(SAT.validData(data), "data invalid");
		var p = new SAT($M(data));
		console.log("loaded problem with %d clauses %d variables", p.clauses(), p.variables());
			
	
		var algs = new GSAT(p, 
			{'terminate_fitness' : p.clauses(), 
			'terminate_ls_steps' : 50
			});
		
		algs.run(function(step){
			//console.log("step %d: %s", step, algs.cur_sol);
		});
		
		
		console.log("final solution %s", algs.cur_sol);
		if(algs.lo_trap) console.log("algs local optima trap");
		
		test.done();			
			
	});
}


exports.testFitness = function(test){
	
	var NUM_CLAUSES = 30;
	
	var p = SAT.randomSAT(NUM_CLAUSES, 5, 3); //3-SAT with 10 clauses and 5 variables
	test.ok(SAT.validData(p.data), "invalid random literal set");
	//console.log(p.data);
	
	for(var i=0;i<30;i++){
		var sol = p.randsol();
		test.ok(p.valid(sol));			
		var fit = p.fitness(sol);		
		test.ok(typeof(fit)=="number" && fit >= 0 && fit <= NUM_CLAUSES);
	}

	test.done();
}

exports.testRanSolution = function(test){
	
	var p = SAT.randomSAT(10, 5, 3); //3-SAT with 10 clauses and 5 variables
	test.ok(SAT.validData(p.data), "invalid random literal set");
	
	var sol = p.randsol();
	test.ok(p.valid(sol));	
	
	test.done();
}

exports.testRandomSAT = function(test){

	var p = SAT.randomSAT(10, 5, 3); //3-SAT with 10 clauses and 5 variables
	test.ok(SAT.validData(p.data), "invalid random literal set");
	

	test.done();
}

exports.testSATLoad = function(test){
	
	//async read 
	fs.readFile('../test/satlib/uf20-01.cnf', {'encoding' : 'utf8'}, function(err, raw) {		
		test.ok(raw!=undefined,"error reading file");
		var data = SAT.parseData(raw);
		test.ok(SAT.validData(data), "data invalid");
		
		
		var p = new SAT($M(data));
		console.log("loaded problem with %d clauses %d variables", p.clauses(), p.variables());
		
		//some random solution		
		for(var i=0;i<10;i++){
			var sol = p.randsol();
			test.ok(p.valid(sol));			
			var fit = p.fitness(sol);		
			console.log("solution %s ==> (%d)", sol, fit);
		}		
		
		
		test.done();
	});
	
}