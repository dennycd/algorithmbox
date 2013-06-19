var util = require('util');
var assert = require('assert');
var defineClass = require('class/defineClass.js');
var Class = require('class/Class.js');
var OSolution = require('./OSolution.js');
var OProblem = require('./OProblem.js');

var SLS_MAX_LS_STEPS = 1000;

/**
 Base Class for a Stochastic Local Search Algorithm 
**/
var SLS = defineClass({
	name : "SLS",
	
	/**
		initiliaze an algorithm with its targer problem instance
		configuration settings 
		- plateu_move : true to allow local search to move into a solution having the same quality as the previous one。 default true
		- terminate_ls_steps : search step threshold for stoping the ls
		- terminate_fitness : fitness threshhold for stopping the ls 
	**/
	construct : function(problem, config){
		this.problem = problem;
		this.config = config;
		
		//config
		if(config && config.plateu_move != undefined) this.plateu_move = config.plateu_move;
		if(config && config.terminate_ls_steps != undefined) this.terminate_ls_steps = config.terminate_ls_steps;
		if(config && config.terminate_fitness != undefined) this.terminate_fitness = config.terminate_fitness;		
	}, 
	
	statics : {
		SOLUTION_QUALITY_MIN_DIFFERENCE : 0.000006 		
	}, 
	
	variables : {
		problem : null, ///the underlying problem instance
		config : null,  //algorithm configuration 

		//search state 
		init_sol : null, //initial starting solution 
		cur_sol : null, //current solution during the search process
		best_sol : null, //best found solution so far
		cur_step : 0, //current local search steps
		lo_trap : false, //flag whether current solution is trapped in local optima
		
		
		//configuration options
		plateu_move : true, //true to allow local search to move into a solution having the same quality as the previous one。 default true
		terminate_ls_steps : SLS_MAX_LS_STEPS , //search will terminate if this steps is reached
		terminate_fitness : null //when present, iia will stop if current solution is found equals or better than this valueOf()
	},
	
	methods : {
	
		/**
		 algorithm initialization
		 default implementation initialize with a random solution - reset all internal state to be ready for another independent run
		 subclass can override it to provide alternative initalization scheme
		**/
		init : function(){ 
			this.init_sol = this.init_solution();
			this.cur_sol = this.init_sol;
			this.best_sol = this.init_sol;
			this.lo_trap = false;
			this.cur_step = 0;
		}, 
		
	
		/**
		 one independent run of SLS
		@param op - an operator, when given, will be invoked after every single step
				function (stepno) -  stepno is [0,n] - where 0 indicates initial step
		**/
		run : function(op){
			assert.ok(!op || typeof(op)=="function");
			this.init();
			if(op) op(0);			
			while(true){
				if(this.terminate()) break;
				this.step(this.cur_step);	
				this.cur_step += 1;
				if(this._better(this.cur_sol, this.best_sol))  this.best_sol = this.cur_sol; //best known solution
				if(op) op(this.cur_step);					
			}
		}, 
		
		/**
		 termination criteria 
		 returns true if algs should terminate, otherwise false
		 
		 - subclass can override it to add more termination conditions
		**/ 
		terminate : function(){
			var threshFitSol = new OSolution(null,this.terminate_fitness);
	
			if(this.lo_trap) return true; //if previous step hit local optima
			if(this.cur_step >= this.terminate_ls_steps)  return true; //reaching user-specified max steps
			if(this.terminate_fitness && (this._equal(this.best_sol, threshFitSol) || this._better(this.best_sol, threshFitSol))) return true; //if use threshold fitness and we found better, break 
			if(this.cur_step > SLS_MAX_LS_STEPS) return true; //reaching system-defined max steps (so it won't just run forever!)
			return false;
		},
		
		//default gives a random solution
		//subclass to provide custom initial solution
		init_solution : function(){
			return this.problem.randsol();
		}, 
		
		/**
		 a single local search step
		@param n - gives the step count (starting with 1 as init is the 0 step)
		**/
		step : function(n){assert.ok("not implemented");}, 
		
		/**
		 define the transient operator / neighborhood structure
		 returns the set of all neighbor candidates 
		 
		 Time Complexity O(K) where K is the branching factor from a single solution node in the app's search landscape 
		**/
		neighbors : function(sol){assert.ok("not implemented");}, 
		
		//given a solution, returns a random neighbors of it 
		neighbor : function(sol){assert.ok("not implemented");},
		
		
		// --- utility functions
		
		//given two problem solution, determine which solution is better
		//return true is s1 is better than s2
		_better : function(s1,s2){  
			return this.problem.minimization ? (s1.fitness < s2.fitness) : (s1.fitness > s2.fitness);  
		},
		
		//given two problem solution ,determine if they have equal quality / fitness
		_equal : function(s1,s2){ 
			return Math.abs(s1.fitness - s2.fitness) <= SLS.SOLUTION_QUALITY_MIN_DIFFERENCE; 
		}
	}
});

module.exports = exports = SLS;



