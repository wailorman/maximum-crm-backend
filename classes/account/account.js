var restify = require('restify');
var mongoose = require('mongoose');
var mf = require('../../libs/mini-funcs.js');
var AccountModel = require('./account-model.js');


/**
 * Account class
 *
 * @param {object}          data                    Passing if you want to create a new Account. New Account data
 * @param {string}          data.name               Name
 * @param {string}          data.password           Password
 * @param {AccountGroup}    data.group              Group in which the new Member will consist
 * @param {object}          data.individualPerms    Individual perms
 *
 * @constructor
 */
var Account = function (data) {

    /**
     * Account ID
     *
     * @type {stringObjectId}
     */
    this.id = null;


    /**
     * Account name
     *
     * @type {string}
     */
    this.name = data.name;

    /**
     * Account password (md5 or string)
     *
     * @type {string}
     */
    this.password = data.password;

    /**
     * Account's AccountGroup
     *
     * @type {AccountGroup}
     */
    this.group = data.group;

    /**
     * Account token. If he has
     *
     * @type {Array}
     */
    this.token = null;

    /**
     * AccountGroup + Individual perms
     *
     * @type {object}
     */
    this.perms = null;


    /**
     * Individual for Account perms
     *
     * @type {object}
     */
    this.individualPerms = data.individualPerms;

    /**
     * Create an Account
     *
     * @param {function}    next    Callback(err, doc)
     */
    this.create = function (next) {
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