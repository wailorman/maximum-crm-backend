var mongoose     = require( 'mongoose' ),
    Schema       = mongoose.Schema,
    ObjectId     = mongoose.Types.ObjectId,
    randToken    = require( 'rand-token' ),
    passwordHash = require( 'password-hash' ),
    restify      = require( 'restify' ),
    async        = require( 'async' );

/// SCHEMAS /////////////////////////////////////////////////

var hallSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        }
    },
    { collection: 'halls' }
);

/// METHODS /////////////////////////////////////////////////


/// MODEL DEFINING //////////////////////////////////////////
var HallModel = mongoose.model( 'HallModel', hallSchema );

module.exports = HallModel;