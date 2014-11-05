var mongoose = require('mongoose');
var restify = require('restify');
var createLesson = require('./create-lesson.js');

var lol = "1";

module.exports = {
    getAll: function (req, res, next) {
        res.send(lol);
        return next();
    },
    getOne: function (req, res, next) {
        res.send({lol: "getOne"});
        return next();
    },
    update: function (req, res, next) {

        lol = req.params.id;

        res.send({lol: "update"});
        return next();
    },
    remove: function (req, res, next) {
        res.send({lol: "remove"});
        return next();
    },
    create: function (req, res, next) {

        createLesson({
                time: {
                    start: req.params.time.start,
                    end: req.params.time.end
                },
                hall: req.params.hall,
                coach: req.params.coach,
                group: req.params.group
            },
            function (err, result) {
                if (err) return next(err);
                res.send(result);
            });


    }
};