var mongoose = require( 'mongoose' ),
    Schema   = mongoose.Schema;

var tokenSchema = new Schema({

    token: {
        type: String,
        required: true
    },
    account: {
        type: Schema.Types.ObjectId,
        required: true
    },

    ttl: {
        type: Date,
        required: true
    },

    created: {
        type: Date
    }

}, {

    collection: 'tokens'

} );

module.exports.TokenModel = mongoose.model( 'TokenModel', tokenSchema );