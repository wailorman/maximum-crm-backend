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
     * Error object
     *
     * @typedef {object} Error
     */

    // permissions doc

    /**
     * Perms callback
     *
     * @callback PermsCallback
     * @param {Error}           err
     * @param {Perms}           perms       Perms object
     */

    /**
     * The object of permissions
     *
     * Examples:
     *  {
     *      hall: {
     *          create: true
     *      }
     *  }
     *
     * In example above we can see:
     * User allowed to _create_ Hall, but not allowed to _remove_ them
     *
     * @typedef {object} Perms
     */


    /**
     * ObjectId string. 24-byte hex. Example: "54669de0dee0f05018e5538a"
     *
     * @typedef {string} stringObjectId
     */
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

module.exports.ObjectId = ObjectId;