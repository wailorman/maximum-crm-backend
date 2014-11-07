var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var restify = require('restify');
var ObjectId = require('mongoose').Types.ObjectId;
var is = require('../../libs/mini-funcs.js').is;
var HallModel = require('./hall-model.js').HallModel;

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

module.exports = function(params){

    var Hall = this;

    if ( is(params).ObjectID ){
        //get hall by id
        return HallModel.findOne({ _id: new ObjectId(params) });
    }

    if ( is(params).object ){
        // create new hall

    }

};