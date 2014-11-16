var should =        require('should');
var mongoose =      require('mongoose');
var async =         require('async');

var Account =       require('../../../classes/account/account.js');
var AccountGroup =  require('../../../classes/account-group/account-group.js');

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

                        AccountGroup.Model.find().remove().exec(
                            function (err) {
                                should.not.exist(err);
                                seriesCb();
                            }
                        );
                    },
                    function (seriesCb) {

                        // Remove all Accounts

                        Account.Model.find().remove().exec(
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

            Account.Model.find().remove().exec(function (err) {
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
                        group: null // Method should understand that this is null
                    },
                    {
                        name: 'wailorman6',
                        password: '123',
                        individualPerms: null
                    }
                ],
                function (accountData, eachCallback) {

                    Account.create(accountData, function (err, newAccount) {
                        should.not.exist(err);

                        newAccount.name.should.eql(accountData.name);
                        newAccount.should.not.have.property('password');

                        // Should be an AccountGroup object
                        newAccount.group.should.have.properties('id', 'name', 'perms');
                        newAccount.group.should.eql(theNewAccountGroup);

                        // Check instances
                        newAccount.group.should.be.instanceof(AccountGroup);
                        newAccount.should.be.instanceof(Account);

                        // Check token
                        newAccount.should.not.have.property('token');

                        if ( accountData.individualPerms ) { // If we passed individual perms for the Account
                            newAccount.individualPerms.should.eql(accountData.individualPerms);
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
                        name: 'snoberik2',
                        password: '123',
                        individualPerms: true
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

                    Account.create(accountData, function (err, createdAccount) {
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

    });




    describe('.getById', function () {
    });

    describe('.getByName', function () {
    });



    describe('.update', function () {
    });




    describe('.remove', function () {
    });

});