var util = require('util');
var assert = require('assert');
var TYPE = require('./Type.js');
var Method = require('./Method.js');

/**
 Constructor for Class class instance 
 
 @type - OO type : INTERFACE / CLASS ...
 @constructor - the Class constructor function
 @def - the type definition information 
**/
var Class = function(type, constructor, def){

	//define some instance variables and methods on the class object 	
	assert(def, "invalid definition passed to Class constructor");
	assert(typeof(constructor)=="function", "invalid constructor passed to Class constructor");

	this.def = def; //the original definition data
	this.constructor = constructor;
	this.type = type; 


	//validation check 
	if(type == TYPE.INTERFACE){
		//all extends must be interface as well !
		for(var i in def.extend){
			var itf = def.extend[i];
			if( typeof(itf)!="function" || (!itf.__class) || !itf.__class.isInterface()) throw new Error("interface cannot extend an invalid interface!");
		}
	}
	else if(type == TYPE.CLASS){
	
		//all implements must be interfaces 
		for(var i in def.implement){
			var itf = def.implement[i];
			if( typeof(itf)!="function" || (!itf.__class) || !itf.__class.isInterface()) throw new Error("class cannot implement an invalid interface!");
			
			//detection of duplicaiton of methods having the same name and same number of parameters 
			//check if a class has implemented all interfaces it intends to declare
			
		}
		
		//extend must be a class, but not interface 
		if( typeof(def.extend)!="function") throw new Error("class cannot extend an invalid class!");
		if(def.extend.__class && !def.extend.__class.isSynthetic()) throw new Error("class cannot extend an invalid user-defined class");
	}
	
}

Class.prototype = new Object();//directly inherits from js object


//Static Methods on Class Constructor. Invoked by  Class.XXXX

/**
 Static Method to Check whether a given object is an instance of the given class or an instnace of a subclass of the given class
**/
Class.isInstanceOfClass = function(obj, cls){
	if(!obj || !cls) return false;
	if(typeof(obj.getClass)=="function") return obj.getClass().isKindOfClass(cls);
	return false;
}

/*** Inheritable Methods defined on Class Prototype **/

Class.prototype.getConstructor = function(){
	return this.constructor;
}

Class.prototype.getSimpleName = function(){
	return this.def.name;
}

/**
 http://docs.oracle.com/javase/7/docs/api/java/lang/Class.html#isAssignableFrom(java.lang.Class)
 
 Determines if the class or interface represented by this Class object is either the same as, or is a superclass or superinterface of, the class or interface represented by the  specified Class parameter. It returns true if so; otherwise it returns false. 
**/
Class.prototype.isAssignableFrom = function(cls){
	if(!cls || !(cls.type)) return false; //undefined or non-class type
	if(cls === this) return true;
	

	if(this.type==TYPE.INTERFACE){
		
		if(cls.type==TYPE.INTERFACE){
			for(var i in cls.def.extend){
				var itf = cls.def.extend[i];
				if(this.isAssignableFrom(itf.__class)) return true;
			}			
		}
		else if(cls.type==TYPE.CLASS){
			if(cls.def.extend.__class && this.isAssignableFrom(cls.def.extend.__class)) return true;
			for(var i in cls.def.implement){
				var itf = cls.def.implement[i];
				if(this.isAssignableFrom(itf.__class)) return true;
			}				
		}	
	}
	else if(this.type==TYPE.CLASS){

		if(cls.type==TYPE.INTERFACE) return false; //a class cannot be a superclass of an interface
		else if(cls.type==TYPE.CLASS){
			if(cls.def.extend.__class && this.isAssignableFrom(cls.def.extend.__class)) return true;
		}
	}
	
	return false;
};


Class.prototype.isKindOfClass = function(cls){
	if(typeof(cls)=="string") return this.isKindOfClassForName(cls);
	else return this.isKindOfClassForClass(cls);
};

Class.prototype.isKindOfClassForName = function(classname){
	if(this.def.name == classname) return true;
	
	if(this.type==TYPE.INTERFACE){ //check all super interfaces
		for(var i in this.def.extend){
			var itf = this.def.extend[i];
			if(itf.__class.isKindOfClassForName(classname)) return true;
		}		
	}
	else if(this.type==TYPE.CLASS){
		for(var i in this.def.implement){   //check if any super interface is kind of that class
			var itf = this.def.implement[i];
			if(itf.__class.isKindOfClassForName(classname)) return true; 
		}
		
		if(this.def.extend.__class)
			if(this.def.extend.__class.isKindOfClassForName(classname)) return true;
	}
	
	return false;
};

