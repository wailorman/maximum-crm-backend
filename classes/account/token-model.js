var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tokenSchema = new Schema({
    expiration: {type: Date},
    accountId: {type: Schema.Types.ObjectId},
    deleted: {type: Boolean, required: true}
}, {
    collection: 'tokens'
});


module.exports.TokenModel = mongoose.model('TokenModel', tokenSchema);