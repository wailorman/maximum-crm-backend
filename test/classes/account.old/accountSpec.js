var should = require( 'should' );
var mongoose = require( 'mongoose' );
var async = require( 'async' );
var passwordHash = require( 'password-hash' );
var mf = require( '../../../libs/mini-funcs.js' );

var AccountClass = require( '../../../classes/account/account.js' );
var Account = new AccountClass();
var AccountModel = require( '../../../classes/account/account-model.js' ).AccountModel;

var AccountGroupClass = require( '../../../classes/account-group/account-group.js' );
var AccountGroup = new AccountGroupClass();
var AccountGroupModel = require( '../../../classes/account-group/account-group-model.js' ).AccountGroupModel;


var theNewAccount, theNewAccountGroup;


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

                        theNewAccountGroup = new AccountGroupClass();
                        theNewAccountGroup.create(
                            {
                                name: 'Test New Group',
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
                        theNewAccountGroup = new AccountGroupClass( { name: 'some_group' } );
                        theNewAccountGroup.create( function ( err ) {
                            if ( err ) return scb( err );
                            scb();
                        } );
                    },


                    // 4. Create new Account
                    function ( scb ) {
                        theNewAccount = new AccountClass( {
                            name: 'user123',
                            password: '123',
                            group: theNewAccountGroup
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
                        name: 'wailorman',
                        password: '123',
                        group: theNewAccountGroup
                    },
                    {
                        name: 'wailorman2',
                        password: '123',
                        group: theNewAccountGroup,
                        individualPerms: {  // Should add individual perms to the Account
                            lesson: {
                                create: true
                            }
                        }
                    },
                    {
                        name: 'wailorman3',
                        password: '123'
                        // No AccountGroup and no Individual perms => no perms
                    },
                    {
                        name: 'wailorman4',
                        password: '123',
                        individualPerms: {
                            lesson: {
                                create: true
                            }
                        }
                    },

                    // Pass AccountGroup object as AccountGroup
                    {
                        name: 'theWailorman',
                        password: '123',
                        group: theNewAccountGroup
                    },

                    // Passing null as group/individual perms
                    {
                        name: 'wailorman5',
                        password: '123',
                        group: null // Method should understand that this is no group
                    },
                    {
                        name: 'wailorman6',
                        password: '123',
                        individualPerms: null
                    }
                ],
                function ( accountData, eachCallback ) {

                    theNewAccount = new AccountClass( accountData );

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

                            newAccount.group.should.be.instanceof( AccountGroupClass );
                        }


                        newAccount.should.be.instanceof( AccountClass );


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
                        name: 'snoberik1',
                        password: '123',
                        group: true
                    },
                    {
                        name: 'snoberik2',
                        password: '123',
                        individualPerms: 'some string (avoid false)'
                    },
                    {
                        name: { someParam: 'string!' },
                        password: '123'
                    },
                    {
                        name: 'snoberik4',
                        password: { someParam: 'string!' }
                    }
                ],
                function ( accountData, eachSeriesCallback ) {

                    theNewAccount = new AccountClass( accountData );

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
                name: "theWailorman",
                password: "123"
            };

            theNewAccount = new AccountClass( newAccData );

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
                        theNewAccountGroup = new AccountGroupClass( {
                            name: 'mergeAccountGroup',
                            perms: {
                                hall: {
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

                                    var someNewAccount = new AccountClass( {
                                        name: 'mergeAccount',
                                        password: '123',
                                        group: theNewAccountGroup,
                                        individualPerms: {
                                            hall: {
                                                create: false,
                                                someObj: {
                                                    anotherProp: true,
                                                    anotherEmptyObj: {},
                                                    anotherObj: {
                                                        lol4ik: true
                                                    }
                                                }
                                            },
                                            lesson: {
                                                edit: true,
                                                emptyObject: {},
                                                object: {
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

                                    var someNewAccount = new AccountClass( {
                                        name: 'mergeAccount',
                                        password: '123',
                                        individualPerms: {
                                            hall: {
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

                                    var someNewAccount = new AccountClass( {
                                        name: 'mergeAccount',
                                        password: '123',
                                        group: theNewAccountGroup
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

                                results[0].should.eql( {
                                    hall: {
                                        create: false,
                                        someObj: {
                                            anotherProp: true,
                                            anotherEmptyObj: {},
                                            anotherObj: {
                                                lol4ik: true
                                            }
                                        }
                                    },
                                    coach: true,
                                    lesson: {
                                        edit: true,
                                        emptyObject: {},
                                        object: {
                                            prop: true
                                        }
                                    }
                                } );

                                results[1].should.eql( {
                                    hall: {
                                        create: false
                                    },
                                    lesson: {
                                        edit: true
                                    }
                                } );

                                results[2].should.eql( {
                                    hall: {
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
                name: "wailormanForUGroup",
                password: "123",
                group: theNewAccountGroup
            };


            theNewAccountGroup.remove( function ( err ) {
                should.not.exist( err );

                theNewAccount = new AccountClass( newAccData );
                theNewAccount.create( function ( err ) {
                    should.exist( err );

                    AccountGroup.create(
                        {
                            name: 'Test New Group',
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


    describe( '.getById', function () {

        var theFoundAccount;

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

                    theNewAccount = new AccountClass( {
                        name: 'wailormanGet',
                        password: '123',
                        group: theNewAccountGroup,
                        individualPerms: {
                            coaches: {
                                create: true
                            }
                        }
                    } );

                    theNewAccount.create( function ( err ) {
                        should.not.exist( err );

                        var newId = theNewAccount.id;

                        theNewAccount = new AccountClass();
                        theNewAccount.getById( newId, function ( err ) {
                            should.not.exist( err );
                            done();
                        } );

                    } );


                }
            ] );

        } );

        it( 'should find created Account', function ( done ) {

            theFoundAccount = new AccountClass();

            theFoundAccount.getById( theNewAccount.id, function ( err ) {
                should.not.exist( err );

                theFoundAccount.should.have.properties( 'id', 'name', 'group', 'perms', 'individualPerms' );
                theFoundAccount.should.eql( theFoundAccount );

                done();

            } );

        } );

        it( 'should haven\'t password property', function ( done ) {
            should.not.exist( theNewAccount.password );
            done();
        } );

        it( 'should not find nonexistent Account', function ( done ) {
            theNewAccount = new AccountClass();
            theNewAccount.getById( '000000000000000000000000', function ( err ) {
                should.exist( err )
                done();
            } );
        } );

        it( 'should not find Account with invalid params', function ( done ) {

            theFoundAccount = new AccountClass();

            async.eachSeries(
                [
                    // invalid arguments

                    'aaaa',
                    '',
                    true,
                    {},
                    null
                ],

                // Iterator
                function ( invalidId, esCallback ) {
                    theFoundAccount.getById( invalidId, function ( err ) {
                        should.exist( err );
                        esCallback();
                    } );
                },

                // Callback
                function ( err ) {
                    should.not.exist( err );
                    done();
                }
            );

        } );

        // !!
        xit( 'should not find removed Account', function ( done ) {
            theNewAccount.remove( function ( err ) {
                should.not.exist( err );

                theFoundAccount = new AccountClass();
                theFoundAccount.getById( theNewAccount.id, function ( err ) {
                    should.exist( err );

                    done();
                } );
            } );
        } );

        // -
        it( 'should not return AccountGroup info of deleted AccountGroup' );

    } );

    describe( '.getByName', function () {

        var theFoundAccount;

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

                    theNewAccount = new AccountClass( {
                        name: 'wailormanGet',
                        password: '123',
                        group: theNewAccountGroup,
                        individualPerms: {
                            coaches: {
                                create: true
                            }
                        }
                    } );

                    theNewAccount.create( function ( err ) {
                        should.not.exist( err );

                        var newId = theNewAccount.id;

                        theNewAccount = new AccountClass();
                        theNewAccount.getById( newId, function ( err ) {
                            should.not.exist( err );
                            done();
                        } );

                    } );


                }
            ] );

        } );

        it( 'should find created Account by name', function ( done ) {

            theFoundAccount = new AccountClass();

            theFoundAccount.getByName( theNewAccount.name, function ( err, foundAcc ) {
                should.not.exist( err );

                foundAcc.should.eql( theFoundAccount );

                done();
            } );

        } );

        it( 'should not find nonexistent Account', function ( done ) {
            theNewAccount = new AccountClass();
            theNewAccount.getByName( '000000000000000000000000', function ( err ) {
                should.exist( err );

                done();
            } );
        } );

        it( 'should haven\'t password property', function ( done ) {
            should.not.exist( theNewAccount.password );
            done();
        } );

        it( 'should not find created Account with invalid params', function ( done ) {

            theFoundAccount = new AccountClass();

            theFoundAccount.getByName( theNewAccount.name, function ( err, foundAcc ) {

                should.not.exist( err );

                foundAcc.should.eql( theFoundAccount );

                done();
            } );

        } );

        xit( 'should not find removed Account', function ( done ) {
            theNewAccount.remove( function ( err ) {
                should.not.exist( err );

                theFoundAccount = new AccountClass();
                theFoundAccount.getByName( theNewAccount.name, function ( err ) {
                    should.exist( err );

                    done();
                } );
            } );
        } );

        // -
        it( 'should not return AccountGroup info of deleted AccountGroup' );

    } );


    xdescribe( '.getByToken', function () {

        var accountToFind;

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

                    theNewAccount = new AccountClass( {
                        name: 'wailormanGetByToken',
                        password: '123',
                        group: theNewAccountGroup,
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

        it( 'should auth & find Account by token', function ( done ) {

            theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                should.not.exist( err );

                doc.id.should.eql( theNewAccount.id );

                var getAccount = new Account();
                getAccount.getByToken( doc.token[0], function ( err, doc ) {
                    should.not.exist( err );

                    doc.id.should.eql( theNewAccount.id );

                    done();
                } );

            } );

        } );

        // -
        xit( 'should not find by terminated token' );


        it( 'should not find nonexistent token', function ( done ) {

            accountToFind.getByToken( '000000000000000000000000', function ( err ) {
                should.exist( err );
                done();
            } );

        } );

        // !!
        it( 'should haven\'t password property', function ( done ) {
        } );

        it( 'should not find Account with invalid params', function ( done ) {

            async.each(
                [
                    '',
                    '1234',
                    true,
                    false,
                    null,
                    {}
                ],
                function ( token, escb ) {
                    accountToFind.getByToken( token, function ( err ) {
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

        it( 'should not find removed Account', function ( done ) {


            theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                should.not.exist( err );

                doc.id.should.eql( theNewAccount.id );

                theNewAccount = doc;
                var token = doc.token[0];


                theNewAccount.remove( function ( err ) {
                    should.not.exist( err );


                    accountToFind.getByToken( token, function ( err ) {
                        should.exist( err );

                        done();
                    } );

                } );

            } );

        } );

        // -
        xit( 'should not return AccountGroup info of deleted AccountGroup' );

    } );


    describe( '.update', function () {

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
                        theNewAccountGroup = new AccountGroupClass( { name: 'some_group' } );
                        theNewAccountGroup.create( function ( err ) {
                            if ( err ) return scb( err );
                            scb();
                        } );
                    },


                    // 4. Create new Account
                    function ( scb ) {
                        theNewAccount = new AccountClass( {
                            name: 'user123',
                            password: '123',
                            group: theNewAccountGroup
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

                        theNewAccount = doc;
                        scb();
                    } );
                },

                // group
                function ( scb ) {
                    // First, create new group
                    var newGroupForUpdate = new AccountGroupClass( { name: 'groupForUpdate' } );

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
                name: ['', '   ', true, false, null, {}],
                password: ['', '  ', true, false, null, {}],
                group: ['', '   ', true, {}, theNewAccount],
                individualPerms: [true, theNewAccount]
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
                            theNewAccount[propertyOfNewData] = newData;
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

                    testGroup = new AccountGroupClass();
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

                    testAccount = new AccountClass( { name: 'wailormanEx1', password: '123' } );
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

                    theNewAccount = new AccountClass( {
                        name: 'wailormanRemove',
                        password: '123',
                        group: theNewAccountGroup,
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

                var getAccount = new AccountClass();
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

                    theNewAccount = new AccountClass( {
                        name: 'wailormanAuth',
                        password: '123',
                        group: theNewAccountGroup,
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

                doc.token[0].should.be.type( 'string' );

                done();
            } );

        } );

        it( 'should authenticate Account again', function ( done ) {

            // First auth
            theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                should.not.exist( err );

                doc.token.should.be.type( 'string' );
                var firstToken = doc.token[0];

                // Second auth
                theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                    should.not.exist( err );

                    doc.token[1].should.be.type( 'string' );
                    doc.token[0].should.eql( firstToken );
                    doc.token[1].should.not.eql( firstToken );

                    done();
                } );
            } );

        } );

        it( 'should check Account have two tokens after twice authorization', function ( done ) {

            // First auth
            theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                should.not.exist( err );

                doc.token[0].should.be.type( 'string' );
                var firstToken = doc.token[0];

                // Second auth
                theNewAccount.auth( theNewAccount.name, '123', function ( err, doc ) {
                    should.not.exist( err );

                    doc.token[1].should.be.type( 'string' );
                    doc.token[0].should.eql( firstToken );
                    doc.token[1].should.not.eql( firstToken );


                    var secondToken = doc.token[1];


                    var account1 = new AccountClass();
                    var account2 = new AccountClass();

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
                        name: theNewAccount.name,
                        password: null
                    },
                    {
                        name: theNewAccount.name,
                        password: ''
                    },
                    {
                        name: true,
                        password: true
                    },
                    {
                        name: null,
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

                    theNewAccount = new AccountClass( {
                        name: 'wailormanLogout',
                        password: '123',
                        group: theNewAccountGroup,
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
                var firstToken = doc.token[0];

                theNewAccount.auth( theNewAccount.name, '123', function ( err ) {
                    should.not.exist( err );
                    var secondToken = doc.token[1];

                    theNewAccount.logout( firstToken, function ( err, doc ) {
                        should.not.exist( err );

                        doc.id.should.eql( theNewAccount.id );

                        doc.token.length.should.eql( 1 );

                        doc.token[0].should.eql( secondToken );

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

                var token = doc.token[0];
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