/**
 * Created by Сергей on 12.12.2014.
 */

var should = require( 'should' );
var mongoose = require( 'mongoose' );
var async = require( 'async' );
var passwordHash = require( 'password-hash' );
var mf = require( '../../../libs/mini-funcs.js' );

var Account = require( '../../../classes/account/account.js' );
var AccountModel = require( '../../../classes/account/account-model.js' ).AccountModel;

var AccountGroup = require( '../../../classes/account-group/account-group.js' );
var AccountGroupModel = require( '../../../classes/account-group/account-group-model.js' ).AccountGroupModel;

var theNewAccount, theNewAccountGroup;

var cleanUp = {
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
                this.Accounts,
                this.AccountGroups
            ],
            function ( err ) {
                should.not.exist( err );
                next();
            }
        );
    }
};

var reCreate = {

    Accounts: function ( next ) {

        async.series(
            [
                cleanUp.Accounts,
                function () {

                    theNewAccount = new Account();

                    theNewAccount.create(
                        {
                            name: 'theNewAccount',
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

    AccountGroup: function ( next ) {

        async.series(
            [
                cleanUp.AccountGroups,
                function () {

                    theNewAccount = new Account();

                    theNewAccount.create(
                        {
                            name: 'theNewAccountGroup',
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
                this.Accounts,
                this.AccountGroup
            ],
            function () {
                next();
            }
        );

    }

};


describe( 'Account class', function () {

    // clean up database
    before( function ( done ) {

        mongoose.connect( 'mongodb://localhost/test', {}, function ( err ) {
            should.not.exist( err );

            reCreate.full( function () {

                done();

            } );

        } );

    } );


    describe( '.create', function () {

        beforeEach( function ( done ) {

            cleanUp.Accounts( function () {
                done();
            } );

        } );

        it( 'should create Account with correct params', function ( done ) {

            var validArguments = [
                {
                    name: 'some-name1',
                    password: '12345',
                    group: theNewAccountGroup,
                    individualPerms: {
                        indHall: {
                            create: true
                        }
                    }
                },
                {
                    name: 'some-name2',
                    password: '12345',
                    group: theNewAccountGroup
                },
                {
                    name: 'some-name3',
                    password: '12345',
                    individualPerms: {
                        indHall: {
                            create: true
                        }
                    }
                }
            ];

            async.eachSeries(
                validArguments,
                function ( arguments, escb ) {

                    theNewAccount = new Account();
                    theNewAccount.create( arguments, function ( err ) {
                        should.not.exist( err );
                        escb();
                    } );

                },
                function () {
                    done();
                }
            );

        } );

        it( 'should not create Account with incorrect params types', function ( done ) {

            var invalidArguments = [
                {
                    name: '',
                    password: '',
                    group: ''
                },
                {
                    name: false,
                    password: false,
                    group: false
                }
            ];

            async.eachSeries(
                invalidArguments,
                function ( arguments, escb ) {

                    theNewAccount = new Account();

                    theNewAccount.create( arguments, function ( err ) {
                        should.exist( err );
                        escb();
                    } );

                },
                function () {
                    done();
                }
            );


        } );

        it( 'should not create Account without some of the required params', function ( done ) {

            var invalidParams = [
                {
                    name: 'some-name'
                },
                {
                    password: 'somePassword'
                }
            ];

            async.eachSeries(
                invalidParams,
                function ( arguments, escb ) {

                    theNewAccount = new Account();

                    theNewAccount.create( arguments, function ( err ) {
                        should.exist( err );
                        escb();
                    } );

                },
                function () {
                    done();
                }
            );

        } );

        it( 'should not create Account with the same name twice', function ( done ) {

            async.series(
                [
                    function ( scb ) {

                        theNewAccount = new Account();

                        theNewAccount.create(
                            {
                                name: 'new-name',
                                password: '123'
                            },
                            function ( err ) {
                                should.not.exist( err );
                                scb();
                            }
                        );

                    },
                    function () {

                        theNewAccount = new Account();

                        theNewAccount.create(
                            {
                                name: 'new-name',
                                password: '123'
                            },
                            function ( err ) {
                                should.exist( err );
                                done();
                            }
                        );

                    }
                ]
            );

        } );

        it( 'should not create Account with nonexistent AccountGroup', function ( done ) {

            var oldAccountGroup = theNewAccountGroup;

            theNewAccountGroup.remove( function ( err ) {

                should.not.exist( err );

                theNewAccount = new Account();

                theNewAccount.create(
                    {
                        name: 'deletedGroup',
                        password: '1234',
                        group: oldAccountGroup
                    },
                    function ( err ) {
                        should.exist( err );

                        reCreate.AccountGroup( function ( err ) {

                            should.not.exist( err );
                            done();

                        } );

                    }
                );

            } );

        } );

    } );

    xdescribe( '.getOne', function () {

        beforeEach( function ( done ) {

            reCreate.Accounts( function () {
                done();
            } );

        } );

        // TODO By token
        it( 'should find Account by id, name, token, AccountGroup', function ( done ) {

            var filters = [
                {
                    id: theNewAccount.id
                },
                {
                    name: theNewAccount.name
                },
                {
                    group: theNewAccount.group
                }
            ];

        } );

        it( 'should not find nonexistent Account' );

        it( 'should not find removed Account' );

        it( 'should call error when we trying to find Account by password or individualPerms' );

    } );

    xdescribe( '.get', function () {

        it( 'should find one Account by id, name, token' );

        it( 'should find more than one Account by AccountGroup' );

        it( 'should not find nonexistent Account' );

        it( 'should not find removed Account' );

        it( 'should call error when we trying to find Account by password or individualPerms' );

    } );

    xdescribe( '.update', function () {

        it( 'should not update Account.id' );

        it( 'should update Account.name' );

        it( 'should update Account.password' );

        it( 'should update Account.individualPerms' );

        it( 'should not update Account.perms' );

        it( 'should update Account.group' );

    } );


    xdescribe( '.remove', function () {

        it( 'should remove Account and mark them as deleted: true' );

        it( 'should not remove already removed Account' );

    } );

    xdescribe( '.auth', function () {

        it( 'should auth Account and return Account object with token property' );

        it( 'should not auth with incorrect password' );

        it( 'should not auth nonexistent Account' );

        it( 'should auth twice and return two different tokens' );

    } );


    xdescribe( '.logout', function () {

        it( 'should terminate one session' );

        it( 'should terminate all current sessions' );

        it( 'should call error when we trying to terminate nonexistent session' );

    } );


} );
