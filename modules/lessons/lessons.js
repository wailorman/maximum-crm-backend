var restify = require('restify');
var createLesson = require('./create-lesson.js');
var ObjectID = require('../../libs/mini-funcs.js').ObjectID;
var is = require('../../libs/mini-funcs.js').is;


var lol = "1";

module.exports = {
    getAll: function (req, res, next) {
        res.send(lol);
        return next();
    },
    getOne: function (req, res, next) {
        res.send({lol: "getOne"});
        return next();
    },
    update: function (req, res, next) {

        lol = req.params.id;

        res.send({lol: "update"});
        return next();
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

        // is time.start not number
        if ( !is(req.params.time.start).number || !is(req.params.time.end).number) { return next(new restify.InvalidArgumentError('time')); }

        // is hall string looks like 24-byte hex code (Mongo ObjectId)
        if ( !is(req.params.hall).ObjectID ) { return next(new restify.InvalidArgumentError('hall')); }
        if ( !is(req.params.coach).ObjectID ) { return next(new restify.InvalidArgumentError('coach')); }
        if ( !is(req.params.group).ObjectID ) { return next(new restify.InvalidArgumentError('group')); }


        var startTime = new Date( parseInt(req.params.time.start) );
        var endTime = new Date( parseInt(req.params.time.end) );
        var hallObjectId = new ObjectID(req.params.hall);
        var coachObjectId = new ObjectID(req.params.coach);
        var groupObjectId = new ObjectID(req.params.group);
        

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


    }
};