/**
 check if this is a subclass/subinterface of cls
**/
Class.prototype.isKindOfClassForClass = function(cls){
	if(!cls) return false;
	if(cls === this) return true;


	if(this.type==TYPE.INTERFACE){
		if(cls.type!=TYPE.INTERFACE) return false; //an interface could only be a subinterface of another interface
		for(var i in this.def.extend){
			var itf = this.def.extend[i];
			if(itf.__class.isKindOfClass(cls)) return true; //if a superinterface is that class, true
		} 
	}
	else if(this.type==TYPE.CLASS){
		
		//check if any super interface is kind of that class
		for(var i in this.def.implement){
			var itf = this.def.implement[i];
			if(itf.__class.isKindOfClass(cls)) return true; 
		}	
		
		//check if the superclass(es) of this class is kind of that class
		if(! this.def.extend.__class){  //this class inherits from a system-defined class,
			if(! cls.__class){  //only possible when cls is also a system-defined class
				if(this.def.extend === cls) return true; // only when the two constructor name are the same thing
			}
		}
		else{
			if(this.def.extend.__class.isKindOfClass(cls)) return true;
		}
	}
	
	return false;
}

/**
	REFERENCE http://docs.oracle.com/javase/7/docs/api/java/lang/Class.html#getMethods()
	
Returns an array containing Method objects reflecting all the public member methods of the class or interface represented by this Class object, including those declared by the class or interface and those inherited from superclasses and superinterfaces. Array classes return all the (public) member methods inherited from the Object class. The elements in the array returned are not sorted and are not in any particular order. This method returns an array of length 0 if this Class object represents a class or interface that has no public member methods, or if this Class object represents a primitive type or void.

**/
Class.prototype.getMethods = function(){
	var methods = [];
	
	if(this.type == TYPE.INTERFACE){
		//collect methods from all extended super interfaces
		for(var i in this.def.extend){ 
			var itf = this.def.extend[i];
			methods = methods.concat( itf.__class.getMethods() );
		}
		
		//collect self
		for(var p in this.def.methods)
			methods.push(new Method(this,p,this.def.methods[p]));
	}
	else if(this.type == TYPE.CLASS){
		
		//collect methods from extended classes that is a user defined class
		if(this.def.extend && this.def.extend.__class)
			methods = methods.concat(this.def.extend.__class.getMethods());
		
		//should also include implementation methods on all interfaces 
		for(var i in this.def.implement){
			var itf = this.def.implement[i];
			methods = methods.concat( itf.__class.getMethods() );
		}
		
		//collect methods defined on this class 
		for(var p in this.def.methods)
			methods.push(new Method(this,p,this.def.methods[p]));
	}
	
	return methods;
};

/**

Determines the interfaces implemented by the class or interface represented by this object.
If this object represents a class, the return value is an array containing objects representing all interfaces implemented by the class. The order of the interface objects in the array corresponds to the order of the interface names in the implements clause of the declaration of the class represented by this object. For example, given the declaration:

class Shimmer implements FloorWax, DessertTopping { ... }
suppose the value of s is an instance of Shimmer; the value of the expression:
s.getClass().getInterfaces()[0]
is the Class object that represents interface FloorWax; and the value of:
s.getClass().getInterfaces()[1]
is the Class object that represents interface DessertTopping.
If this object represents an interface, the array contains objects representing all interfaces extended by the interface. The order of the interface objects in the array corresponds to the order of the interface names in the extends clause of the declaration of the interface represented by this object.

If this object represents a class or interface that implements no interfaces, the method returns an array of length 0.

If this object represents a primitive type or void, the method returns an array of length 0.

@return an array of Class objects representing the interfaces extended/implemented by this class!
**/
Class.prototype.getInterfaces = function(){
	var interfaces = [];
	if(this.type == TYPE.INTERFACE){
		for(var i in this.def.extend){
			var itf = this.def.extend[i];
			interfaces.push(itf.__class);
		}
	}

	return interfaces;
};

Class.prototype.isInterface = function(){
	return this.type == TYPE.INTERFACE;
}

Class.prototype.isSynthetic = function(){
	return this.type = TYPE.CLASS; 
}


Class.prototype.toString = function(){
	var str = "{[" + this.type + "] - " + this.def.name + "}";
	
	str += "{EXTENDS: "; 
	
	if(this.def.extend instanceof Array){  //an array of super interfaces 
		for(var c in this.def.extend)
		{
			var cls = this.def.extend[c].__class;
			str += cls.def.name + ",";
		}
	}
	else{   //a single super class
		str +=  this.def.extend.__class ? this.def.extend.__class.def.name : "[Built-In]";
	}
	str += "}"
	
	return str;
};



















module.exports = exports = Class;