var util = require('util');
var assert = require('assert');
var defineClass = require('simple-cls').defineClass;
var uuid = require('node-uuid').v4;

var OProblem = require('./OProblem.js');
var OSolution = require('./OSolution.js');
var SLS = require('./SLS.js');

var ALGS_BOX_VERSION = "0.0.1";

var fs = require('fs');

/**
 An experiment utility manages a single experiment session 
 
  - an experiment session may contain the following iterations 
  	 * 1 or more problem instances to test against 
  	 * 1 or more SLS algorithms to test against each problem
  	 * for each algorithm, a number of meta-parameter settings to test 
  	 
  	 
  - the experiment result is a set of triples  (problem, alg, config)
  	   * each trip element represent N independent runs of an algorithm under a parameter setting against a problem instance.   
  	   * each trip associates a result table of the following form 
  	   
  	   			step0 step1 ... stepN
  	   			xx     xx             xx
  	   			xx
  	   			..
  	   			N
  	   			
  	   			
  	      where each cell records the best found solution quality at that local search step 
  	      interally, the data is a matrix, with the ith row representing data collected at the ith local search step
  	    	  
  	      this format conforms to tsv with the first line being the field name 
  	  
  	  
  Notes:
  	- this module will be the main interface connecting UI     
  	- handles file loading, parsing and stuff like that 
  	- it will incrementally streaming results to the files - so a watcher can still read the experimental progress
  	
  	
  Notes: 
  
  	 - this class will export all experiment results to a target folder with the following structurs 
  	 		
  	 		
  	 		master.tsv - the main index file for this entire experiment session
  	 			#version xx 
  	 			#problem  algorithm  config 	    filename 
  	 			  tsp      tsp_sa   [1,"arit"]   xxx.tsv
  	 			  .  
  	 			
  	 			* problem is the problem name being tested
  	 			* algorithm is the unique algorithm name run against the problem
  	 			* filename is the corresponding raw data file under the same directory 
  	 			* config is the algorithm's meta-parameter settings for this experiment
  	 				 it is an array of meta-parameter setting values for this experiment
  	 			
  	 			  	 		
  	 		xx.tsv  - the raw experiment data corresponding to a triple (problem,alg,config). name is randomly generated and indexed from master.tsv 
  	 		
**/
var Experiment = defineClass({
	name : "Experiment",
	
	/**
	  config is an object containing the following synatx 
	  
	  	{
	  		"sat" : {    //the SAT problem name 
	  			"instances" : ["xxx.tsv", "yyy.xml"],    //an array of filenames represeting the problem isntance to test agains
	  			
	  			
	  			"algorithms" : {		  //a list of algorithms to test against. Name must be matching that algorithm's global definition name 	
	  				"sat_iia" : [        //meta-parameter settings for each algorithm. An object with key being the algorithm name 
				  		 			{"boltzmanconst":0.05, "coolingscheme":"geometric"}, 
				  		 			{"boltzmanconst":0.005, "coolingscheme":"geometric"},
				  		 			{"boltzmanconst":0.001, "coolingscheme":"geometric"},
				  		 			...	  								
	  							] ,
	  			
	  				"sat_ts" : [
			  		 				{"tabu_tenure" : 10},
			  		 				{"tabu_tenure" : 50},
			  		 				{"tabu_tenure" : 100}	  			
			  		 				...	
	  							],
	  							
	  				"sat_iia" : []
	  			}, 
	  			
	  			
	  			"runs"  :  N   //a number specifing how many independent runs on each algorithm against each problem instance / acted as a max bound
	  			"max_ls_steps" : M  //an upper bound for maximu number of local search steps on algs running against this problem categor
	  		}, 
	  		
	  		
	  		"tsp" : {   //the TSP problem name 
	  		 	...
	  		}
	  	
	  	}
	  	
	  	
	  outdir - output directory (will create it if not exist)
	**/
	construct : function(config, outdir){
		this.config = config;
		if(outdir) this.outdir = outdir;
	},
	variables : {
		config : null, //experiment config
		outdir : "default.box",  //default is current folder
		//master_fd : null,  //master file's file descriptor
	},
	methods : {
	
		/**
		 Some initialization task 
		  - ready the output dirs 		  
		  return true if initialization succeeded
		**/
		init : function(){
			
			if(!fs.existsSync(this.outdir)){
				fs.mkdirSync(this.outdir);
			}
			else{
				var stats = fs.statSync(this.outdir);
				if(!stats.isDirectory()){
					console.log("output dir exists and is not a directory. abort experiment");
					return false;
				}
				
				
			
				
			}
			
			this.save_config();
			return true;
		}, 
	
		
		/**
		 Start executing the experiment 
		**/
		run : function(){
			var self = this;
			if(!this.init()) return;
			
			//for each problem category
			for(var problem_name in this.config){
			
				//load the Problem class
				var problem_config = this.config[problem_name];
				var Problem = loadProblemClass(problem_name);
				
				//load each problem instance
				problem_config['instances'].forEach(function(instance_filename){

					//loading the file from disk
					var fullpath = '../workspace/instances/'+instance_filename;
					assert.ok(fs.existsSync(fullpath, "instance file not exist " + fullpath));
					console.log("reading " + fullpath);
					var content = fs.readFileSync(fullpath, {'encoding' : 'utf8'});
					assert.ok(content!=undefined,"error reading file");

					//parsing instance content and instantiate the problem instance object! 
					var data = Problem.parseData(content);
					assert.ok(Problem.validData(data), "data invalid");					
					var instance = new Problem(data);
					
					//total independent runs
					var independent_runs = parseInt(problem_config.runs);
					assert(!isNaN(independent_runs) && independent_runs > 0);
					
					var max_ls_steps = parseInt(problem_config.max_ls_steps);
					assert(!isNaN(max_ls_steps) && max_ls_steps > 0);
					
					//for each testing algorithm
					for(var alg_name in problem_config.algorithms){
						var algorithm_config = problem_config.algorithms[alg_name];
						
						//load algorithm class
						var Algorithm = loadAlgorithmClass(problem_name, alg_name);
						
						
						//for each parameter setting, conduct N indepedent runs 
						if(algorithm_config.length > 0){
							
							algorithm_config.forEach(function(alg_config){

								//add the local search step constraint 
								alg_config['terminate_ls_steps'] = max_ls_steps; 
								var alg = new Algorithm(instance, alg_config);
								

								//before an independent run, add index to master file
								var exp_filename = self.outdir + "/" + problem_name + "-" + alg_name + "-" + uuid() + ".tsv";
								self.add_master(problem_name, instance_filename,  alg_name, JSON.stringify(alg.config), exp_filename, independent_runs, max_ls_steps);
								
								console.log("problem %s, instance %s, algorithm %s, experiment_file %s", problem_name, instance_filename, alg_name, exp_filename);								
								
								for(var run = 1 ; run <= independent_runs; run++){
									var stats = []; //record best found solution for each step
									
									alg.init();									
									alg.run(function(step){
										stats.push(alg.best_sol.fitness);
									});
	
									//if alg stopped before reaching max, add * to indicate this and fill up the entire array
									for(var i=stats.length;i<=max_ls_steps;i++) stats.push("*");			
										
									//update on experiment file 
									self.add_experiment_file(exp_filename, max_ls_steps, stats);
																	
								}
								
							});
							
						}
						//using alg's default setting and conduct a N indpedent run
						else{
						
								var alg = new Algorithm(instance, {'terminate_ls_steps' : max_ls_steps});
								
								//before an independent run, add index to master file
								var exp_filename = self.outdir + "/" + problem_name + "-" + alg_name + "-" + uuid() + ".tsv";
								self.add_master(problem_name, instance_filename, alg_name, JSON.stringify(alg.config), exp_filename, independent_runs, max_ls_steps);
								
									console.log("problem %s, instance %s, algorithm %s, experiment_file %s",  problem_name, instance_filename, alg_name, exp_filename);
																		
								for(var run = 1 ; run <= independent_runs; run++){
									var stats = []; //record best found solution for each step
									alg.init();
									alg.run(function(step){
										stats.push(alg.best_sol.fitness);
									});
	

										
									//if alg stopped before reaching max, add * to indicate this and fill up the entire array
									for(var i=stats.length;i<=max_ls_steps;i++)
										stats.push("*");			
										
									//update on experiment file 
									self.add_experiment_file(exp_filename, max_ls_steps, stats);								
								}
																

						}
					}
				})
			}

		}, 
	
		
		/**
		 add a new entry to the master index file 
		**/
		add_master : function(problem, instance, algorithm, config, filename, runs, steps){
			var path = this.outdir+"/master.tsv";
			var opt = {'encoding' : "utf8"};
			if(!fs.existsSync(path)){
				fs.appendFileSync(path, "#version "+ALGS_BOX_VERSION+"\n", opt);
				fs.appendFileSync(path, "#problem	instance	algorithm	config	filename	runs	steps\n", opt);
			}
			
			//adding the entry
			var entry = problem + "\t" + instance + "\t" + algorithm + "\t" + config + "\t" + filename + "\t" + runs + "\t" + steps;
			fs.appendFileSync(path, entry+"\n", opt);
		},
		
		/**
			FORMAT 
  	   			step0 step1 ... stepN
  	   			xx     xx             xx
  	   			xx
  	   			..
  	   			N
		   	   
		   	   steps is total number of local search steps in this single run
		   	   fitnesses is an arary of  fitness value at each local search step  [0, MAX]
		**/
		add_experiment_file : function(filepath,steps, fitnesses){
			var opt = {'encoding' : "utf8"};
			assert.ok(fitnesses.length == steps + 1);
			if(!fs.existsSync(filepath)){
				var header = "";
				for(var i=0;i<=steps;i++) header += "step"+i + "\t"; //step0  step1 ... stepN
				fs.appendFileSync(filepath, header+"\n", opt);
			}
			fs.appendFileSync(filepath, fitnesses.join('\t') + "\n", opt);
		},
		
		/**
		 the configuration for this entire experiment session
		**/
		save_config : function(){
			var opt = {'encoding' : "utf8"};
			var path = this.outdir + "/config.json";
			fs.writeFileSync(path, JSON.stringify(this.config), opt);
		}
		
		
	},
	statics : {
	}
});

