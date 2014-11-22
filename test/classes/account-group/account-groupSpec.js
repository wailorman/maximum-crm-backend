var should =            require('should');
var mongoose =          require('mongoose');
var async =             require('async');
var mf = require('../../../libs/mini-funcs.js');

var AccountGroupClass = require('maxcrm-account-group');
var AccountGroup =      new AccountGroupClass();
var AccountGroupModel = require('../../../classes/account-group/account-group-model.js').AccountGroupModel;

var theNewAccountGroup;

describe('AccountGroup module testing', function () {

    before(function (done) {

        // Connecting to mongoose test database

        mongoose.connect('mongodb://localhost/test', {},
            function (err) {
                should.not.exist(err);

                // Remove all documents after previous test

                AccountGroupModel.find().remove().exec(
                    function (err) {
                        should.not.exist(err);
                        done();
                    }
                );

            });
    });

    describe('.create', function () {

        beforeEach(function (done) {

            AccountGroupModel.find().remove().exec(function (err) {
                should.not.exist(err);
                done();
            });

        });

        it('should create a new group', function (done) {

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
                function (validGroup, eachSeriesCallback) {


                    async.series([

                        // Delete old AccountGroups
                        function (seriesCallback) {
                            AccountGroupModel.find().remove().exec(
                                function (err) {
                                    should.not.exist(err);
                                    seriesCallback();
                                }
                            );
                        },

                        // Create new AccountGroup
                        function (seriesCallback) {

                            theNewAccountGroup = new AccountGroupClass();

                            theNewAccountGroup.create( validGroup, function (err) {
                                should.not.exist(err);

                                theNewAccountGroup.should.be.instanceof(AccountGroupClass);

                                //theNewAccountGroup.should.have.properties('id', 'name');

                                // id
                                theNewAccountGroup.should.have.property('id');
                                theNewAccountGroup.id.should.be.type('string');
                                mf.isObjectId(theNewAccountGroup.id).should.eql(true);

                                // name
                                theNewAccountGroup.should.have.property('name');
                                theNewAccountGroup.name.should.be.type('string');
                                theNewAccountGroup.name.should.eql(validGroup.name);


                                if ( validGroup.perms ) {
                                    theNewAccountGroup.should.have.property('perms');
                                    mf.validatePerms(theNewAccountGroup.perms).should.eql(true);
                                }


                                seriesCallback();
                            } );
                        }
                    ],
                    function (err) {
                        should.not.exist(err);
                        eachSeriesCallback();
                    });



                },

                // End of iteration. Result
                function (err) {
                    should.not.exist(err);
                    done();
                }
            );


        });

        it('should not create a new group with invalid params', function(done){

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
                        name: '',       // incorrect perms type
                        perms: ''       // ... string instead of object
                    }
                ],

                // Iterator
                function (invalidGroup, callback) {


                    AccountGroup.create(invalidGroup, function(err){
                        should.exist(err);
                        callback();
                    });


                },

                // End of iteration. Result
                function (err) {
                    should.not.exist(err);
                    done();
                }
            );

        });

        it('should not create two AccountGroup with same names', function (done) {

            async.series([
                    // First create AccountObject. Should go fine
                    function (callback) {

                        theNewAccountGroup = null;

                        AccountGroup.create(
                            {
                                name: 'Baz'
                            },
                            function (err, doc) {
                                should.not.exist(err);
                                callback(err);
                            }
                        );

                    },

                    function (callback) {

                        theNewAccountGroup = null;

                        AccountGroup.create(
                            {
                                name: 'Baz'
                            },
                            function (err, doc) {
                                should.exist(err);
                                callback();
                            }
                        );

                    },

                    function (callback) {

                        AccountGroup.create(
                            {
                                name: 'Baz'
                            },
                            function (err, doc) {
                                should.exist(err);
                                callback();
                            }
                        );

                    }
                ],
                function (err) {
                    should.not.exists(err);
                    done();
                });

        });

    });

    describe('.update', function () {

        beforeEach(function (done) {

            async.series([

                // Remove old AccountGroups
                function (scb) {
                    AccountGroupModel.find().remove().exec(function (err) {
                        should.not.exist(err);
                        scb();
                    });
                },

                // Create a new AccountGroup
                function () {
                    theNewAccountGroup = new AccountGroupClass();
                    theNewAccountGroup.create({name: 'someAccountGroup'}, function (err) {
                        should.not.exist(err);
                        done();
                    });
                }
            ]);

        });

        it('should update AccountGroup', function (done) {


            async.eachSeries(

                // valid new data of an Account Group
                [
                    {
                        // only name
                        name: 'new name1'
                    },
                    {
                        // all params
                        name: 'new name2',
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

                    async.series([



                        // Remove old AccountGroups
                        function (scb) {
                            theNewAccountGroup = null;

                            AccountGroupModel.find().remove(function (err) {
                                should.not.exist(err);
                                scb()
                            });
                        },



                        // Create new AccountGroup
                        function (scb) {

                            theNewAccountGroup = new AccountGroupClass();

                            theNewAccountGroup.create(
                                {
                                    name: 'testGroupLol',
                                    perms: {
                                        hall: {
                                            create: true
                                        }
                                    }
                                },
                                function (err, accountGroupDocument) {
                                    should.not.exist(err);
                                    //theNewAccountGroup = accountGroupObject;

                                    scb();
                                }
                            );

                        },



                        // Update
                        function () {

                            for ( var i in newDataOfAccountGroup ){
                                theNewAccountGroup[i] = newDataOfAccountGroup[i];
                                console.log('\n newDataOfAccountGroup.'+i+' = '+newDataOfAccountGroup[i]);
                                console.log('\n theNewAccountGroup.'+i+' := newDataOfAccountGroup.'+i);
                                console.log('\n theNewAccountGroup.'+i+' = '+theNewAccountGroup[i]);
                            }

                            theNewAccountGroup.update( function (err) {
                                    should.not.exist(err);

                                    if ( newDataOfAccountGroup.name ){
                                        console.log('\n 1 ' + newDataOfAccountGroup.name);
                                        console.log('\n 2 ' + theNewAccountGroup.name);
                                        theNewAccountGroup.name.should.eql(newDataOfAccountGroup.name);
                                    }

                                    if ( newDataOfAccountGroup.perms ){
                                        theNewAccountGroup.perms.should.eql(newDataOfAccountGroup.perms);
                                    }

                                    escb();
                                }
                            );

                        }
                    ]);


                },

                // async.eachSeries main callback
                function (err) {
                    should.not.exist(err);
                    done();
                }
            );

        });

        it('should not update AccountGroup with invalid data', function (done) {


            async.series([
                function (theSeriesCallback) {
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

                            async.series([

                                    // Remove old AccountGroup
                                    function (seriesCallback) {
                                        AccountGroupModel.find().remove().exec(
                                            function (err) {
                                                should.not.exist(err);
                                                seriesCallback();
                                            }
                                        );
                                    },

                                    // Create a new AccountGroup
                                    function (seriesCallback) {
                                        AccountGroup.create(
                                            {
                                                name: 'testGroup222',
                                                perms: {
                                                    hall: {
                                                        create: true
                                                    }
                                                }
                                            },
                                            function (err, newAccountGroup) {
                                                should.not.exist(err);
                                                theNewAccountGroup = newAccountGroup;


                                                for ( var i in data ){
                                                    theNewAccountGroup[i] = data[i];
                                                }


                                                theNewAccountGroup.update(
                                                    function (err) {
                                                        should.exist(err);
                                                        seriesCallback();
                                                    }
                                                );

                                            }
                                        );
                                    }
                                ],
                                function (err) {
                                    should.not.exist(err);
                                    iteratorCallback();
                                });





                        },

                        // async.eachSeries callback
                        function (err) {
                            should.not.exist(err);

                            theSeriesCallback();
                        }
                    );
                },
                function () {
                    done();
                }
            ]);





        });

        it('should not update id of the AccountGroup', function (done) {

            var earlyCreatedAccountGroup;

            async.series([
                function (seriesCallback) {

                    // Creating a new AccountGroup
                    AccountGroup.create(
                        {
                            name: 'name of the new AccountGroup'
                        },
                        function (err, createdAccountGroup) {
                            should.not.exist(err);
                            earlyCreatedAccountGroup = createdAccountGroup;

                            var lol;

                            seriesCallback();
                        }
                    );

                },
                function () {

                    earlyCreatedAccountGroup.id = 'excellent new id!';

                    earlyCreatedAccountGroup.update(function (err, updatedAccountGroup) {
                        should.exist(err);
                        done();
                    });

                }
            ]);

        });

        it('should not update empty AccountGroup', function (done) {

            AccountGroup.update(function (err) {
                should.exist(err);
                done();
            });

        });

        it('should not update AccountGroup name to the already used name', function (done) {

            var accountGroupWithName = new AccountGroupClass();
            accountGroupWithName.create({name: 'someExistentName'}, function (err) {
                should.not.exist(err);

                // update name of the AccountGroup to some existent name
                theNewAccountGroup.name = accountGroupWithName.name;
                theNewAccountGroup.update(function (err) {
                    should.exist(err);
                    done();
                });

            });

        });

    });

    describe('.remove', function () {

        beforeEach(function (done) {

            theNewAccountGroup = null;

            AccountGroup.create(
                {
                    name: 'Foo',
                    perms: {
                        hall: {
                            whiskey: true
                        }
                    }
                },
                function (err, newAccountGroup) {
                    should.not.exist(err);
                    theNewAccountGroup = newAccountGroup;
                    done();
                }
            );

        });

        it('should remove AccountGroup', function (done) {

            theNewAccountGroup.remove(
                function (err) {
                    should.not.exists(err);
                    done();
                }
            );

        });

        it('should not find removed AccountGroup');

        it('should mark removed AccountGroup as {deleted: true}');

        it('should not remove already removed AccountGroup', function (done) {

            theNewAccountGroup.remove(
                function (err) {

                    // first removing...
                    should.not.exists(err);

                    theNewAccountGroup.remove(
                        function (err) {
                            // second removing. should failed
                            should.exist(err);

                            done();
                        }
                    );

                }
            );

        });

        it('should update Accounts info which using this AccountGroup');

    });

    describe('.getById', function () {

        beforeEach(function (done) {

            theNewAccountGroup = null;

            async.series([

                // Remove old AccountGroup
                function (seriesCallback) {

                    AccountGroupModel.find().remove().exec(
                        function (err) {
                            should.not.exist(err);
                            seriesCallback();
                        }
                    );

                },

                // Create new AccountGroup
                function (seriesCallback) {
                    AccountGroup.create(
                        {
                            name: 'Foo2222',
                            perms: {
                                hall: {
                                    whiskey: true
                                }
                            }
                        },
                        function (err, foundAccountGroup) {
                            should.not.exist(err);
                            theNewAccountGroup = foundAccountGroup;
                            seriesCallback();
                        }
                    );
                }
            ],
            function(err){
                should.not.exist(err);
                done();
            });


        });

        it('should get AccountGroup', function (done) {

            AccountGroup.getById(
                theNewAccountGroup.id,
                function (err, doc) {
                    should.not.exist(err);

                    doc.should.be.instanceof(AccountGroupClass);
                    doc.id.should.eql(theNewAccountGroup.id);
                    doc.name.should.eql(theNewAccountGroup.name);


                    done();
                }
            );

        });

        it('should not get removed AccountGroup', function (done) {

            theNewAccountGroup.remove(
                function (err) {
                    should.not.exist(err);

                    AccountGroup.getById(
                        theNewAccountGroup.id,
                        function (err) {
                            should.exist(err);
                            done();
                        }
                    );

                }
            );

        });

        it('should not call with invalid params', function (done) {

            async.eachSeries(
                [
                    '',
                    'ab69ba69ab676ab67',
                    {},
                    {id: 8383},
                    null,
                    true,
                    false
                ],
                function (invalidIdParam, callback) {

                    AccountGroup.getById(invalidIdParam, function(err) {
                        should.exist(err);
                        callback();
                    });

                },
                function (err) {
                    should.not.exist(err);
                    done();
                }
            );

        });

    });


    describe('.getByName', function () {

        it('should get AccountGroup');

        it('should not get removed AccountGroup');

        it('should not get AccountGroup with invalid params');

    });


    after(function () {
        mongoose.disconnect();
    });

});