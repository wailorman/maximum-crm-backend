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
    AccountGroupModel = require( '../../../classes/account-group/account-group-model.js' ).AccountGroupModel,

    Auth              = require( '../../../classes/auth/auth.js' ),

    cleanUp           = {
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
    },
    reCreate          = {

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

    },

    theNewToken, theNewAccount, theNewAccountGroup, theNewAccountArguments;

describe( 'Auth system', function () {

    before( function ( done ) {

        mongoose.connect( 'mongodb://localhost/test', {}, function ( err ) {

            should.not.exist( err );
            reCreate.full( done );

        } );

    } );

    describe( '.login()', function () {

        beforeEach( function ( done ) {

            reCreate.full( done );

        } );

        it( 'should login successfully', function ( done ) {

            Auth.login(
                theNewAccountArguments.name,
                theNewAccountArguments.password,
                function ( err, receivedToken ) {

                    should.not.exist( err );

                    mf.isToken( receivedToken.token ).should.eql( true );

                    receivedToken.account.isFull().should.eql( true );

                    done();

                }
            );

        } );

        it( 'should not login nonexistent user', function ( done ) {

            Auth.login(
                theNewAccountArguments.name + 'k',
                theNewAccountArguments.password,
                function ( err ) {

                    should.exist( err );
                    err.should.be.instanceof( restify.InvalidArgumentError );
                    done();

                }
            );

        } );

        it( 'should not login with incorrect pass', function ( done ) {

            Auth.login(
                theNewAccountArguments.name,
                theNewAccountArguments.password + 'k',
                function ( err ) {

                    should.exist( err );
                    err.should.be.instanceof( restify.InvalidArgumentError );
                    done();

                }
            );

        } );

        it( 'should return another token after second login', function ( done ) {

            var firstLoginToken;

            async.series(
                [

                    // . First login
                    function ( scb ) {

                        Auth.login(
                            theNewAccountArguments.name,
                            theNewAccountArguments.password,
                            function ( err, receivedToken ) {

                                should.not.exist( err );
                                firstLoginToken = receivedToken.token;
                                scb();

                            }
                        );

                    },

                    // . Second login
                    function ( scb ) {

                        Auth.login(
                            theNewAccountArguments.name,
                            theNewAccountArguments.password,
                            function ( err, receivedToken ) {

                                should.not.exist( err );
                                receivedToken.token.should.not.eql( firstLoginToken );
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

        it( 'should not login with invalid arguments', function ( done ) {

            async.eachSeries(
                [
                    { username: '', password: '' },
                    { username: '', password: null },
                    { username: null, password: null },
                    { username: null, password: null },
                    { username: theNewAccount, password: '' }
                ],
                function ( parameters, escb ) {

                    Auth.login(
                        parameters.username,
                        parameters.password,
                        function ( err ) {

                            should.exist( err );
                            err.should.be.instanceof( restify.InvalidArgumentError );
                            escb();

                        }
                    );

                },
                function () {
                    done();
                }
            );

        } );

        it( 'should login after password changing', function ( done ) {

            async.series(
                [

                    // . First login without password changing
                    function ( scb ) {

                        Auth.login(
                            theNewAccountArguments.name,
                            theNewAccountArguments.password,
                            function ( err ) {

                                should.not.exist( err );
                                scb();

                            }
                        );

                    },

                    // . Change password
                    function ( scb ) {

                        theNewAccount.password = 'qwerty';
                        theNewAccount.update( function ( err ) {

                            should.not.exist( err );
                            scb();

                        } );

                    },

                    // . Login with new password
                    function ( scb ) {

                        Auth.login(
                            theNewAccountArguments.name,
                            'qwerty',
                            function ( err ) {

                                should.not.exist( err );
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

    } );

    describe( '.logout()', function () {

        var receivedToken;

        before( function ( done ) {

            reCreate.full( done );

        } );

        beforeEach( function ( done ) {

            Auth.login(
                theNewAccountArguments.name,
                theNewAccountArguments.password,
                function ( err, token ) {

                    should.not.exist( err );
                    receivedToken = token.token;
                    done();

                }
            );

        } );

        it( 'should logout', function ( done ) {

            async.series(
                [

                    // . Logout
                    function ( scb ) {

                        Auth.logout( receivedToken, function ( err ) {

                            should.not.exist( err );
                            scb();

                        } );

                    },

                    // . Try to find removed (logout) token
                    function ( scb ) {

                        var removedToken = new Token();

                        removedToken.findOne( { token: receivedToken }, function ( err ) {

                            should.exist( err );
                            err.should.be.instanceof( restify.ResourceNotFoundError );
                            scb();

                        } );

                    }
                ],
                function () {

                    done();

                }
            );


        } );

        it( 'should not logout with nonexistent token', function ( done ) {

            var removedToken;

            async.series(
                [

                    // . Remove receivedToken
                    function ( scb ) {

                        removedToken = receivedToken; // cloning object

                        receivedToken = new Token();
                        receivedToken.findOne( { token: removedToken }, function ( err ) {

                            should.not.exist( err );

                            receivedToken.remove( function ( err ) {

                                should.not.exist( err );
                                scb();

                            } );

                        } );


                    },

                    // . Try to logout with nonexistent token
                    function ( scb ) {

                        Auth.logout( removedToken, function ( err ) {

                            should.exist( err );
                            err.should.be.instanceof( restify.InvalidArgumentError );

                            scb();

                        } )

                    }

                ],
                function () {
                    done();
                }
            );

        } );

        it( 'should not logout twice', function ( done ) {

            var cloneOfReceivedToken = receivedToken;

            async.series(
                [

                    // . First logout
                    function ( scb ) {

                        Auth.logout( receivedToken, function ( err ) {

                            should.not.exist( err );
                            scb();

                        } );

                    },

                    // . Second logout
                    function ( scb ) {

                        Auth.logout( cloneOfReceivedToken, function ( err ) {

                            should.exist( err );
                            err.should.be.instanceof( restify.InvalidArgumentError );

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