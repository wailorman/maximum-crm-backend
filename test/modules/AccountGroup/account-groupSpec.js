var should = require('should');
var mongoose = require('mongoose');
var async = require('async');

var AccountGroup =  require('../../../modules/AccountGroup.js');

var theNewAccountGroup;

describe('AccountGroup module testing', function () {

    before(function () {
        mongoose.connect('mongodb://maximum-crm-test:qwerty155@gefest.wailorman.ru:27017/maximum-crm-test');
    });

    describe('.create', function () {

        it('should create a new group', function (done) {

            var validGroups = [
                {
                    name: 'testGroup',
                    perms: { // should create with perms ...
                        hall: {
                            create: true
                        }
                    }
                },
                {
                    name: 'testGroup',
                    perms: { // ... with empty perms (or null) ...

                    }
                },
                {
                    name: 'testGroup'
                    // ... and without them
                },
                {
                    name: 'test group' // name with spaces
                }
            ];

            for ( var i in validGroups ){

                // .create( data, next );
                AccountGroup.create( validGroups[i], function (err, doc) {
                    should.not.exist(err);

                    doc.should.have.properties('id', 'name');
                    doc.id.should.be.type('string');
                    doc.name.should.be.type('string');
                    doc.name.should.eql(validGroups[i].name);

                    if ( i === validGroups.length-1 ){ done(); }
                } );

            }

        });

        xit('should not create a new group with invalid params', function(done){

            var invalidGroups = [
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
            ];

            for ( var i in invalidGroups ) {
                AccountGroup.create(invalidGroups[i], function(err, doc){
                    should.exist(err);

                    if ( i === invalidGroups.length-1 ){ done(); }
                });
            }

        });

    });

    xdescribe('.update', function () {


        it('should update AccountGroup', function (done) {


            async.each(

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
                function ( data, callback ) {

                    theNewAccountGroup = null;

                    AccountGroup.create(
                        {
                            name: 'testGroup',
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
                                    should.not.exist(err);

                                    if ( data.name ){
                                        doc.name.should.eql(data.name);
                                    }

                                    if ( data.perms ){
                                        doc.perms.should.eql(data.perms);
                                    }

                                    callback();
                                }
                            );

                        }
                    );

                },

                // async.each callback
                function (err) {
                    should.not.exist(err);
                    done();
                }
            );

        });


        it('should not update AccountGroup with invalid data', function (done) {


            async.each(

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
                function ( data, callback ) {

                    theNewAccountGroup = null;

                    AccountGroup.create(
                        {
                            name: 'testGroup',
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

                },

                // async.each callback
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

            async.each(
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

            async.each(
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

            async.each(
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

            async.each(
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