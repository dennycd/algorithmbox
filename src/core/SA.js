var util = require('util');
var assert = require('assert');
var defineClass = require('../class/defineClass.js');
var Class = require('../class/Class.js');
var OSolution = require('./OSolution.js');
var OProblem = require('./OProblem.js');
var SLS = require('./SLS.js');

/**
 Cooling schedule
**/
var CoolingScheme = {
	ARITHMETIC : "arithmetic",
	GEOMETRIC : "geometric"	
};

/**
 General Simulated Annealing Algorithm
**/
var SA = defineClass({
	name : "SA", 
	extend : SLS,
	
	/**
	   
	   configuration 
	   
	   	 coolingscheme - cooling scheme options
	   	 boltzmanconst - boltzmann constant value 
	   	 temperaturescope - defines min/max value for temperature 
	   	 check_localoptima - true will check for local optima at every search step
	**/
	construct : function(problem, config){
		SLS.apply(this,arguments);
		if(config && config.coolingscheme != undefined) this.coolingscheme = config.coolingscheme;
		if(config && config.boltzmanconst != undefined) this.boltzmanconst = config.boltzmanconst;
		if(config && config.temperaturescope != undefined) this.temperaturescope = config.temperaturescope;
		if(config && config.check_localoptima != undefined) this.check_localoptima = config.check_localoptima;
	},
	
	variables : {	
	
		//runtime state
		temperature : null, 
	
		//config
		coolingscheme : CoolingScheme.ARITHMETIC,
		boltzmanconst : 0.05,  //boltzmann constant  
		temperaturescope : [1,100], // min and max temperature scope. max value will be used as initial temperature 
		check_localoptima : false
	},
	
	methods : {
	
		init : function(){
			this.temperature = this.temperaturescope[1]; //init to max temperature
			SLS.prototype.init.apply(this,arguments);
		},
		
		/**
		 
		**/
		step : function(step){
			var nei = this.neighbor(this.cur_sol); //pick a random neighbor
			if(this._better(nei, this.cur_sol)){
				this.cur_sol = nei;
			}
			else{
				//relative fitness delta :   f(s')-f(s) / f(s)
				var deltaE = Math.abs((this.problem.fitness(nei)-this.problem.fitness(this.cur_sol)) / this.problem.fitness(this.cur_sol)); 
				var p = Math.exp(-deltaE / (this.boltzmanconst * this.temperature)); // gives (0,1]
			
				//accept with probablity p
				if(Math.random() <= p) 
					this.cur_sol = nei;
			}
			this._update_temperature();
		
			if(this.check_localoptima)
				this.lo_trap = this._check_localoptima();
		},
		
		
		_update_temperature : function(){
			if(this.coolingscheme == CoolingScheme.ARITHMETIC){
				var theta = (this.temperaturescope[1] - this.temperaturescope[0]) / this.terminate_ls_steps; // (T_max - T_min) / N  
				this.temperature -= theta;
				//assert.ok(this.temperature >= this.temperaturescope[0], "curTemp=" + this.temperature + ", minTemp=" + this.temperaturescope[0]);
			}
			else if(this.coolingscheme == CoolingScheme.GEOMETRIC){
				var alpha = Math.pow( this.temperaturescope[0]/this.temperaturescope[1], 1/this.terminate_ls_steps ); // (T_min/T_max)^(1/N)
				this.temperature *= alpha;
				//assert.ok(this.temperature >= this.temperaturescope[0]);
 			}
			else assert.ok(false,"invalid cooling")
		},
		
		//returns true if current solution is a local optima
		// O(K) time complexity 
		_check_localoptima : function(){
			var self = this;
			var neis = this.neighbors(this.cur_sol);
			var betterNei = null;
			neis.forEach(function(nei){
				if(self._better(nei, self.cur_sol)) 
					betterNei = nei;
			});
			
			return (betterNei == null); 
		}
	}
	
});

module.exports = exports = SA;