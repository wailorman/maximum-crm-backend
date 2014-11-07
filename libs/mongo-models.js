var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var lessonSchema = new Schema({
    id: Schema.Types.ObjectId,
    time: {
        start: Date,
        end: Date
    },
    hall: Schema.Types.ObjectId,
    group: Schema.Types.ObjectId,
    coach: Schema.Types.ObjectId
},{
    collection: 'lessons'
});
module.exports.Lesson = mongoose.model('Lesson', lessonSchema);;