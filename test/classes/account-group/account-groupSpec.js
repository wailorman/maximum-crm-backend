var should            = require( 'should' ),
    mongoose          = require( 'mongoose' ),
    async             = require( 'async' ),
    mf                = require( '../../../libs/mini-funcs.js' ),
    restify           = require( 'restify' ),

    AccountGroup      = require( '../../../classes/account-group/account-group.js' ),
    AccountGroupModel = require( '../../../classes/account-group/account-group-model.js' ).AccountGroupModel,

    Account           = require( '../../../classes/account/account.js' ),
    AccountModel      = require( '../../../classes/account/account-model.js' ).AccountModel,

    theNewAccountGroup, theNewAccountGroupArguments,
    foundAccountGroup,

    theNewAccountGroups,


    theNewAccount, theNewAccountArguments,


    cleanUp           = {

        AccountGroup: function ( next ) {

            AccountGroupModel.find().remove().exec( function ( err ) {

                should.not.exist( err );
                next();

            } );

        },

        Account: function ( next ) {

            AccountModel.find().remove().exec( function ( err ) {

                should.not.exist( err );
                next();

            } );

        }

    },

    reCreate          = {

        AccountGroup: function ( next ) {

            cleanUp.AccountGroup( function () {

                theNewAccountGroupArguments = {
                    name:  'theAccountGroup',
                    perms: {
                        hall: {
                            create: true
                        }
                    }
                };

                theNewAccountGroup = new AccountGroup();
                theNewAccountGroup.create( theNewAccountGroupArguments, function ( err ) {

                    should.not.exist( err );
                    next();

                } );

            } );

        },

        Account: function ( next ) {

            async.series(
                [
                    function ( scb ) {

                        cleanUp.Account( scb );

                    },
                    function ( scb ) {

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

                        if ( theNewAccountGroup )
                            theNewAccountArguments.group = theNewAccountGroup;

                        theNewAccount.create(
                            theNewAccountArguments,
                            function ( err ) {

                                should.not.exist( err );

                                scb();

                            }
                        );

                    }
                ],
                function () {
                    next();
                }
            );

        },

        full: function ( next ) {

            async.series(
                [
                    this.AccountGroup,
                    this.Account
                ],
                function () {
                    next();
                }
            );

        }

    },

    testTemplates     = {

        find: {

            shouldFind: function () {
            },

            shouldReturn404: function () {
            },

            shouldCallError: function () {
            }

        },

        findOne: {

            /**
             *
             * @param isFull
             * @param filter
             * @param done
             */
            shouldFind: function ( isFull, filter, done ) {

                foundAccountGroup = new AccountGroup();

                var funcName = isFull ? 'findOne' : 'findOneShort';

                foundAccountGroup[ funcName ]( filter, function ( err ) {

                    should.not.exist( err );

                    if ( isFull )
                        foundAccountGroup.isFull().should.eql( true );
                    else
                        foundAccountGroup.isShort().should.eql( true );

                    done();

                } );

            },

            /**
             *
             * @param isFull
             * @param filter
             * @param done
             */
            shouldReturn404: function ( isFull, filter, done ) {

                foundAccountGroup = new AccountGroup();

                var funcName = isFull ? 'findOne' : 'findOneShort';

                foundAccountGroup[ funcName ]( filter, function ( err ) {

                    should.exist( err );
                    err.should.be.instanceof( restify.ResourceNotFoundError );

                    done();

                } );

            },

            /**
             *
             * @param isFull
             * @param filter
             * @param done
             */
            shouldCallError: function ( isFull, filter, done ) {

                foundAccountGroup = new AccountGroup();

                var funcName = isFull ? 'findOne' : 'findOneShort';

                foundAccountGroup[ funcName ]( filter, function ( err ) {

                    should.exist( err );

                    done();

                } );

            }

        }

    };

