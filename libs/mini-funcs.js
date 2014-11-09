//var ObjectId = require('mongodb').ObjectID;
var ObjectId = require('mongoose').Types.ObjectId;

module.exports.is = function(variable){
    var isVariable = {};

    var isVariableStringObjectId = new RegExp("^[0-9a-fA-F]{24}$");

    isVariable.stringObjectId = typeof variable === 'string' &&
                                isVariableStringObjectId.test(variable);

    // not working!
    isVariable.ObjectId =       typeof variable !== 'boolean' &&
                                (!variable !== true) &&  // not null
                                variable.hasOwnProperty('toString') &&
                                isVariableStringObjectId.test(variable.toString());


    var isVariableStringNumber = new RegExp('^\\d+$');


    isVariable.stringNumber =   typeof variable === 'string' &&
                                isVariableStringNumber.test(variable);

    isVariable.Date =           variable instanceof Date;

    isVariable.null =           typeof variable === 'object' &&
                                typeof variable !== 'boolean' &&
                                (!variable === true);

    // some magic checking for null variable
    isVariable.object =         typeof variable === 'object' &&
                                typeof variable !== 'boolean' &&
                                (!variable !== true);

    isVariable.undefined =      typeof variable == 'undefined';


    isVariable.string =         typeof variable != 'undefined' &&
                                typeof variable === 'string';

    isVariable.number =         typeof variable == 'number';

    isVariable.boolean =        typeof variable == 'boolean';

    return isVariable;
};

module.exports.ObjectId = ObjectId;