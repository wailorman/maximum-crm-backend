/**
 * Token class
 *
 * @param {string}  stringToken    24-byte token string
 *
 * @typedef Token
 *
 * @class
 * @constructor
 */
var Token = function (stringToken) {

    this.string = stringToken;

    /**
     * Validate constructed Token
     *
     * @returns {boolean}
     */
    this.isValid = function () {

        var isToken = new RegExp("^[0-9a-zA-Z]{24}$");

        return isToken.test(this.string);
    };

    /**
     * Stringify Token object
     *
     * @returns {string}
     */
    this.toString = function () {
        return this.string;
    };

};

module.exports = Token;