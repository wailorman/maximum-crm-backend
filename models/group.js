var mongoose     = require( 'mongoose' ),
    Schema       = mongoose.Schema,
    ObjectId     = mongoose.Types.ObjectId,
    randToken    = require( 'rand-token' ),
    passwordHash = require( 'password-hash' ),
    restify      = require( 'restify' ),
    async        = require( 'async' );

/// SCHEMAS /////////////////////////////////////////////////

var groupSchema = new Schema(
    {
        name: {
            type: String,
            required: true
        }
    },
    { collection: 'groups' }
);

/// METHODS /////////////////////////////////////////////////


/// MODEL DEFINING //////////////////////////////////////////
var GroupModel = mongoose.model( 'GroupModel', groupSchema );

module.exports = GroupModel;