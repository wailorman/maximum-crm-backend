var Hall = require('../objects/hall-object.js');
var should = require('should');

var mongoose = require('mongoose');
var HallModel = require('../models/hall-model.js').HallModel;

var ObjectId = require('mongoose').Types.ObjectId;

var newHall, db, createdHallId;

mongoose.connect('mongodb://maximum-crm-test:qwerty155@gefest.wailorman.ru:27017/maximum-crm-test');

describe('Hall object', function () {

    this.timeout(100000);

    before(function () {

        // db = mongoose.createConnection('mongodb://maximum-crm-test:qwerty155@gefest.wailorman.ru:27017/maximum-crm-test');

        // remove all documents from halls collection
        HallModel.find().remove().exec();

    });


    describe('.create()', function () {

        it('should create Hall with name "Foo"', function (done) {
            Hall.create(
                {name: 'Foo'},
                function (err, doc) {
                    should.not.exist(err);

                    doc.should.have.property('name');
                    doc.should.have.property('id');

                    doc.name.should.equal('Foo');

                    done();
                }
            );
        });

        it('should not create Hall with no parameters', function (done) {

            // also, if we passed empty object, if statement will return error,
            // because data has no property .name
            // or because data is not object
            var incorrectDataTypes = [
                {},
                null,
                true,
                100,
                function () {
                },
                "",
                {notName: "some string"},
                ["1", {name: "lol. lets try"}]
            ];

            for (var i in incorrectDataTypes) {

                Hall.create(
                    incorrectDataTypes[i],
                    function (err) {
                        should.exist(err);
                    }
                );
            }

            done();
        });

    });

    describe('.getById', function () {

        it('should find created hall by id', function (done) {

            Hall.create({name: 'Bar'},
                function (err, createdHall) {
                    should.not.exist(err);
                    createdHall.should.have.property('id');

                    createdHall.name.should.equal('Bar');

                    Hall.getById(
                        createdHall.id,
                        function (err, foundHall) {
                            should.not.exist(err);

                            foundHall.should.have.property('id');
                            foundHall.should.have.property('name');

                            foundHall.id.should.eql(createdHall.id);
                            foundHall.name.should.equal('Bar');

                            done();
                        }
                    );

                });
        });

        it('should not find hall with incorrect ObjectId', function (done) {

            var incorrectObjectIds = [
                "",
                null,
                false,
                function () {
                },
                {}
            ];

            for (var i in incorrectObjectIds) {
                Hall.getById(
                    incorrectObjectIds[i],
                    function (err) {
                        should.exist(err);
                    }
                );
            }

            done();

        });

    });

    describe('.remove()', function () {

        it('should remove created hall', function (done) {

            Hall.create(
                {name: 'awesome name'},
                function (err, createdHall) {
                    should.not.exist(err);

                    createdHall.name.should.equal('awesome name');

                    Hall.getById(
                        createdHall.id,
                        function (err, foundHall) {
                            should.not.exist(err);

                            foundHall.should.have.property('id');
                            foundHall.should.have.property('name');

                            foundHall.id.should.equal(createdHall.id);
                            foundHall.name.should.equal(createdHall.name);
                            foundHall.name.should.equal('awesome name');

                            Hall.remove(
                                foundHall.id,
                                function (err) {
                                    should.not.exist(err);

                                    Hall.getById(
                                        foundHall.id,
                                        function (err) {
                                            should.exist(err);
                                            done();
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );

        });

    });

});