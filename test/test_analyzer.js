process.chdir("../src/");
console.log("switching to directory " + process.cwd());
var util = require('util');
var assert = require('assert');
var fs = require('fs');
var Experiment = require('core/Experiment.js').Experiment;
var Analyzer = require('core/Experiment.js').Analyzer;


exports.testInspection = function(test){
	var a = new Analyzer("../workspace/default.box");
	test.ok(a.loaded, "failed to load");

	console.log("all problem tested " + a.problems().join(","));

	a.problems().forEach(function(problem){
		console.log("\ttested instance for (%s): %s", problem, a.instances(problem));
		console.log("\ttested algorithm for (%s) : %s", problem, a.algorithms(problem));
		
		a.instances(problem).forEach(function(instance){
			console.log("\t\ttested algorithm for instance %s: %s", instance, a.algorithms(problem,instance));
			a.algorithms(problem,instance).forEach(function(alg_name){
				console.log("\t\t\ttested params for algorithm %s: %s", alg_name, util.inspect(a.configs(problem,instance,alg_name),{'depth' : null}));
			})
		});
	});




	var stat = a.get_problem_solution_quality('sat');
	console.log(util.inspect(stat, {'depth' : null}));
	
	
	var stat = a.get_problem_solution_quality('tsp');
	console.log(util.inspect(stat, {'depth' : null}));

	test.done();
}

exports.testLoadExperiment = function(test){
	var analyzer = new Analyzer("../workspace/default.box");
	test.ok(analyzer.loaded, "failed to load");
	
	
	
	//load runtime quality distribution of a specifici data
	var rqds = analyzer.get_runtime_quality("sat", "uf20-01.cnf", "gsat_iia", {"terminate_ls_steps" : 30});
	test.ok(rqds.length == 1);

	var rqds2 = analyzer.get_runtime_quality("sat", "uf20-01.cnf", "gsat_iia", {"terminate_ls_steps" : 10});
	test.ok(rqds2.length == 0);	
	
	
	var rsd = analyzer.get_runtime_solvability('sat', "uf20-01.cnf", "gsat_iia", {}, 85);
	test.ok(rqds.length == 1);
	
	
	rsd = analyzer.get_runtime_solvability('tsp', "bayg29.xml", "tsp_iia", {}, 1800);
	test.ok(rqds.length == 1);

	
	test.done();
}

