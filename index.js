//base class for optimization problem and solution
module.exports.OProblem = require('./src/core/OProblem.js');
module.exports.OSolution = require('./src/core/OSolution.js');

//base class for stochasic local search algorithm
module.exports.SLS = require('./src/core/SLS.js');

//3 major SLS algorithm
module.exports.IIA = require('./src/core/IIA.js');
module.exports.SA = require('./src/core/SA.js');
module.exports.TS = require('./src/core/TS.js');

//experiment support
module.exports.Experiment = require('./src/core/Experiment.js').Experiment;
module.exports.Analyzer = require('./src/core/Experiment.js').Analyzer;


module.exports.Example = {};

//example SAT Problem
module.exports.Example.SAT = require('./src/example/sat/Problem.js');
module.exports.Example.GSAT = require('./src/example/sat/Algorithms.js').GSAT_IIA;
module.exports.Example.SAT_SA = require('./src/example/sat/Algorithms.js').SAT_SA;
module.exports.Example.SAT_TS = require('./src/example/sat/Algorithms.js').SAT_TS;

//example TSP Problem
module.exports.Example.TSP = require('./src/example/tsp/Problem.js');
module.exports.Example.TSP_Solution = require('./src/example/tsp/Solution.js');
module.exports.Example.IIA = require('./src/example/tsp/Algorithms.js').TSP_IIA;
module.exports.Example.SA = require('./src/example/tsp/Algorithms.js').TSP_SA;
module.exports.Example.TS = require('./src/example/tsp/Algorithms.js').TSP_TS;


//class system
module.exports.defineClass = require('./src/class/defineClass.js');