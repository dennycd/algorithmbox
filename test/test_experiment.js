process.chdir("../src/");
console.log("switching to directory " + process.cwd());
var util = require('util');
var assert = require('assert');
var fs = require('fs');
var Experiment = require('core/Experiment.js').Experiment;

exports.testBasicExperiment = function(test) {


	var config = {
	
		"sat": {  
		
			"instances": ["uf20-01.cnf", "uf20-02.cnf"],
			"algorithms": {
				"sat_sa": [ 
					{
						"boltzmanconst": 0.05,
						"coolingscheme": "geometric"
					}, {
						"boltzmanconst": 0.005,
						"coolingscheme": "geometric"
					}, {
						"boltzmanconst": 0.001,
						"coolingscheme": "geometric"
					}, 
					
				],
				
				"sat_ts": [
					{
						"tabu_tenure": 10
					}, {
						"tabu_tenure": 50
					}, {
						"tabu_tenure": 100
					}
				],
				
				
				"gsat_iia": []
			},
			
			"runs": 5,
			"max_ls_steps" : 30
		},
		
		
		"tsp": { 
		
			"instances" : ["bayg29.xml", "br17.xml"], 
			"algorithms": {
				"tsp_sa": [ 
					{
						"boltzmanconst": 0.05,
						"coolingscheme": "geometric"
					}, {
						"boltzmanconst": 0.005,
						"coolingscheme": "geometric"
					}, {
						"boltzmanconst": 0.001,
						"coolingscheme": "geometric"
					}, 
					
				],
				
				"tsp_ts": [
					{
						"tabu_tenure": 10
					}, {
						"tabu_tenure": 50
					}, {
						"tabu_tenure": 100
					}
				],
				
				
				"tsp_iia": []
			},
			
			"runs": 5,
			"max_ls_steps" : 50
		}
	};
	
	
	var session = new Experiment(config, "../workspace/default.box");
	session.run();
	test.done();
}











