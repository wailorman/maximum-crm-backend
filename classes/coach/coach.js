var restify    = require( 'restify' ),
    mongoose   = require( 'mongoose' ),
    async      = require( 'async' ),
    sugar      = require( 'sugar' ),
    mf         = require( '../../libs/mini-funcs.js' ),


    CoachModel = require( './coach-model.js' ).CoachModel,


    Coach = function () {
    };

/**
 * Create new Coach
 *
 * @param                   data
 * @param {string}          data.fullname
 * @param {string}          [data.secondname]
 * @param {string}          [data.patron]
 * @param {string|Account}  [data.account]
 * @param {function}        next
 */
Coach.prototype.create = function ( data, next ) {
};

/**
 * Find one full Coach object
 *
 * @param                   filter                  Should be not null
 * @param {string}          [filter.id]
 * @param {string}          [filter.fullname]
 * @param {string}          [filter.secondname]
 * @param {string}          [filter.patron]
 * @param {string|Account}  [filter.account]
 * @param {function}        next
 */
Coach.prototype.findOne = function ( filter, next ) {
};

/**
 * Find one short Coach object
 *
 * @param                   filter                  Should be not null
 * @param {string}          [filter.id]
 * @param {string}          [filter.fullname]
 * @param {string}          [filter.secondname]
 * @param {string}          [filter.patron]
 * @param {string|Account}  [filter.account]
 * @param {function}        next
 */
Coach.prototype.findOneShort = function ( filter, next ) {
};

/**
 * Find several short Coaches
 *
 * @param filter
 * @param {function} next
 */
Array.prototype.findShortCoaches = function ( filter, next ) {
};

/**
 * Remove Coach
 *
 * @param {function} next
 */
Coach.prototype.remove = function ( next ) {
};

/**
 * Update Coach
 *
 * @param {function} next
 */
Coach.prototype.update = function ( next ) {
};