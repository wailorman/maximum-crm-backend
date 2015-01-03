var should            = require( 'should' ),
    restify           = require( 'restify' ),
    async             = require( 'async' ),
    mf                = require( '../../../libs/mini-funcs.js' ),
    mongoose          = require( 'mongoose' ),
    sugar             = require( 'sugar' ),

    Token             = require( '../../../classes/token/token.js' ),
    TokenModel        = require( '../../../classes/token/token-model.js' ).TokenModel,

    Account           = require( '../../../classes/account/account.js' ),
    AccountModel      = require( '../../../classes/account/account-model.js' ).AccountModel,

    AccountGroup      = require( '../../../classes/account-group/account-group.js' ),
    AccountGroupModel = require( '../../../classes/account-group/account-group-model.js' ).AccountGroupModel;


var theNewToken, theNewTokens, theNewAccount, theNewAccountGroup, theNewAccountArguments;


var isTokenValid = function ( token ) {
    token.should.have.properties( [ 'token', 'account', 'ttl', 'created' ] );
    token.account.isFull().should.eql( true );
};

Token.prototype.isTokenValid = function () {
    return isTokenValid( this );
};

var cleanUp = {
    Tokens: function ( next ) {

        TokenModel.find().remove().exec(
            function ( err ) {

                should.not.exist( err );

                next();


            }
        );

    },

    Accounts: function ( next ) {

        AccountModel.find().remove().exec( function ( err ) {
            should.not.exist( err );
            next();
        } );


    },

    AccountGroups: function ( next ) {

        AccountGroupModel.find().remove().exec( function ( err ) {
            should.not.exist( err );
            next();
        } );

    },

    full: function ( next ) {

        async.series(
            [
                this.AccountGroups,
                this.Accounts
            ],
            function ( err ) {
                should.not.exist( err );
                next();
            }
        );
    }
};

var reCreate = {

    Tokens: function ( next ) {

        TokenModel.find().remove().exec(
            function ( err ) {

                should.not.exist( err );

                theNewToken = new Token();

                theNewToken.create( { account: theNewAccount }, function ( err ) {

                    should.not.exist( err );

                    next();

                } );

            }
        );

    },

    Accounts: function ( next ) {

        async.series(
            [
                function ( scb ) {

                    cleanUp.Accounts( scb );

                },
                function () {

                    theNewAccount = new Account();

                    theNewAccountArguments = {
                        name:            'theNewAccount',
                        password:        '1234',
                        individualPerms: {
                            hall: {
                                create: true
                            }
                        }
                    };

                    if ( theNewAccountGroup ) {
                        theNewAccountArguments.group = theNewAccountGroup;
                    }

                    theNewAccount.create(
                        theNewAccountArguments,
                        function ( err ) {
                            should.not.exist( err );
                            next();
                        }
                    );

                }
            ]
        );

    },

    AccountGroup: function ( next ) {

        async.series(
            [
                function ( scb ) {

                    cleanUp.AccountGroups( scb );

                },
                function () {

                    theNewAccountGroup = new AccountGroup();

                    theNewAccountGroup.create(
                        {
                            name:     'theNewAccountGroup',
                            password: '1234'
                        },
                        function ( err ) {
                            should.not.exist( err );
                            next();
                        }
                    );

                }
            ]
        );

    },

    full: function ( next ) {

        async.series(
            [
                this.AccountGroup,
                this.Accounts,
                this.Tokens
            ],
            function () {
                next();
            }
        );

    }

};

