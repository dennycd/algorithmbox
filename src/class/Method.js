var util = require('util');
var assert = require('assert');

/**
 Constructing a Method object
 
 @cls - the Class object declaring this method
 @name - the declared name string of the method
 @method - the function object 
**/
var Method = function(cls, name, method){
	
	this.cls = cls;
	this.name = name;
	this.method = method;
	
};



Method.prototype.getName = function(){
	return this.name;
}


/**
	Returns the Class object representing the class or interface that declares the method represented by this Method object.
**/
Method.prototype.getDeclaringClass = function(){
	return this.cls;
}


module.exports = exports = Method;