var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var restify = require('restify');

var ObjectId = require('../../libs/mini-funcs.js').ObjectId;
var is = require('../../libs/mini-funcs.js').is;

var LessonModel = require('../../libs/mongo-models.js').Lesson;


// Create LessonModel
module.exports = function (args, next) {

    /*var newLesson = new LessonModel({
        time: {
            start: args.time.start,
            end: args.time.end
        },
        hall: args.hall, // ObjectId
        group: args.group, // ObjectId
        coach: args.coach // ObjectId
    });

    newLesson.save(function(err, newLesson){
        if (err) return next(err);
        next(null, newLesson);
    });*/

    LessonModel.create(
        {
            time: {
                start: args.time.start,
                end: args.time.end
            },
            hall: args.hall, // ObjectId
            group: args.group, // ObjectId
            coach: args.coach // ObjectId
        },
        function(err, doc) {
            if ( err ) next( new restify.InvalidArgumentError("can't write new lesson to db") );
            next(null, doc);
        }
    );

};