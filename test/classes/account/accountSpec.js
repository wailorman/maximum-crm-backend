var should            = require( 'should' ),
    mongoose          = require( 'mongoose' ),
    async             = require( 'async' ),
    passwordHash      = require( 'password-hash' ),
    mf                = require( '../../../libs/mini-funcs.js' ),
    restify           = require( 'restify' ),

    Account           = require( '../../../classes/account/account.js' ),
    AccountModel      = require( '../../../classes/account/account-model.js' ).AccountModel,

    AccountGroup      = require( '../../../classes/account-group/account-group.js' ),
    AccountGroupModel = require( '../../../classes/account-group/account-group-model.js' ).AccountGroupModel;


var theNewAccount, theNewAccounts, theNewAccountGroup, theNewAccountArguments;

var testTemplates = {

    findOne: {
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

                            theNewAccount.isShort().should.be.eql( true );

                        } else {

                            // Use full mode

                            theNewAccount.isFull().should.be.eql( true );

                            if ( theNewAccount.hasOwnProperty( 'password' ) )
                                passwordHash.isHashed( theNewAccount.password ).should.be.eql( true );


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

            async.each(
                filters,
                function ( filter, escb ) {

                    var theLocalNewAccount;

                    theLocalNewAccount = new Account();

                    theLocalNewAccount[ funcName ]( filter, function ( err ) {

                        should.exist( err );

                        escb();

                    } );

                },
                function () {
                    done();
                }
            );

        }


    },
    find:    {

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
                    theNewAccounts[ funcName ]( filter, function ( err ) {

                        should.not.exist( err );

                        if ( typeof expectedNumberOfObjects === 'string' && expectedNumberOfObjects.match( /(one)/igm ) ) {

                            theNewAccounts.length.should.be.eql( 1 );

                        } else if ( typeof expectedNumberOfObjects === 'string' && expectedNumberOfObjects.match( /(several|many|much)/igm ) ) {

                            theNewAccounts.length.should.be.greaterThan( 0 );

                        } else if ( typeof expectedNumberOfObjects === 'number' ) {

                            theNewAccounts.length.should.be.eql( expectedNumberOfObjects );

                        } else {

                            theNewAccounts.length.should.be.greaterThan( 0 );

                        }


                        var shortMode = funcName.match( /short/igm );


                        for ( var i in theNewAccounts ) {

                            if ( ! theNewAccounts.hasOwnProperty( i ) )
                                continue;

                            if ( shortMode ) {

                                // Use short mode

                                theNewAccounts[ i ].isShort().should.be.eql( true );

                            } else {

                                // Use full mode

                                theNewAccounts[ i ].isFull().should.be.eql( true );

                                if ( theNewAccounts[ i ].hasOwnProperty( 'password' ) )
                                    passwordHash.isHashed( theNewAccounts[ i ].password ).should.be.eql( true );

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

    }

};


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

var reCreate = {

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


    describe( 'objectSize', function () {

        describe( '.isShort', function () {

            it( 'should detect short object', function ( done ) {

                theNewAccount = new Account();

                theNewAccount.id = '00000000000000000000000';
                theNewAccount.name = 'wailorman';
                theNewAccount.group = theNewAccountGroup;

                theNewAccount.isShort().should.be.eql( true );

                done();

            } );

            it( 'should detect not short object (not full, not short)', function ( done ) {

                theNewAccount = new Account();

                theNewAccount.id = '00000000000000000000000';
                theNewAccount.name = 'wailorman';
                theNewAccount.group = theNewAccountGroup;
                theNewAccount.perms = {
                    somePerm: {
                        create: true
                    }
                };

                theNewAccount.isShort().should.be.eql( false );

                done();

            } );

            it( 'should detect not short object (full)', function ( done ) {

                theNewAccount = new Account();

                theNewAccount.id = '00000000000000000000000';
                theNewAccount.name = 'wailorman';
                theNewAccount.group = theNewAccountGroup;
                theNewAccount.perms = {
                    somePerm: {
                        create: true
                    }
                };
                theNewAccount.individualPerms = {
                    somePerm: {
                        create: true
                    }
                };

                theNewAccount.isShort().should.be.eql( false );

                done();

            } );

            it( 'should detect short object without group as short object', function ( done ) {

                theNewAccount = new Account();

                theNewAccount.id = '00000000000000000000000';
                theNewAccount.name = 'wailorman';

                theNewAccount.isShort().should.be.eql( true );

                done();

            } );

        } );

        describe( '.isFull', function () {

            it( 'should detect full object with std properties', function ( done ) {

                theNewAccount = new Account();

                theNewAccount.id = '00000000000000000000000';
                theNewAccount.name = 'wailorman';
                theNewAccount.group = theNewAccountGroup;
                theNewAccount.perms = {
                    somePerm: {
                        create: true
                    }
                };
                theNewAccount.individualPerms = {
                    somePerm: {
                        create: true
                    }
                };

                theNewAccount.isFull().should.be.eql( true );

                done();

            } );

            it( 'should detect full object with other properties', function ( done ) {

                theNewAccount = new Account();

                theNewAccount.id = '00000000000000000000000';
                theNewAccount.name = 'wailorman';
                theNewAccount.group = theNewAccountGroup;
                theNewAccount.perms = {
                    somePerm: {
                        create: true
                    }
                };
                theNewAccount.individualPerms = {
                    somePerm: {
                        create: true
                    }
                };
                theNewAccount.password = '123';
                theNewAccount.token = '22345678743234567876543';


                theNewAccount.isFull().should.be.eql( true );

                done();

            } );

            it( 'should detect not full object without some required properties', function ( done ) {

                theNewAccount = new Account();

                theNewAccount.id = '00000000000000000000000';
                theNewAccount.name = 'wailorman';
                theNewAccount.group = theNewAccountGroup;

                theNewAccount.isFull().should.be.eql( false );

                done();

            } );

            it( 'should detect object with id, name, perms properties only as full object', function ( done ) {

                theNewAccount = new Account();

                theNewAccount.id = '00000000000000000000000';
                theNewAccount.name = 'wailorman';
                theNewAccount.perms = {};
                theNewAccount.individualPerms = {};

                theNewAccount.isFull().should.be.eql( true );

                done();

            } );

            it( 'Account object with id and name only is not full', function ( done ) {

                theNewAccount = new Account();

                theNewAccount.id = '00000000000000000000000';
                theNewAccount.name = 'wailorman';

                theNewAccount.isFull().should.be.eql( false );

                done();

            } );

        } );

    } );


    describe( 'filter validating', function () {

        before( function ( done ) {

            reCreate.full( function ( err ) {
                should.not.exist( err );
                done();
            } );

        } );

        describe( 'validators', function () {

            describe( 'id', function () {

                it( 'should validate', function ( done ) {

                    theNewAccount._validators.id( '548dfad210b13dc0226ef8c1', function ( err ) {
                        should.not.exist( err );
                        done();
                    } );

                } );

                it( 'should not validate', function ( done ) {

                    async.each(
                        [
                            '0',
                            null,
                            true,
                            {},
                            ''
                        ],
                        theNewAccount._validators.id,
                        function ( err ) {
                            should.exist( err );
                            done();
                        }
                    );

                } );

            } );

            describe( 'name', function () {

                it( 'should validate', function ( done ) {

                    async.each(
                        [
                            'wailorman',
                            'snoberik',
                            'iTs Some STRanGe StRiNg'
                        ],
                        theNewAccount._validators.name,
                        function ( err ) {
                            should.not.exist( err );
                            done();
                        }
                    );

                } );

                it( 'should not validate', function ( done ) {

                    async.each(
                        [
                            '',
                            false,
                            true,
                            {},
                            null
                        ],
                        theNewAccount._validators.name,
                        function ( err ) {
                            should.exist( err );
                            done();
                        }
                    );

                } );

            } );

            describe( 'group', function () {

                it( 'should validate', function ( done ) {

                    async.each(
                        [
                            theNewAccountGroup
                        ],
                        theNewAccount._validators.group,
                        function ( err ) {
                            should.not.exist( err );
                            done();
                        }
                    );

                } );

                it( 'should not validate', function ( done ) {

                    async.series(
                        [
                            function ( scb ) {

                                theNewAccountGroup.remove( function ( err ) {

                                    should.not.exist( err );
                                    scb();

                                } );

                            },
                            function ( scb ) {

                                async.each(
                                    [
                                        theNewAccountGroup
                                    ],
                                    theNewAccount._validators.group,
                                    function ( err ) {
                                        should.exist( err );
                                        scb();
                                    }
                                );

                            },
                            function () {

                                reCreate.full( function () {
                                    done();
                                } );

                            }
                        ]
                    );

                } );

            } );

        } );

        describe( '._validateParameters()', function () {

            it( 'should validate successfully', function ( done ) {

                async.each(
                    [
                        { id: '548dfad210b13dc0226ef8c1' },
                        { name: 'wailorman' },
                        { group: theNewAccountGroup }
                    ],
                    theNewAccount._validateParameters,
                    function ( err ) {
                        should.not.exist( err );
                        done();
                    }
                );

            } );

            it( 'should not validate', function ( done ) {

                async.series(
                    [
                        // Remove AccountGroup
                        function ( scb ) {

                            theNewAccountGroup.remove( function ( err ) {

                                should.not.exist( err );
                                scb();

                            } );

                        },

                        // Try to validate
                        function ( scb ) {

                            async.eachSeries(
                                [
                                    { id: '0' },
                                    { id: null },
                                    { id: true },
                                    { id: true },
                                    { id: {} },
                                    { id: '' },


                                    { name: '' },
                                    { name: false },
                                    { name: true },
                                    { name: {} },
                                    { name: null },


                                    { token: '' },
                                    { token: 'a' },
                                    { token: null },
                                    { token: true },
                                    { token: false },
                                    { token: {} },
                                    { token: [] },


                                    { group: theNewAccountGroup }
                                ],
                                theNewAccount._validateParameters,
                                function ( err ) {
                                    should.exist( err );
                                    scb();
                                }
                            );

                        },

                        // ReCreate AccountGroup
                        function () {

                            reCreate.full( function () {

                                done();

                            } );

                        }
                    ]
                );


            } );

        } );

    } );

    describe( '._prepareFindQuery()', function () {

        before( function ( done ) {

            reCreate.full( function ( err ) {
                should.not.exist( err );
                done();
            } );

        } );

        it( 'should prepare query by simple filter', function ( done ) {

            var theAccountGroups = [];
            var suiteAccountGroup;

            async.series(
                [
                    // Creating AccountGroups for testing
                    function ( scb ) {

                        async.each(
                            [
                                // Parameters to create new AccountGroups
                                { name: 'test AccountGroup #1' },
                                { name: 'test AccountGroup #2' }
                            ],
                            function ( parameters, ecb ) {

                                suiteAccountGroup = new AccountGroup();
                                suiteAccountGroup.create( parameters, ecb );
                                theAccountGroups.push( suiteAccountGroup );

                            },
                            function ( err ) {

                                should.not.exist( err );
                                scb();

                            }
                        );

                    },

                    // testing
                    function ( scb ) {

                        async.eachSeries(
                            [
                                [
                                    {}, // What we actually pass to filter
                                    { deleted: false }  // What we should to get
                                ],


                                [
                                    { id: '548dfad210b13dc0226ef8c1' },
                                    {
                                        $and:    [
                                            {
                                                $or: [
                                                    { _id: mf.ObjectId( '548dfad210b13dc0226ef8c1' ) }
                                                ]
                                            }
                                        ],
                                        deleted: false
                                    }
                                ],
                                [
                                    { id: [ '548dfad210b13dc0226ef8c1', '548dfad210b13dc0226ef8c2' ] },
                                    {
                                        $and:    [
                                            {
                                                $or: [
                                                    { _id: mf.ObjectId( '548dfad210b13dc0226ef8c1' ) },
                                                    { _id: mf.ObjectId( '548dfad210b13dc0226ef8c2' ) }
                                                ]
                                            }
                                        ],
                                        deleted: false
                                    }
                                ],


                                [
                                    { name: 'wailorman' },
                                    {
                                        $and:    [
                                            {
                                                $or: [
                                                    { name: 'wailorman' }
                                                ]
                                            }
                                        ],
                                        deleted: false
                                    }
                                ],
                                [
                                    { name: [ 'wailorman', 'snoberik' ] },
                                    {
                                        $and:    [
                                            {
                                                $or: [
                                                    { name: 'wailorman' },
                                                    { name: 'snoberik' }
                                                ]
                                            }
                                        ],
                                        deleted: false
                                    }
                                ],


                                [
                                    { group: theAccountGroups[ 0 ] },
                                    {
                                        $and:    [
                                            {
                                                group: {
                                                    $in: [ mf.ObjectId( theAccountGroups[ 0 ].id ) ]
                                                }
                                            }
                                        ],
                                        deleted: false
                                    }
                                ],
                                [
                                    {
                                        group: [ theAccountGroups[ 0 ], theAccountGroups[ 1 ].id ]
                                    },
                                    {
                                        $and:    [
                                            {
                                                group: {
                                                    $in: [ mf.ObjectId( theAccountGroups[ 0 ].id ), mf.ObjectId( theAccountGroups[ 1 ].id ) ]
                                                }
                                            }
                                        ],
                                        deleted: false
                                    }
                                ],


                                [
                                    {
                                        name:  [ 'wailorman', 'snoberik' ],
                                        group: [ theAccountGroups[ 0 ], theAccountGroups[ 1 ] ]
                                    },
                                    {
                                        $and:    [
                                            {
                                                $or: [
                                                    { name: 'wailorman' },
                                                    { name: 'snoberik' }
                                                ]
                                            },

                                            {
                                                group: {
                                                    $in: [ mf.ObjectId( theAccountGroups[ 0 ].id ), mf.ObjectId( theAccountGroups[ 1 ].id ) ]
                                                }
                                            }
                                        ],
                                        deleted: false
                                    }
                                ]
                            ],
                            function ( parameters, escb ) {

                                theNewAccount._prepareFindQuery( parameters[ 0 ], function ( err, query ) {
                                    should.not.exist( err );

                                    query.should.be.eql( parameters[ 1 ] );

                                    escb();

                                } );


                            },
                            function () {
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
                        theNewAccountGroup = new AccountGroup();
                        theNewAccountGroup.create( { name: 'some_group' },
                            function ( err ) {
                                if ( err ) return scb( err );
                                scb();
                            } );
                    },


                    // 4. Create new Account
                    function ( scb ) {
                        theNewAccount = new Account();
                        theNewAccount.create(
                            {
                                name:     'user123',
                                password: '123',
                                group:    theNewAccountGroup
                            },
                            function ( err ) {
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

                    theNewAccount = new Account();

                    theNewAccount.create( accountData, function ( err ) {
                        should.not.exist( err );

                        // id
                        theNewAccount.should.have.property( 'id' );
                        theNewAccount.id.should.be.type( 'string' );
                        mf.isObjectId( theNewAccount.id ).should.eql( true );


                        // name
                        theNewAccount.should.have.property( 'name' );
                        theNewAccount.name.should.be.type( 'string' );
                        theNewAccount.name.should.eql( accountData.name );

                        // individualPerms
                        if ( accountData.individualPerms ) {
                            theNewAccount.should.have.property( 'individualPerms' );

                            theNewAccount.individualPerms.should.eql( accountData.individualPerms );
                        }


                        // group
                        if ( accountData.group ) {
                            theNewAccount.should.have.property( 'group' );

                            //newAccount.group.should.have.properties('id', 'name', 'perms');
                            theNewAccount.group.id.should.eql( accountData.group.id );

                            theNewAccount.group.should.be.instanceof( AccountGroup );
                        }


                        theNewAccount.should.be.instanceof( Account );


                        eachCallback();
                    } );

                },
                function ( err ) {
                    should.not.exist( err );
                    done();
                }
            );

        } );

        describe( 'perms merging', function () {

            var groupForTest, accountForTest;

            beforeEach( function ( done ) {

                cleanUp.full( done );

            } );

            it( 'no perms', function ( done ) {

                async.series(
                    [

                        // . Creare group
                        function ( scb ) {

                            groupForTest = new AccountGroup();

                            groupForTest.create(
                                {
                                    name: 'group'
                                },
                                function ( err ) {

                                    should.not.exist( err );
                                    scb();

                                }
                            );

                        },

                        // . Create account
                        function ( scb ) {

                            accountForTest = new Account();

                            accountForTest.create(
                                {
                                    name:     'account',
                                    password: '1234',
                                    group:    groupForTest
                                },
                                function ( err ) {
                                    should.not.exist( err );
                                    scb();
                                }
                            );

                        },

                        // . Check permissions
                        function ( scb ) {

                            accountForTest.perms.should.eql( {} );
                            accountForTest.individualPerms.should.eql( {} );
                            scb();

                        }

                    ],
                    function () {
                        done();
                    }
                );

            } );

            it( 'group perms only', function ( done ) {

                async.series(
                    [

                        // . Creare group
                        function ( scb ) {

                            groupForTest = new AccountGroup();

                            groupForTest.create(
                                {
                                    name:  'group',
                                    perms: {
                                        hall: {
                                            create: true
                                        }
                                    }
                                },
                                function ( err ) {

                                    should.not.exist( err );
                                    scb();

                                }
                            );

                        },

                        // . Create account
                        function ( scb ) {

                            accountForTest = new Account();

                            accountForTest.create(
                                {
                                    name:     'account',
                                    group:    groupForTest,
                                    password: '1234'
                                },
                                function ( err ) {
                                    should.not.exist( err );
                                    scb();
                                }
                            );

                        },

                        // . Check permissions
                        function ( scb ) {

                            accountForTest.perms.should.eql(
                                {
                                    hall: {
                                        create: true
                                    }
                                }
                            );
                            accountForTest.individualPerms.should.eql( {} );
                            scb();

                        }

                    ],
                    function () {
                        done();
                    }
                );

            } );

            it( 'group and individual perms', function ( done ) {

                async.series(
                    [

                        // . Creare group
                        function ( scb ) {

                            groupForTest = new AccountGroup();

                            groupForTest.create(
                                {
                                    name:  'group',
                                    perms: {
                                        hall: {
                                            create: true
                                        }
                                    }
                                },
                                function ( err ) {

                                    should.not.exist( err );
                                    scb();

                                }
                            );

                        },

                        // . Create account
                        function ( scb ) {

                            accountForTest = new Account();

                            accountForTest.create(
                                {
                                    name:            'account',
                                    password:        '1234',
                                    group:           groupForTest,
                                    individualPerms: {
                                        lesson: {
                                            create: true
                                        }
                                    }
                                },
                                function ( err ) {
                                    should.not.exist( err );
                                    scb();
                                }
                            );

                        },

                        // . Check permissions
                        function ( scb ) {

                            accountForTest.perms.should.eql(
                                {
                                    hall:   {
                                        create: true
                                    },
                                    lesson: {
                                        create: true
                                    }
                                }
                            );
                            accountForTest.individualPerms.should.eql(
                                {
                                    lesson: {
                                        create: true
                                    }
                                }
                            );
                            scb();

                        }

                    ],
                    function () {
                        done();
                    }
                );

            } );

            it( 'individual perms only', function ( done ) {

                async.series(
                    [

                        // . Creare group
                        function ( scb ) {

                            groupForTest = new AccountGroup();

                            groupForTest.create(
                                {
                                    name: 'group'
                                },
                                function ( err ) {

                                    should.not.exist( err );
                                    scb();

                                }
                            );

                        },

                        // . Create account
                        function ( scb ) {

                            accountForTest = new Account();

                            accountForTest.create(
                                {
                                    name:            'account',
                                    password:        '1234',
                                    group:           groupForTest,
                                    individualPerms: {
                                        lesson: {
                                            create: true
                                        }
                                    }
                                },
                                function ( err ) {
                                    should.not.exist( err );
                                    scb();
                                }
                            );

                        },

                        // . Check permissions
                        function ( scb ) {

                            accountForTest.perms.should.eql(
                                {
                                    lesson: {
                                        create: true
                                    }
                                }
                            );
                            accountForTest.individualPerms.should.eql(
                                {
                                    lesson: {
                                        create: true
                                    }
                                }
                            );
                            scb();

                        }

                    ],
                    function () {
                        done();
                    }
                );

            } );

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

                    theNewAccount = new Account();

                    theNewAccount.create( accountData, function ( err ) {
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

            theNewAccount = new Account();

            theNewAccount.create( newAccData, function ( err ) {
                should.not.exist( err );

                theNewAccount.create( newAccData, function ( err ) {
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
                        theNewAccountGroup = new AccountGroup();

                        theNewAccountGroup.create( {
                                name:  'mergeAccountGroup',
                                perms: {
                                    hall:  {
                                        create: true
                                    },
                                    coach: true
                                }
                            },
                            function ( err ) {
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

                                    var someNewAccount = new Account();

                                    someNewAccount.create( {
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
                                        },
                                        function ( err ) {
                                            if ( err ) return pcb( err );
                                            pcb( null, someNewAccount.perms );
                                        } );

                                },

                                // 2nd variant
                                function ( pcb ) {

                                    var someNewAccount = new Account();

                                    someNewAccount.create( {
                                            name:            'mergeAccount2',
                                            password:        '123',
                                            individualPerms: {
                                                hall:   {
                                                    create: false
                                                },
                                                lesson: {
                                                    edit: true
                                                }
                                            }
                                        },
                                        function ( err ) {
                                            if ( err ) return pcb( err );
                                            pcb( null, someNewAccount.perms );
                                        } );

                                },

                                // 3rd variant
                                function ( pcb ) {

                                    var someNewAccount = new Account();

                                    someNewAccount.create( {
                                            name:     'mergeAccount3',
                                            password: '123',
                                            group:    theNewAccountGroup
                                        },
                                        function ( err ) {
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

                theNewAccount = new Account();
                theNewAccount.create( newAccData, function ( err ) {
                    should.exist( err );

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

                            //theNewAccountGroup = newGroup;

                            done();
                        }
                    );
                } );
            } );

        } );

    } );


    describe( '.findOneShort', function () {

        // reCreate
        beforeEach( function ( done ) {

            reCreate.full( function () {
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

        //it( 'should find short by token' );

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

            reCreate.full( function () {
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

        // TODO
        it( 'it should find by multiplie params', function ( done ) {

            var oldAccount = theNewAccount;

            theNewAccount = new Account();
            theNewAccount.findOne(
                { id: oldAccount.id, group: oldAccount.group },
                function ( err ) {
                    should.not.exist( err );

                    theNewAccount.id.should.be.eql( oldAccount.id );
                    theNewAccount.isFull().should.eql( true );

                    done();
                }
            );

        } );

        it( 'should not find with invalid types', function ( done ) {

            testTemplates.findOne.shouldCallErr( 'findOne', [
                //{},
                //null,

                //{ id: '' },
                //{ id: false },
                { id: theNewAccountGroup },

                //{ name: '' },
                //{ name: false },
                { name: theNewAccountGroup }

                //{ group: '' },
                //{ group: false }
            ], function () {
                done();
            } );

        } );

        //it( 'should find full by token' );

        // TODO
        it( 'should not find by nonexistent AccountGroup', function ( done ) {

            async.series(
                [
                    // . Remove AccountGroup
                    function ( scb ) {

                        theNewAccountGroup.remove( function ( err ) {

                            should.not.exist( err );

                            scb();

                        } );

                    },

                    // . Try to find
                    function ( scb ) {

                        testTemplates.findOne.shouldReturn404( 'findOne', [
                            { group: theNewAccount.group }
                        ], scb );

                    },

                    // . Recreate
                    function () {

                        reCreate.full( done );

                    }
                ]
            );

        } );

        it( 'should not find nonexistent', function ( done ) {

            testTemplates.findOne.shouldReturn404( 'findOne', [ { id: '000000000000000000000000' } ], done );

        } );

        it( 'should return 404 on empty filter', function ( done ) {

            testTemplates.findOne.shouldReturn404( 'findOne',
                [
                    {}
                ],
                done );

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

    describe( 'Array.findAccounts', function () {

        // reCreate
        beforeEach( function ( done ) {

            reCreate.full( function () {
                done();
            } );

        } );

        it( 'should find all Accounts by passing empty filter', function ( done ) {

            cleanUp.Accounts( function () {

                async.times( 3, function ( n, tcb ) {

                    // First - create three Accounts with same group

                    var acc = new Account();

                    acc.create( {
                        name:            'severalFull' + n,
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
                        'findAccounts',
                        [ {} ],
                        3,
                        done
                    );

                } );

            } );

        } );

        it( 'should find full one by id, name', function ( done ) {

            //cleanUp.Accounts( function () {

            testTemplates.find.shouldFind( 'findAccounts',
                [
                    { id: theNewAccount.id },
                    { name: theNewAccount.name }
                ], 1, done );

            //} );

        } );

        it( 'should find full !several! by group', function ( done ) {

            cleanUp.Accounts( function () {

                async.times( 3, function ( n, tcb ) {

                    // First - create three Accounts with same group

                    var acc = new Account();

                    acc.create( {
                        name:            'severalFull' + n,
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
                        'findAccounts',
                        [ { group: theNewAccountGroup } ],
                        3,
                        done
                    );

                } );

            } );
        } );

        //it( 'should find full by token' );

        it( 'should not find nonexistent', function ( done ) {

            testTemplates.find.shouldReturn404(
                'findAccounts',
                [ { id: '000000000000000000000000' } ],
                done
            );

        } );

    } );

    describe( 'Array.findShortAccounts', function () {

        // reCreate
        beforeEach( function ( done ) {

            reCreate.full( function () {
                done();
            } );

        } );

        it( 'should find all Accounts by passing empty filter', function ( done ) {

            cleanUp.Accounts( function () {

                async.times( 3, function ( n, tcb ) {

                    // First - create three Accounts with same group

                    var acc = new Account();

                    acc.create( {
                        name:            'severalFull' + n,
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
                        'findShortAccounts',
                        [ {} ],
                        3,
                        done
                    );

                } );

            } );

        } );

        it( 'should find full one by id, name', function ( done ) {

            testTemplates.find.shouldFind( 'findShortAccounts',
                [
                    { id: theNewAccountArguments.id },
                    { name: theNewAccountArguments.name }
                ], 1, done );

        } );

        it( 'should find full !several! by group', function ( done ) {

            cleanUp.Accounts( function () {

                async.times( 3, function ( n, tcb ) {

                    // First - create three Accounts with same group

                    var acc = new Account();

                    acc.create( {
                        name:            'severalFull' + n,
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
                        'findShortAccounts',
                        [ { group: theNewAccountGroup } ],
                        3,
                        done
                    );

                } );

            } );


        } );

        //it( 'should find short by token' );

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

                    var oldId = theNewAccount.id;

                    theNewAccount.name = 'noWailorman';
                    theNewAccount.update( function ( err ) {
                        should.not.exist( err );

                        theNewAccount.id.should.eql( oldId );
                        theNewAccount.name.should.eql( 'noWailorman' );

                        scb();
                    } );
                },

                // group
                function ( scb ) {
                    // First, create new group
                    var newGroupForUpdate = new AccountGroup();

                    newGroupForUpdate.create(
                        {
                            name:  'groupForUpdate',
                            perms: {
                                lessons: {
                                    delete: true
                                }
                            }
                        },
                        function ( err ) {
                            should.not.exist( err );


                            theNewAccount.group = newGroupForUpdate;
                            theNewAccount.update( function ( err ) {
                                should.not.exist( err );

                                //theNewAccount.id.should.eql(newGroupForUpdate.id);
                                //theNewAccount.deleted.should.eql( false );
                                theNewAccount.group.name.should.eql( newGroupForUpdate.name );
                                theNewAccount.perms.should.eql( {
                                    hall:    {
                                        create: true
                                    },
                                    lessons: {
                                        delete: true
                                    }
                                } );

                                scb();
                            } );

                        }
                    );
                },

                // individualPerms
                function () {

                    theNewAccount.individualPerms = { someIndPerms: true };
                    theNewAccount.update( function ( err ) {
                        should.not.exist( err );

                        theNewAccount.individualPerms.should.eql( { someIndPerms: true } );

                        done();
                    } );

                }
            ] );
        } );

        it( 'should not update Account data with invalid params', function ( done ) {

            var invalidNewData = {
                name:            [ '', '   ', true, false, null, {} ],
                password:        [ '', '  ', true, false, null, {} ],
                group:           [ '   ', true, {}, theNewAccount ],
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

                    testAccount = new Account();
                    testAccount.create( { name: 'wailormanEx1', password: '123' },
                        function ( err, doc ) {
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

        it( 'should remove group prop', function ( done ) {

            theNewAccount.group = null;
            theNewAccount.update( function ( err ) {

                should.not.exist( err );
                should.not.exist( theNewAccount.group );

                done();

            } );

        } );

        it( 'should remove individualPerms prop (make it {})', function ( done ) {

            theNewAccount.individualPerms = null;

            theNewAccount.update( function ( err ) {

                should.not.exist( err );
                theNewAccount.individualPerms.should.eql( {} );

                done();

            } );

        } );

        it( 'should not call error if we didnt write any changes', function ( done ) {

            theNewAccount.update( function ( err ) {

                should.not.exist( err );
                done();

            } );

        } );

    } );


    describe( '.remove', function () {

        beforeEach( function ( done ) {

            reCreate.full( done );

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
                getAccount.findOne( { id: theNewAccount.id }, function ( err ) {
                    should.exist( err );

                    done();
                } );

            } );

        } );

        it( 'should mark removed Account {deleted: true}', function ( done ) {

            var oldId = theNewAccount.id;

            theNewAccount.remove( function ( err ) {

                if ( err ) console.log( JSON.stringify( err ) );
                should.not.exist( err );

                AccountModel.findOne( { _id: new mf.ObjectId( oldId ) }, function ( err, doc ) {

                    should.exist( doc );
                    doc.deleted.should.eql( true );
                    done();

                } );

            } );

        } );

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

        it( 'should clean object after removing', function ( done ) {

            theNewAccount.remove( function ( err ) {

                if ( err ) console.log( JSON.stringify( err ) );
                should.not.exist( err );

                should.not.exist( theNewAccount.id );
                should.not.exist( theNewAccount.name );
                should.not.exist( theNewAccount.group );
                should.not.exist( theNewAccount.perms );
                should.not.exist( theNewAccount.individualPerms );
                should.not.exist( theNewAccount.password );
                should.not.exist( theNewAccount.token );

                done();

            } );

        } );

        //it( 'should terminate all sessions of the Account' );

    } );

    after( function ( done ) {

        mongoose.connection.close( done );

    } );

} );