// AccountGroup

var is = require('../../libs/mini-funcs.js').is;
var restify = require('restify');
var AccountGroupModel = require('./account-group-model.js').AccountGroupModel;
var async = require('async');
var ObjectId = require('mongoose').Types.ObjectId;

module.exports = {

    /**
     * Create an AccountGroup
     * @param data mixed {name:string} or {name:string, perms:object}
     * @param next callback (err, doc)
     * @returns {*}
     */
    create: function ( data, next ) {
        if ( is(data).not.object || !data )
            return next( new restify.InvalidArgumentError('data argument is not object') );

        if ( is(data.name).not.string || !data.name )
            return next( new restify.InvalidArgumentError('data.name argument is not string or empty') );

        if ( data.perms ){

            // We can don't pass perms. It will be AccountGroup without any perms

            if ( is(data.perms).not.object )
                return next( new restify.InvalidArgumentError('data.perms is not object') );

        } else {

            // If we didn't passed any perms

            data.perms = {}; // Make it empty, because Model says: "perms are required"
        }

        AccountGroupModel.findOne(
            {name: data.name, deleted: false},
            function (err, doc) {
                if (err) return next(err);

                // If we didn't find any AccountGroups with the same name
                if (!doc) {

                    // Now, let's create a new AccountGroup
                    AccountGroupModel.create(
                        {
                            // Generate data object again to avoid injections
                            name: data.name,
                            perms: data.perms,
                            deleted: false
                        },
                        function (err, doc) {
                            if (err) return next(err);

                            next(null, {
                                id: doc._id.toString(),
                                name: doc.name,
                                perms: doc.perms
                            });
                        }
                    );


                } else {
                    return next(new restify.InvalidArgumentError('AccountGroup with the same name is already exists'));
                }
            }
        )

    },

    /**
     * Update AccountGroup info
     * @param id stringObjectId
     * @param data object {name:string} or {name:string, perms:object}
     * @param next callback(err, doc)
     * @returns {*}
     */
    update: function (id, data, next) {
        if ( is(id).not.stringObjectId )
            return next( new restify.InvalidArgumentError('id argument is not stringObjectId') );

        if ( is(data).not.object || !data )
            return next( new restify.InvalidArgumentError('data argument is not object') );

        if ( is(data.name).not.string || !data.name )
            return next( new restify.InvalidArgumentError('data.name argument is not string or empty') );

        if ( data.perms ){

            if ( is(data.perms).not.object )
                return next( new restify.InvalidArgumentError('data.perms is not object') );

        } else {

            data.perms = {};

        }


        AccountGroupModel.findOne(
            { _id: ObjectId(id), deleted: false },
            function (err, doc) {
                if (err) return next(err);
                if (!doc) return next( new restify.InvalidContentError('cant find AccountGroup') );

                doc.name = data.name;
                doc.perms = data.perms;

                doc.save(function (err, savedDoc) {
                    if (err) return next(err);

                    next(null, {
                        id: savedDoc._id.toString(),
                        name: savedDoc.name,
                        perms: savedDoc.perms
                    });
                });
            }
        );

    },

    /**
     * Remove AccountGroup (marked as delete, not completely remove)
     * @param id stringObjectId
     * @param next callback(err)
     * @returns {*}
     */
    remove: function (id, next) {
        if ( is(id).not.stringObjectId )
            return next( new restify.InvalidArgumentError('id argument is not stringObjectId') );

        AccountGroupModel.findOne(
            { _id: ObjectId(id), deleted: false },
            function (err, doc) {
                if (err) return next(err);
                if (!doc) return next( new restify.InvalidContentError('cant find AccountGroup') );

                doc.deleted = true;

                doc.save(function(err, doc){
                    if (err) return next(err);
                    next(null);
                });
            }
        );
    },

    getById: function(id, next){
        if ( is(id).not.stringObjectId )
            return next( new restify.InvalidArgumentError('id argument is not stringObjectId') );

        AccountGroupModel.findOne(
            { _id: ObjectId(id), deleted: false },
            function (err, doc) {
                if (err) return next(err);
                if (!doc) return next( new restify.InvalidContentError('cant find AccountGroup') );

                next(null, {
                    id: doc._id.toString(),
                    name: doc.name,
                    perms: doc.perms
                });
            }
        );
    },

    Model: AccountGroupModel
};