
var app = {};

//start up function 
$(function(){

var socket = io.connect();

socket.on('connect', function(){
	console.log("connected to srv");
});

socket.on('disconnect', function(){
	console.log("disconnected from srv");
});


//data upates
socket.on('data', function (data) {
	console.log("data update: ");
	console.log(data);
	app.initDraw(data);
});

});



/**
 	//stat data 
	//each array elem correspond to a local search step:  an array of solution quality at that step from multiple independent runs 
	// stat[m][n] gives the solution quality at search step m for the nth run 
	
**/
app.initDraw = function(data){

	//ordinal scale uses discrete range, whose output is pre-determine by the range
	var w = 1024;
	var h = 640;

	var offset_x = 50, offset_y = 50;
		
	//ordinal using the local search step index
	var xscale = d3.scale.ordinal().domain(d3.range(data.length)).rangeRoundBands([0,w - offset_x], 0.2);  //use 20% of each band's width as the spacing	
	
	//y is the average soution quality 
	var yscale = d3.scale.linear()
	.domain([0,d3.max(data, function(d){
		return average(d);
	})])
	.range([0,h]); //scale from [0, max] to 0 ~ h
	        
	

	var svg = d3.select("body").append("svg").attr("height",h).attr("width",w);
	svg.selectAll("rect").data(data).enter().append("rect")
	.attr("x", function(d,i){
		return xscale(i) + offset_x;  //map element index to a corresponding position along X-axis using ordinal scale!!!
	})
	.attr("y", function(d,i){
		return h - yscale(average(d)) - offset_y;
	})
	.attr("width", xscale.rangeBand())
	.attr("height",function(d,i){
		return yscale(average(d));
	})
	.attr("fill",function(d,i){
		return "rgb(0,0," + (average(d) * 10) + ")";
	});


	//draw axis 
	var padding = 50;
	var xaxis = d3.svg.axis()
	xaxis.scale(xscale).orient("bottom");
	svg.append("g")
	.attr("class","axis")
	.attr("transform", "translate(" + offset_x + "," + (h-padding) + ")")
	.call(xaxis);
	
	{
		var _yscale = d3.scale.linear().domain([0,d3.max(data, function(d){ return average(d); })]).range([h,0]);
	
		var yaxis = d3.svg.axis();
		yaxis.scale(_yscale).orient("left");
		svg.append("g")
		.attr("class","axis")
		.attr("transform", "translate(" + padding + ", "  + (-offset_y) +  ")")
		.call(yaxis);
	}
}


function average(d){
	//sum up all indepent run's quality and give the average
	var sum = 0;
	for(var i=0;i<d.length;i++)
		sum += d[i];
	return sum/d.length;
}