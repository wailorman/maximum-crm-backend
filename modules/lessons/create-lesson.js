var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var restify = require('restify');

var ObjectID = require('../../libs/mini-funcs.js').ObjectID;
var is = require('../../libs/mini-funcs.js').is;

var Lesson = require('../../libs/mongo-models.js').Lesson;


// Create Lesson
module.exports = function (args, next) {

    var newLesson = new Lesson({
        time: {
            start: args.time.start,
            end: args.time.end
        },
        hall: args.hall,
        group: args.group,
        coach: args.coach
    });

    newLesson.save(function(err, newLesson){
        if (err) return next(err);
        next(null, newLesson);
    });


};