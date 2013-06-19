var util = require('util');
var assert = require('assert');
var clc = require('cli-color');
var TYPE = require('./Type.js');
var Class = require('./Class.js');
var uuid = require('node-uuid').v4;

//track number of definition counts for each class name, should be 1 for each class type
var counter = {};
/**

	var MyClass = defineClass({
		name : "MyClass",
		extend : MyBaseClass,
		implement : [BaseInterface, BaseInterface2, ...], 
		statics : {},
		variables : {}, 
		methods : {}
	});
 
 @def - definition 
 @post - post definition execution code  
 		- function(op){}
 		allow users to define overloading functions by invoking op.method("name", func);
 		
**/
var defineClass = function(def, post){
	if(!def.name) def.name = uuid(); //anonymous class name
	assert(def.name && typeof(def.name=="string"));
	//console.log(clc.blue("defining " + def.name));
	assert(!counter[def.name], "class " + def.name + " has multiple definition calls!!"); 
	counter[def.name] = 1;
	if(!def.extend) def.extend = Object;
	assert(!(def.extend instanceof Array));	
	if(!def.implement) def.implement = [];
	if(!(def.implement instanceof Array)) def.implement = [def.implement];
	if(!def.methods) def.methods = {};
	if(!def.variables) def.variables = {};
	if(!def.statics) def.statics = {};
	assert(def.methods instanceof Object);
	assert(def.variables instanceof Object);
	assert(def.statics instanceof Object);
	if(!post) post = function(){}; 
	assert(typeof(post)=="function"); 
/*
	if(!def.abstract) def.abstract = {};
	assert(typeof(def.abstract)=="object");
*/
	
	//default constructor will chain up calls to superclass' constructor
	//passing all parameters
	if(!def.construct) def.construct = function(){
		def.extend.apply(this,arguments);
	};
	assert(typeof(def.construct)=="function");
	

	var constructor = function(){
		//Variables are defined on Each Instance Objects, therefore only can
		//be done inside the constructor where "this" refers to the newly created object	
		//We first initialize defined variables on the object instnace, and then invoke user-defined constructor
		for(var p in def.variables){
			var variable = def.variables[p];
			if(typeof(variable)=="function") throw Error("invalid interface constant definition: variable="+p + " for interface " + def.name);
			this[p] = variable;
		}
		
		def.construct.apply(this,arguments); //chain up to user-defined constructor function
	};

	

	// proototype object is an insntace of the extending class type
	try{
		var proto = new def.extend();
	}catch(e){
		console.log(clc.red(e.toString()));
		throw new Error("something wrong with this");
	}
	//console.log(clc.green("success " + def.name));


	proto.constructor = constructor; //so that we can find the constructor once we have reference to the proto obj
	constructor.prototype = proto; 
	
/*
	//Class abstract methods are declared but never defined on the object 
	for(var p in def.abstract){
		var method = def.methods[p];
		if(typeof(method)!="function") throw Error("invalid interface method definition: method="+p + " for interface " + def.name);
	}
*/
		
	//Class Methods are defined on Prototype object
	for(var p in def.methods){
		var method = def.methods[p];
		if(typeof(method)!="function") throw Error("invalid interface method definition: method="+p + " for interface " + def.name);
		
		
		//abstract function
		if(p.indexOf("$abstract")!=-1){
			p = p.substring(0, p.indexOf("$abstract"));
			//dynamically create the function with specified parameters and replace body with throw
			//this is essentiiall not required, as an interface will never get instantiated therefore the method will never had a chance to get called
			var str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; //max 26 parameters for the function 
			assert(method.length <= str.length, "MAX NUMBER OF METHOD PARAMETERS REACHED");
	
			var args = new Array(method.length+1);
			for(var i=0;i<method.length;i++) args[i] = str.charAt(i); //mock argument name "A", "B"s, "C" ...
			args[method.length]= "throw new Error(\"abstract method invocation not allowed in a class\");";
	 		proto[p] = Function.apply(this, args);
	 		
	 		//all methods defined in interface are implicit abstract method
			proto[p]["__abstract"] = true; 
		}
		//overloading function
		else if(p.indexOf("$overload")!=-1){
			p = p.substring(0, p.indexOf("$overload"));
			addOverloadMethod(proto, p, method);
			proto[p]["__overload"] = true; //overloading function flag
		}
		else if(p.indexOf("$override")!=-1){
			p = p.substring(0, p.indexOf("$override"));
			addOverrideMethod(proto, p, method);
			proto[p]["__override"] = true; //overriding function flag
		}
		//normal method
		else{
			proto[p] = method;
		}	
	}
	
	//Class Statics are defined on the Constructor 
	for(var p in def.statics){
		var method = def.statics[p];
		
		if(p.indexOf("$overload")!=-1){   //add support for method overload on static method as well !!
			p = p.substring(0, p.indexOf("$overload"));
			addOverloadMethod(constructor, p, method);
			constructor[p]["__overload"] = true; //overloading function flag
		}
		else{
			constructor[p] = method;
		}
	}

	//A constructor has a reserved word "__class" that points to a Class object that describes this interface
	constructor.__class = new Class(TYPE.CLASS, constructor, def);
	
	//enable user to find the Class object from the object instance of an interface
	proto.getClass = function(){return constructor.__class;};
	
	//a hash code uniquely identify a barebone object
	//if two var references the same obj, the returned value should be the smae
	//if the two returned value not the same, the two refercing obj not the same
	proto.hashCode = function(){
		if(!this.__hashcode) this.__hashcode = uuid();
		return this.__hashcode;
	};
	
	return constructor;	
};

addOverrideMethod = function(obj, name, fn){
	addOverloadMethod(obj,name,fn);
};

//REFERENCE - Secrets of the JavaScript Ninja Chapter 4 Listing 4.15
// note that this works for override as well. the overloaded/overriding function is alwasy 
// defined on the most concrete object instance, and does not alters any of the prototype objects up the chain 
addOverloadMethod = function(obj, name, fn){
	var old = obj[name];
	obj[name] = function(){
		if(fn.length == arguments.length)
			return fn.apply(this, arguments);
		else if(typeof(old)=="function")
			return old.apply(this, arguments);
		else throw new Error("failed to overload function");	
	};
}

defineClass.reset = function(){ counter = {}; }

module.exports = exports = defineClass;