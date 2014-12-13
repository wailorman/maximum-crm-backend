var should = require( 'should' );
var mongoose = require( 'mongoose' );
var async = require( 'async' );
var passwordHash = require( 'password-hash' );
var mf = require( '../../../libs/mini-funcs.js' );
var restify = require( 'restify' );

var Account = require( '../../../classes/account/account.js' );
var AccountModel = require( '../../../classes/account/account-model.js' ).AccountModel;

var AccountGroup = require( '../../../classes/account-group/account-group.js' );
var AccountGroupModel = require( '../../../classes/account-group/account-group-model.js' ).AccountGroupModel;


var theNewAccount, theNewAccounts, theNewAccountGroup;

var testTemplates;


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

var theNewAccountArguments;
var reCreate = {

    Accounts: function ( next ) {

        async.series(
            [
                cleanUp.Accounts,
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
                cleanUp.AccountGroups,
                function () {

                    theNewAccount = new Account();

                    theNewAccount.create(
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

describe( 'Account module testing', function () {

    //this.timeout(10000);

    before( function ( done ) {

        // Connecting to mongoose test database

        mongoose.connect( 'mongodb://localhost/test', {},
            function ( err ) {
                should.not.exist( err );

                // Remove all documents after previous test

                async.series( [
                    function ( seriesCb ) {

                        // Remove all old AccountGroup

                        AccountGroupModel.find().remove().exec(
                            function ( err ) {
                                should.not.exist( err );
                                seriesCb();
                            }
                        );
                    },
                    function ( seriesCb ) {

                        // Remove all Accounts

                        AccountModel.find().remove().exec(
                            function ( err ) {
                                should.not.exist( err );
                                seriesCb();
                            }
                        );
                    },
                    function () {

                        // Create AccountGroup for testing

                        theNewAccountGroup = new AccountGroup();
                        theNewAccountGroup.create(
                            {
                                name:  'Test New Group',
                                perms: {
                                    hall: {
                                        create: true
                                    }
                                }
                            },
                            function ( err, newGroup ) {
                                should.not.exist( err );
                                done();
                            }
                        );

                    }
                ] );


            } );
    } );

    describe( '.create', function () {

        // Recreate Accounts and AccountGroups
        beforeEach( function ( done ) {

            async.series(
                [
                    // 1. Remove all Accounts
                    function ( scb ) {
                        AccountModel.find().remove().exec( function ( err ) {
                            should.not.exist( err );
                            scb();
                        } );
                    },

                    // 2. Remove all AccountGroups
                    function ( scb ) {
                        AccountGroupModel.find().remove().exec( function ( err ) {
                            should.not.exist( err );
                            scb();
                        } );
                    },

                    // 3. Create new AccountGroup
                    function ( scb ) {
                        theNewAccountGroup = new AccountGroup( { name: 'some_group' } );
                        theNewAccountGroup.create( function ( err ) {
                            if ( err ) return scb( err );
                            scb();
                        } );
                    },


                    // 4. Create new Account
                    function ( scb ) {
                        theNewAccount = new Account( {
                            name:     'user123',
                            password: '123',
                            group:    theNewAccountGroup
                        } );
                        theNewAccount.create( function ( err ) {
                            if ( err ) return scb( err );
                            scb();
                        } );
                    }
                ],
                function ( err ) {
                    should.not.exist( err );
                    done();
                }
            );

        } );

        it( 'should create a new Account', function ( done ) {

            async.eachSeries(
                // Correct Account data

                [
                    {
                        name:     'wailorman',
                        password: '123',
                        group:    theNewAccountGroup
                    },
                    {
                        name:            'wailorman2',
                        password:        '123',
                        group:           theNewAccountGroup,
                        individualPerms: {  // Should add individual perms to the Account
                            lesson: {
                                create: true
                            }
                        }
                    },
                    {
                        name:     'wailorman3',
                        password: '123'
                        // No AccountGroup and no Individual perms => no perms
                    },
                    {
                        name:            'wailorman4',
                        password:        '123',
                        individualPerms: {
                            lesson: {
                                create: true
                            }
                        }
                    },

                    // Pass AccountGroup object as AccountGroup
                    {
                        name:     'theWailorman',
                        password: '123',
                        group:    theNewAccountGroup
                    },

                    // Passing null as group/individual perms
                    {
                        name:     'wailorman5',
                        password: '123',
                        group:    null // Method should understand that this is no group
                    },
                    {
                        name:            'wailorman6',
                        password:        '123',
                        individualPerms: null
                    }
                ],
                function ( accountData, eachCallback ) {

                    theNewAccount = new Account( accountData );

                    theNewAccount.create( function ( err, newAccount ) {
                        should.not.exist( err );

                        // id
                        newAccount.should.have.property( 'id' );
                        newAccount.id.should.be.type( 'string' );
                        mf.isObjectId( newAccount.id ).should.eql( true );


                        // name
                        newAccount.should.have.property( 'name' );
                        newAccount.name.should.be.type( 'string' );
                        newAccount.name.should.eql( accountData.name );


                        // password
                        newAccount.should.have.property( 'password' );
                        newAccount.password.should.be.type( 'string' );
                        passwordHash.isHashed( newAccount.password ).should.eql( true );

                        // individualPerms
                        if ( accountData.individualPerms ) {
                            newAccount.should.have.property( 'individualPerms' );

                            newAccount.individualPerms.should.eql( accountData.individualPerms );
                        }


                        // group
                        if ( accountData.group ) {
                            newAccount.should.have.property( 'group' );

                            //newAccount.group.should.have.properties('id', 'name', 'perms');
                            newAccount.group.id.should.eql( accountData.group.id );
                            newAccount.group.deleted.should.eql( false );

                            newAccount.group.should.be.instanceof( AccountGroup );
                        }


                        newAccount.should.be.instanceof( Account );


                        eachCallback();
                    } );

                },
                function ( err ) {
                    should.not.exist( err );
                    done();
                }
            );

        } );

        it( 'should not create Account with invalid params', function ( done ) {

            async.eachSeries(
                [
                    /*{}, // empty!

                     // Without some parameters
                     {
                     name: 'snoberik'
                     },
                     {
                     password: '123'
                     },*/

                    // Incorrect types
                    {
                        name:     'snoberik1',
                        password: '123',
                        group:    true
                    },
                    {
                        name:            'snoberik2',
                        password:        '123',
                        individualPerms: 'some string (avoid false)'
                    },
                    {
                        name:     { someParam: 'string!' },
                        password: '123'
                    },
                    {
                        name:     'snoberik4',
                        password: { someParam: 'string!' }
                    }
                ],
                function ( accountData, eachSeriesCallback ) {

                    theNewAccount = new Account( accountData );

                    theNewAccount.create( function ( err ) {
                        should.exist( err );
                        eachSeriesCallback();
                    } );

                },
                function ( err ) {
                    should.not.exist( err );
                    done();
                }
            );

        } );

        it( 'should not create Accounts with same names', function ( done ) {

            var newAccData = {
                name:     "theWailorman",
                password: "123"
            };

            theNewAccount = new Account( newAccData );

            theNewAccount.create( function ( err ) {
                should.not.exist( err );

                theNewAccount.create( function ( err ) {
                    should.exist( err );
                    done();
                } );
            } );

        } );

        // TODO verify group and individualPerms too
        it( 'should merge individual and group permissions correctly', function ( done ) {






            // Creating Account & AccountGroup for testing
            async.series(
                [
                    // 1. Create AccountGroup
                    function ( scb ) {
                        theNewAccountGroup = new AccountGroup( {
                            name:  'mergeAccountGroup',
                            perms: {
                                hall:  {
                                    create: true
                                },
                                coach: true
                            }
                        } );

                        theNewAccountGroup.create( function ( err ) {
                            if ( err ) return scb( err );
                            scb();
                        } );
                    },


                    // 2. Create Account in this AccountGroup
                    function ( scb ) {


                        async.parallel(
                            [
                                // 1st variant
                                function ( pcb ) {

                                    var someNewAccount = new Account( {
                                        name:            'mergeAccount',
                                        password:        '123',
                                        group:           theNewAccountGroup,
                                        individualPerms: {
                                            hall:   {
                                                create:  false,
                                                someObj: {
                                                    anotherProp:     true,
                                                    anotherEmptyObj: {},
                                                    anotherObj:      {
                                                        lol4ik: true
                                                    }
                                                }
                                            },
                                            lesson: {
                                                edit:        true,
                                                emptyObject: {},
                                                object:      {
                                                    prop: true
                                                }
                                            }
                                        }
                                    } );

                                    someNewAccount.create( function ( err ) {
                                        if ( err ) return pcb( err );
                                        pcb( null, someNewAccount.perms );
                                    } );

                                },

                                // 2nd variant
                                function ( pcb ) {

                                    var someNewAccount = new Account( {
                                        name:            'mergeAccount',
                                        password:        '123',
                                        individualPerms: {
                                            hall:   {
                                                create: false
                                            },
                                            lesson: {
                                                edit: true
                                            }
                                        }
                                    } );

                                    someNewAccount.create( function ( err ) {
                                        if ( err ) return pcb( err );
                                        pcb( null, someNewAccount.perms );
                                    } );

                                },

                                // 3rd variant
                                function ( pcb ) {

                                    var someNewAccount = new Account( {
                                        name:     'mergeAccount',
                                        password: '123',
                                        group:    theNewAccountGroup
                                    } );

                                    someNewAccount.create( function ( err ) {
                                        if ( err ) return pcb( err );
                                        pcb( null, someNewAccount.perms );
                                    } );

                                }
                            ],


                            // Checking merging results
                            function ( err, results ) {
                                if ( err ) return scb( err );

                                results[ 0 ].should.eql( {
                                    hall:   {
                                        create:  false,
                                        someObj: {
                                            anotherProp:     true,
                                            anotherEmptyObj: {},
                                            anotherObj:      {
                                                lol4ik: true
                                            }
                                        }
                                    },
                                    coach:  true,
                                    lesson: {
                                        edit:        true,
                                        emptyObject: {},
                                        object:      {
                                            prop: true
                                        }
                                    }
                                } );

                                results[ 1 ].should.eql( {
                                    hall:   {
                                        create: false
                                    },
                                    lesson: {
                                        edit: true
                                    }
                                } );

                                results[ 2 ].should.eql( {
                                    hall:  {
                                        create: true
                                    },
                                    coach: true
                                } );

                                scb();
                            }
                        );


                    }
                ],
                function ( err ) {
                    should.not.exist( err );

                    done();
                }
            );

        } );

        it( 'should not create Account with nonexistent AccountGroup', function ( done ) {

            var newAccData = {
                name:     "wailormanForUGroup",
                password: "123",
                group:    theNewAccountGroup
            };


            theNewAccountGroup.remove( function ( err ) {
                should.not.exist( err );

                theNewAccount = new Account( newAccData );
                theNewAccount.create( function ( err ) {
                    should.exist( err );

                    AccountGroup.create(
                        {
                            name:  'Test New Group',
                            perms: {
                                hall: {
                                    create: true
                                }
                            }
                        },
                        function ( err, newGroup ) {
                            should.not.exist( err );

                            theNewAccountGroup = newGroup;

                            done();
                        }
                    );
                } );
            } );

        } );

    } );


    testTemplates.findOne = {

        /**
         * Account.findOne[] test template
         *
         * @param {string}      funcName        Name of a function to test. Is funcName contain string 'short', template
         *                                      will work with short object mode
         *
         * @param {Array}       filters         Array of parameters to pass
         *
         * @param {function}    done            callback
         */
        shouldFind: function ( funcName, filters, done ) {

            async.eachSeries(
                filters,
                function ( filter, escb ) {

                    theNewAccount = new Account();

                    theNewAccount[ funcName ]( filter, function ( err ) {

                        should.not.exist( err );

                        if ( funcName.match( /short/igm ) ) {

                            // Use short mode

                            theNewAccount.should.have.property( 'id' );
                            theNewAccount.should.have.property( 'name' );
                            theNewAccount.should.have.property( 'group' );

                            theNewAccount.should.not.have.properties( 'perms', 'token', 'password', 'individualPerms' );

                        } else {

                            // Use full mode

                            theNewAccount.should.have.property( 'id' );
                            theNewAccount.should.have.property( 'name' );
                            theNewAccount.should.have.property( 'group' );
                            theNewAccount.should.have.property( 'perms' );
                            theNewAccount.should.have.property( 'individualPerms' );


                            theNewAccount.should.not.have.properties( 'token', 'password' );

                        }

                        escb();

                    } );

                },
                function () {
                    done();
                }
            );


        },

        /**
         * Account.findOne[] test template. Should return 404 when we trying to call passed func with passed params
         *
         * @param {string}      funcName        Name of the function to test
         *
         * @param {Array}       filters         Array of parameters to pass
         *
         * @param {function}    done            callback
         */
        shouldReturn404: function ( funcName, filters, done ) {

            async.eachSeries(
                filters,
                function ( filter, escb ) {

                    theNewAccount = new Account();

                    theNewAccount[ funcName ]( filter, function ( err ) {

                        should.exist( err );

                        err.should.be.an.instanceof( restify.ResourceNotFoundError );

                        escb();

                    } );

                },
                function () {
                    done();
                }
            );

        },

        /**
         * Account.findOne[] test template. Should call error when we trying to call passed func with passed params
         *
         * @param {string}      funcName        Name of the function to test
         *
         * @param {Array}       filters         Array of parameters to pass
         *
         * @param {function}    done            callback
         */
        shouldCallErr: function ( funcName, filters, done ) {

            async.eachSeries(
                filters,
                function ( filter, escb ) {

                    theNewAccount = new Account();

                    theNewAccount[ funcName ]( filter, function ( err ) {

                        should.exist( err );

                        escb();

                    } );

                },
                function () {
                    done();
                }
            );

        }

    };

    testTemplates.find = {

        /**
         * Account.find[] test template. Should call error when we trying to call passed func with passed params
         *
         * @param {string}          funcName                    Function name
         *
         * @param {Array}           filters                     Array of parameters objects
         *
         * @param {string|int}      expectedNumberOfObjects     String: one, several, many, much
         *                                                      Integer: number
         *
         * @param {function}        done                        callback
         */
        shouldFind: function ( funcName, filters, expectedNumberOfObjects, done ) {

            async.eachSeries(
                filters,
                function ( filter, escb ) {

                    theNewAccounts = [];
                    theNewAccounts.Account.find( filter, function ( err ) {

                        should.not.exist( err );

                        if ( typeof expectedNumberOfObjects === 'string' && expectedNumberOfObjects.match( /(one)/igm ) ) {

                            theNewAccounts.length.should.be.eql( 1 );

                        }
                        else {

                            if ( typeof expectedNumberOfObjects === 'string' && expectedNumberOfObjects.match( /(several|many|much)/igm ) ) {

                                theNewAccounts.length.should.be.greaterThan( 0 );

                            } else {

                                if ( typeof expectedNumberOfObjects === 'number' ) {

                                    theNewAccounts.length.should.be.eql( expectedNumberOfObjects );

                                } else {

                                    theNewAccounts.length.should.be.greaterThan( 0 );

                                }

                            }

                        }


                        var shortMode = funcName.match( /short/igm );


                        for ( var i in theNewAccounts ) {

                            if ( !theNewAccounts.hasOwnProperty( i ) )
                                continue;

                            if ( shortMode ) {

                                // Use short mode

                                theNewAccounts[ i ].should.have.property( 'id' );
                                theNewAccounts[ i ].should.have.property( 'name' );
                                theNewAccounts[ i ].should.have.property( 'group' );

                                theNewAccounts[ i ].should.not.have.properties( 'perms', 'token', 'password', 'individualPerms' );

                            } else {

                                // Use full mode

                                theNewAccounts[ i ].should.have.property( 'id' );
                                theNewAccounts[ i ].should.have.property( 'name' );
                                theNewAccounts[ i ].should.have.property( 'group' );
                                theNewAccounts[ i ].should.have.property( 'perms' );
                                theNewAccounts[ i ].should.have.property( 'individualPerms' );


                                theNewAccounts[ i ].should.not.have.properties( 'token', 'password' );

                            }

                        }

                        escb();

                    } );

                },
                function () {
                    done();
                }
            );

        },

        /**
         * Account.find[] test template. Should return 404 when we trying to call passed func with passed params
         *
         * @param {string}      funcName        Name of the function to test
         *
         * @param {Array}       filters         Array of parameters to pass
         *
         * @param {function}    done            callback
         */
        shouldReturn404: function ( funcName, filters, done ) {

            async.eachSeries(
                filters,
                function ( filter, escb ) {

                    theNewAccounts = [];

                    theNewAccounts[ funcName ]( filter, function ( err ) {

                        should.exist( err );

                        err.should.be.an.instanceof( restify.ResourceNotFoundError );

                        escb();

                    } );

                },
                function () {
                    done();
                }
            );

        },

        /**
         * Account.find[] test template. Should call error when we trying to call passed func with passed params
         *
         * @param {string}      funcName        Name of the function to test
         *
         * @param {Array}       filters         Array of parameters to pass
         *
         * @param {function}    done            callback
         */
        shouldCallErr: function ( funcName, filters, done ) {

            async.eachSeries(
                filters,
                function ( filter, escb ) {

                    theNewAccounts = [];

                    theNewAccount[ funcName ]( filter, function ( err ) {

                        should.exist( err );

                        escb();

                    } );

                },
                function () {
                    done();
                }
            );

        }

    };


    describe( '.findOneShort', function () {

        // reCreate
        beforeEach( function ( done ) {

            reCreate.Accounts( function () {
                done();
            } );

        } );

        it( 'should find short by id, name, group', function ( done ) {

            testTemplates.findOne.shouldFind( 'findOneShort', [
                { id: theNewAccount.id },
                { name: theNewAccount.name },
                { group: theNewAccount.group }
            ], done );

        } );

        it( 'should not find with invalid types', function ( done ) {

            testTemplates.findOne.shouldCallErr( 'findOneShort', [
                {},
                null,

                { id: '' },
                { id: false },
                { id: theNewAccountGroup },

                { name: '' },
                { name: false },
                { name: theNewAccountGroup },

                { group: '' },
                { group: false }
            ], done );

        } );

        it( 'should find short by token' );

        it( 'should not find nonexistent', function ( done ) {

            testTemplates.findOne.shouldReturn404( 'findOneShort', [ { id: '000000000000000000000000' } ], done );

        } );

        it( 'should return 404 when find by correctly password or individualPerms', function ( done ) {

            testTemplates.findOne.shouldReturn404( 'findOneShort',
                [
                    { password: theNewAccountArguments.password },
                    { individualPerms: theNewAccountArguments.individualPerms }
                ],
                done );

        } );

    } );

    describe( '.findOne', function () {

        // reCreate
        beforeEach( function ( done ) {

            reCreate.Accounts( function () {
                done();
            } );

        } );

        it( 'should find full by id, name, group', function ( done ) {

            testTemplates.findOne.shouldFind( 'findOne', [
                { id: theNewAccount.id },
                { name: theNewAccount.name },
                { group: theNewAccount.group }
            ], done );

        } );

        it( 'should not find with invalid types', function ( done ) {

            testTemplates.findOne.shouldCallErr( 'findOne', [
                {},
                null,

                { id: '' },
                { id: false },
                { id: theNewAccountGroup },

                { name: '' },
                { name: false },
                { name: theNewAccountGroup },

                { group: '' },
                { group: false }
            ], done );

        } );

        it( 'should find short by token' );

        it( 'should not find nonexistent', function ( done ) {

            testTemplates.findOne.shouldReturn404( 'findOne', [ { id: '000000000000000000000000' } ], done );

        } );

        it( 'should return 404 when find by correctly password or individualPerms', function ( done ) {

            testTemplates.findOne.shouldReturn404( 'findOne',
                [
                    { password: theNewAccountArguments.password },
                    { individualPerms: theNewAccountArguments.individualPerms }
                ],
                done );

        } );

    } );

    describe( '.find', function () {

        // reCreate
        beforeEach( function ( done ) {

            reCreate.Accounts( function () {
                done();
            } );

        } );

        it( 'should find full one by id, name', function ( done ) {

            testTemplates.find.shouldFind( 'find',
                [
                    { id: theNewAccountArguments.id },
                    { name: theNewAccountArguments.name }
                ], 1, done );

        } );

        it( 'should find full !several! by group', function ( done ) {

            async.times( 3, function ( tcb ) {

                // First - create three Accounts with same group

                var acc = new Account();

                acc.create( {
                    name: 'severalFull' + n,
                    password:        '123',
                    group:           theNewAccountGroup,
                    individualPerms: {
                        hall: {
                            create: true
                        }
                    }
                }, function ( err ) {

                    should.not.exist( err );
                    tcb();

                } );


            }, function () {

                // Second - find them

                testTemplates.find.shouldFind(
                    'find',
                    [ { group: theNewAccountGroup } ],
                    3,
                    done
                );

            } );

        } );

        it( 'should find full by token' );

        it( 'should not find nonexistent', function ( done ) {

            testTemplates.find.shouldReturn404(
                'find',
                [ { id: '000000000000000000000000' } ],
                done
            );

        } );

        it( 'should return 404 when find by password or individualPerms', function ( done ) {

            testTemplates.find.shouldReturn404(
                'find',
                [
                    { password: '123' },
                    {
                        individualPerms: {
                            hall: {
                                create: true
                            }
                        }
                    }
                ],
                done
            );

        } );

    } );

    describe( '.findShort', function () {

        // reCreate
        beforeEach( function ( done ) {

            reCreate.Accounts( function () {
                done();
            } );

        } );

        it( 'should find full one by id, name', function ( done ) {

            testTemplates.find.shouldFind( 'findShort',
                [
                    { id: theNewAccountArguments.id },
                    { name: theNewAccountArguments.name }
                ], 1, done );

        } );

        it( 'should find full !several! by group', function ( done ) {

            async.times( 3, function ( tcb ) {

                // First - create three Accounts with same group

                var acc = new Account();

                acc.create( {
                    name: 'severalFull' + n,
                    password:        '123',
                    group:           theNewAccountGroup,
                    individualPerms: {
                        hall: {
                            create: true
                        }
                    }
                }, function ( err ) {

                    should.not.exist( err );
                    tcb();

                } );


            }, function () {

                // Second - find them

                testTemplates.find.shouldFind(
                    'findShort',
                    [ { group: theNewAccountGroup } ],
                    3,
                    done
                );

            } );

        } );

        it( 'should find short by token' );

        it( 'should not find nonexistent', function ( done ) {

            testTemplates.find.shouldReturn404(
                'findShort',
                [ { id: '000000000000000000000000' } ],
                done
            );

        } );

        it( 'should return 404 when find by password or individualPerms', function ( done ) {

            testTemplates.find.shouldReturn404(
                'findShort',
                [
                    { password: '123' },
                    {
                        individualPerms: {
                            hall: {
                                create: true
                            }
                        }
                    }
                ],
                done
            );

        } );

    } );


    describe( '.update', function () {

        // Recreate Accounts and AccountGroups
        beforeEach( function ( done ) {

            reCreate.full( done );

        } );

        it( 'should update Account data', function ( done ) {
            async.series( [

                // name
                // group
                // password
                // individualPerms

                // name
                function ( scb ) {
                    theNewAccount.name = 'noWailorman';
                    theNewAccount.update( function ( err, doc ) {
                        should.not.exist( err );

                        doc.name.should.eql( 'noWailorman' );

                        //theNewAccount = doc;
                        scb();
                    } );
                },

                // group
                function ( scb ) {
                    // First, create new group
                    var newGroupForUpdate = new AccountGroup( { name: 'groupForUpdate' } );

                    newGroupForUpdate.create(
                        function ( err ) {
                            should.not.exist( err );


                            theNewAccount.group = newGroupForUpdate;
                            theNewAccount.update( function ( err ) {
                                should.not.exist( err );

                                //theNewAccount.id.should.eql(newGroupForUpdate.id);
                                theNewAccount.deleted.should.eql( newGroupForUpdate.deleted );
                                theNewAccount.group.name.should.eql( newGroupForUpdate.name );
                                theNewAccount.perms.should.eql( newGroupForUpdate.perms );

                                scb();
                            } );

                        }
                    );
                },

                // password
                function ( scb ) {

                    theNewAccount.password = 'no123';
                    theNewAccount.update( function ( err, doc ) {
                        should.not.exist( err );

                        passwordHash.verify( 'no123', doc.password );

                        theNewAccount = doc;
                        scb();
                    } );

                },

                // individualPerms
                function () {

                    theNewAccount.individualPerms = { someIndPerms: true };
                    theNewAccount.update( function ( err, newAccountObject ) {
                        should.not.exist( err );

                        newAccountObject.individualPerms.should.eql( { someIndPerms: true } );

                        theNewAccount = newAccountObject;

                        done();
                    } );

                }
            ] );
        } );

        it( 'should not update Account data with invalid params', function ( done ) {

            var invalidNewData = {
                name:            [ '', '   ', true, false, null, {} ],
                password:        [ '', '  ', true, false, null, {} ],
                group:           [ '', '   ', true, {}, theNewAccount ],
                individualPerms: [ true, theNewAccount ]
            };

            // {...}
            async.each(
                invalidNewData,
                function ( propertyOfNewData, ecb ) {

                    // [...]
                    async.each(
                        propertyOfNewData,
                        function ( newData, ecb2 ) {


                            // e.g. theNewAccount.name = ...
                            theNewAccount[ propertyOfNewData ] = newData;
                            theNewAccount.update( function ( err ) {
                                should.exist( err );
                                ecb2();
                            } );
                        },
                        function ( err ) {
                            should.not.exist( err );
                            ecb();
                        }
                    );
                },
                function ( err ) {
                    should.not.exist( err );
                    done();
                }
            );

        } );

        it( 'should not update Account.group to nonexistent AccountGroup', function ( done ) {

            var testGroup;

            async.series( [

                // Create test group
                function ( scb ) {

                    testGroup = new AccountGroup();
                    testGroup.create( { name: 'theTestGroup' },
                        function ( err, doc ) {
                            should.not.exist( err );

                            testGroup = doc;

                            scb();
                        } );
                },


                // Remove created group
                function ( scb ) {

                    testGroup.remove( function ( err ) {
                        should.not.exist( err );
                        scb();
                    } );

                },


                // Let's update Account data
                function () {

                    theNewAccount.group = testGroup;

                    theNewAccount.update( function ( err ) {
                        should.exist( err );

                        done();
                    } );

                }

            ] );

        } );

        it( 'should not update Account name to name of the existent Account', function ( done ) {

            var testAccount;

            async.series( [

                // Create testAccount with name wailormanEx1
                function ( scb ) {

                    testAccount = new Account( { name: 'wailormanEx1', password: '123' } );
                    testAccount.create( function ( err, doc ) {
                        should.not.exist( err );

                        testAccount = doc;

                        scb();
                    } );

                },


                // Update existed Account name to wailormanEx1
                function () {

                    theNewAccount.name = 'wailormanEx1';
                    theNewAccount.update( function ( err ) {
                        should.exist( err );
                        done();
                    } );

                }

            ] );

        } );

    } );


    xdescribe( '.remove', function () {

        beforeEach( function ( done ) {

            async.series( [

                // Remove all old Accounts
                function ( seriesCallback ) {
                    AccountModel.find().remove().exec( function ( err ) {
                        should.not.exist( err );
                        seriesCallback();
                    } );
                },

                // Create a new Account for tests
                function () {

                    theNewAccount = new Account( {
                        name:            'wailormanRemove',
                        password:        '123',
                        group:           theNewAccountGroup,
                        individualPerms: {
                            coaches: {
                                create: true
                            }
                        }
                    } );

                    theNewAccount.create( function ( err, createdAccount ) {
                        should.not.exist( err );

                        theNewAccount = createdAccount;

                        done();
                    } );

                }
            ] );

        } );

        it( 'should remove Account', function ( done ) {

            theNewAccount.remove( function ( err ) {
                should.not.exist( err );
                done();
            } );

        } );

        it( 'should not find removed Account', function ( done ) {

            theNewAccount.remove( function ( err ) {
                should.not.exist( err );

                var getAccount = new Account();
                getAccount.getById( theNewAccount.id, function ( err ) {
                    should.exist( err );

                    done();
                } );

            } );

        } );

        // -
        xit( 'should mark removed Account {deleted: true}' );

        it( 'should not remove already removed Account', function ( done ) {

            theNewAccount.remove( function ( err ) {
                should.not.exist( err );

                theNewAccount.remove( function ( err ) {
                    should.exist( err );
                    done();
                } );
            } );

        } );

        it( 'should not remove Account with invalid id', function ( done ) {

            theNewAccount.id = '1234';
            theNewAccount.remove( function ( err ) {
                should.exist( err );
                done();
            } );

        } );

        // -
        xit( 'should terminate all sessions of the Account' );

    } );


    xdescribe( '.auth', function () {

        beforeEach( function ( done ) {

            async.series( [

                // Remove all old Accounts
                function ( seriesCallback ) {
                    AccountModel.find().remove().exec( function ( err ) {
                        should.not.exist( err );
                        seriesCallback();
                    } );
                },

                // Create a new Account for tests
                function () {

                    theNewAccount = new Account( {
                        name:            'wailormanAuth',
                        password:        '123',
                        group:           theNewAccountGroup,
                        individualPerms: {
                            coaches: {
                                create: true
                            }
                        }
                    } );

                    theNewAccount.create( function ( err, createdAccount ) {
                        should.not.exist( err );

                        theNewAccount = createdAccount;

                        done();
                    } );

                }
            ] );

        } );

        it( 'should authenticate Account', function ( done ) {

            theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                should.not.exist( err );

                doc.token[ 0 ].should.be.type( 'string' );

                done();
            } );

        } );

        it( 'should authenticate Account again', function ( done ) {

            // First auth
            theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                should.not.exist( err );

                doc.token.should.be.type( 'string' );
                var firstToken = doc.token[ 0 ];

                // Second auth
                theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                    should.not.exist( err );

                    doc.token[ 1 ].should.be.type( 'string' );
                    doc.token[ 0 ].should.eql( firstToken );
                    doc.token[ 1 ].should.not.eql( firstToken );

                    done();
                } );
            } );

        } );

        it( 'should check Account have two tokens after twice authorization', function ( done ) {

            // First auth
            theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                should.not.exist( err );

                doc.token[ 0 ].should.be.type( 'string' );
                var firstToken = doc.token[ 0 ];

                // Second auth
                theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                    should.not.exist( err );

                    doc.token[ 1 ].should.be.type( 'string' );
                    doc.token[ 0 ].should.eql( firstToken );
                    doc.token[ 1 ].should.not.eql( firstToken );


                    var secondToken = doc.token[ 1 ];


                    var account1 = new Account();
                    var account2 = new Account();

                    account1.getByToken( firstToken, function ( err, doc ) {
                        should.not.exist( err );
                        doc.id.should.eql( theNewAccount.id );

                        account2.getByToken( secondToken, function ( err, doc ) {
                            should.not.exist( err );
                            doc.id.should.eql( theNewAccount.id );

                            done();
                        } );

                    } );
                } );
            } );

        } );

        it( 'should not authenticate user with incorrect pass', function ( done ) {

            theNewAccount.auth( theNewAccount.name, '12345678987654', function ( err ) {
                should.exist( err );
                done();
            } );

        } );

        it( 'should not authenticate with incorrect params', function ( done ) {

            async.each(
                [
                    {
                        name:     theNewAccount.name,
                        password: null
                    },
                    {
                        name:     theNewAccount.name,
                        password: ''
                    },
                    {
                        name:     true,
                        password: true
                    },
                    {
                        name:     null,
                        password: null
                    }
                ],
                function ( authData, escb ) {
                    theNewAccount.auth( authData.name, authData.password, function ( err ) {
                        should.exist( err );
                        escb();
                    } );
                },
                function ( err ) {
                    should.not.exist( err );
                    done();
                }
            );

        } );

    } );


    xdescribe( '.logout', function () {

        beforeEach( function ( done ) {

            async.series( [

                // Remove all old Accounts
                function ( seriesCallback ) {
                    AccountModel.find().remove().exec( function ( err ) {
                        should.not.exist( err );
                        seriesCallback();
                    } );
                },

                // Create a new Account for tests
                function () {

                    theNewAccount = new Account( {
                        name:            'wailormanLogout',
                        password:        '123',
                        group:           theNewAccountGroup,
                        individualPerms: {
                            coaches: {
                                create: true
                            }
                        }
                    } );

                    theNewAccount.create( function ( err, createdAccount ) {
                        should.not.exist( err );

                        theNewAccount = createdAccount;

                        done();
                    } );

                }
            ] );

        } );

        it( 'should terminate all sessions of the Account', function ( done ) {

            theNewAccount.auth( theNewAccount.name, '123', function ( err ) {
                should.not.exist( err );

                theNewAccount.auth( theNewAccount.name, '123', function ( err ) {
                    should.not.exist( err );

                    theNewAccount.logoutAll( function ( err, doc ) {
                        should.not.exist( err );

                        doc.id.should.eql( theNewAccount.id );

                        doc.token.length.should.eql( 0 );

                        done();

                        // TODO Write DB checking
                    } );
                } );

            } );

        } );

        it( 'should terminate only one session of the Account', function ( done ) {

            theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                should.not.exist( err );
                var firstToken = doc.token[ 0 ];

                theNewAccount.auth( theNewAccount.name, '123', function ( err ) {
                    should.not.exist( err );
                    var secondToken = doc.token[ 1 ];

                    theNewAccount.logout( firstToken, function ( err, doc ) {
                        should.not.exist( err );

                        doc.id.should.eql( theNewAccount.id );

                        doc.token.length.should.eql( 1 );

                        doc.token[ 0 ].should.eql( secondToken );

                        done();

                        // TODO Write DB checking
                    } );
                } );

            } );

        } );

        it( 'should not call method with incorrect params', function ( done ) {

            async.each(
                [
                    '', '123', true, false, null, {}
                ],
                function ( token, ecb ) {
                    theNewAccount.logout( token, function ( err ) {
                        should.exist( err );
                        ecb();
                    } );
                },
                function ( err ) {
                    should.not.exist( err );
                    done();
                }
            );

        } );

        it( 'should not call error when we calling .logoutAll without any active sessions', function ( done ) {

            theNewAccount.logoutAll( function ( err ) {
                should.not.exist( err );
                done();
            } );

        } );

        it( 'should call error when terminating nonexistent session', function ( done ) {

            theNewAccount.logout( '000000000000000000000000', function ( err ) {
                should.exist( err );
                done();
            } );

        } );

        it( 'should not terminate sessions of nonexistent Account', function ( done ) {

            theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                should.not.exist( err );

                var token = doc.token[ 0 ];
                doc.remove( function ( err ) {
                    should.not.exist( err );

                    theNewAccount.getByToken( token, function ( err ) {
                        should.exist( err );
                        done();
                    } );

                } );

            } );

        } );

    } );

} );