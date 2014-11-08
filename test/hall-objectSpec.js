var Hall = require('../modules/halls/hall-object.js').Hall;
var should = require('should');

var mongoose = require('mongoose');
var HallModel = require('../modules/halls/hall-model.js').HallModel;

var newHall, db, createdHallId;

describe('Hall object', function () {

    this.timeout(10000);

    before(function () {
        mongoose.connect('mongodb://maximum-crm-test:qwerty155@gefest.wailorman.ru:27017/maximum-crm-test');
        // db = mongoose.createConnection('mongodb://maximum-crm-test:qwerty155@gefest.wailorman.ru:27017/maximum-crm-test');

        // remove all documents from halls collection
        HallModel.find().remove().exec();

    });

    beforeEach(function () {
        newHall = new Hall;
    });

    describe('.create()', function () {


        it('should create Hall with name "Foo"', function (done) {
            newHall.create(
                {name: 'Foo'},
                function(err, doc){
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
            var incorrectDataTypes = [{}, null, true, 100, function(){}, ""];

            for ( var i in incorrectDataTypes ){
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
            newHall = Hall.create({name: 'Foo'}, function(err, doc) {
                should.not.exist(err);
            });

        });

        it('should find hall', function (done) {

        })


    });

});