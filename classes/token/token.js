var restify      = require( 'restify' ),
    mongoose     = require( 'mongoose' ),
    async        = require( 'async' ),
    sugar        = require( 'sugar' ),
    randToken    = require( 'rand-token' ),

    mf           = require( '../../libs/mini-funcs.js' ),

    TokenModel   = require( './token-model.js' ).TokenModel,

    Account      = require( '../account/account.js' ),


    defaultTTL   = 72; // in hours


var Token = function () {

    var self = this;

    this._validators = {

        /**
         * Token validator
         *
         * @param {string} value
         * @param {function} next
         *
         * @throws InvalidArgumentError( 'token|invalid' )
         */
        token: function ( value, next ) {

            if ( mf.isToken( value ) )
                next();
            else
                return next( new restify.InvalidArgumentError( 'token|invalid' ) );

        },


        /**
         * Account validator
         *
         * @param {Account}     value
         * @param {function}    next
         *
         * @throws InvalidArgumentError( 'account|404' )
         * @throws InternalError( 'account validator. findOneShort: ...' )
         */
        account: function ( value, next ) {

            if ( value && value.id ) {

                var theAccount = new Account();
                theAccount.findOneShort( { id: value.id }, function ( err ) {

                    if ( err && err instanceof restify.ResourceNotFoundError )
                        return next( new restify.InvalidArgumentError( 'account|404' ) );
                    else if ( err )
                        return next( new restify.InternalError( 'validators.account(): Account.findOneShort: ' + err.message ) );

                    next();

                } );

            } else
                return next( new restify.InvalidArgumentError( 'account|null' ) );

        },


        /**
         * Token TTL validator
         *
         * @param {number}      value
         * @param {function}    next
         *
         * @throws InvalidArgumentError( 'ttl|null. invalid' )
         * @throws InvalidArgumentError( 'ttl|not number. invalid' )
         */
        ttl: function ( value, next ) {

            if ( ! value ) return next( new restify.InvalidArgumentError( 'ttl|null. invalid' ) );

            if ( typeof value !== 'number' ) return next( new restify.InvalidArgumentError( 'ttl|not number. invalid' ) );

            next();

        }
    };

    /**
     * Convert document to Token object
     *
     * @param document
     * @param next
     *
     * @throws InternalError( 'documentToObject. Find Account: ...')
     */
    this.documentToObject = function ( document, next ) {

        if ( ! document ) return next( new restify.InternalError( 'documentToObject: document|null' ) );

        async.series(
            [

                // . Find Account
                function ( scb ) {

                    self.account = new Account();

                    self.account.findOne(
                        { id: document.account.toString() },
                        function ( err ) {

                            if ( err ) return scb( new restify.InternalError( 'documentToObject. Find Account: ' + err.message ) );
                            scb();

                        }
                    );

                },

                // . Convert simple fields
                function ( scb ) {

                    self.token = document.token;
                    self.created = document.created;
                    self.ttl = document.ttl;
                    scb();

                }

            ],
            function ( err ) {

                if ( err ) return next( err );
                next( null, self );

            }
        );

    };

    /**
     * Create new Token
     *
     * @param {object}      data
     * @param {Account}     data.account
     * @param {number}      [data.ttl]
     * @param {function}    next
     */
    this.create = function ( data, next ) {

        var documentToConvert, ttl,
            curTimeMS = (new Date()).getTime(); // Current time in milliseconds

        //console.log( curTimeMS );

        if ( ! data ) return next( new restify.InvalidArgumentError( 'data|null' ) );

        async.series(
            [

                // . Validate data
                function ( scb ) {

                    async.series(
                        [
                            // account
                            function ( vscb ) {

                                self._validators.account( data.account, vscb );

                            },

                            // ttl
                            function ( vscb ) {

                                if ( data.ttl )
                                    self._validators.ttl( data.ttl, vscb );
                                else
                                    vscb();

                            }
                        ],
                        function ( err ) {

                            if ( err ) return scb( err );
                            scb();

                        }
                    );


                },


                // . Write data to DB
                function ( scb ) {

                    var newTokenDocument = new TokenModel( {

                        token:   randToken.generate( 24 ),
                        account: new mf.ObjectId( data.account.id ),
                        created: new Date( curTimeMS ),
                        ttl:     data.ttl ?
                            new Date( curTimeMS + ( data.ttl * 1000 ) ) :
                            new Date( curTimeMS + ( defaultTTL * 3600 * 1000 ) )

                    } );

                    newTokenDocument.save( function ( err, doc ) {

                        if ( err ) return scb( new restify.InternalError( 'Write data to DB. mongo: ' + err.message ) );
                        documentToConvert = doc;
                        scb();

                    } );

                },

                // . Convert document to object
                function ( scb ) {

                    self.clean();
                    self.documentToObject( documentToConvert, scb );

                }

            ],
            function ( err ) {

                if ( err ) return next( err );
                next( null, self );

            }
        );

    };

    /**
     * Find Token
     *
     * @param {object}      filter
     * @param {string}      filter.token
     * @param {function}    next
     *
     * @throws InvalidArgumentError( 'filter|null' )
     * @throws InternalError( 'mongo: ...' )
     * @throws ResourceNotFoundError( '404' )
     */
    this.findOne = function ( filter, next ) {

        if ( ! filter ) return next( new restify.InvalidArgumentError( 'filter|null' ) );

        var preparedQuery, documentForConvert;

        async.series(
            [

                // . Validate filter
                function ( scb ) {

                    self._validators.token( filter.token, scb );

                },

                // . Prepare query
                function ( scb ) {

                    preparedQuery = { ttl: { $gte: new Date() }, token: filter.token };
                    scb();

                },

                // . Find in DB
                function ( scb ) {

                    TokenModel.findOne( preparedQuery, function ( err, doc ) {

                        if ( err ) return scb( new restify.InternalError( 'mongo: ' + err.message ) );
                        if ( ! doc ) return scb( new restify.ResourceNotFoundError( '404' ) );

                        documentForConvert = doc;

                        scb();

                    } );

                },

                // . Convert document to object
                function ( scb ) {

                    self.clean();
                    self.documentToObject( documentForConvert, function ( err ) {

                        if ( err ) return scb( err );

                        scb();

                    } );

                }

            ],
            function ( err ) {

                if ( err ) return next( err );
                next( null, self );

            }
        );

    };


    /**
     * Remove token
     *
     * @param {function}    next
     */
    this.remove = function ( next ) {

        async.series(
            [

                // . Validate id
                function ( scb ) {

                    self._validators.token( self.token, scb );

                },

                // . Check exist
                function ( scb ) {

                    var checkExistToken = new Token();
                    checkExistToken.findOne( { token: self.token }, function ( err ) {

                        if ( err && err instanceof restify.ResourceNotFoundError )
                            return scb( new restify.InternalError( '404' ) );
                        else if ( err )
                            return scb( new restify.InternalError( 'error on check exist: ' + err.message ) );

                        scb();

                    } );

                },

                // . findAndRemove mongo
                function ( scb ) {

                    TokenModel.findOneAndRemove(
                        { token: self.token },
                        function ( err ) {

                            if ( err ) return scb( new restify.InternalError( 'mongo: ' + err.message ) );

                            scb();

                        }
                    );

                },


                // . Clean object
                function ( scb ) {

                    self.clean();
                    scb();

                }

            ],
            function ( err ) {

                if ( err ) return next( err );
                next();

            }
        );

    };


    this.clean = function () {

        delete self.token;
        delete self.account;
        delete self.ttl;
        delete self.created;

    };

};

module.exports = Token;