var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var accountGroupSchema = new Schema({
    name: {type: String, required: true},
    perms: {type: Schema.Types.Mixed},
    deleted: {type: Boolean, required: true}
}, {
    collection: 'account_groups'
});


module.exports.AccountGroupModel = mongoose.model('AccountGroupModel', accountGroupSchema);