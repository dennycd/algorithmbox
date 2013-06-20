var util = require('util');
var assert = require('assert');
var defineClass = require('../../class/defineClass.js');
var Class = require('../../class/Class.js');
var Matrix = require('sylvester').Matrix;
var Vector = require('sylvester').Vector;
var fisher_yates_permute = require('../../util/permute.js');


var OProblem = require('../../core/OProblem.js');
var SATSolution = require('./Solution.js');


/**
  The Propositional Satisfiability Problem 
  
  Given a propositional logic in CNF (conjuntion normal form), find a variable value assignment a (x1,...xk) such that
  the logic evaluates to true 
    
  SAT is satifiable iff there exist at least a value assignment evaluating it to true.
  
  e.g.    
  
  	f =   ( c1 | c2 ) & ( !c3 | c4  )
  
**/ 
var SAT = defineClass({
	name : "SAT",
	extend : OProblem,
	construct : function(data){
		if(data instanceof Array) data = $M(data);
		OProblem.call(this,data,false); // a maximization problem - more positive clauses, better 
	},
	 
	methods : {
		
		/**
		 a valid solution should mach number of variables, and contains only [1|0] for true/false 
		**/
		valid: function(candidate) {
			assert.ok(Class.isInstanceOfClass(candidate,"SATSolution"));
			if(candidate.dimension()!=this.variables()) return false;
			for(var i=0;i<candidate.dimension();i++)
				if(!(candidate.value(i)==-1 || candidate.value(i)==1)) return false;
			return true;
		},
		
		/**
			f = total # of clauses that evaluates to true for the given solution
			
			Time Complexity O(MN)
		**/
		fitness: function(candidate) {
			var M = this.clauses();
			var N = this.variables();
			
			var trueclauses = 0; 
			
			//a literal is true if 
			//   -  solution's variable value is true (1), and the clause literal is present and positive (1)
			//   - solution's variable value is false (-1), and the clause literal is present and negative (-1)
			for(var i=0;i<M;i++){
				var clause = this.data.elements[i];
				
				var trueeval = false;
				for(var j=0;j<N;j++){
					if( clause[j] * candidate.value(j) == 1){
						trueeval = true;
						break;
					}
				}
				
				if(trueeval) trueclauses += 1; 
			}
			
			return trueclauses;
		},
		

		/**
		 a random variable assignemnt 
		 	- each var randomly takes either true or false 
		**/
		randsol : function(){
			var vals = [-1,1]; //a solution takes either 1(true) or -1(false)
			var sol = new Array(this.variables());
			for(var i=0;i<sol.length;i++)
				sol[i] = (Math.random() > 0.5) ? 1 : -1; 

			var ret = new SATSolution($V(sol));
			ret.fitness = this.fitness(ret);
			return ret;
		},
		
		//CNF clause count
		clauses : function(){
			return this.data.elements.length;
		}, 
		
		//number of variables 
		variables : function(){
			return this.data.elements[0].length;
		}
	},
	
	statics : {

		/**
		 takes in a sat problem in CNF form, and convert it to internal matrix representation
		 
		 SAT problem format using te following 
		 http://www.cs.ubc.ca/~hoos/SATLIB/benchm.html
		 
		 it uses the DIMACS CNF Format form 
		 
		**/
		parseData : function(raw){
			assert(typeof(raw) == "string", "raw is " + raw);
			
			var M = 0; //number of clauses 
			var N = 0; //number of vars
		
			//read preambles
			var lines = raw.trim().split('\n');
			var curl = 0 ;// current line number			
			
			for(curl=0;curl<lines.length;curl++){
			
				var line = lines[curl].trim();
			
				//comment
				if(line[0]=="c"){
					//ignore comments 
				}
				//problem def
				else if(line[0]=="p"){
					var words = line.split(/[\s]+/);
					assert.ok(words.length==4);
					assert.ok(words[0]=="p");
					assert.ok(words[1]=="cnf"); 
					N = parseInt(words[2]);
					M = parseInt(words[3]); 
					assert.ok(!isNaN(N) && !isNaN(M));
					assert.ok(M >= 1 && N >= 1); 
				}
				else{
					break;
				}				
			}
			
			//initlaize the data with M x N array
			var data = new Array(M);
			for(var i=0;i<M;i++){
				data[i] = new Array(N);
				for(var j=0;j<N;j++)
					data[i][j] = 0; //default a literal not present 
			}
			
			//read body
			var body = lines.slice(curl).join(' ');
			var clauses = body.trim().split(/[\s\t\n]+0[\s\t\n]+/); //split at 0 with trailing space/newline on sides
			assert.ok(clauses.length == M + 1); //an ending %
			
			//for each clause
			for(var i=0;i<M;i++){
				var clause = clauses[i].trim();
				var literals = clause.split(/[\s]+/);
				assert.ok(literals.length >= 1); //t least one literal 

				for(var j=0;j<literals.length;j++){
					var literal = parseInt(literals[j]);
					assert.ok(!isNaN(literal));
					assert.ok(literal != 0 && literal >= -N && literal <= N); //range 
					
					//-1 to map to the actual index of the variable!!
					data[i][Math.abs(literal)-1] =  (literal > 0) ? 1 : -1; 
				}
				
			}
		
			return $M(data);
		},
		
		/**
		  SAT Data is a matrix representing propositional logic in CNF of dimention  N x K   (# of clauses x # of variables)
		  - each row is a clause representing a disjuntion of literals 
		  - each col represent a single literal 
		  - each cell (i,j) represent a literal xj's form in clause i 
		  		 0 - literal not exist in the clause
		  		 1 - literal in positive form 
		  		 -1 - literal in negative form  	
		**/
		validData : function(data){
				
			assert.ok(data instanceof Matrix); 
			var N = data.elements.length;
			if(N < 1) return false;
			var K = data.elements[0].length;
			for(var r=0; r<N;r++){
				var sum = 0;
				if(data.elements[r].length != K){
					console.log("length for row %d is %d",r,data.elements[r].length );
					return false;
				}
				
				for(var c=0;c<K;c++){
					var val = data.elements[r][c];
					if(!(val==1 || val==-1 || val==0))
					{
						console.log("invalid val="+val);	
						 return false;
					}
					sum += val;
				}
				if(sum==0){ 
					console.log("all clauses not present");
					return false; //cannot be an empty clause
				}
			}
			return true;
		},
		
		
		/**
		 Using Uniform Random k-SAT (fixed clause-length model) 
		  given M clauses, N variables, fixed clause length K (each clause only include K variables)
		
		    k literals are chosen independtly and uniformly at random for the set of 2N possible literals (positive + negative)
		    	- exclude clauses containing duplicate literals 
		    	- exclude clauses containing both a literal and its negation at the same time  (which will always evaluate to true)
		   
		   run it M times to produce M clauses
		   		
		   TODO : clauses shall not duplicate 
		**/
		randomSAT : function(M, N, K){

			var clauses = [];
			
			for(var m=0;m<M;m++){
				var clause = {}; //each key is the variable index (or its negation). Starting with 1 
				
				
				for(var i=0;i<K;i++){
					//randomly pick a literal and include
					
					//each refers to the ith literal, with positive value indicating its negative form
					var literals = [];
					for(var j=1;j<=N;j++){
						if(clause[j] || clause[-j]) continue; //ignore already included clause
						literals.push(j);
						literals.push(-j);
					}
					fisher_yates_permute(literals); //randomize it and simply take the first k literals 
					clause[literals[0]] = 1; //just pick the first one which is randomly picked after permute
				}
				
				var row = new Array(N);
				for(var i=0;i<N;i++) row[i] = 0;
				
				for(var key in clause){
					var literal = parseInt(key);
					row[Math.abs(literal)-1] =  (literal > 0) ? 1 : -1;
				}
				
				clauses.push(row);				
			}
			
			return new SAT($M(clauses));	
		}
	}
});
module.exports = exports = SAT;