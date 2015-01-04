var mongoose = require( 'mongoose' ),
    Schema   = mongoose.Schema;


var coachSchema = new Schema( {

    firstname: {
        type:     String,
        required: true
    },

    secondname: {
        type:     String
    },

    patron: {
        type:     String
    },

    account: {
        type: Schema.Types.ObjectId
    },

    deleted: {
        type:     Boolean,
        required: true
    }

}, {

    collection: 'coaches'

} );


module.exports.CoachModel = mongoose.model( 'CoachModel', coachSchema );