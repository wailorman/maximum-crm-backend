var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var restify = require('restify');
var ObjectId = require('mongoose').Types.ObjectId;
var is = require('../libs/mini-funcs.js').is;
var HallModel = require('./../models/hall-model.js').HallModel;

/*
 *
 * {
 *   _id: ObjectId(),
 *   name: "...",
 *   save()
 *   remove()
 * }
 *
 * */




module.exports = {


    create: function (data, next) {
        if (!is(data).object || !data) return next(new restify.InvalidArgumentError("data argument is not object"));
        if (!data.hasOwnProperty('name')) return next(new restify.InvalidArgumentError("argument name was not passed"));
        if (!is(data.name).string) return next(new restify.InvalidArgumentError("argument name is not string"));

        HallModel.create(data, function (err, doc) {
            if (err) return next(err);

            next(null, {
                id: doc._id.toString(),
                name: doc.name
            });
        });
    },


    getById: function (searchingId, next) {
        if (!is(searchingId).stringObjectId) return next(new restify.InvalidArgumentError("Hall.getById: searchingId is not ObjectId"));

        HallModel.findOne({_id: ObjectId(searchingId)}, function (err, doc) {
            if (err) return next(err);

            // if no matches
            if ( is(doc).null ) return next( new restify.InvalidContentError('can not find hall') );

            next(null, {
                id: doc._id.toString(),
                name: doc.name
            });
        });
    },


    remove: function (searchingId, next) {
        if (!is(searchingId).stringObjectId) return next(new restify.InvalidArgumentError("Hall.remove: searchingId is not ObjectId"));

        HallModel.findOneAndRemove({ _id: searchingId }, function (err) {
            if (err) return next(err);

            next();
        });
    }
};
/*
module.exports.Hall = function () {

    var Hall = this;

    this.create = function (data, next) {
        if (!is(data).object || !data) return next(new restify.InvalidArgumentError("data argument is not object"));
        if (!data.hasOwnProperty('name')) return next(new restify.InvalidArgumentError("argument name was not passed"));
        if (!is(data.name).string) return next(new restify.InvalidArgumentError("argument name is not string"));

        // {name: "lol"}

        HallModel.create(data, function (err, doc) {
            if (err) next(err);

            Hall.id = doc._id.toString();
            Hall.name = doc.name;

            next(null, Hall); // passing Hall(this) object as newHall object
        });
    };

    this.getById = function (searchingId, next) {
        if (!is(searchingId).stringObjectId) return next(new restify.InvalidArgumentError("Hall.getById: searchingId is not ObjectId"));

        HallModel.findOne({_id: ObjectId(searchingId)}, function (err, doc) {
            if (err) next(err);

            Hall.id = doc._id;
            Hall.name = doc.name;

            next(null, Hall);
        });
    };

    this.remove = function (searchingId, next) {
        if (!is(searchingId).ObjectId) return next(new restify.InvalidArgumentError("Hall.remove: searchingId is not ObjectId"));

        HallModel.findOneAndRemove({ _id: searchingId }, function (err) {
            if (err) next(err);

            next();
        });
    };

};*/
