var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tokenSchema = new Schema({
    expiration: {type: Date},
    accountId: {type: mongoose.Types.ObjectId},

    deleted: {type: Boolean, required: true}
}, {
    collection: 'tokens'
});


module.exports.AccountModel = mongoose.model('TokenModel', tokenSchema);