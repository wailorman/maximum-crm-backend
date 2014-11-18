/**
 * Perms class
 *
 * @param {object}  permsObj    Permissions object
 *
 * @typedef {object|null} Perms
 *
 * @class
 * @constructor
 */
var Perms = function (permsObj) {

    this.object = permsObj;

    /**
     * Validate passed to the class constructor permissions object
     *
     * @return {boolean}
     */
    this.isValid = function () {

        function checkObjectLevel(obj) {
            for ( var i in obj ){

                if ( obj.hasOwnProperty(i) && obj[i] ) {

                    // If it's next level...
                    // Recursive call self to check next level
                    if ( typeof obj[i] === 'object' ) {

                        if ( checkObjectLevel(obj[i]) ) {

                            // It's correct perm. property
                            // Continue checking...
                            // To the next property...

                            continue;

                        }else{

                            // Some of props in the next level
                            // is invalid. Break checking.
                            // Because we must return true
                            // only if all the properties is valid

                            return false;

                        }

                    }


                    // If it's normal permission value (boolean)
                    if ( typeof obj[i] === 'boolean' ) {

                        // Continue checking

                        continue;
                    }


                    // If the property not next level
                    // and not normal permission value (boolean)
                    // it's incorrect property. Then we should
                    // break checking, because one of the property
                    // is invalid

                    return false;

                }else{

                    // Object property is null.
                    // So, it can be a permission.
                    //
                    // The false permission

                    return true;
                }
            }

            return true;

        }

        if ( typeof this.object === 'boolean' && this.object === true ) {
            return false;
        }

        return checkObjectLevel(this.object);

    };

    /**
     * Stringify permissions.
     * Convert object to string.
     *
     * @returns {string}
     */
    this.toString = function () {
        return JSON.stringify(this.object);
    };

};

module.exports = Perms;