/**
 Analyzer consumes an experiment session data, and renders it to output 
**/ 
var Analyzer = defineClass({
	name : "Analyzer",
	construct : function(exp_dir){
		this.exp_dir = exp_dir;
		this._load();
	},
	variables : {
		loaded : false, //indicate if loading session is success
		exp_dir : null,  //input directory containing the experiment session 
		
		config : null, 
		master : null 
	},
	
	methods : {
	
		//obtain all tested problem categories in this experiment session
		problems : function(){
			return !this.master ? [] : Object.keys(this.master);
		}, 
		
		//obtain all tested problem instnaces in thsi experiment session
		instances : function(problem_name){
			if(!this.master) return [];
			if(!this.master[problem_name]) return [];
			return Object.keys(this.master[problem_name]);
		}, 
		
		/**
		 return all algorithm tested on a problem or problem instnaces
		 if instance not specified, simply return algoritms tested on any of that problem's instances 
		**/
		algorithms : function(problem_name, instance){
			if(!this.master) return [];
			if(!this.master[problem_name]) return [];
			
			if(instance){
				if(!this.master[problem_name][instance]) return [];
				return Object.keys(this.master[problem_name][instance]);
			}
			else{
				var algs = {};
				for(var instance_name in this.master[problem_name]){
					var alg_names = Object.keys(this.master[problem_name][instance_name]);
					alg_names.forEach(function(alg_name){
						algs[alg_name] = true;
					});
				}
				return Object.keys(algs);				
			}		
		}, 
		
		/**
		 return all tested algorithm configuration for a givne problem instance & algorithm
		 
		  each element in the returned array is the master  info cell 
		**/
		configs : function(problem_name, instance_name, alg_name){
			if(!this.master) return [];
			if(!this.master[problem_name]) return [];	
			if(!this.master[problem_name][instance_name]) return [];		
			if(!this.master[problem_name][instance_name][alg_name]) return [];		
			
			var configs = [];
			this.master[problem_name][instance_name][alg_name].forEach(function(exp){
				configs.push(exp.config);
			});
			return configs;
		}, 
		
		
		/**
		 return all algorithm performance on all isntances of a problem 
		 	returned object has follwoing fields 
		 	{
		 		'instance1' {
		 						'alg1' :  alg1's best found solution quality on intance1 . 
		 							{
		 								'config' : xxx    //the config that produces best solution quality 
		 								'fitness' : xx  //the value of the best found solution quality
		 							}
		 						
		 						
		 						'alg2' :  ... 
		 					}
		 		
		 		
		 		'instance2'
		 	}
		 	
		 	
		 	- note if there are multiple experiemtns alg1 runed on instanc1 under diferent parameter settings. we simply return the best one 
		**/
		get_problem_solution_quality : function(problem_name){
			var self = this;
			//find the problem clas
			var problem = loadProblemClass(problem_name);
			var instance = new problem(null);
			
			
			if(!this.master) return [];
			if(!this.master[problem_name]) return [];				

			var stat = {};
			for(var instance_name in this.master[problem_name]){
				if(!stat[instance_name]) stat[instance_name] = {};
				
				for(var alg_name in this.master[problem_name][instance_name]){
				
					//loop exp for each config
					this.master[problem_name][instance_name][alg_name].forEach(function(exp){
						var exp_data = self._load_experiment(exp.filename, exp.runs, exp.steps);
						var rqd = Analyzer._runtime_quality_distribution(exp_data);							
						var final_quality = rqd[rqd.length-1];
						
						//simply record the best solution quality across all parameter settings
						if(stat[instance_name][alg_name] == undefined) stat[instance_name][alg_name] = final_quality;
						else{
							var isBetter = instance.minimization ? (final_quality < stat[instance_name][alg_name]) : (final_quality > stat[instance_name][alg_name]);
							if(isBetter)
								stat[instance_name][alg_name] = final_quality;
						}
					});
				}
			}
			
			return stat;
		}, 
	
		/**
		 return an array of runtime solvability data
		 
		   {
		   	'config' : algorith configuration dat
		   	'data' : a vector containing the solvability distribution over local search steps
		   }
		**/
		get_runtime_solvability : function(problem, instance, alg, config, threshold){
			if(!this.loaded) return [];
			var self = this;
			var stat = [];			
			this._match_experiment(problem, instance, alg, config, function(exp){
				var exp_data = self._load_experiment(exp.filename, exp.runs, exp.steps);
				var rqd = Analyzer._runtime_solvability_distribution(exp_data, threshold, problem);
				stat.push({
					'config' : exp.config, 
					'data' : rqd 
				});				
			});
			return stat;				
		}, 
	
		/**
		 get runtime quality distribution result 
		 	for an algorithm running on a specific problem instance 
		 	
		 	- note tat there might be multiple experiemts with different parameter settings, 
		 	 so if config is provided, attemp to fetch all experiments matching the config settings! 
		 	 here as long as the config is a subset of that algorithm's actual run setting, we will include the experiment in the result  
		**/
		get_runtime_quality : function(problem, instance, alg, config){
			if(!this.loaded) return [];
			var self = this;
			var stat = [];			
			this._match_experiment(problem, instance, alg, config, function(exp){
				var exp_data = self._load_experiment(exp.filename, exp.runs, exp.steps);
				var rqd = Analyzer._runtime_quality_distribution(exp_data);
				
				stat.push({
					'config' : exp.config, 
					'data' : rqd 
				});				
			});
			return stat;
		}, 

		/**
		 find experiments matching the specified criteria . invoked fn callback on every matched experiment 
		 
		  fn - function(experiment)
		  	   experiment comes from master's experiment object 
		  	   
		**/
		_match_experiment : function(problem, instance, alg, config, fn){
			if(!this.loaded) return;
			if(this.master[problem] && this.master[problem][instance] && this.master[problem][instance][alg]){
				var exps = this.master[problem][instance][alg];
				
				exps.forEach(function(exp){
					//if config provided, check if we shall include it 
					var shouldadd = true;
					if(config){
						for(var cfgname in config){
							if(exp.config[cfgname] == undefined){
								console.log("WARNING: user specified a non-existing parameter config name: [" + cfgname + "]  exp.config: " + exp.config);
								shouldadd = false;
								break;
							}
							
							//if any user-specified config is not matched agains the experiment's run setting, should not add this experiment
							if(exp.config[cfgname] != config[cfgname]){
								shouldadd = false;
								break;
							}
						}
					}
				
					//load the experiment data and compute runtie quality 
					if(shouldadd)  fn(exp);
				});
			}			
		}, 
	
		//=== loader functions
		
		/**
		 loading content of an experiment session data
		 return true if loading success, false otherwise
		**/
		_load : function(){
			this._loaded = false;
			this.config = null;
			this.master = null;
			
			this.config = this._load_config();
			if(!this.config){
				console.log("WARNING: failed to load config file");
				return;
			}
			
			 this.master = this._load_master();
			if(!this.config){
				console.log("WARNING: failed to load master file");
				return;
			}
						
			this.loaded = true;	
		},
	
		/**
		 load a raw experiment file and return the run data
		 
		   runtime data is simply a matrix  N * M 
		    - N is total number of indepedent run.  M is max local search steps
		   	- each row containing a single indepedent run's fitness level at each local search step
		 
		**/
		_load_experiment : function(filename, runs, steps){
			var raw = fs.readFileSync(filename,  {'encoding' : "utf8"});
			if(!raw) return null;
			
			var data = [];
			var lines = raw.trim().split(/[\s]*\n[\s]*/);
			
			//should contain M + 1 fields 
			var M = lines[0].trim().split(/[\s]+/).length - 1;
			assert.ok(M==steps, "ls steps not matching in exp file: "); 
			
			for(var i=1;i<lines.length;i++){
				var line = lines[i].trim();
				if(line.length==0) continue;
				
				var vals = line.split(/[\s]+/);
				if(vals.length != M+1){
					console.log("invalid # of columns in " + filename + " at line " + i);
					return null;
				}
				
				var row = [];
				vals.forEach(function(val){
					var fitness = parseFloat(val);
					assert.ok(!isNaN(fitness),"invalid fitness value");
					row.push(fitness);
				});
				assert.ok(row.length==M+1);
				data.push(row);
			}
			
			assert.ok(data.length == runs, "# of runs not matching in exp file");
			return data;
		}, 
		
		/**
		 a returned master file contains the content of the index
		 
		 master[problem_category][problem_instance_name][algorithm_name]  is an array of object having following field
		 
		 		[config] :  run configuration string 
		 		[filename] :  the experiment run data 
		 		[runs] : total number of independent runs
		 		[steps] : local step uppoer bounds
		 			
		**/
		_load_master : function(){
			var raw = fs.readFileSync(this.exp_dir+"/master.tsv",  {'encoding' : "utf8"});
			if(!raw) return null;
			
			var lines = raw.trim().split('\n');
			var version = lines[0].match(/(#version)[\s]+([\d.]+)/)[2];  
			var fields = lines[1].substr(1).trim().split(/[\s]+/);

			var master = {}; 
			for(var i=2;i<lines.length;i++){
				var line = lines[i].trim(); 
				if(line.length==0) continue;
				
				var entries = line.split(/[\s]/);
				
				var problem = entries[0];
				var instance = entries[1];
				var algs = entries[2];
				var config = JSON.parse(entries[3]); assert(config!=undefined);
				var filename = entries[4];
				var runs = parseInt(entries[5]); assert(!isNaN(runs));
				var steps = parseInt(entries[6]); assert(!isNaN(steps));
				
				if(!master[problem]) master[problem] = {};
				if(!master[problem][instance]) master[problem][instance] = {};
				if(!master[problem][instance][algs]) master[problem][instance][algs] = [];
				
				master[problem][instance][algs].push({
					'config' : config, 
					'filename' : filename,
					'runs' : runs,
					'steps' : steps
				});
			}
			
			return master;
		},
		
		_load_config : function(){
			//load configuration
			var configStr = fs.readFileSync(this.exp_dir+"/config.json", {'encoding' : "utf8"});
			if(!configStr) return null;
			
			var config = JSON.parse(configStr);
			return config;
		},
		
	}, 
	
	statics : {
	
		/**
		  solvability is percentage of runs that found solution better than the threshold fitness
		  return a runtime array with each value being the averaged solvability at that local search step
		**/
		_runtime_solvability_distribution : function(raw_data, threshold, problem_name){
			//find the problem clas
			var problem = loadProblemClass(problem_name);
			var instance = new problem(null);
		
			var rqd = new Array(raw_data[0].length); // containing N+1 entries where N is max local search step
			for(var i=0;i<rqd.length;i++) rqd[i] = 0;
			
			for(var run=0;run<raw_data.length;run++){
				for(var step=0;step<raw_data[run].length;step++){
					var isBetter = instance.minimization ? (raw_data[run][step] < threshold) : (raw_data[run][step] > threshold);
					if(isBetter) rqd[step] += 1;
				}
			}
			for(var i=0;i<rqd.length;i++) 
			{
				rqd[i] = rqd[i]/raw_data.length;
				assert.ok(rqd[i]>=0 && rqd[i] <= 1);
			}
			
			return rqd;
		}, 
		
		/**
		 given the loaded raw experiment data, compute runtime quality distribution array
			return a simple array containing average solution quality at each local search step		  
		 
		**/
		_runtime_quality_distribution : function(raw_data){		
			var rqd = new Array(raw_data[0].length); // containing N+1 entries where N is max local search step
			for(var i=0;i<rqd.length;i++) rqd[i] = 0;
			
			for(var run=0;run<raw_data.length;run++){
				for(var step=0;step<raw_data[run].length;step++){
					rqd[step] += raw_data[run][step];
				}
			}
			for(var i=0;i<rqd.length;i++) 
				rqd[i] = rqd[i]/raw_data.length;
			return rqd;
		}
	}
});

function loadAlgorithmClass(problem_name, alg_name){
	//load algorithm class
	var Algorithm = require('example/'+problem_name+"/Algorithms.js")[alg_name.toUpperCase()];
	assert.ok(Algorithm && typeof(Algorithm)=="function", "failed to load " + 'example/'+problem_name+"/Algorithms.js - " + alg_name.toUpperCase());
	return Algorithm;					
}

function loadProblemClass(problem_name){
	var Problem = require('example/'+problem_name.toLowerCase()+"/Problem.js");
	assert(Problem && typeof(Problem)=="function");	
	return Problem;
}

module.exports.Experiment = Experiment; 
module.exports.Analyzer = Analyzer;
