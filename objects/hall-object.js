var mongoose = require('mongoose');
var restify = require('restify');
var ObjectId = require('mongoose').Types.ObjectId;
var is = require('../libs/mini-funcs.js').is;
var HallModel = require('./../models/all.js').HallModel;


var Hall = {


    create: function (data, next) {
        if (is(data).not.object || !data)
            return next(new restify.InvalidArgumentError("argument data is not object"));

        if (is(data.name).undefined)
            return next(new restify.InvalidArgumentError("argument name was not passed"));

        if (is(data.name).not.string || !data.name) // check for empty string data.name
            return next(new restify.InvalidArgumentError("argument name is not string"));


        HallModel.findOne({name: data.name}, function(err, doc) {
            if (!is(doc).null)
                return next(new restify.InvalidArgumentError('hall with the same name is already exists'));

            HallModel.create(data, function (err, doc) {
                if (err) return next(err);

                next(null, {
                    id: doc._id.toString(),
                    name: doc.name
                });
            });
        });
    },


    getById: function (id, next) {
        if (is(id).not.stringObjectId)
            return next(new restify.InvalidArgumentError("Hall.getById: searchingId is not ObjectId"));


        HallModel.findOne({_id: ObjectId(id)}, function (err, doc) {
            if (err) return next(err);

            // if no matches
            if (is(doc).null) return next(new restify.InvalidContentError('can not find hall'));

            next(null, {
                id: doc._id.toString(),
                name: doc.name
            });
        });
    },

    update: function (id, data, next) {
        if (is(id).not.stringObjectId || !id)
            return next(new restify.InvalidArgumentError('id argument is not stringObjectId'));

        if (is(data).not.object || !data)
            return next(new restify.InvalidArgumentError('data argument is not object'));

        if (is(data.name).undefined)
            return next(new restify.InvalidArgumentError('data argument: property name is not found'));

        if (is(data.name).not.string)
            return next(new restify.InvalidArgumentError('data.name argument is not string'));


        HallModel.findOne({_id: ObjectId(id)}, function (err, doc) {

            doc.name = data.name;

            if (is(doc).null) return next(new restify.InvalidContentError('can not find hall'));

            doc.save(function (err, doc) {
                if (err) return next(err);

                next(null, {
                    id: doc._id.toString(),
                    name: doc.name
                });
            });
        });
    },

    remove: function (id, next) {
        if (is(id).not.stringObjectId)
            return next(new restify.InvalidArgumentError("Hall.remove: searchingId is not ObjectId"));


        HallModel.findOneAndRemove({_id: ObjectId(id)}, function (err, doc) {
            if (err) return next(err);
            if (is(doc).null) return next(new restify.InvalidContentError('nobody to remove'));

            next();
        });

    }
};

module.exports = Hall;