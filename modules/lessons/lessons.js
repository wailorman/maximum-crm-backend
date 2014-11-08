var restify = require('restify');
var createLesson = require('./create-lesson.js');
var ObjectId = require('../../libs/mini-funcs.js').ObjectId;
var is = require('../../libs/mini-funcs.js').is;

var lol = "1";

module.exports = {
    getAll: function (req, res, next) {
        //next( new restify.InvalidArgumentError("123") );
        //next( new restify.InvalidArgumentError("123444") );

        /*var foo = function(next) {
            next.ifError( new restify.InvalidArgumentError("123") );
        };


        foo(next);

        res.send(lol);*/

        var Foo = function() {
            this.name = "lol1";
            this.function = function() {

            };
        };

        res.send( new Foo() );

        //return next();
    },
    getOne: function (req, res, next) {
        res.send(lol);
        //return next();
    },
    update: function (req, res, next) {

        lol = req.params.id;

        res.send({newLol: lol});
        //return next();
    },
    remove: function (req, res, next) {
        res.send(req.params);
        return next();
    },
    /*newPost: function (req, res, next) {
        res.send(req.params);
        return next();
    },*/
    create: function (req, res, next) {

        /*// is time.start not number
        if ( !is(req.params.time.start).number || !is(req.params.time.end).number) { next(new restify.InvalidArgumentError('time')); }

        // is hall string looks like 24-byte hex code (Mongo ObjectId)
        if ( !is(req.params.hall).stringObjectId ) { return next(new restify.InvalidArgumentError('hall')); }
        if ( !is(req.params.coach).stringObjectId ) { return next(new restify.InvalidArgumentError('coach')); }
        if ( !is(req.params.group).stringObjectId ) { return next(new restify.InvalidArgumentError('group')); }


        var startTime = new Date( parseInt(req.params.time.start) );
        var endTime = new Date( parseInt(req.params.time.end) );
        var hallObjectId = new ObjectId(req.params.hall);
        var coachObjectId = new ObjectId(req.params.coach);
        var groupObjectId = new ObjectId(req.params.group);
        

        createLesson({
                time: {
                    start: startTime,
                    end: endTime
                },
                hall: hallObjectId,
                coach: coachObjectId,
                group: groupObjectId
            },
            function (err, result) {
                if (err) return next(err);
                res.send(result);

            });

*/
        /*
        *
        *
        * */

        /*mHall.create(
            { name: 'Foo' },
            function (err, doc) {
                res.send(doc);
            }
        );*/

        next( new restify.InvalidArgumentError('ur dick. big dick') );

        /*Hall.create(
            { name: "Foo" },
            function (err, doc) {
                //expect(err).to.be.null;
                //if (err) done(err);


                expect(doc.name).to.eql('Fsoo');
                //doc.name.should.eql('Foo');
                *//*assert.equal(HallObject.name, 'Food');
                 HallObject.should.have.property('2000');
                 HallObject.name.should.equal('Foo');*//*
                //done();
            }
        );*/
    }
};