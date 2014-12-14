// AccountGroup

var is = require('../../libs/mini-funcs.js').is;
var restify = require('restify');
var AccountGroupModel = require('./account-group-model.js').AccountGroupModel;
var async = require('async');
var mf = require( '../../libs/mini-funcs.js' );


/**
 * AccountGroup object
 *
 * @property {stringObjectId}     id          Id of the AccountGroup
 * @property {string}       name        Name of the AccountGroup
 * @property {object}       perms       Permissions for the AccountGroup
 *
 * @constructor
 */
var AccountGroup = function (data) {

    var self = this;

    if (data) {
        this.constructorData = data;
    }


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
     * @param {object|function}     data        Data of the new AccountGroup
     * @param {string}              data.name   Name
     * @param {object=}             data.perms  Perms
     *
     * @param {function}            next        callback(err, doc)
     */
    this.create = function (data, next) {





        /*if ( !next && typeof data == 'function' ){

            if (self.constructorData) {
                self.name = self.constructorData.name;

                if (self.constructorData.perms) {
                    self.perms = self.constructorData.perms;
                }else{
                    self.perms = {};
                }
            }

            next = data;

            data = {};

            data.name = self.name ? self.name : null;
            data.perms = self.perms ? self.perms : null;
        }*/


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

                            if ( doc.perms ) {
                                self.perms = doc.perms;
                            }else{
                                self.perms = {};
                            }

                            self.deleted = doc.deleted;

                            delete self.constructorData;

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
                if (!doc) return next(new restify.ResourceNotFoundError('404'));

                //var newAccountGroup = new AccountGroup();

                self.id = doc._id.toString();
                self.name = doc.name;

                if ( doc.perms ) {
                    self.perms = doc.perms;
                }else{
                    self.perms = {};
                }

                self.deleted = doc.deleted;

                next(null, self);
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



        //var dataForWrite;
        var accountGroupDocument;

        async.series(
            [

                // 1. Get AccountGroup document to update
                function (mainScb) {

                    AccountGroupModel.findOne(
                        {_id: self.id, deleted: false},
                        function (err, doc) {
                            if (err) return next(err);
                            if (!doc) return next(new restify.InvalidArgumentError('id|404'));
                            accountGroupDocument = doc;
                            mainScb();
                        });

                },

                // 2. What parameters was modified & update Object
                function (mainScb) {


                    async.series(
                        [
                            // 2.1  if name modified
                            function (scb) {

                                if (accountGroupDocument.name != self.name) {

                                    // Check type
                                    if (!self.name)
                                        return next(new restify.InvalidArgumentError('name|null'));

                                    if (typeof self.name != 'string') // if name empty or not string
                                        return next(new restify.InvalidArgumentError('name|not string'));

                                    //dataForWrite.name = self.name;

                                    // Check for name existing
                                    AccountGroupModel.findOne(
                                        {name: self.name, deleted: false},
                                        function (err, isNameEngagedAccountGroupDocument) {
                                            if (err) return next(err);


                                            // Is name for update is already engaged

                                            if ( isNameEngagedAccountGroupDocument ) {
                                                return next( new restify.InvalidArgumentError( 'name|engaged' ) );
                                            } else {
                                                accountGroupDocument.name = self.name;
                                                scb();
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
                                            return next(new restify.InvalidArgumentError('perms|invalid'));
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
                            if (err) return next(err);
                            mainScb();
                        }
                    );

                },

                // 3. Update AccountGroup
                function (mainScb) {


                    accountGroupDocument.save(function (err, updatedAccountGroupDocument) {
                        if (err) return next(err);


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