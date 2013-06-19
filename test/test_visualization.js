process.chdir("../src/");
console.log("switching to directory " + process.cwd());

var util = require('util');
var assert = require('assert');
var fs = require('fs');

var d3 = require('d3');
var express = require('express');
var http = require('http');
var socketio = require('socket.io');

var TSP = require('example/tsp/Problem.js');
var TSPSolution =  require('example/tsp/Solution.js');

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

exports.testRuntimePerformance = function(test){

	//fire up the server
	var app = express();	
	var server = http.createServer(app);
	var io = socketio.listen(server);
	server.listen(8888);
	console.log("server listening on 8888");

	//express static file handler 
	app.use(express.static("../workspace/www/"));

	//socket.io handler 
	io.sockets.on('connection', function (socket) {
	  socket.on('disconnect', function(){
		 console.log("client disconnected"); 
	  });
	  
	  //client request a data update
	  socket.on('pull', function (opt, fn) {
	    fn(data_available ? stat : []);
	  });
	  
	  
	  //on client first connect, serve the new data
	  if(data_available)
	  	socket.emit('data', stat);
	});	
	
	
	//stat data 
	//each array elem correspond to a local search step:  an array of solution quality at that step from multiple independent runs 
	// stat[m][n] gives the solution quality at search step m for the nth run 
	var MAX_LOCAL_SEARCH_STEPS = 50;  //cap on local search steps for each run
	var NUM_RUN = 10; //# of independent run of iia with random restart 
	var stat = new Array(MAX_LOCAL_SEARCH_STEPS+1);
	for(var i=0;i<=MAX_LOCAL_SEARCH_STEPS;i++)
		stat[i] = new Array(NUM_RUN);
	var data_available = false;


	var ALGS = TS;
	
	//load data from file 
	fs.readFile('../test/tsplib/bayg29.xml', function(err, raw) {		
		test.ok(raw!=undefined,"error reading file");
		
		//parse data
	 	var data = TSP.parseData(raw);
	 	test.ok(TSP.validData(data), "data invalid");

	 	//instatiate problem
	 	var instance = new TSP(data);

		for(var n=0;n<NUM_RUN;n++){
			console.log("%d run ", n);
			
			
			var algs = new ALGS(instance, {'terminate_ls_steps' : MAX_LOCAL_SEARCH_STEPS});
			algs.run(function(step){
				stat[step][n] = algs.best_sol.fitness;
				
				//console.log("step %s [%s]", step, algs.best_sol);
				if(algs.lo_trap) 
					console.log("run %d trapped at step %d with fitness %.0f", n, step, algs.best_sol.fitness);
			});		
		}

		data_available = true;
		io.sockets.emit('data', stat);			 	
	 	
	});


	test.done();
}

/*
exports.testVisualize = function(test){


	var fake_data = [5, 10, 15, 20, 25];

	//an express http server 
	var app = express();	
	var server = http.createServer(app);
	var io = socketio.listen(server);
	server.listen(8888);

	//express static file handler 
	app.use(express.static(__dirname + "/www/"));

	//socket.io handler 
	io.sockets.on('connection', function (socket) {
	  
	  socket.on('disconnect', function(){
		 console.log("client disconnected"); 
	  });
	  
	  
	  //client request a data update
	  socket.on('pull', function (opt, fn) {
	    fn(fake_data);
	  });
	  
	  
	  //on client first connect, serve the new data
	  socket.emit('data', fake_data);
	});

	test.done();

}
*/

