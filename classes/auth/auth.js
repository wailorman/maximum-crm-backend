var restify      = require( 'restify' ),
    mongoose     = require( 'mongoose' ),
    passwordHash = require( 'password-hash' ),
    async        = require( 'async' ),
    sugar        = require( 'sugar' ),
    randToken    = require( 'rand-token' ),

    mf           = require( '../../libs/mini-funcs.js' ),

    Token        = require( '../token/token.js' ),

    Account      = require( '../account/account.js' ),
    AccountModel = require( '../account/account-model.js' ).AccountModel,


    validators   = {

        /**
         * Username validator
         *
         * @param {string}      value
         * @param {function}    next
         */
        username: function ( value, next ) {

            if ( ! value ) return next( new restify.InvalidArgumentError( 'username|null. invalid' ) );
            if ( typeof value !== 'string' ) return next( new restify.InvalidArgumentError( 'username|not string. invalid' ) );
            next();

        },

        /**
         * Password validator
         *
         * @param {string}      value
         * @param {function}    next
         */
        password: function ( value, next ) {

            if ( ! value ) return next( new restify.InvalidArgumentError( 'password|null. invalid' ) );
            if ( typeof value !== 'string' ) return next( new restify.InvalidArgumentError( 'password|not string. invalid' ) );
            next();

        }
    };

module.exports = {

    /**
     * Log In user.
     * Returns token object
     *
     * @param {string}      username
     * @param {string}      password
     * @param {function}    next
     */
    login: function ( username, password, next ) {

        var accountDocument, accountForToken, generatedToken;

        async.series(
            [

                // . Validate username and password
                function ( scb ) {

                    async.series(
                        [

                            // username
                            function ( vscb ) {

                                validators.username( username, vscb );

                            },

                            // password
                            function ( vscb ) {

                                validators.password( password, vscb );

                            }

                        ],
                        function ( err ) {
                            if ( err ) return scb( err );
                            scb();
                        }
                    );

                },

                // . Get Account document
                function ( scb ) {

                    AccountModel.findOne(
                        { name: username, deleted: false },
                        function ( err, doc ) {

                            if ( err ) return scb( new restify.InternalError( 'Mongo error on getting Account document: ' + err.message ) );
                            if ( ! doc ) return scb( new restify.InvalidArgumentError( 'username|invalid' ) );

                            accountDocument = doc;

                            scb();

                        }
                    );

                },

                // . Verify password
                function ( scb ) {

                    if ( ! passwordHash.verify( password, accountDocument.password ) )
                        return scb( new restify.InvalidArgumentError( 'password|incorrect' ) );

                    scb();

                },

                // . Get Account for generate Token
                function ( scb ) {

                    accountForToken = new Account();

                    accountForToken.findOne( { name: username }, function ( err ) {

                        if ( err ) return scb( new restify.InternalError( 'Error on getting Account for Token: ' + err.message ) );
                        scb();

                    } );

                },

                // . Generate token
                function ( scb ) {

                    generatedToken = new Token();

                    generatedToken.create( { account: accountForToken }, function ( err ) {

                        if ( err ) return scb( new restify.InternalError( 'Error on generating token: ' + err.message ) );
                        scb();

                    } );


                }

            ],
            function ( err ) {

                if ( err ) return next( err );
                next( null, generatedToken );

            }
        );

    },

    /**
     * Log Out user.
     * Returns only error if exist
     *
     * @param {string}      token
     * @param {function}    next
     */
    logout: function ( token, next ) {

        var tokenForRemove;

        async.series(
            [

                // . Validate token
                function ( scb ) {

                    if ( ! mf.isToken( token ) ) return scb( new restify.InvalidArgumentError( 'token|invalid' ) );

                    scb();

                },

                // . Get token
                function ( scb ) {

                    tokenForRemove = new Token();

                    tokenForRemove.findOne( { token: token }, function ( err ) {

                        if ( err && err instanceof restify.ResourceNotFoundError )
                            return scb( new restify.InvalidArgumentError( 'token|invalid. 404' ) );
                        else if ( err )
                            return scb( new restify.InternalError( 'Error on getting token for remove: ' + err.message ) );

                        scb();

                    } );

                },

                // . Remove token
                function ( scb ) {

                    tokenForRemove.remove( function ( err ) {

                        if ( err ) return scb( new restify.InternalError( 'Error on removing token: ' + err.message ) );

                        scb();

                    } );

                }

            ],
            function ( err ) {

                if ( err ) return next( err );

                next();

            }
        );

    }

};