// AccountGroup

var is = require('../../libs/mini-funcs.js').is;
var restify = require('restify');
var AccountGroupModel = require('./account-group-model.js').AccountGroupModel;
var async = require('async');
var ObjectId = require('mongoose').Types.ObjectId;
var mf = require('../../libs/mini-funcs.js');


/**
 * AccountGroup object
 *
 * @property {ObjectId}     id          Id of the AccountGroup
 * @property {string}       name        Name of the AccountGroup
 * @property {Perms}        perms       Permissions for the AccountGroup
 *
 * @constructor
 */
var AccountGroup = function () {

    var self = this;

    /**
     * Id
     *
     * @type {stringObjectId}
     */
    this.id = null;

    /**
     * Name
     *
     * @type {string}
     */
    this.name = null;

    /**
     * Permissions
     *
     * @type {Perms}
     */
    this.perms = null;


    /**
     * Is deleted (just in case)
     *
     * @type {boolean}
     */
    this.deleted = null;


    /**
     * Callback for AccountGroup
     *
     * @typedef {Function} AccountGroupCallback
     *
     * param {Error}                   err
     * param {AccountGroupObject}      doc         A new AccountGroup object
     */


    /**
     * Create a new AccountGroup
     *
     * @param {object}      data        Data of the new AccountGroup
     * @param {string}      data.name   Name
     * @param {Perms=}      data.perms  Perms
     *
     * @param {function}    next        callback(err, doc)
     */
    this.create = function (data, next) {
        if ( typeof data != 'object' || !data)
            return next(new restify.InvalidArgumentError('data|not object'));

        if ( typeof data.name != 'string' || !data.name)
            return next(new restify.InvalidArgumentError('name|not string or empty'));

        if (data.perms) {

            // We can don't pass perms. It will be AccountGroup without any perms

            if (is(data.perms).not.object)
                return next(new restify.InvalidArgumentError('data.perms is not object'));

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


                            var theNewAccountGroup = new AccountGroup();

                            theNewAccountGroup.id = doc._id.toString();
                            theNewAccountGroup.name = doc.name;
                            theNewAccountGroup.perms = doc.perms;
                            theNewAccountGroup.deleted = doc.deleted;

                            next(null, theNewAccountGroup);
                        }
                    );


                } else {
                    return next(new restify.InvalidArgumentError('AccountGroup with the same name ("' + data.name + '") is already exists'));
                }
            }
        )

    };

    /**
     * Get AccountGroup by id.
     * Public method
     *
     * @param {stringObjectId}      id      Id of an AccountGroup to find
     * @param {function}            next    callback(err, doc)
     * @returns {*}
     */
    this.getById = function (id, next) {
        if (!mf.isObjectId(id))
            return next(new restify.InvalidArgumentError('id|not stringObjectId'));

        AccountGroupModel.findOne(
            {_id: id, deleted: false},
            function (err, doc) {
                if (err) return next(err);
                if (!doc) return next(new restify.InvalidContentError('cant find AccountGroup ' + self.id));

                var newAccountGroup = new AccountGroup();

                newAccountGroup.id = doc._id.toString();
                newAccountGroup.name = doc.name;
                newAccountGroup.perms = doc.perms;
                newAccountGroup.deleted = doc.deleted;

                next(null, newAccountGroup);
            }
        );
    };

    /**
     * Remove AccountGroup
     * prototype method
     *
     * @param {function}    next    callback(err)
     */
    this.remove = function (next) {

        AccountGroupModel.findOne(
            {_id: self.id, deleted: false},
            function (err, doc) {
                if (err) {
                    return next(err);
                }
                if (!doc) {
                    return next(new restify.InvalidContentError('cant find AccountGroup ' + self.id));
                }

                doc.deleted = true;

                doc.save(function (err) {
                    if (err) return next(err);
                    next(null);
                });
            }
        );

    };

    /**
     * Write updates to DB
     * prototype method
     *
     * @param {function}    next    callback(err, doc)
     * @returns {*}
     */
    this.update = function (next) {

        if ( !mf.isNull(self.id) ) // if id empty or not ObjectId
            return next(new restify.InvalidArgumentError('passed empty AccountGroup object'));

        if ( !mf.isObjectId(self.id) )
            return next(new restify.InvalidArgumentError('id|not ObjectId'));


        AccountGroupModel.findOne(
            {_id: self.id, deleted: false},
            function (err, doc) {
                if (err) return next(err);
                if (!doc) return next(new restify.InvalidContentError('cant find AccountGroup ' + self.id));


                // Update only modified data


                // Is name was modify
                if ( doc.name != self.name ){

                    // Check type
                    if ( !mf.isNull(self.name) || typeof self.name != 'string' ) // if name empty of not string
                        return next( new restify.InvalidArgumentError('name|not string') );

                    doc.name = self.name;

                }


                // Is perms was modify
                if ( doc.perms != self.perms ) {
                    if ( self.perms ) {

                        // But if perms is not null, we should validate them
                        if ( !mf.validatePerms(self.perms) ){

                            // And if they are validated with errors, we can't use this perms
                            // to write to DB
                            return next( new restify.InvalidArgumentError('perms|invalid') );
                        }

                    }else{

                        // If perms became null, we shouldn't validate them
                        // But just in case, we will set perms to null by ourselves

                        self.perms = {};

                    }


                    // Check type
                    doc.perms = self.perms;

                }







                doc.save(function (err, savedDoc) {
                    if (err) return next(err);


                    // Just in case update already updated AccountGroup object data
                    self.id = savedDoc._id.toString();
                    self.name = savedDoc.name;
                    self.perms = savedDoc.perms;

                    // Return AccountGroup object
                    next(null, self);
                });
            }
        );

    };
};


module.exports = AccountGroup;