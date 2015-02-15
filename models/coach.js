var mongoose     = require( 'mongoose' ),
    Schema       = mongoose.Schema,
    ObjectId     = mongoose.Types.ObjectId,
    randToken    = require( 'rand-token' ),
    passwordHash = require( 'password-hash' ),
    restify      = require( 'restify' ),
    async        = require( 'async' );

/// SCHEMAS /////////////////////////////////////////////////

var coachSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        }
    },
    { collection: 'coaches' }
);

/// METHODS /////////////////////////////////////////////////


/// MODEL DEFINING //////////////////////////////////////////
var CoachModel = mongoose.model( 'CoachModel', coachSchema );

module.exports = CoachModel;