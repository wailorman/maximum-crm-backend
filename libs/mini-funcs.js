
module.exports.is = function(variable){
    var isVariable = {};

    var isObjectIDRegExp = new RegExp("^[0-9a-fA-F]{24}$");
    isVariable.ObjectID = isObjectIDRegExp.test(variable);
    isVariable.ObjectId = isVariable.ObjectID;

    isVariable.number = typeof variable == 'number';

    isVariable.Date = variable instanceof Date;

    return isVariable;
};

module.exports.ObjectID = require('mongodb').ObjectID;