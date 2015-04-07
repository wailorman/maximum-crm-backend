var mongoose     = require( 'mongoose' ),
    Schema       = mongoose.Schema,
    ObjectId     = mongoose.Types.ObjectId,
    randToken    = require( 'rand-token' ),
    passwordHash = require( 'password-hash' ),
    restify      = require( 'restify' ),
    async        = require( 'async' );

/// SCHEMAS /////////////////////////////////////////////////

var clientSchema = new Schema(
    {
        name: {
            type:     String,
            required: true
        },

        consists: [ Schema.Types.ObjectId ]
    },
    { collection: 'clients' }
);

/// METHODS /////////////////////////////////////////////////


/// MODEL DEFINING //////////////////////////////////////////
var ClientModel = mongoose.model( 'ClientModel', clientSchema );

module.exports = ClientModel;