var restify           = require( 'restify' ),
    mongoose          = require( 'mongoose' ),
    async             = require( 'async' ),
    sugar             = require( 'sugar' ),
    mf                = require( '../../../libs/mini-funcs.js' ),
    should            = require( 'should' ),


    CoachModel        = require( '../../../classes/coach/coach-model.js' ).CoachModel,
    Coach             = require( '../../../classes/coach/coach.js' ),

    Account           = require( '../../../classes/account/account.js' ),
    AccountModel      = require( '../../../classes/account/account-model.js' ).AccountModel,

    AccountGroup      = require( '../../../classes/account-group/account-group.js' ),
    AccountGroupModel = require( '../../../classes/account-group/account-group-model.js' ).AccountGroupModel,


    theNewAccount, theNewAccountArguments,
    theNewAccountGroup,
    theNewCoach,

    testTemplates     = {

        create: {

            shouldCreate: function ( data, next ) {

                theNewCoach = new Coach();

                theNewCoach.create( data, function ( err ) {

                    should.not.exist( err );

                    should.exist( theNewCoach.id );
                    should.exist( theNewCoach.firstname );

                    theNewCoach.firstname.should.eql( data.firstname );

                    if ( data.secondname )
                        theNewCoach.secondname.should.eql( data.secondname );

                    if ( data.patron )
                        theNewCoach.patron.should.eql( data.patron );

                    if ( data.account ) {

                        if ( typeof data.account === 'string' )
                            theNewCoach.account.id.should.eql( data.account );

                        else if ( data.account instanceof Account )
                            theNewCoach.account.id.should.eql( data.account.id );

                    }

                    next();


                } );


            },

            shouldCallError: function ( data, next ) {

                theNewCoach = new Coach();

                theNewCoach.create( data, function ( err ) {

                    should.exist( err );
                    next();

                } );

            }

        }

    },

    cleanUp           = {

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

        Coaches: function ( next ) {

            CoachModel.find().remove().exec( function ( err ) {
                should.not.exist( err );
                next();
            } );

        },

        full: function ( next ) {

            async.series(
                [
                    this.AccountGroups,
                    this.Accounts,
                    this.Coaches
                ],
                function ( err ) {
                    should.not.exist( err );
                    next();
                }
            );
        }

    },

    reCreate          = {

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
                    this.Accounts
                ],
                function () {
                    next();
                }
            );

        }

    };


