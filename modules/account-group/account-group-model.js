var mongoose = require('mongoose');
var Schema = mongoose.Schema;


    var accountGroupSchema = new Schema({
        name: {type: String, required: true},
        perms: {type: Schema.Types.Mixed, required: true}
    }, {
        collection: 'halls'
    });


module.exports.AccountGroupModel = mongoose.model('AccountGroupModel', accountGroupSchema);