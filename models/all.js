var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var hallsSchema = new Schema({
    name: {type: String, required: true}
},{
    collection: 'halls'
});
module.exports.HallModel = mongoose.model('HallsModel', hallsSchema);