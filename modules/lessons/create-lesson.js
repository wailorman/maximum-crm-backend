var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var restify = require('restify');

var ObjectID = require('../../libs/mini-funcs.js').ObjectID;
var is = require('../../libs/mini-funcs.js').is;

var LessonModel = require('../../libs/mongo-models.js').Lesson;


// Create LessonModel
module.exports = function (args, next) {

    var newLesson = new LessonModel({
        time: {
            start: args.time.start,
            end: args.time.end
        },
        hall: args.hall, // ObjectID
        group: args.group, // ObjectID
        coach: args.coach // ObjectID
    });

    newLesson.save(function(err, newLesson){
        if (err) return next(err);
        next(null, newLesson);
    });


};