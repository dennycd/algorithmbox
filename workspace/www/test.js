

//load a csv 
d3.csv("test.csv", function(data){
	console.log(data);
});

var dataset = [5, 10, 15, 20, 25];
/*

d3.select("body")
.selectAll("p")
.data(dataset)
.enter()
.append("p")
.text(function(data) {
	return data;
})
.style("color", function(d) {
	if (d > 15) {   //Threshold of 15
	    return "red";
	} else {
	    return "black";
	}
});
*/



d3.select("body").selectAll("div")
.data(dataset)
.enter()
.append("div")
.attr("class", "bar")
.style("height", function(d) {
	return d + "px";
});
        
        
//reference to a svg object we just created 
var w = 500, h = 500;

var svg = d3.select("body").append("svg");
svg.attr("height", h).attr("width", w);


//a reference to all circles created 
var circles = svg.selectAll("circle").data(dataset).enter().append("circle");

circles.attr("cx", function(data, i){
	return i * 50 + 25;
})
.attr("cy", h/2)
.attr("r", function(data,i){
	return data;
});




//draw data using svg 
var svg2 = d3.select("body").append("svg").attr("height",h).attr("width",w);
var rects = svg2.selectAll("rect").data(dataset).enter().append("rect");
rects.attr("x", function(data,i){
	return i * 21;
})
.attr("width", 20)
.attr("y", function(data,i){
	return h - data;
})
.attr("height",function(data,i){
	return data;
})
.attr("fill",function(data,i){
	return "rgb(0,0," + (data * 10) + ")";
});


var texts = svg2.selectAll("text").data(dataset).enter().append("text");
texts.text(function(d,i){
	return d;	
})
.attr("x", function(d,i){
	return i * 21 + 6;
})
.attr("y", function(d,i){
	return h - d + 10;
})
.attr("fill", "white").attr("font-size", "11px");



var mydata = [
[5,50],
[20,75],
[15,80],
[23,102],
[0,0]
];

var svg3 = d3.select("body").append("svg").attr("height",h).attr("width",w);
var circles = svg3.selectAll("circle").data(mydata).enter().append("circle");
circles.attr("cx", function(d){
	return d[0] + 15;
})
.attr("cy",function(d){
	return d[1];
})
.attr("r", 10);


d3.select("body").append("br");

//Scale 
var scale = d3.scale.linear();
scale.domain([0,1]); //input value domain range
scale.range([10,100]); //output range in px
console.log(scale(0.8)); //gives a scaled value in between 10 and 100


//analyze max / min of a dataset 
d3.max(mydata, function(d){
	return d[0]; //use first dimenstion of each elem to computer the max value of the entire data set 
});



var padding = 30;
//set up a dynamic scale based on data set 
var xscale = d3.scale.linear();
xscale.domain([0, d3.max(mydata, function(d){return d[0];})]).range([padding,w-padding]);


var yscale = d3.scale.linear();
yscale.domain([0, d3.max(mydata, function(d){return d[1];})]).range([h-padding, padding]);

var svg4 = d3.select("body").append("svg").attr("height",h).attr("width",w);
var circles = svg4.selectAll("circle").data(mydata).enter().append("circle");
circles.attr("cx", function(d){
	return xscale(d[0]);
})
.attr("cy",function(d){
	return yscale(d[1]);
})
.attr("r", 10);



//draw axis 
var xaxis = d3.svg.axis()
xaxis.scale(xscale).orient("bottom");
svg4.append("g")
.attr("class","axis")
.attr("transform", "translate(0," + (h-padding) + ")")
.call(xaxis);

var yaxis = d3.svg.axis();
yaxis.scale(yscale).orient("left");
svg4.append("g")
.attr("class","axis")
.attr("transform", "translate(" + padding + ", 0)")
.call(yaxis);


//ordinal scale uses discrete range, whose output is pre-determine by the range
var w = 600;
var h = 250;
var xscale = d3.scale.ordinal().domain(d3.range(dataset.length)).rangeRoundBands([0,w], 0.2);  //use 20% of each band's width as the spacing
//a range band equality divides to form bands corresponding to the ordinal input domain
        
        
var svg5 = d3.select("body").append("svg").attr("height",h).attr("width",w);
svg5.selectAll("rect").data(dataset).enter().append("rect")
.attr("x", function(d,i){
	return xscale(i);  //map element index to a corresponding position along X-axis using ordinal scale!!!
})
.attr("width", xscale.rangeBand())
.attr("y", function(d,i){
	return h - d;
})
.attr("height",function(d,i){
	return d;
})
.attr("fill",function(data,i){
	return "rgb(0,0," + (data * 10) + ")";
});


//append a paragraph
d3.select("body").append("p").text("click me").on("click", function(){
	console.log("click me");
	 dataset = [15, 30, 8, 35, 17];
	 
	 //Step 1 - rebind data
	 var rects = svg5.selectAll("rect").data(dataset);   //rebind the new data
	 
	 //Step 2 - update attr
	 rects.transition().duration(500).ease("linear")
	 .delay(function(d,i){
		 return i * 100;
	 })
	 .attr("y", function(d,i){
		 return h - d;
	})
	.attr("height",function(d,i){
		return d;
	});
	
	
});



