var restify = require('restify');
var server = restify.createServer();
//var lessons = require('./classes/lessons.js');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var randtoken = require('rand-token').suid;

var someModule = require( './some-module.js');

//var AccountGroupModel = require('./classes/account-group/account-group.js').Model;


mongoose.connect('mongodb://localhost/test');

server.get('/lessons', function (res, req, next) {

});


    /*//   LESSONS

    // Get all lessons
    server.get('/lessons', lessons.getAll);

    // Get only one lesson
    server.get('/lessons/:id', lessons.getOne);

    // Update lesson info
    server.put('/lessons/:id', lessons.update);

    // Delete lesson
    server.del('/lessons/:id', lessons.remove);

    // Create lesson
    server.post('/lessons', lessons.create);
*/

server.listen(8080, function () {
    console.log('Maximum CRM REST API server started on port 8080');

    var someArr = [];

    console.log( someArr.someFunc() );

});



// cd libs && npm link && cd .. && npm link maxcrm-libs
// cd classes/account-group && npm link && cd ../.. && npm link maxcrm-account-group
// cd classes/account && npm link && cd ../.. && npm link maxcrm-account

