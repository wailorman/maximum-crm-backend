var mongoose     = require( 'mongoose' ),
    Schema       = mongoose.Schema,
    ObjectId     = mongoose.Types.ObjectId,
    restify      = require( 'restify' ),
    async        = require( 'async' );

/// SCHEMAS /////////////////////////////////////////////////

var lessonSchema = new Schema(
    {
        groups: {
            type: Array,
            required: true
        },
        coaches: {
            type: Array,
            required: true
        },
        halls: {
            type: Array
        },
        time: {
            start: {
                type: Date,
                required: true
            },
            end: {
                type: Date,
                required: true
            }
        }
    },
    { collection: 'lessons' }
);

//lessonSchema.paths.groups.isRequired = true;
//lessonSchema.paths.coaches.isRequired = true;

/// METHODS /////////////////////////////////////////////////


/// MODEL DEFINING //////////////////////////////////////////
var LessonModel = mongoose.model( 'LessonModel', lessonSchema );

module.exports = LessonModel;