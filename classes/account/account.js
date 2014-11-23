var restify = require('restify');
var mongoose = require('mongoose');
var passwordHash = require('password-hash');
var async = require('async');

var mf = require('../../libs/mini-funcs.js');
var AccountModel = require('./account-model.js').AccountModel;
var AccountGroup = require('../account-group/account-group.js');


/**
 * Account class
 *
 * @param {object=}         data                    Passing if you want to create a new Account. New Account data
 * @param {string}          data.name               Name
 * @param {string}          data.password           Password
 * @param {AccountGroup}    data.group              Group in which the new Member will consist
 * @param {object}          data.individualPerms    Individual perms
 *
 * @constructor
 */
var Account = function (data) {

    if (data) {
        this.constructorData = data;
    }

    var self = this;

    /**
     * Create an Account
     *
     * @param {function}    next    Callback(err, doc)
     */
    this.create = function (next) {

        // 0. Move data from constructor
        if ( self.constructorData ) {
            self.name = self.constructorData.name;
            self.password = self.constructorData.password;

            if ( self.constructorData.group ) {
                self.group = self.constructorData.group;
            }else{
                self.group = null;
            }


            if ( self.constructorData.individualPerms ){
                self.individualPerms = self.constructorData.individualPerms;
            }else{
                self.individualPerms = null;
            }
        }


        // 1. Check variables types

        if ( ! self.name )
            return next( new restify.InvalidArgumentError('name|null') );

        if ( ! self.password )
            return next( new restify.InvalidArgumentError('password|null') );

        if ( typeof self.name != 'string')
            return next( new restify.InvalidArgumentError('name|not string') );

        if ( typeof self.password != 'string' )
            return next( new restify.InvalidArgumentError('password|not string') );

        if ( self.group && ! (self.group instanceof AccountGroup) )
            return next( new restify.InvalidArgumentError('group|not AccountGroup') );

        if ( self.individualPerms && ! mf.validatePerms(self.individualPerms) )
            return next( new restify.InvalidArgumentError('individualPerms|invalid') );


        async.waterfall(
            [
                // 2. Check name engaged
                function (wcb) {
                    AccountModel.findOne(
                        {name: self.name, deleted: false},
                        function (err, accountDocument) {
                            if (err) return wcb(err);

                            // name is engaged
                            if (accountDocument)
                                return wcb( new restify.InvalidArgumentError('name|engaged') );

                            wcb();
                        }
                    );
                },

                // 3. Check group existent
                function (wcb) {
                    if ( self.group ) {

                        var accountGroupToFind = new AccountGroup();

                        accountGroupToFind.getById(
                            self.group.id,
                            function (err) {
                                if (err) return wcb(err);

                                wcb();
                            }
                        );

                    }else{
                        wcb();
                    }
                },

                // 4. Write data to DB
                function (wcb) {
                    var dataToWriteToDb = {};

                    dataToWriteToDb.name = self.name;
                    dataToWriteToDb.password = passwordHash.isHashed(self.password) ?
                        self.password :
                        passwordHash.generate(self.password);

                    dataToWriteToDb.group = self.group ? self.group.id : null;
                    dataToWriteToDb.individualPerms = self.individualPerms;
                    dataToWriteToDb.deleted = false;

                    AccountModel.create(dataToWriteToDb, function (err, accountDocument) {
                        if (err) return wcb(err);
                        wcb(null, accountDocument);
                    });
                },

                // 5. Return new Account object
                function (accountDocument, wcb) {

                    async.series([
                            function (scb) {

                                if (accountDocument.group) {
                                    self.group = new AccountGroup();
                                    self.group.getById(accountDocument.group.toString(), function (err) {
                                        if (err) return scb(err);

                                        scb();
                                    });
                                } else {
                                    self.group = null;
                                    scb();
                                }

                            },
                            function (scb) {

                                self.id = accountDocument._id.toString();
                                self.name = accountDocument.name;
                                self.password = accountDocument.password;
                                self.individualPerms = accountDocument.individualPerms;
                                self.deleted = accountDocument.deleted;

                                self.perms = self.group ?
                                    mf.mergePerms(self.group.perms, self.individualPerms) :
                                    self.individualPerms;

                                scb();
                            }
                        ],
                        function (err) {
                            if (err) return wcb(err);
                            wcb();
                        });

                }
            ],
            function (err) {
                if (err) return next(err);

                next(null, self);
            }
        );



    };

    /**
     * Get Account by id
     *
     * @param {string}      id      Account Id to find
     *
     * @param {function}    next    Callback(err, doc)
     */
    this.getById = function (id, next) {

        if ( !id )
            return next( new restify.InvalidArgumentError('id|null') );

        if ( !mf.isObjectId(id) )
            return next( new restify.InvalidArgumentError('id|not ObjectId') );


        AccountModel.findOne(
            {_id: id, deleted: false},
            function (err, accountDocument) {
                if (err) return next(err);
                if (!accountDocument) return next(new restify.ResourceNotFoundError('404'));

                var theAccountGroup = new AccountGroup();

                async.series(
                    [
                        // Get AccountGroup
                        function (scb) {
                            if (accountDocument.group) {

                                theAccountGroup.getById(
                                    accountDocument.group.toString(),
                                    function (err) {
                                        if (err) return scb(err);

                                        scb();
                                    }
                                );

                            } else {

                                theAccountGroup = null;
                                scb();

                            }
                        },

                        // Write info into self object
                        function(scb) {

                            self.id = accountDocument._id.toString();
                            self.name = accountDocument.name;
                            self.group = theAccountGroup;
                            self.individualPerms = accountDocument.individualPerms;
                            self.password = null;

                            self.perms = self.group ?
                                mf.mergePerms(self.group.perms, self.individualPerms) :
                                self.individualPerms;

                            scb();

                        }
                    ],

                    function (err) {
                        if (err) return next(err);
                        next(null, self);
                    }
                );

            }
        );


    };


    /**
     * Get an Account by name string
     * @param {string}      name    Name to find
     *
     * @param {function}    next    callback(err, doc)
     */
    this.getByName = function (name, next) {

        if ( !name )
            return next( new restify.InvalidArgumentError('id|null') );

        if ( typeof name != 'string' )
            return next( new restify.InvalidArgumentError('id|not ObjectId') );


        AccountModel.findOne(
            {name: name, deleted: false},
            function (err, accountDocument) {
                if (err) return next(err);
                if (!accountDocument) return next(new restify.ResourceNotFoundError('404'));

                var theAccountGroup = new AccountGroup();

                async.series(
                    [
                        // Get AccountGroup
                        function (scb) {
                            if (accountDocument.group) {

                                theAccountGroup.getById(
                                    accountDocument.group.toString(),
                                    function (err) {
                                        if (err) return scb(err);

                                        scb();
                                    }
                                );

                            } else {

                                theAccountGroup = null;
                                scb();

                            }
                        },

                        // Write info into self object
                        function(scb) {

                            self.id = accountDocument._id.toString();
                            self.name = accountDocument.name;
                            self.group = theAccountGroup;
                            self.individualPerms = accountDocument.individualPerms;
                            self.password = null;

                            self.perms = self.group ?
                                mf.mergePerms(self.group.perms, self.individualPerms) :
                                self.individualPerms;

                            scb();

                        }
                    ],

                    function (err) {
                        if (err) return next(err);
                        next(null, self);
                    }
                );

            }
        );


    };

    /**
     * Get an Account by token
     *
     * @param {string}       token       Token string
     *
     * @param {function}    next        callback(err, Account)
     */
    this.getByToken = function (token, next) {
    };

    /**
     * Authenticate by username & password
     *
     * @param {string}      username    Username of the Account to auth
     * @param {string}      password    Password of the Account to auth
     *
     * @param {function}    next        Callback(err, doc)
     */
    this.auth = function (username, password, next) {
    };


    /**
     * Terminate user session
     *
     * @param {string}         token     Token to logout.
     *
     * @param {function}       next      Callback(err, Account)
     */
    this.logout = function (token, next) {

    };


    /**
     * Terminate all user sessions
     *
     * @param {function}    next    callback(err, doc)
     */
    this.logoutAll = function (next) {
    };

    /**
     * Remove Account
     *
     * @param {function}    next        Callback(err, doc). doc - Found Account
     */
    this.remove = function (next) {
    };

    /**
     * Update Account data by parameters in the self object
     *
     * @example
     * someAccount.name = "ivan233";
     * someAccount.update(function(err, Account){ ... });
     *
     * @param {function}    next        Callback(err, newDoc). newDoc - Updated Account data
     */
    this.update = function (next) {
    };

};

module.exports = Account;