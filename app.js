var restify = require('restify');
var server = restify.createServer();
var lessons = require('./modules/lessons.js');
var mongoose = require('mongoose');

mongoose.connect('mongodb://maximum-crm:75FzSCK@gefest.wailorman.ru:27017/maximum-crm');

    server.use(restify.queryParser());
    server.use(restify.bodyParser());

    //   LESSONS

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

    //server.post('/lessonsss', lessons.newPost);

server.listen(8080, function () {
    console.log('Maximum CRM REST API server started on port 8080');
});
