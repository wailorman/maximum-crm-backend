// new Lesson();
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var restify = require('restify');
var ObjectID = require('../../libs/mini-funcs.js').ObjectID;
var is = require('../../libs/mini-funcs.js').is;
var LessonModel = require('../../libs/mongo-models.js').Lesson;

module.exports = function(params){


    if ( is(params).ObjectID ){
        // find lesson by id
        return true;
    }
    if ( is(params).object ) {
        // creating new lesson

    }

    /*
    *
    * Get lesson
    * var Lesson = new Lesson("d79f7sd78f9987sd7fds9f87");
    *
    * Create lesson
    * var Lesson = new Lesson({});
    * Lesson.save(next(err, newLesson));
    *
    * Update lesson
    * var Lesson = new Lesson("6fd67s8df67867sd66sdf67s");
    *
    *
    * {
    *   _id: ObjectId("7dsf9sdf879s9d8f97sd7f97"),
    *   time: {
    *       start: Date(...),
    *       end: Date(...)
    *   },
    *   hall: {
    *       _id: ObjectId("sd8f89sd980f980sd909ds9f898"),
    *       name: "..."
    *   },
    *   group: {
    *
    *   }
    * }
    *
    *
    * */

};