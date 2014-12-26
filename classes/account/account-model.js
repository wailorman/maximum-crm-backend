var mongoose = require( 'mongoose' ),
    Schema   = mongoose.Schema;


var accountSchema = new Schema( {

    name: {
        type:     String,
        required: true
    },

    password: {
        type:     String,
        required: true
    },

    individualPerms: {
        type: Schema.Types.Mixed
    },

    group: {
        type: Schema.Types.ObjectId         // TODO change to array of ObjectId's
    },

    deleted: {
        type:     Boolean,
        required: true
    }

}, {

    collection: 'accounts'

} );


module.exports.AccountModel = mongoose.model( 'AccountModel', accountSchema );