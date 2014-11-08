var Hall = require('../modules/halls/hall-object.js').Hall;
var should = require('should');

var mongoose = require('mongoose');
var HallModel = require('../modules/halls/hall-model.js').HallModel;

var ObjectId = require('mongoose').Types.ObjectId;

var newHall, db, createdHallId;

describe('Hall object', function () {

    this.timeout(100000);

    before(function () {
        mongoose.connect('mongodb://maximum-crm-test:qwerty155@gefest.wailorman.ru:27017/maximum-crm-test');
        // db = mongoose.createConnection('mongodb://maximum-crm-test:qwerty155@gefest.wailorman.ru:27017/maximum-crm-test');

        // remove all documents from halls collection
        HallModel.find().remove().exec();

    });


    describe('.create()', function () {

        beforeEach(function () {
            newHall = new Hall;
        });

        it('should create Hall with name "Foo"', function (done) {
            newHall.create(
                {name: 'Foo'},
                function (err, doc) {
                    should.not.exist(err);

                    doc.should.have.property('name');
                    doc.should.have.property('id');
                    newHall.should.have.property('name');
                    newHall.should.have.property('id');

                    doc.name.should.equal('Foo');
                    newHall.name.should.equal('Foo');

                    done();
                }
            );
        });

        it('should not create Hall with no parameters', function (done) {

            // also, if we passed empty object, if statement will return error,
            // because data has no property .name
            var incorrectDataTypes = [{}, null, true, 100, function () {
            }, ""];

            for (var i in incorrectDataTypes) {

                newHall = new Hall;

                newHall.create(
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

        before(function () {

            //var newHall;
            /*newHall = new Hall;
            newHall.create(
                {name: 'Bar'},
                function (err, doc) {
                    should.not.exist(err);
                });*/
        });

        it('should find hall', function (done) {

            var hall = new Hall;
            hall.create({name: 'Bar'},
                function (err, doc) {
                    should.not.exist(err);
                    done();
                    hall.should.have.property('id');
                });



            /*newHall.getById(
             id,
             function(err, doc) {
             should.not.exist(err);
             doc.name.should.equal('Bar');
             done();
             }
             );*/

            //done();
        });


    });

});