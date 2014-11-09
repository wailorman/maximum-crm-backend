var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var hallsSchema = new Schema({
    name: String
},{
    collection: 'halls'
});
module.exports.HallModel = mongoose.model('HallsModel', hallsSchema);