//var ObjectId = require('mongodb').ObjectID;
var ObjectId = require('mongoose').Types.ObjectId;

module.exports.is = function(variable){
    var isVariable = {};

    var isObjectIdRegExp = new RegExp("^[0-9a-fA-F]{24}$");
    isVariable.stringObjectId = isObjectIdRegExp.test(variable);
    isVariable.ObjectId =   typeof variable !== 'boolean' &&
                            (!variable !== true) &&  // not null
                            variable.hasOwnProperty('toString') &&
                            variable.toString().match(/^[0-9a-fA-F]{24}$/);

    var isVariableStringNumber = new RegExp("^[0-9]");
    //isVariable.number = typeof variable == 'number';
    isVariable.stringNumber = isVariableStringNumber.test(variable);
    isVariable.Date = variable instanceof Date;

    isVariable.null =   typeof variable === 'object' &&
                        typeof variable !== 'boolean' &&
                        (!variable === true);

    // some magic checking for null variable
    isVariable.object = typeof variable === 'object' &&
                        typeof variable !== 'boolean' &&
                        (!variable !== true);

    isVariable.undefined = typeof variable == 'undefined';


    isVariable.string = typeof variable != 'undefined' && typeof variable != 'null' &&
                        typeof variable === 'string';
    isVariable.number = typeof variable == 'number';


    return isVariable;
};

module.exports.ObjectId = ObjectId;