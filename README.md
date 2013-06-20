## AlgorithmBox
AlgorithmBox is an algorithm development toolkit for solving discrete optimization problems. It provides a framework for implementing [metaheuristic](https://en.wikipedia.org/wiki/Metaheuristic) algorithms in javascript and an empirical experiment library for testing the algorithm against a number of standard optimization problems. It can be installed as a Node.js module via 
```javascript
npm install algorithmbox
```

## How to Use
With algorithmbox, you can write a few lines of javascript code to implemente a local search algorithm and run it against problems such as [TSP](https://en.wikipedia.org/wiki/Travelling_salesman_problem) and [SAT](https://en.wikipedia.org/wiki/Boolean_satisfiability_problem). AlgorithmBox defined a number of basic stochastic local search algorithms including 

* Simulated Annealing <https://en.wikipedia.org/wiki/Simulated_annealing>
* Tabu Search  <https://en.wikipedia.org/wiki/Tabu_search>
* Hill Climbing / Iterative Improvement <https://en.wikibooks.org/wiki/Artificial_Intelligence/Search/Iterative_Improvement/Hill_Climbing>

It also provides spec for the following optimization problems 
* Travelling Sales Problem (TSP)
* Satisfiability Problem (SAT)



To implement a hill climbing algorithm for solving TSP, do the following 
```javascript 
//base algorithm definition of hill climbing
var IIA = require('algorithmbox').IIA;

//extend the framework-provided IIA definition
var TSP_IIA = defineClass({
	name : "TSP_IIA",
	extend : IIA, 
	methods : {
		
		//given a candidate solution, return a set of neighborhood
		//solutions that can be reached by 1-point mutation
		'neighbors' : function neighbors(candidate) {
		
		}
	}
});
```

To load a TSP problem instance from a file such as [tsplib](http://comopt.ifi.uni-heidelberg.de/software/TSPLIB95/), do 
```javascript 
var TSP = require('algorithmbox').TSP;

//load tsp instance from file
var raw = fs.readFileSync('tsplib/bayg29.xml');

//parse data and create a TSP instance 
var instance = new TSP(TSP.parseData(raw));
```

Now run the algorithm against the problem instance 

```javascript

//create a IIA algorithm with predefined terminate condition
var algs = new TSP_IIA(instance, {
	'terminate_ls_steps' : 1000  //stop if maximum search steps reached
});

//run the algorithm and monitor progress
algs.run(function(step){
	console.log("step %d. best found solution: [%s]", step, algs.best_sol);
	if(algs.lo_trap)
		console.log("trapped");  //algorithm trapped in local optima
});		
```
 

## Experiment and Analysis 
AlgorithmBox provides a simple framework for experimenting with different problem instances and algorithm parameter configurations . To define an experiment 

```javascript 
var Experiment = require('algorithmbox').Experiment;

var config = {
	//test against TSP problem class
	"tsp": { 
		//run each algorithm against each TSP instance loaded from a file
		"instances" : ["bayg29.xml", "br17.xml"],   
		
		"algorithms": {
			//setting for a user-defined Simulated Annealing algorithm 
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
			]
			//settings for a user-defined hill climbing algorithm
			"tsp_iia": []
		},
		
		//total number of independent runs (with random restart)
		"runs": 100,

		//terminate condition for each run
		"max_ls_steps" : 5000
	}
};
	
``` 

To run the experiment and output the raw data result to a folder: 
```javascript 
var session = new Experiment(config, "default.box");
session.run();
```

To analyze the experimental result, use the **Analyzer** to load the experiment raw data  
```javascript 
var Analyzer = require('algorithm').Analyzer;

//load runtime quality distribution result for a specific algorithm runed against a specific problem instance
var rqds = analyzer.get_runtime_quality("sat", "uf20-01.cnf", "gsat_iia", {"terminate_ls_steps" : 30});
var rqds2 = analyzer.get_runtime_quality("sat", "uf20-01.cnf", "gsat_iia", {"terminate_ls_steps" : 10});
var rsd = analyzer.get_runtime_solvability('sat', "uf20-01.cnf", "gsat_iia", {}, 85);
rsd = analyzer.get_runtime_solvability('tsp', "bayg29.xml", "tsp_iia", {}, 1800);
	
```

AlgorithmBox provides the following experimental analysis matrix 

* **Runtime Quality Distribution** showing how solution quality changes over local search steps 
* **Runtime Solvability Distribution** showing the probability of reaching a solution quality over local search steps
* **Problem Solution Quality** shows the average solution of the algorithm across mutlitple problem instances over a number of indepedent runs 

For further details, please look into the test case examples. 

#Visualization and Ploting 
A sample visualization is provided (test/test_visualization.js) that demonstrate how to use [Socket.IO](http://socket.io/) and [D3](http://d3js.org/) to visualize the runtime quality distribution of a typical experiment. In the test folder, do 
```javascript 
nodeunit test_visualization.js
```
and you would obtain the runtime quality distribution

![RuntimeQualityDistribution](https://github.com/dennycd/algorithmbox/blob/master/doc/visualiation.png "RuntimeQualityDistribution")

## Roadmap


## Author 
Denny C. Dai (<dennycd@me.com> <http://dennycd.me>)


## License 
[MIT License](http://opensource.org/licenses/MIT) 