describe( 'Token class', function () {

    before( function ( done ) {

        mongoose.connect( 'mongodb://localhost/test', {}, function ( err ) {

            should.not.exist( err );
            reCreate.full( done );

        } );

    } );

    describe( '.create', function () {

        this.timeout( 50000 );

        it( 'should create token with correct params', function ( done ) {

            theNewToken = new Token();

            theNewToken.create(
                { account: theNewAccount },
                function ( err ) {

                    should.not.exist( err );

                    theNewToken.isTokenValid();

                    done();

                }
            );

        } );

        it( 'should not create token with invalid parameters', function ( done ) {

            async.eachSeries(
                [
                    { account: theNewAccountGroup },
                    { account: '000000000000000000000000' },
                    theNewAccount,
                    null
                ],
                function ( parameters, escb ) {

                    theNewToken = new Token();

                    theNewToken.create( parameters, function ( err ) {

                        should.exist( err );
                        escb();

                    } );

                },
                function () {

                    done();

                }
            );

        } );

        it( 'should not create token with nonexistent Account', function ( done ) {

            var testAccount, removedAccount;

            async.series(
                [

                    // . Create Account for testing
                    function ( scb ) {

                        testAccount = new Account();

                        testAccount.create(
                            {
                                name:     'gangsta',
                                password: '123',
                                group:    theNewAccountGroup
                            },
                            function ( err ) {
                                should.not.exist( err );

                                removedAccount = testAccount;

                                scb();
                            }
                        );

                    },

                    // . Remove Account for testing
                    function ( scb ) {

                        testAccount.remove( function ( err ) {

                            should.not.exist( err );
                            scb();

                        } );

                    },

                    // . Try to create token with removed Account
                    function ( scb ) {

                        theNewToken = new Token();

                        theNewToken.create(
                            { account: removedAccount },
                            function ( err ) {

                                should.exist( err );
                                err.should.be.instanceof( restify.InvalidArgumentError );

                                scb();

                            }
                        );

                    }

                ],
                function () {
                    done();
                }
            );

        } );

        it( 'should accept short and full Account object', function ( done ) {

            var fullAccount, shortAccount;

            async.series(
                [

                    // . Get full Account
                    function ( scb ) {

                        fullAccount = new Account();

                        fullAccount.findOne( { id: theNewAccount.id }, function ( err ) {

                            should.not.exist( err );
                            scb();

                        } );

                    },

                    // . Get short Account
                    function ( scb ) {

                        shortAccount = new Account();

                        shortAccount.findOneShort( { id: theNewAccount.id }, function ( err ) {

                            should.not.exist( err );
                            scb();

                        } );

                    },

                    // . Try to create with full object
                    function ( scb ) {

                        theNewToken = new Token();

                        theNewToken.create( { account: fullAccount }, function ( err ) {

                            should.not.exist( err );
                            scb();

                        } );

                    },

                    // . Try to create with short object
                    function ( scb ) {

                        theNewToken = new Token();

                        theNewToken.create( { account: shortAccount }, function ( err ) {

                            should.not.exist( err );
                            scb();

                        } );

                    }

                ],
                function () {
                    done();
                }
            );


        } );

        it( 'should not find overdue token', function ( done ) {

            async.series(
                [
                    // CleanUp
                    function ( scb ) {

                        cleanUp.Tokens( scb );

                    },

                    // Create
                    function ( scb ) {

                        theNewToken = new Token();

                        theNewToken.create(
                            { account: theNewAccount, ttl: 1 },
                            function ( err ) {

                                should.not.exist( err );

                                setTimeout( function () {

                                    var tokenToFind = theNewToken.token;

                                    theNewToken.findOne( { token: tokenToFind }, function ( err ) {

                                        should.exist( err );
                                        err.should.be.instanceof( restify.ResourceNotFoundError );

                                        scb();

                                    } );

                                }, 1500 );

                            }
                        );

                    }

                ],
                function () {
                    done();
                }
            );



        } );

        it( 'should find not overdue token', function ( done ) {

            async.series(
                [
                    // CleanUp
                    function ( scb ) {

                        cleanUp.Tokens( scb );

                    },

                    // Create
                    function ( scb ) {

                        theNewToken = new Token();

                        theNewToken.create(
                            { account: theNewAccount, ttl: 10 },
                            function ( err ) {

                                should.not.exist( err );

                                setTimeout( function () {

                                    var tokenToFind = theNewToken.token;

                                    theNewToken.findOne( { token: tokenToFind }, function ( err ) {

                                        should.not.exist( err );

                                        scb();

                                    } );

                                }, 1500 );

                            }
                        );

                    }

                ],
                function () {
                    done();
                }
            );



        } );

    } );

    describe( '.findOne', function () {

        var foundToken;

        before( function ( done ) {

            reCreate.full( done );

        } );

        it( 'should find Token by id', function ( done ) {

            foundToken = new Token();

            foundToken.findOne( { token: theNewToken.token }, function ( err ) {

                should.not.exist( err );
                foundToken.token.should.eql( theNewToken.token ); // is this Token I find?
                foundToken.isTokenValid();
                done();

            } );

        } );

        it( 'should not find by invalid filter', function ( done ) {

            async.eachSeries(
                [
                    null,
                    {},
                    { id: true },
                    { token: true }
                ],
                function ( filter, escb ) {

                    foundToken = new Token();
                    foundToken.findOne( filter, function ( err ) {

                        should.exist( err );
                        err.should.be.instanceof( restify.InvalidArgumentError );
                        escb();

                    } );

                },
                function () {
                    done();
                }
            );

        } );

    } );

    describe( '.remove', function () {

        beforeEach( function ( done ) {

            reCreate.full( done );

        } );

        it( 'should remove created Token', function ( done ) {

            theNewToken.remove( function ( err ) {

                should.not.exist( err );
                done();

            } );

        } );

        it( 'should not find removed Token', function ( done ) {

            var removedToken;

            async.series(
                [

                    // . Clone object
                    function ( scb ) {


                        removedToken = new Token();
                        removedToken.findOne( { token: theNewToken.token }, function ( err ) {

                            should.not.exist( err );
                            scb();

                        } );

                    },

                    // . First remove
                    function ( scb ) {

                        theNewToken.remove( function ( err ) {

                            should.not.exist( err );
                            scb();

                        } );

                    },

                    // . Second remove
                    function ( scb ) {

                        removedToken.remove( function ( err ) {

                            should.exist( err );
                            err.should.be.instanceof( restify.InternalError );
                            scb();

                        } );

                    }

                ],
                function () {
                    done();
                }
            );

        } );

    } );

    after( function ( done ) {

        mongoose.connection.close( done );

    } );

} );