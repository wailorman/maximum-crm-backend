var should = require('should');
var mongoose = require('mongoose');
var async = require('async');

var AccountGroup =  require('../../../modules/account-group/account-group.js');

var theNewAccountGroup;

describe('AccountGroup module testing', function () {

    before(function (done) {

        // Connecting to mongoose test database

        mongoose.connect('mongodb://maximum-crm-test:qwerty155@gefest.wailorman.ru:27017/maximum-crm-test', {},
            function (err) {
                should.not.exist(err);

                // Remove all documents after previous test

                AccountGroup.Model.find().remove().exec(
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
                        perms: { // should create with perms ...
                            hall: {
                                create: true
                            }
                        }
                    },
                    {
                        name: '.create1-2',
                        perms: { // ... with empty perms (or null) ...

                        }
                    },
                    {
                        name: '.create1-2'
                        // ... and without them
                    }
                ],

                // Iterator
                function (validGroup, eachSeriesCallback) {


                    async.series([
                        function (seriesCallback) {
                            AccountGroup.Model.find().remove().exec(
                                function (err) {
                                    should.not.exist(err);
                                    seriesCallback();
                                }
                            );
                        },

                        function (seriesCallback) {
                            AccountGroup.create( validGroup, function (err, doc) {
                                should.not.exist(err);

                                doc.should.have.properties('id', 'name');
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
                        // no new perms
                        name: 'new name'
                    },
                    {
                        // fully new AccountGroup data
                        name: 'new name2',
                        perms: {
                            hall: {
                                removing: true
                            }
                        }
                    },
                    {
                        // fully new AccountGroup data
                        name: 'new name3',
                        perms: {}
                    }
                ],

                // iterator
                function ( data, finIterator ) {

                    async.series([

                        // Remove old AccountGroup-s
                        function (callback) {
                            theNewAccountGroup = null;

                            AccountGroup.Model.find().remove(function (err) {
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

                            AccountGroup.update(
                                theNewAccountGroup.id,
                                data,
                                function (err, doc) {
                                    should.not.exist(err);

                                    if ( data.name ){
                                        doc.name.should.eql(data.name);
                                    }

                                    if ( data.perms ){
                                        doc.perms.should.eql(data.perms);
                                    }

                                    finIterator();
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


            async.eachSeries(

                // invalid new data of an Account Group
                [
                    {
                        name: ''
                    },
                    {
                        name: {}
                    },
                    {
                        perms: {}
                    },
                    {

                    },
                    {
                        perms: ''
                    },
                    {
                        name: '',
                        perms: {}
                    }
                ],

                // iterator
                function ( data, iteratorCallback ) {

                    theNewAccountGroup = null;

                    async.series([

                            // Remove old AccountGroup
                            function (callback) {
                                AccountGroup.Model.find().remove().exec(
                                    function (err) {
                                        should.not.exist(err);
                                        callback();
                                    }
                                );
                            },

                            // Create a new AccountGroup
                            function (callback) {
                                AccountGroup.create(
                                    {
                                        name: 'testGroup222',
                                        perms: {
                                            hall: {
                                                create: true
                                            }
                                        }
                                    },
                                    function (err, doc) {
                                        should.not.exist(err);
                                        theNewAccountGroup = doc;

                                        AccountGroup.update(
                                            theNewAccountGroup.id,
                                            data,
                                            function (err, doc) {
                                                should.exist(err);

                                                callback();
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
                    done();
                }
            );



        });

    });

    xdescribe('.remove', function () {

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
                function (err, doc) {
                    should.not.exist(err);
                    theNewAccountGroup = doc;
                    done();
                }
            );

        });

        it('should remove AccountGroup', function (done) {

            AccountGroup.remove(
                theNewAccountGroup.id,
                function (err) {
                    should.not.exists(err);
                    done();
                }
            );

        });

        it('should not remove already removed AccountGroup', function (done) {

            AccountGroup.remove(
                theNewAccountGroup.id,
                function (err) {

                    // first removing...
                    should.not.exists(err);

                    AccountGroup.remove(
                        theNewAccountGroup.id,
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

    xdescribe('.getById', function () {

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
                function (err, doc) {
                    should.not.exist(err);
                    theNewAccountGroup = doc;
                    done();
                }
            );

        });

        it('should get AccountGroup', function (done) {

            AccountGroup.getById(
                theNewAccountGroup.id,
                function (err, doc) {
                    should.not.exist(err);

                    doc.should.eql(theNewAccountGroup);

                    done();
                }
            );

        });

        it('should not get removed AccountGroup', function (done) {

            AccountGroup.remove(
                theNewAccountGroup.id,
                function (err) {
                    should.not.exist(err);

                    AccountGroup.getById(
                        theNewAccountGroup.id,
                        function (err, doc) {
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

                    AccountGroup.getById(invalidIdParam, function(err, doc) {
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

    xdescribe('.getPerms', function () {

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
                function (err, doc) {
                    should.not.exist(err);
                    theNewAccountGroup = doc;
                    done();
                }
            );

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

                    AccountGroup.getParams( invalidIdParam, function(err, doc) {
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


    xdescribe('.updatePerms', function () {

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
                function (err, doc) {
                    should.not.exist(err);
                    theNewAccountGroup = doc;
                    done();
                }
            );

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
                        function (err, doc) {
                            should.not.exist(err);
                            theNewAccountGroup = doc;
                            done();
                        }
                    );

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
                    false,
                    ''
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

    });


    after(function () {
        mongoose.disconnect();
    });

});