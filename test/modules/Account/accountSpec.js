var should =        require('should');
var mongoose =      require('mongoose');
var async =         require('async');

var Account =       require('../../../modules/account/account.js');
var AccountGroup =  require('../../../modules/account-group/account-group.js');

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

        beforeEach(function (done) {

            Account.Model.find().remove().exec(function (err) {
                should.not.exist(err);
                done();
            });

        });

        it('should create a new Account', function (done) {

            async.eachSeries(
                [
                    {
                        name: 'wailorman',
                        password: '123',
                        group: theNewAccountGroup.id
                    }
                ],
                function (accountData, eachCallback) {

                    Account.create(accountData, function (err, newAccount) {
                        should.not.exist(err);

                        newAccount.name.should.eql(accountData.name);
                        newAccount.should.not.have.property('password');
                        newAccount.group.id.should.eql();
                    });

                }
            );

        });

    });

});