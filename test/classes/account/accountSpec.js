var should = require('should');
var mongoose = require('mongoose');
var async = require('async');

var AccountClass = require('../../../classes/account/account.js');
var Account = new Account();
var AccountModel = require('../../../classes/account/account-model.js');

var AccountGroupClass = require('../../../classes/account-group/account-group.js');
var AccountGroup = new AccountGroupClass();
var AccountGroupModel = require('../../../classes/account-group/account-group-model.js');


var theNewAccount, theNewAccountGroup;


describe('Account module testing', function () {

    before(function (done) {

        // Connecting to mongoose test database

        mongoose.connect('mongodb://localhost/test', {},
            function (err) {
                should.not.exist(err);

                // Remove all documents after previous test

                async.series([
                    function (seriesCb) {

                        // Remove all old AccountGroup

                        AccountGroupModel.find().remove().exec(
                            function (err) {
                                should.not.exist(err);
                                seriesCb();
                            }
                        );
                    },
                    function (seriesCb) {

                        // Remove all Accounts

                        AccountModel.find().remove().exec(
                            function (err) {
                                should.not.exist(err);
                                seriesCb();
                            }
                        );
                    },
                    function () {

                        // Create AccountGroup for testing

                        AccountGroup.create(
                            {
                                name: 'Test New Group',
                                perms: {
                                    hall: {
                                        create: true
                                    }
                                }
                            },
                            function (err, newGroup) {
                                should.not.exist(err);

                                theNewAccountGroup = newGroup;

                                done();
                            }
                        );

                    }
                ]);


            });
    });

    describe('.create', function () {

        // Remove all Accounts
        beforeEach(function (done) {

            AccountModel.find().remove().exec(function (err) {
                should.not.exist(err);
                done();
            });

        });

        it('should create a new Account', function (done) {

            async.eachSeries(
                // Correct Account data

                [
                    {
                        name: 'wailorman',
                        password: '123',
                        group: theNewAccountGroup.id
                    },
                    {
                        name: 'wailorman2',
                        password: '123',
                        group: theNewAccountGroup.id,
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

                    {
                        // Should recognize perms property as individualPerms property
                        name: 'wailorman41',
                        password: '123',
                        perms: {
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
                function (accountData, eachCallback) {

                    theNewAccount = new AccountClass(accountData);

                    theNewAccount.create(function (err, newAccount) {
                        should.not.exist(err);

                        newAccount.name.should.be.type('string');
                        newAccount.name.should.eql(accountData.name);
                        newAccount.should.have.properties('id', 'name', 'group', 'token', 'perms', 'individualPerms');
                        newAccount.should.not.have.property('password');

                        // Should be an AccountGroup object
                        newAccount.group.should.have.properties('id', 'name', 'perms');
                        newAccount.group.should.eql(accountData.group);
                        newAccount.group.deleted.should.eql(false);

                        // Check instances
                        newAccount.group.should.be.instanceof(AccountGroupClass);
                        newAccount.should.be.instanceof(AccountClass);


                        if (accountData.individualPerms) { // If we passed individual perms for the Account
                            newAccount.individualPerms.should.eql(accountData.individualPerms);
                            //newAccount.perms.object
                        }

                        eachCallback();
                    });

                },
                function (err) {
                    should.not.exist(err);
                    done();
                }
            );

        });

        it('should not create Account', function (done) {

            async.eachSeries(
                [
                    {}, // empty!

                    // Without some parameters
                    {
                        name: 'snoberik'
                    },
                    {
                        password: '123'
                    },

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
                        name: {someParam: 'string!'},
                        password: '123'
                    },
                    {
                        name: 'snoberik4',
                        password: {someParam: 'string!'}
                    }
                ],
                function (accountData, eachSeriesCallback) {

                    theNewAccount = new AccountGroupClass(accountData);

                    theNewAccount.create(function (err) {
                        should.exist(err);
                        eachSeriesCallback();
                    });

                },
                function (err) {
                    should.not.exist(err);
                    done();
                }
            );

        });

        it('should not create Accounts with same names');

        it('should merge individual and group permissions correctly');

    });


    describe('.getById', function () {

        var theFoundAccount;

        beforeEach(function (done) {

            async.series([

                // Remove all old Accounts
                function (seriesCallback) {
                    AccountModel.find().remove().exec(function (err) {
                        should.not.exist(err);
                        seriesCallback();
                    });
                },

                // Create a new Account for tests
                function () {

                    theNewAccount = new AccountClass({
                        name: 'wailormanGet',
                        password: '123',
                        group: theNewAccountGroup,
                        individualPerms: {
                            coaches: {
                                create: true
                            }
                        }
                    });

                    theNewAccount.create(function (err, doc) {
                        should.not.exist(err);
                        done();
                    });

                }
            ]);

        });

        it('should find created account Account', function (done) {

            theFoundAccount = new AccountClass();

            theFoundAccount.getById(theNewAccount.id, function (err, receivedAccount) {
                should.not.exist(err);

                receivedAccount.should.eql( theFoundAccount );

                done();

            });

        });

        it('should not find nonexistent Account');

        it('should not find Account', function (done) {

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
                function( invalidId, esCallback ) {
                    theFoundAccount.getById(invalidId, function (err) {
                        should.exist(err);
                        esCallback();
                    });
                },

                // Callback
                function (err) {
                    should.not.exist(err);
                    done();
                }
            );

        });

        it('should not find removed Account');

    });

    describe('.getByName', function () {

        var theFoundAccount;

        beforeEach(function (done) {

            async.series([

                // Remove all old Accounts
                function (seriesCallback) {
                    AccountModel.find().remove().exec(function (err) {
                        should.not.exist(err);
                        seriesCallback();
                    });
                },

                // Create a new Account for tests
                function () {

                    theNewAccount = new AccountClass({
                        name: 'wailormanGet',
                        password: '123',
                        group: theNewAccountGroup,
                        individualPerms: {
                            coaches: {
                                create: true
                            }
                        }
                    });

                    theNewAccount.create(function (err, createdAccount) {
                        should.not.exist(err);

                        theNewAccount = createdAccount;

                        done();
                    });

                }
            ]);

        });

        it('should find created Account by name', function (done) {

            theFoundAccount = new AccountClass();

            theFoundAccount.getByName( theNewAccount.name, function(err, foundAcc) {
                should.not.exist(err);

                foundAcc.should.eql(theFoundAccount);

                done();
            });

        });

        it('should not find nonexistent Account');

        it('should not find created Account with invalid params', function (done) {

            theFoundAccount = new AccountClass();

            theFoundAccount.getByName( theNewAccount.name, function (err, foundAcc) {

                should.not.exist(err);

                foundAcc.should.eql(theFoundAccount);

                done();
            });

        });

        it('should not find removed Account');


    });


    describe('.getByToken', function () {

        it('should auth & find Account by token');

        it('should not find by terminated token');

        it('should not find nonexistent Account');

        it('should not find created Account with invalid params');

        it('should not find removed Account');

    });


    describe('.update', function () {

        it('should update Account data');

        it('should not update Account data with invalid params');

        it('should not update Account name to name of the existent Account');

        it('should check that updated Account.perms not been wrote to DB');

    });


    describe('.remove', function () {

        it('should remove Account');

        it('should not find removed Account');

        it('should mark removed Account {deleted: true}');

        it('should not remove already removed Account');

        it('should not remove Account with invalid id');

        it('should terminate all sessions of the Account');

    });


    describe('.auth', function () {

        it('should authenticate Account');

        it('should authenticate Account again');

        it('should check Account have two tokens after twice authorization');

        it('should not authenticate user with incorrect pass');

        it('should not authenticate with incorrect params');

        it('should not duplicate tokens in parallel auth');

    });

    describe('.logout', function () {

        it('should terminate all sessions of the Account');

        it('should terminate only one session of the Account');

        it('should not call method with incorrect params');

        it('should not call error when we calling .logout without any active sessions');

        it('should not terminate nonexistent session');

        it('should not terminate sessions of nonexistent Account');

    });

});