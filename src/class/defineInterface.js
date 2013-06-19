var util = require('util');
var assert = require('assert');
var TYPE = require('./Type.js');
var Class = require('./Class.js');

var counter = {};
/**
 An interface definition
 an interface is a group of related methods with empty bodies
 An interface can contain constant declarations in addition to method declarations. All constant values defined in an interface are implicitly public, static, and final.
 
 var myInterface = defineInterface({
 	name : "myInterface",
 	extend : [superinterface1, superinterface2]  
 	methods : {
 		method1 : function(arg1, arg2){},
 		method2 : function(){}
 	},
 	variables : {
 		var1 : xx
 	}
 });
 
 
 JAVA Reference  http://docs.oracle.com/javase/tutorial/java/IandI/interfaceDef.html
 
 @def - definition
 @post
**/
var defineInterface = function(def, post){
	assert(def.name);
	assert(!counter[def.name]); 
	counter[def.name] = 1;
	if(!def.extend) def.extend = [];
	else if(!(def.extend instanceof Array)) def.extend = [def.extend];
	if(!def.methods) def.methods = {};
	if(!def.variables) def.variables = {};
	assert(def.methods instanceof Object);
	assert(def.variables instanceof Object);
	if(!post) post = function(){};
	assert(typeof(post)=="function");

	//the interface class's constructor
	//prevent interface from instanciation
	//if user do this 
	//    var obj = new MyInterface()  will throw the error  
	var constructor = function(){throw new Error("cannot instanciate an interface!");};

	//an interface class object simply inherits from object
	var proto = new Object();
	proto.constructor = constructor;
	constructor.prototype = proto;
	
		
	//Interface Methods are defined on Prototype object
	for(var p in def.methods){
		var method = def.methods[p];
		if(typeof(method)!="function") throw Error("invalid interface method definition: method="+p + " for interface " + def.name);

		//dynamically create the function with specified parameters and replace body with throw
		//this is essentiiall not required, as an interface will never get instantiated therefore the method will never had a chance to get called
		var str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; //max 26 parameters for the function 
		assert(method.length <= str.length, "MAX NUMBER OF METHOD PARAMETERS REACHED");

		var args = new Array(method.length+1);
		for(var i=0;i<method.length;i++) args[i] = str.charAt(i); //mock argument name "A", "B", "C" ...
		args[method.length]= "throw new Error(\"abstract method invocation not allowed in an interface\");";
 		proto[p] = Function.apply(this, args);
 		
 		//all methods defined in interface are implicit abstract method
		proto[p]["__abstract"] = true; 
	}
	
	
	//Interface variables are class-level statics defined on the constructor 
	for(var p in def.variables){
		var variable = def.variables[p];
		if(typeof(variable)=="function") throw Error("invalid interface constant definition: variable="+p + " for interface " + def.name);
		constructor[p] = variable;
	}

	//A constructor has a reserved word "__class" that points to a Class object that describes this interface
	constructor.__class = new Class(TYPE.INTERFACE, constructor, def);
	
	//enable user to find the Class object from the object instance of an interface
	proto.getClass = function(){return constructor.__class;};
	
	return constructor;
};

defineInterface.reset = function(){ counter = {}; }
module.exports = exports = defineInterface;