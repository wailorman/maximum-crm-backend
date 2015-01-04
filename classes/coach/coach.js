var restify    = require( 'restify' ),
    mongoose   = require( 'mongoose' ),
    async      = require( 'async' ),
    sugar      = require( 'sugar' ),
    mf         = require( '../../libs/mini-funcs.js' ),


    CoachModel = require( './coach-model.js' ).CoachModel,

    Account    = require( '../account/account.js' ),


    Coach      = function () {
    };

Coach.prototype._validators = {

    /**
     * @param {string} value
     * @returns {boolean}
     */
    id: function ( value ) {

        return value && mf.isObjectId( value );

    },

    /**
     * @param {string} value
     * @returns {boolean}
     */
    name: function ( value ) {

        return value && typeof value === 'string';

    },

    /**
     * Account validator
     *
     * @param {Account|string}      value
     * @param {function}            next
     *
     * @throws InvalidArgumentError( 'account|404' )
     * @throws InternalError( 'account validator. findOneShort: ...' )
     */
    account: function ( value, next ) {

        var idToFind;


        if ( typeof value === 'string' )
            idToFind = value;

        else if ( value instanceof Account && value.id )
            idToFind = value.id;

        else
            return next( new restify.InvalidArgumentError( 'account|invalid type' ) );


        var theAccount = new Account();
        theAccount.findOneShort( { id: idToFind }, function ( err ) {

            if ( err && err instanceof restify.ResourceNotFoundError )
                return next( new restify.InvalidArgumentError( 'account|404' ) );
            else if ( err )
                return next( new restify.InternalError( 'validators.account(): Account.findOneShort: ' + err.message ) );

            next();

        } );

    }

};

Coach.prototype._documentToFullObject = function ( document, next ) {

    var self = this;

    self.id = document._id.toString();

    self.firstname = document.firstname;

    if ( document.secondname ) self.secondname = document.secondname;

    if ( document.patron ) self.patron = document.patron;

    // Account adding

    if ( document.account ) {

        self.account = new Account();

        self.account.findOneShort( { id: document.account.toString() }, function ( err ) {

            if ( err ) return next( new restify.InternalError( 'Document to full object: Account adding error: ' + err.message ) );
            next( null, self );

        } );

    }else
        next( null, self );

};

/**
 * Create new Coach
 *
 * @param                   data
 * @param {string}          data.firstname
 * @param {string}          [data.secondname]
 * @param {string}          [data.patron]
 * @param {string|Account}  [data.account]
 * @param {function}        next
 */
Coach.prototype.create = function ( data, next ) {

    var dataForDB = {}, documentForConvert, self = this;

    async.series(
        [

            // . Validate parameters
            function ( scb ) {

                if ( ! data ) return scb( new restify.InvalidArgumentError( 'filter|invalid' ) );

                if ( ! self._validators.name( data.firstname ) )
                    return scb( new restify.InvalidArgumentError( 'firstname|invalid' ) );

                if ( data.secondname && ! self._validators.name( data.secondname ) )
                    return scb( new restify.InvalidArgumentError( 'secondname|invalid' ) );

                if ( data.patron && ! self._validators.name( data.patron ) )
                    return scb( new restify.InvalidArgumentError( 'patron|invalid' ) );


                if ( data.account ) {

                    self._validators.account( data.account, function ( err ) {

                        if ( err ) return scb( err );
                        scb();

                        // TODO . Check account unique


                    } );

                } else
                    scb();

            },

            // . Prepare query
            function ( scb ) {

                dataForDB.firstname = data.firstname;

                if ( data.secondname )
                    dataForDB.secondname = data.secondname;

                if ( data.patron )
                    dataForDB.patron = data.patron;

                if ( data.account ) {

                    if ( typeof data.account === 'string' )
                        dataForDB.account = new mf.ObjectId( data.account );

                    else if ( data.account instanceof Account && data.account.id )
                        dataForDB.account = new mf.ObjectId( data.account.id );

                    else
                        return scb( new restify.InternalError( 'Prepare query: Account is invalid' ) );

                }

                dataForDB.deleted = false;

                scb();

            },

            // . Write to DB
            function ( scb ) {

                var coachDoc = new CoachModel( dataForDB );

                coachDoc.save( function ( err, doc ) {

                    if ( err ) return scb( new restify.InternalError( 'Mongo: ' + err.message ) );

                    documentForConvert = doc;

                    scb();

                } );

            },

            // . Convert to full object
            function ( scb ) {

                self._documentToFullObject( documentForConvert, scb );

            }

        ],
        function ( err ) {

            if ( err ) return next( err );
            next();

        }
    );

};

/**
 * Find one full Coach object
 *
 * @param                   filter                  Should be not null
 * @param {string}          [filter.id]
 * @param {string}          [filter.firstname]
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
 * @param {string}          [filter.firstname]
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

module.exports = Coach;