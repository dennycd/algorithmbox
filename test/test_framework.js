//base algorithm definition of hill climbing
var IIA = require('algorithmbox').IIA;
var defineClass = require('simple-cls').defineClass;

//extend the framework-provided IIA definition
var MyIIA = defineClass({
	name : "MyIIA",
	extend : IIA, 
	methods : {
		
		//given a candidate solution, return a set of neighborhood
		//solutions that can be reached by 1-point mutation
		'neighbors' : function neighbors(candidate) {
		
		}
	}
});
	