describe( 'Coach class testing', function () {

    before( function ( done ) {

        mongoose.connect( 'mongodb://localhost/test', {}, function ( err ) {
            should.not.exist( err );
            done();
        } );

    } );

    describe( '.create()', function () {

        describe( 'should create', function () {

            beforeEach( function ( done ) {

                async.series(
                    [
                        function ( scb ) {
                            cleanUp.Coaches( scb );
                        },
                        function ( scb ) {
                            reCreate.AccountGroup( scb );
                        },
                        function ( scb ) {
                            reCreate.Accounts( scb );
                        }
                    ],
                    function () {
                        done();
                    }
                );

            } );

            it( 'with firstname, secondname, patron', function ( done ) {

                testTemplates.create.shouldCreate(
                    {
                        firstname:   'fname',
                        secondname: 'sname',
                        patron:     'ptrn'
                    },
                    function () {
                        done();
                    }
                );

            } );

            it( 'with firstname, secondname, patron, account', function ( done ) {

                testTemplates.create.shouldCreate(
                    {
                        firstname:   'fname',
                        secondname: 'sname',
                        patron:     'ptrn',
                        account:    theNewAccount
                    },
                    done
                );

            } );

            it( 'with firstname, account', function ( done ) {

                testTemplates.create.shouldCreate(
                    {
                        firstname: 'fname',
                        account:  theNewAccount
                    },
                    done
                );

            } );

            it( 'with firstname', function ( done ) {

                testTemplates.create.shouldCreate(
                    {
                        firstname: 'fname'
                    },
                    done
                );

            } );

            it( 'with firstname, string account', function ( done ) {

                testTemplates.create.shouldCreate(
                    {
                        firstname: 'fname',
                        account:  theNewAccount.id
                    },
                    done
                );

            } );

        } );

        describe( 'should not create with invalid params', function () {

            beforeEach( function ( done ) {

                async.series(
                    [
                        function ( scb ) {
                            cleanUp.Coaches( scb );
                        },
                        function ( scb ) {
                            reCreate.AccountGroup( scb );
                        },
                        function ( scb ) {
                            reCreate.Accounts( scb );
                        }
                    ],
                    function () {
                        done();
                    }
                );

            } );

            it( 'no parameters', function ( done ) {

                async.series(
                    [

                        function ( scb ) {
                            testTemplates.create.shouldCallError( null, scb );
                        },
                        function ( scb ) {
                            testTemplates.create.shouldCallError( {}, scb );
                        },
                        function ( scb ) {
                            testTemplates.create.shouldCallError( '', scb );
                        }

                    ],
                    done
                );

            } );

            it( 'secondname, patron, account', function ( done ) {

                testTemplates.create.shouldCallError(
                    {
                        secondname: 'sname',
                        patron:     'ptrn',
                        account:    theNewAccount
                    },
                    done
                );

            } );

            it( 'not string firstname', function ( done ) {

                testTemplates.create.shouldCallError(
                    {
                        firstname: 50
                    },
                    done
                );

            } );

            it( 'firstname, nonexistent account', function ( done ) {

                testTemplates.create.shouldCallError(
                    {
                        firstname: 'fname',
                        account:  '000000000000000000000000'
                    },
                    done
                );

            } );

            xit( 'firstname, account which is already using by another Coach', function ( done ) {

                async.series(
                    [

                        // . First Coach creating
                        function ( scb ) {

                            testTemplates.create.shouldCreate(
                                {
                                    firstname: 'fname',
                                    account:  theNewAccount
                                },
                                scb
                            );

                        },

                        // . Second Coach creating
                        function ( scb ) {

                            testTemplates.create.shouldCallError(
                                {
                                    firstname: 'fname',
                                    account:  theNewAccount
                                },
                                scb
                            );

                        }

                    ],
                    done
                );

            } );

        } );

    } );

    xdescribe( '.findOne()', function () {

        describe( 'should find', function () {

            it( 'by id' );

            it( 'by names' );

            it( 'by account' );

            it( 'by multiplie filter' );

        } );

        describe( 'should not find', function () {

            it( 'nonexistent Coach' );

            it( 'removed Coach' );

            it( 'by nonexistent Account' );

            it( 'by null filter' );

        } );

        it( 'should find full object' );

    } );

    xdescribe( '.findOneShort()', function () {

        describe( 'should find', function () {

            it( 'by id' );

            it( 'by names' );

            it( 'by account' );

            it( 'by multiplie filter' );

        } );

        describe( 'should not find', function () {

            it( 'nonexistent Coach' );

            it( 'removed Coach' );

            it( 'by nonexistent Account' );

            it( 'by null filter' );

        } );

        it( 'should find short object' );

    } );

    xdescribe( 'Array.findShortCoaches()', function () {

        it( 'should not find any Coaches' );

        it( 'should find all Coaches' );

    } );

    xdescribe( '.update()', function () {

        describe( 'firstname', function () {

            it( 'should not remove' );

            it( 'should edit' );

            it( 'should not update to invalid' );

        } );

        describe( 'secondname', function () {

            it( 'should remove' );

            it( 'should edit' );

            it( 'should not update to invalid' );

        } );

        describe( 'patron', function () {

            it( 'should remove' );

            it( 'should edit' );

            it( 'should not update to invalid' );

        } );

        describe( 'account', function () {

            it( 'should remove' );

            it( 'should edit' );

            it( 'should not update to invalid (nonexistent)' );

        } );

    } );

    xdescribe( '.remove()', function () {

        it( 'should not remove nonexistent Coach' );

        it( 'should not remove already removed Coach' );

        it( 'should remove Coach' );

        it( 'should not find removed Coach' );

        it( 'should mark {deleted: true} deleted Coach' );

    } );

} );