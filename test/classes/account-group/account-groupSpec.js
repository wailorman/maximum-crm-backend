var should =            require('should');
var mongoose =          require('mongoose');
var async =             require('async');

var AccountGroupClass = require('../../../classes/account-group/account-group.js');
var AccountGroup =      new AccountGroupClass();
var AccountGroupModel = require('../../../classes/account-group/account-group-model.js').AccountGroupModel;
var Perms =             require('../../../classes/perms/perms.js');
var Token =             require('../../../classes/token/token.js');

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

        it('should create a new group', function (done) {

            async.eachSeries(
                [
                    {
                        name: '.create1-1',
                        perms: // should create with perms ...
                            new Perms({
                                hall: {
                                    create: true
                                }
                            })
                    },
                    {
                        name: '.create1-2',
                        perms: // ... with empty perms (or null) ...
                            new Perms()
                    },
                    {
                        name: '.create1-3'
                        // ... and without them
                    },
                    {
                        name: '.create4',
                        perms: { // should understand not only Perms object, but std obj too
                            hall: {
                                create: true
                            }
                        }
                    }
                ],

                // Iterator
                function (validGroup, eachSeriesCallback) {


                    async.series([
                        function (seriesCallback) {
                            AccountGroupModel.find().remove().exec(
                                function (err) {
                                    should.not.exist(err);
                                    seriesCallback();
                                }
                            );
                        },

                        function (seriesCallback) {
                            AccountGroup.create( validGroup, function (err, doc) {
                                should.not.exist(err);

                                doc.should.be.instanceof(AccountGroupClass);
                                doc.should.have.properties('id', 'name');

                                if ( validGroup.perms ) {
                                    doc.should.have.property('perms');
                                }

                                doc.id.should.be.type('string');
                                doc.name.should.be.type('string');
                                doc.name.should.eql(validGroup.name);



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


                    AccountGroup.create(invalidGroup, function(err, doc){
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
                function ( data, eachSeriesIterator ) {

                    async.series([

                        // Remove old AccountGroup-s
                        function (callback) {
                            theNewAccountGroup = null;

                            AccountGroupModel.find().remove(function (err) {
                                should.not.exist(err);
                                callback()
                            });
                        },

                        // Create new AccountGroup
                        function (callback) {

                            AccountGroup.create(
                                {
                                    name: 'testGroupLol',
                                    perms: {
                                        hall: {
                                            create: true
                                        }
                                    }
                                },
                                function (err, doc) {
                                    should.not.exist(err);
                                    theNewAccountGroup = doc;

                                    callback();
                                }
                            );

                        },

                        // And... the final... updating
                        function () {

                            for ( var i in data ){
                                theNewAccountGroup[i] = data[i];
                            }

                            theNewAccountGroup.update( function (err, newAccountGroup) {
                                    should.not.exist(err);

                                    if ( data.name ){
                                        newAccountGroup.name.should.eql(data.name);
                                    }

                                    if ( data.perms ){
                                        newAccountGroup.perms.should.eql(data.perms);
                                    }

                                    eachSeriesIterator();
                                }
                            );

                        }
                    ]);


                },

                // async.eachSeries callback
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

                            console.log('\nIm called done()!');

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

        it('should call error when passing invalid params', function (done) {

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

    /*describe('.getPerms', function () {

        beforeEach(function (done) {

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
                                name: 'Foo',
                                perms: {
                                    hall: {
                                        whiskey: true
                                    }
                                }
                            },
                            function (err, doc) {
                                should.not.exist(err);
                                theNewAccountGroup = doc;
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

        it('should return perms for the group', function (done) {

            AccountGroup.getPerms(
                theNewAccountGroup.id,
                function(err, perms) {
                    should.not.exist(err);
                    perms.should.eql(theNewAccountGroup.perms);
                    done();
                }
            );

        });

        it('should not get perms of removed AccountGroup', function (done) {

            AccountGroup.remove(
                theNewAccountGroup.id,
                function (err) {
                    should.not.exist(err);

                    AccountGroup.getPerms(
                        theNewAccountGroup.id,
                        function (err, perms) {
                            should.exist(err);
                            done();
                        }
                    );
                }
            );

        });

        it('should call error when passing invalid params', function (done) {

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

                    AccountGroup.getPerms( invalidIdParam, function(err, doc) {
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

    });*/


    /*describe('.updatePerms', function () {

        beforeEach(function (done) {

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
                                name: 'Foo',
                                perms: {
                                    hall: {
                                        whiskey: true
                                    }
                                }
                            },
                            function (err, doc) {
                                should.not.exist(err);
                                theNewAccountGroup = doc;
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

        it('should update perms', function (done) {

            async.eachSeries(
                [
                    {
                        hall: {
                            zoo: true
                        }
                    },
                    {
                        otherPerm: {
                            secondLevelPerm: true
                        }
                    },
                    {

                    },
                    {
                        falsePerm: false
                    }
                ],
                function (validPerms, callback) {

                    AccountGroup.updatePerms(
                        theNewAccountGroup.id,
                        validPerms,
                        function (err, doc) {
                            should.not.exist(err);

                            doc.name.should.eql( theNewAccountGroup.name );
                            doc.perms.should.eql( validPerms );

                            callback();
                        }
                    );
                },
                function (err) {
                    should.not.exist(err);
                    done();
                }
            );

        });


        it('should not update perms', function (done) {

            async.eachSeries(
                [
                    true,
                    'lol. error'
                ],
                function (invalidPerms, callback) {
                    AccountGroup.updatePerms(
                        theNewAccountGroup.id,
                        invalidPerms,
                        function (err, doc) {
                            should.exist(err);
                            callback();
                        }
                    );
                },
                function (err) {
                    should.not.exist(err);
                    done();
                }
            );

        });

    });*/


    after(function () {
        mongoose.disconnect();
    });

});