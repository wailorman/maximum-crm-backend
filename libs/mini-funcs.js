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


    /**
     * ObjectId string. 24-byte hex. Example: "54669de0dee0f05018e5538a"
     *
     * @typedef {string} stringObjectId
     */

    var isToken = new RegExp("^[0-9a-zA-Z]{24}$");

    isVariable.stringToken = isToken.test(variable);


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


    isVariable.string =         typeof variable !== 'undefined' &&
    typeof variable === 'string';

    isVariable.number =         typeof variable == 'number';

    isVariable.boolean =        typeof variable == 'boolean';

    return {
        stringObjectId:     isVariable.stringObjectId,
        stringNumber:       isVariable.stringNumber,
        Date:               isVariable.Date,
        null:               isVariable.null,
        object:             isVariable.object,
        undefined:          isVariable.undefined,
        string:             isVariable.string,
        number:             isVariable.number,
        boolean:            isVariable.boolean,

        not: {
            stringObjectId:     ! isVariable.stringObjectId,
            stringNumber:       ! isVariable.stringNumber,
            Date:               ! isVariable.Date,
            null:               ! isVariable.null,
            object:             ! isVariable.object,
            undefined:          ! isVariable.undefined,
            string:             ! isVariable.string,
            number:             ! isVariable.number,
            boolean:            ! isVariable.boolean
        }
    };
};

module.exports.isObjectId = function (variable) {
    var isVariableStringObjectId = new RegExp("^[0-9a-fA-F]{24}$");
    return typeof variable === 'string' && isVariableStringObjectId.test(variable);
};

module.exports.isToken = function (variable) {
    var isToken = new RegExp("^[0-9a-zA-Z]{24}$");
    return typeof variable === 'string' && isToken.test(variable);
};

module.exports.ObjectId = ObjectId;