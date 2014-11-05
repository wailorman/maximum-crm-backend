var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var restify = require('restify');
var ObjectID = require('mongodb').ObjectID;
var isValidHex24 = new RegExp("^[0-9a-fA-F]{24}$");



var lessonSchema = new Schema({
    id: Schema.Types.ObjectId,
    time: {
        start: Date,
        end: Date
    },
    hall: Schema.Types.ObjectId,
    group: Schema.Types.ObjectId
},{
    collection: 'lessons'
});
var Lesson = mongoose.model('Lesson', lessonSchema);


// Create Lesson
module.exports = function (args, next) {

    var startTime = parseInt(args.time.start);
    var endTime = parseInt(args.time.end);
    var hallId = new ObjectID(args.hall);
    var coachId = new ObjectID(args.coach);
    var groupId = new ObjectID(args.group);


    if ( !isValidHex24.test(hallId.toString()) ) return next(new restify.InvalidArgumentError('hall'));
    if ( !isValidHex24.test(coachId.toString()) ) return next(new restify.InvalidArgumentError('coach'));
    if ( !isValidHex24.test(groupId.toString()) ) return next(new restify.InvalidArgumentError('group'));

    if ( typeof startTime != 'number' || typeof endTime != 'number' ) {
        return next(new restify.InvalidArgumentError('time'));
    }



    var newLesson = new Lesson({
        time: {
            start: Date(args.time.start),
            end: Date(args.time.end)
        },
        hall: hallId,
        group: groupId
    });
    newLesson.save(function(err, newLesson){
        if (err) return next(err);
        next(null, newLesson);
    });


};