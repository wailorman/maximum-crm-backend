var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var accountSchema = new Schema({
    name: {type: String, required: true},
    perms: {type: Schema.Types.Mixed, required: true},
    group: {type: Schema.Types.ObjectId},
    deleted: {type: Boolean, required: true}
}, {
    collection: 'accounts'
});


module.exports.AccountModel = mongoose.model('AccountModel', accountSchema);