describe( 'AccountGroup module testing', function () {

    before( function ( done ) {

        // Connecting to mongoose test database

        mongoose.connect( 'mongodb://localhost/test', {},
            function ( err ) {
                should.not.exist( err );

                // Remove all documents after previous test

                AccountGroupModel.find().remove().exec(
                    function ( err ) {
                        should.not.exist( err );
                        done();
                    }
                );

            } );
    } );

    describe( '.create()', function () {

        beforeEach( function ( done ) {

            AccountGroupModel.find().remove().exec( function ( err ) {
                should.not.exist( err );
                done();
            } );

        } );

        it( 'should create a new group', function ( done ) {

            async.eachSeries(
                [
                    {
                        name: '.create1-1',
                        perms: // should create with perms ...
                              {
                                  hall: {
                                      create: true
                                  }
                              }
                    },
                    {
                        name: '.create1-2',
                        perms: // ... with empty perms (or null) ...
                              null
                    },
                    {
                        name: '.create1-3'
                        // ... and without perms
                    }
                ],

                // Iterator
                function ( validGroup, eachSeriesCallback ) {


                    async.series( [

                            // Delete old AccountGroups
                            function ( seriesCallback ) {
                                AccountGroupModel.find().remove().exec(
                                    function ( err ) {
                                        should.not.exist( err );
                                        seriesCallback();
                                    }
                                );
                            },

                            // Create new AccountGroup
                            function ( seriesCallback ) {

                                theNewAccountGroup = new AccountGroup();

                                theNewAccountGroup.create( validGroup, function ( err ) {
                                    should.not.exist( err );

                                    theNewAccountGroup.should.be.instanceof( AccountGroup );

                                    //theNewAccountGroup.should.have.properties('id', 'name');

                                    // id
                                    theNewAccountGroup.should.have.property( 'id' );
                                    theNewAccountGroup.id.should.be.type( 'string' );
                                    mf.isObjectId( theNewAccountGroup.id ).should.eql( true );

                                    // name
                                    theNewAccountGroup.should.have.property( 'name' );
                                    theNewAccountGroup.name.should.be.type( 'string' );
                                    theNewAccountGroup.name.should.eql( validGroup.name );


                                    if ( validGroup.perms ) {
                                        theNewAccountGroup.should.have.property( 'perms' );
                                        mf.validatePerms( theNewAccountGroup.perms ).should.eql( true );
                                    }


                                    seriesCallback();
                                } );
                            }
                        ],
                        function ( err ) {
                            should.not.exist( err );
                            eachSeriesCallback();
                        } );


                },

                // End of iteration. Result
                function ( err ) {
                    should.not.exist( err );
                    done();
                }
            );


        } );

        it( 'should create a new group by another way', function ( done ) {

            async.eachSeries(
                [
                    {
                        name:  '.create1-1',
                        perms: {
                            hall: {
                                create: true
                            }
                        }
                    },
                    {
                        name: '.create1-2',
                        perms: // ... with empty perms (or null) ...
                              null
                    },
                    {
                        name: '.create1-3'
                        // ... and without perms
                    }
                ],

                // Iterator
                function ( validGroupData, eachSeriesCallback ) {


                    async.series( [

                            // Delete old AccountGroups
                            function ( seriesCallback ) {
                                AccountGroupModel.find().remove().exec(
                                    function ( err ) {
                                        should.not.exist( err );
                                        seriesCallback();
                                    }
                                );
                            },

                            // Create new AccountGroup
                            function ( seriesCallback ) {

                                theNewAccountGroup = new AccountGroup();

                                /*for ( var i in validGroupData ){
                                 theNewAccountGroup[i] = validGroupData[i];
                                 }*/

                                theNewAccountGroup.create( validGroupData, function ( err ) {
                                    should.not.exist( err );


                                    theNewAccountGroup.should.be.instanceof( AccountGroup );


                                    // id
                                    theNewAccountGroup.should.have.property( 'id' );
                                    theNewAccountGroup.id.should.be.type( 'string' );
                                    mf.isObjectId( theNewAccountGroup.id ).should.eql( true );


                                    // name
                                    theNewAccountGroup.should.have.property( 'name' );
                                    theNewAccountGroup.name.should.be.type( 'string' );
                                    theNewAccountGroup.name.should.eql( validGroupData.name );


                                    // perms
                                    if ( validGroupData.perms ) {
                                        theNewAccountGroup.should.have.property( 'perms' );
                                        mf.validatePerms( theNewAccountGroup.perms ).should.eql( true );
                                    }


                                    seriesCallback();
                                } );
                            }
                        ],
                        function ( err ) {
                            should.not.exist( err );
                            eachSeriesCallback();
                        } );


                },

                // End of iteration. Result
                function ( err ) {
                    should.not.exist( err );
                    done();
                }
            );


        } );

        it( 'should not create a new group with invalid params', function ( done ) {

            async.eachSeries(
                [
                    {},
                    null,
                    "",
                    {
                        name: {}        // incorrect name type
                    },
                    {
                        name: true      // incorrect name type
                    },
                    {
                        name: false     // incorrect name type
                    },
                    {
                        perms: {}       // without name
                    },
                    {
                        name: ''        // empty name
                    },
                    {
                        name:  '',       // incorrect perms type
                        perms: ''       // ... string instead of object
                    }
                ],

                // Iterator
                function ( invalidGroup, callback ) {

                    theNewAccountGroup = new AccountGroup();
                    theNewAccountGroup.create( invalidGroup, function ( err ) {
                        should.exist( err );
                        callback();
                    } );


                },

                // End of iteration. Result
                function ( err ) {
                    should.not.exist( err );
                    done();
                }
            );

        } );

        it( 'should not create two AccountGroup with same names', function ( done ) {

            async.series( [
                    // First create AccountObject. Should go fine
                    function ( callback ) {

                        theNewAccountGroup = new AccountGroup();
                        theNewAccountGroup.create(
                            {
                                name: 'Baz'
                            },
                            function ( err ) {
                                should.not.exist( err );
                                callback( err );
                            }
                        );

                    },

                    function ( callback ) {

                        theNewAccountGroup = new AccountGroup();
                        theNewAccountGroup.create(
                            {
                                name: 'Baz'
                            },
                            function ( err ) {
                                should.exist( err );
                                callback();
                            }
                        );

                    },

                    function ( callback ) {

                        theNewAccountGroup = new AccountGroup();
                        theNewAccountGroup.create(
                            {
                                name: 'Baz'
                            },
                            function ( err ) {
                                should.exist( err );
                                callback();
                            }
                        );

                    }
                ],
                function ( err ) {
                    should.not.exists( err );
                    done();
                } );

        } );

    } );

    describe( '.update()', function () {

        beforeEach( function ( done ) {

            async.series( [

                // Remove old AccountGroups
                function ( scb ) {
                    AccountGroupModel.find().remove().exec( function ( err ) {
                        should.not.exist( err );
                        scb();
                    } );
                },

                // Create a new AccountGroup
                function () {
                    theNewAccountGroup = new AccountGroup();
                    theNewAccountGroup.create( { name: 'someAccountGroup' }, function ( err ) {
                        should.not.exist( err );
                        done();
                    } );
                }
            ] );

        } );

        it( 'should update AccountGroup', function ( done ) {


            async.eachSeries(
                // valid new data of an Account Group
                [
                    {
                        // only name
                        name: 'new name1'
                    },
                    {
                        // all params
                        name:  'new name2',
                        perms: {
                            newPerm: true
                        }
                    },
                    {
                        perms: {
                            newPerms: false
                        }
                    },
                    {
                        // no updates
                    }
                ],

                // iterator
                function ( newDataOfAccountGroup, escb ) {

                    async.series( [


                        // Remove old AccountGroups
                        function ( scb ) {
                            theNewAccountGroup = null;

                            AccountGroupModel.find().remove( function ( err ) {
                                should.not.exist( err );
                                scb()
                            } );
                        },


                        // Create new AccountGroup
                        function ( scb ) {

                            theNewAccountGroup = new AccountGroup();

                            theNewAccountGroup.create(
                                {
                                    name:  'testGroupLol2',
                                    perms: {
                                        hall: {
                                            create: true
                                        }
                                    }
                                },
                                function ( err ) {
                                    should.not.exist( err );
                                    //theNewAccountGroup = accountGroupObject;

                                    scb();
                                }
                            );

                        },


                        // Update
                        function () {

                            for ( var i in newDataOfAccountGroup ) {
                                if ( newDataOfAccountGroup.hasOwnProperty( i ) ) {
                                    theNewAccountGroup[ i ] = newDataOfAccountGroup[ i ];
                                }
                            }

                            theNewAccountGroup.update( function ( err ) {
                                    should.not.exist( err );

                                    if ( newDataOfAccountGroup.name ) {
                                        theNewAccountGroup.name.should.eql( newDataOfAccountGroup.name );
                                    }

                                    if ( newDataOfAccountGroup.perms ) {
                                        theNewAccountGroup.perms.should.eql( newDataOfAccountGroup.perms );
                                    }

                                    escb();
                                }
                            );

                        }
                    ] );


                },

                // async.eachSeries main callback
                function ( err ) {
                    should.not.exist( err );
                    done();
                }
            );

        } );

        it( 'should not update AccountGroup with invalid data', function ( done ) {


            async.series( [
                function ( theSeriesCallback ) {
                    async.eachSeries(
                        // invalid new data of an Account Group
                        [
                            //{
                            //    name: ''
                            //},
                            {
                                name: {}
                            }
                            //{
                            //    name: '',
                            //    perms: {}
                            //}
                        ],

                        // iterator
                        function ( data, iteratorCallback ) {

                            //theNewAccountGroup = null;

                            async.series( [

                                    // Remove old AccountGroup
                                    function ( seriesCallback ) {
                                        AccountGroupModel.find().remove().exec(
                                            function ( err ) {
                                                should.not.exist( err );
                                                seriesCallback();
                                            }
                                        );
                                    },

                                    // Create a new AccountGroup
                                    function ( seriesCallback ) {

                                        theNewAccountGroup = new AccountGroup();
                                        theNewAccountGroup.create(
                                            {
                                                name:  'testGroup222',
                                                perms: {
                                                    hall: {
                                                        create: true
                                                    }
                                                }
                                            },
                                            function ( err ) {
                                                should.not.exist( err );
                                                //theNewAccountGroup = newAccountGroup;


                                                for ( var i in data ) {
                                                    if ( data.hasOwnProperty( i ) ) {
                                                        theNewAccountGroup[ i ] = data[ i ];
                                                    }
                                                }


                                                theNewAccountGroup.update(
                                                    function ( err ) {
                                                        should.exist( err );
                                                        seriesCallback();
                                                    }
                                                );

                                            }
                                        );
                                    }
                                ],
                                function ( err ) {
                                    should.not.exist( err );
                                    iteratorCallback();
                                } );


                        },

                        // async.eachSeries callback
                        function ( err ) {
                            should.not.exist( err );

                            theSeriesCallback();
                        }
                    );
                },
                function () {
                    done();
                }
            ] );


        } );

        it( 'should not update id of the AccountGroup', function ( done ) {


            async.series( [
                function ( seriesCallback ) {

                    // Creating a new AccountGroup
                    theNewAccountGroup = new AccountGroup();
                    theNewAccountGroup.create(
                        {
                            name: 'name of the new AccountGroup'
                        },
                        function ( err ) {
                            should.not.exist( err );
                            //theNewAccountGroup = createdAccountGroup;

                            //var lol;

                            seriesCallback();
                        }
                    );

                },
                function () {

                    theNewAccountGroup.id = 'excellent new id!';

                    theNewAccountGroup.update( function ( err ) {
                        should.exist( err );
                        done();
                    } );

                }
            ] );

        } );

        it( 'should not update empty AccountGroup', function ( done ) {

            theNewAccountGroup = new AccountGroup();
            theNewAccountGroup.update( function ( err ) {
                should.exist( err );
                done();
            } );

        } );

        it( 'should not update AccountGroup name to the already used name', function ( done ) {

            var theNewAccountGroup = new AccountGroup();
            var theNewAccountGroup2 = new AccountGroup();

            theNewAccountGroup.create( { name: 'someExistentName' }, function ( err ) {
                should.not.exist( err );

                theNewAccountGroup2.create( { name: 'nonExistentName' }, function ( err ) {
                    should.not.exist( err );

                    // update name of the AccountGroup to some existent name
                    theNewAccountGroup2.name = theNewAccountGroup.name;
                    theNewAccountGroup2.update( function ( err ) {
                        should.exist( err );
                        done();
                    } );

                } );

            } );

        } );

        it( 'should not update id after updating', function ( done ) {

            var oldId = theNewAccountGroup.id;

            theNewAccountGroup.name = 'AwesomeName';
            theNewAccountGroup.update( function ( err ) {

                should.not.exist( err );
                theNewAccountGroup.id.should.eql( oldId );
                done();

            } );

        } );

        it( 'should not call error when no changes', function ( done ) {

            theNewAccountGroup.update( function ( err ) {

                should.not.exist( err );
                done();

            } );

        } );

    } );

    describe( '.remove()', function () {

        beforeEach( function ( done ) {

            theNewAccountGroup = new AccountGroup();

            theNewAccountGroup.create(
                {
                    name:  'Foo2345',
                    perms: {
                        hall: {
                            whiskey: true
                        }
                    }
                },
                function ( err ) {
                    should.not.exist( err );
                    //theNewAccountGroup = newAccountGroup;
                    done();
                }
            );

        } );

        it( 'should remove AccountGroup', function ( done ) {

            theNewAccountGroup.remove(
                function ( err ) {
                    should.not.exists( err );
                    done();
                }
            );

        } );

        it( 'should not find removed AccountGroup', function ( done ) {

            var removedAccountGroupId = theNewAccountGroup.id;

            theNewAccountGroup.remove( function ( err ) {

                should.not.exist( err );
                theNewAccountGroup = new AccountGroup();

                theNewAccountGroup.findOne( { id: removedAccountGroupId }, function ( err ) {

                    should.exist( err );
                    err.should.be.instanceof( restify.ResourceNotFoundError );
                    done();

                } );

            } );

        } );

        it( 'should not remove already removed AccountGroup', function ( done ) {

            theNewAccountGroup.remove(
                function ( err ) {

                    // first removing...
                    should.not.exists( err );

                    theNewAccountGroup.remove(
                        function ( err ) {
                            // second removing. should failed
                            should.exist( err );

                            done();
                        }
                    );

                }
            );

        } );

        it( 'should update Accounts info which using this AccountGroup', function ( done ) {

            var testAccounts = [];

            async.series(
                [
                    // create Accounts
                    function ( scb ) {
                        async.each(
                            [
                                {
                                    name:     'testUser1',
                                    password: '123',
                                    group:    theNewAccountGroup
                                },
                                {
                                    name:     'testUser2',
                                    password: '123',
                                    group:    theNewAccountGroup
                                },
                                {
                                    name:     'testUser3',
                                    password: '123',
                                    group:    theNewAccountGroup
                                }
                            ],
                            function ( testUserData, ecb ) {
                                var testUser = new Account();
                                testUser.create(
                                    testUserData,
                                    function ( err ) {
                                        if ( err ) return ecb( err );

                                        testAccounts.push( testUser );

                                        ecb();
                                    } );
                            },
                            function ( err, results ) {
                                if ( err ) return scb( err );
                                //testAccounts = results;
                                scb();
                            }
                        );
                    },

                    // remove AccountGroup
                    function ( scb ) {
                        theNewAccountGroup.remove( function ( err ) {
                            if ( err ) return scb( err );

                            scb();
                        } );
                    },

                    // checking Account
                    function ( scb ) {

                        async.each(
                            testAccounts,
                            function ( testAccount, ecb ) {
                                var updatedTestAccount = new Account();

                                updatedTestAccount.findOneShort( { id: testAccount.id }, function ( err ) {
                                    should.not.exist( err );
                                    should.not.exist( updatedTestAccount.group );

                                    ecb();
                                } );
                            },
                            function () {
                                scb();
                            }
                        );

                    }
                ],
                done
            );

        } );

    } );

    describe( 'Array.findShortAccountGroups()', function () {

        before( function ( done ) {
            cleanUp.AccountGroup( done );
        } );

        it( 'should return empty array when no AccountGroups', function ( done ) {

            theNewAccountGroups = [];

            theNewAccountGroups.findShortAccountGroups( null, function ( err ) {

                should.not.exist( err );

                theNewAccountGroups.length.should.eql( 0 );

                done();

            } );

        } );

        it( 'should return list of all AccountGroups', function ( done ) {

            async.times(
                5,

                // Create AccountGroups for testing
                function ( n, tcb ) {

                    var anAccountGroup = new AccountGroup();

                    anAccountGroup.create(
                        { name: 'theGrooooup' + n },
                        function ( err ) {

                            should.not.exist( err );
                            tcb();

                        }
                    );

                },

                // Checking
                function () {

                    theNewAccountGroups = [];

                    theNewAccountGroups.findShortAccountGroups( null, function ( err ) {

                        should.not.exist( err );

                        theNewAccountGroups.length.should.eql( 5 );

                        theNewAccountGroups[ 0 ].name.should.eql( 'theGrooooup0' );
                        theNewAccountGroups[ 1 ].name.should.eql( 'theGrooooup1' );
                        theNewAccountGroups[ 2 ].name.should.eql( 'theGrooooup2' );
                        theNewAccountGroups[ 3 ].name.should.eql( 'theGrooooup3' );
                        theNewAccountGroups[ 4 ].name.should.eql( 'theGrooooup4' );

                        done();

                    } );


                }
            );

        } );

    } );

    describe( '.findOneShort()', function () {

        beforeEach( function ( done ) {
            reCreate.AccountGroup( done );
        } );

        it( 'should find AccountGroup by id', function ( done ) {

            testTemplates.findOne.shouldFind(
                false,
                { id: theNewAccountGroup.id },
                done
            );

        } );

        it( 'should find AccountGroup by name', function ( done ) {

            testTemplates.findOne.shouldFind(
                false,
                { name: theNewAccountGroupArguments.name },
                done
            );

        } );

        it( 'should sure that found object is short', function ( done ) {

            testTemplates.findOne.shouldFind(
                false,
                { id: theNewAccountGroup.id },
                function () {

                    foundAccountGroup.isShort().should.eql( true );
                    done();

                }
            );

        } );

        it( 'should not find with invalid filter', function ( done ) {

            async.eachSeries(
                [
                    { id: theNewAccountGroup },
                    { id: '' },
                    { id: null },

                    { name: theNewAccountGroup },
                    { name: '' },
                    { name: null }
                ],
                function ( filter, escb ) {

                    testTemplates.findOne.shouldCallError( false, filter, escb );

                },
                function () {
                    done();
                }
            );


        } );

        it( 'should not find nonexistent AccountGroup', function ( done ) {

            var removedAccountGroup = theNewAccountGroup;

            theNewAccountGroup.remove( function ( err ) {

                should.not.exist( err );

                testTemplates.findOne.shouldReturn404( false, { id: removedAccountGroup.id }, done );

            } );

        } );

        it( 'should call error on null filter', function ( done ) {

            testTemplates.findOne.shouldCallError( false, null, done );

        } );

        it( 'should call error when passing id and name to the filter', function ( done ) {

            testTemplates.findOne.shouldCallError(
                false,
                { id: theNewAccountGroup.id, name: theNewAccountGroupArguments.name },
                done
            );

        } );

    } );

    describe( '.findOne()', function () {

        beforeEach( function ( done ) {
            reCreate.full( done );
        } );

        it( 'should find AccountGroup by id', function ( done ) {

            testTemplates.findOne.shouldFind(
                true,
                { id: theNewAccountGroup.id },
                function () {

                    foundAccountGroup.id.should.eql( theNewAccountGroup.id );
                    foundAccountGroup.name.should.eql( theNewAccountGroupArguments.name );
                    foundAccountGroup.perms.should.eql( theNewAccountGroupArguments.perms );

                    done();

                }
            );

        } );

        it( 'should find AccountGroup by name', function ( done ) {

            testTemplates.findOne.shouldFind(
                true,
                { name: theNewAccountGroupArguments.name },
                function () {

                    foundAccountGroup.id.should.eql( theNewAccountGroup.id );
                    foundAccountGroup.name.should.eql( theNewAccountGroupArguments.name );
                    foundAccountGroup.perms.should.eql( theNewAccountGroupArguments.perms );

                    done();

                }
            );

        } );

        it( 'should sure that found object is full', function ( done ) {

            testTemplates.findOne.shouldFind(
                true,
                { id: theNewAccountGroup.id },
                function () {

                    foundAccountGroup.isFull().should.eql( true );

                    foundAccountGroup.id.should.eql( theNewAccountGroup.id );
                    foundAccountGroup.name.should.eql( theNewAccountGroupArguments.name );
                    foundAccountGroup.perms.should.eql( theNewAccountGroupArguments.perms );

                    done();

                }
            );

        } );

        it( 'should not find with invalid filter', function ( done ) {

            async.eachSeries(
                [
                    { id: theNewAccountGroup },
                    { id: '' },
                    { id: null },

                    { name: theNewAccountGroup },
                    { name: '' },
                    { name: null }
                ],
                function ( filter, escb ) {

                    testTemplates.findOne.shouldCallError( true, filter, escb );

                },
                function () {
                    done();
                }
            );


        } );

        it( 'should not find nonexistent AccountGroup', function ( done ) {

            var removedAccountGroup = theNewAccountGroup;

            theNewAccountGroup.remove( function ( err ) {

                should.not.exist( err );

                testTemplates.findOne.shouldReturn404( true, { id: removedAccountGroup.id }, done );

            } );

        } );

        it( 'should call error on null filter', function ( done ) {

            testTemplates.findOne.shouldCallError( true, null, done );

        } );

        it( 'should call error when passing id and name to the filter', function ( done ) {

            testTemplates.findOne.shouldCallError(
                true,
                { id: theNewAccountGroup.id, name: theNewAccountGroupArguments.name },
                done
            );

        } );

        it( 'should return correct members of the group', function ( done ) {

            //var createdAccounts = [];

            async.series(
                [

                    // . Cleanup old Accounts
                    function ( scb ) {

                        cleanUp.Account( scb );

                    },

                    // . Create Accounts
                    function ( scb ) {

                        async.times(
                            3,
                            function ( n, tcb ) {

                                var theAccount = new Account();

                                theAccount.create(
                                    {
                                        name:     'groupMember' + n,
                                        password: '1234',
                                        group:    theNewAccountGroup
                                    },
                                    function ( err ) {

                                        should.not.exist( err );
                                        tcb();

                                    }
                                );

                            },
                            function () {
                                scb();
                            }
                        );

                    },

                    // . Get AccountGroup
                    function ( scb ) {

                        var groupId = theNewAccountGroup.id;

                        theNewAccountGroup = new AccountGroup();
                        theNewAccountGroup.findOne( { id: groupId }, function ( err ) {

                            should.not.exist( err );

                            scb();

                        } );

                    },

                    // . Check Accounts existent
                    function ( scb ) {

                        theNewAccountGroup.members.length.should.eql( 3 );

                        async.each(
                            theNewAccountGroup.members,
                            function ( theAccount, ecb ) {

                                theAccount.name.should.match( /groupMember/ );
                                ecb();

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

        it( 'should return empty array if there is no members in the group', function ( done ) {

            async.series(
                [

                    // . Make leave group
                    function ( scb ) {

                        theNewAccount.group = null;
                        theNewAccount.update( function ( err ) {

                            should.not.exist( err );
                            should.not.exist( theNewAccount.group );
                            scb();

                        } );

                    },


                    // . Get AccountGroup
                    function ( scb ) {

                        var groupId = theNewAccountGroup.id;

                        theNewAccountGroup = new AccountGroup();

                        theNewAccountGroup.findOne( { id: groupId }, function ( err ) {

                            should.not.exist( err );
                            theNewAccountGroup.members.length.should.eql( 0 );

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

    describe( '.addPermissions()', function () {

        beforeEach( function ( done ) {

            async.series(
                [

                    function ( scb ) {
                        reCreate.full( scb );
                    },
                    function ( scb ) {

                        var groupId = theNewAccountGroup.id;

                        theNewAccountGroup = new AccountGroup();

                        theNewAccountGroup.findOneShort( { id: groupId }, function ( err ) {

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

        it( 'should get permissions', function ( done ) {

            theNewAccountGroup.addPermissions( function ( err, perms ) {

                should.not.exist( err );

                Object.equal( perms, theNewAccountGroupArguments.perms ).should.eql( true );

                done();

            } );

        } );

        it( 'should get permissions and add permissions to the object properties', function ( done ) {

            theNewAccountGroup.addPermissions( function ( err ) {

                should.not.exist( err );

                Object.equal( theNewAccountGroup.perms, theNewAccountGroupArguments.perms ).should.eql( true );

                done();

            } );

        } );

        it( 'should not get permissions of nonexistent AccountGroup', function ( done ) {

            var removedAccountGroup = theNewAccountGroup;

            async.series(
                [

                    // . Remove AccountGroup
                    function ( scb ) {
                        theNewAccountGroup.remove( scb );
                    },

                    // . Try to get permissions
                    function ( scb ) {
                        removedAccountGroup.addPermissions( function ( err ) {

                            should.exist( err );
                            err.should.be.instanceof( restify.InvalidArgumentError );
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

        it( 'should return {} permissions if AccountGroup does not have permissions', function ( done ) {

            async.series(
                [

                    // . Remove AccountGroup's permissions
                    function ( scb ) {

                        theNewAccountGroup.perms = null;
                        theNewAccountGroup.update( function ( err ) {

                            should.not.exist( err );
                            should.not.exist( theNewAccountGroup.perms );
                            scb();

                        } );

                    },

                    // . Try to get permissions
                    function ( scb ) {

                        theNewAccountGroup.addPermissions( function ( err, perms ) {

                            should.not.exist( err );

                            perms.should.eql( {} );

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