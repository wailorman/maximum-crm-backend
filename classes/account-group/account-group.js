// AccountGroup

var is = require('../../libs/mini-funcs.js').is;
var restify = require('restify');
var AccountGroupModel = require('./account-group-model.js').AccountGroupModel;
var async = require('async');
var mf = require('maxcrm-libs');


/**
 * AccountGroup object
 *
 * @property {stringObjectId}     id          Id of the AccountGroup
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


                            //var theNewAccountGroup = new AccountGroup();

                            self.id = doc._id.toString();
                            self.name = doc.name;
                            self.perms = doc.perms;
                            self.deleted = doc.deleted;

                            next(null, self);
                        }
                    );


                } else {
                    return next(new restify.InvalidArgumentError('name|engaged'));
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
     * Get AccountGroup by name
     *
     * @param {string}          name        Name
     * @param {function}        next        Callback(err, doc)
     */
    this.getByName = function (name, next) {

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

                    self.deleted = true;

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

        if ( !self.id )
            return next(new restify.InvalidArgumentError('id|null'));

        if ( !mf.isObjectId(self.id) )
            return next(new restify.InvalidArgumentError('id|not ObjectId'));



        async.waterfall(
            [

                // 1. Get AccountGroup document to update
                function (wcb) {

                    AccountGroupModel.findOne(
                        {_id: self.id, deleted: false},
                        function (err, accountGroupDocument) {
                            if (err) return wcb(err);
                            if (!accountGroupDocument) return wcb(new restify.InvalidArgumentError('id|cant find'));
                            wcb(null, accountGroupDocument);
                        });

                },

                // 2. What parameters was modified & update Object
                function (accountGroupDocument, wcb) {


                    async.series(
                        [
                            // 2.1  if name modified
                            function (scb) {

                                if (accountGroupDocument.name != self.name) {

                                    // Check type
                                    if (!self.name)
                                        return scb(new restify.InvalidArgumentError('name|null'));

                                    if (typeof self.name != 'string') // if name empty or not string
                                        return scb(new restify.InvalidArgumentError('name|not string'));

                                    accountGroupDocument.name = self.name;

                                    // Check for name existing
                                    AccountGroupModel.findOne(
                                        {name: self.name, deleted: false},
                                        function (err, isNameEngagedAccountGroupDocument) {
                                            if (err) return wcb(err);


                                            // Is name for update is already engaged

                                            if (!isNameEngagedAccountGroupDocument) {
                                                accountGroupDocument.name = self.name;
                                                scb();
                                            } else {
                                                return scb(new restify.InvalidArgumentError('name|engaged'));
                                            }

                                        }
                                    );

                                }else{
                                    scb();
                                }
                            },

                            // 2.2  if perms modified
                            function (scb) {

                                // If perms was modify
                                if (accountGroupDocument.perms != self.perms) {
                                    if (self.perms) {


                                        // But if perms is not null, we should validate them
                                        if (!mf.validatePerms(self.perms)) {


                                            // And if they are validated with errors, we can't use this perms
                                            // to write to DB
                                            return scb(new restify.InvalidArgumentError('perms|invalid'));
                                        }

                                    } else {

                                        // If perms became null, we shouldn't validate them
                                        // But just in case, we will set perms to null by ourselves

                                        self.perms = {};

                                    }


                                    // Check type
                                    accountGroupDocument.perms = self.perms;

                                    scb();
                                }else{
                                    scb();
                                }

                            }
                        ],

                        // Main callback
                        function (err) {
                            if (err) return wcb(err);
                            wcb(null, accountGroupDocument);
                        }
                    );

                },

                // 3. Update AccountGroup
                function (accountGroupDocument, wcb) {
                    accountGroupDocument.save(function (err, updatedAccountGroupDocument) {
                        if (err) return wcb(err);


                        // Just in case update already updated AccountGroup object data
                        self.id = updatedAccountGroupDocument._id.toString();
                        self.name = updatedAccountGroupDocument.name;
                        self.perms = updatedAccountGroupDocument.perms;

                        // Return AccountGroup object
                        next(null, self);
                    });
                }

            ],
            function (err) {
                if (err) return next(err);

                next(null, self);
            }
        );


    };
};


module.exports = AccountGroup;