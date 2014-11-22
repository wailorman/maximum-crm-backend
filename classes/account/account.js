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

        // check params

        if ( ! self.constructorData.name )
            return next( new restify.InvalidArgumentError('name|null') );

        if ( ! self.constructorData.password )
            return next( new restify.InvalidArgumentError('password|null') );

        if ( typeof self.constructorData.name != 'string')
            return next( new restify.InvalidArgumentError('name|not string') );

        if ( typeof self.constructorData.password != 'string' )
            return next( new restify.InvalidArgumentError('password|not string') );

        if ( self.constructorData.group && ! self.constructorData.group instanceof AccountGroup )
            return next( new restify.InvalidArgumentError('group|not AccountGroup') );

        if ( self.constructorData.individualPerms && ! mf.validatePerms(self.constructorData.individualPerms) )
            return next( new restify.InvalidArgumentError('individualPerms|invalid') );


        async.series([

            // check existent
            function (scb) {
                AccountModel.findOne(
                    {name: self.constructorData.name,
                        deleted: false},
                    function (err, doc) {
                        if (err) return next(err);

                        // If we didn't find Account with the same name
                        if (!doc) {
                            scb();
                        }else{
                            return next(    new restify.ConflictError('Account with name ' +
                                            self.constructorData.name +
                                            ' is already exists') );
                        }
                    }
                );
            },



            // write data to DB
            function () {

                var dataToWrite = {};

                dataToWrite.name = self.constructorData.name;
                dataToWrite.password = passwordHash.generate(self.constructorData.password);

                if (self.constructorData.group) {
                    dataToWrite.group = self.constructorData.group.id;
                } else {
                    dataToWrite.group = null;
                }

                if (self.constructorData.individualPerms) {
                    dataToWrite.individualPerms = self.constructorData.individualPerms;
                } else {
                    dataToWrite.individualPerms = null;
                }

                dataToWrite.deleted = false;

                AccountModel.create(
                    dataToWrite,
                    function (err, newAccountDocument) {
                        if (err) return next(err);

                        var newAccountObject = new Account();

                        newAccountObject.id = newAccountDocument._id.toString();

                        newAccountObject.name = newAccountDocument.name;
                        newAccountObject.password = newAccountDocument.password;

                        if ( self.constructorData.individualPerms )
                            newAccountObject.individualPerms = newAccountDocument.individualPerms;


                        if ( self.constructorData.group ) {
                            var group = new AccountGroup();
                            group.getById(self.constructorData.group.id, function (err, accountGroupDocument) {
                                if (err) return next(err);

                                if (!accountGroupDocument)
                                    return next( new restify.InvalidArgumentError('group|not exists') );

                                newAccountObject.group = accountGroupDocument;

                                next(null, newAccountObject);
                            });
                        }else{
                            next(null, newAccountObject);
                        }
                    }
                );
            }
        ]);


    };

    /**
     * Get Account by id
     *
     * @param {string}      id      Account Id to find
     *
     * @param {function}    next    Callback(err, doc)
     */
    this.getById = function (id, next) {
    };


    /**
     * Get an Account by name string
     * @param {string}      name    Name to find
     *
     * @param {function}    next    callback(err, doc)
     */
    this.getByName = function (name, next) {
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