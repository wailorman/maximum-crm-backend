var Account = function () {

    /**
     * Account ID
     *
     * @type {ObjectId}
     */
    this.id = null;


    /**
     * Account name
     *
     * @type {string}
     */
    this.name = null;

    /**
     * Account's AccountGroup
     *
     * @type {AccountGroup}
     */
    this.group = null;

    /**
     * Account token. If he has
     *
     * @type {Token}
     */
    this.token = null;


    /**
     * AccountGroup + Individual perms
     *
     * @type {Perms}
     */
    this.perms = null;


    /**
     * Individual for Account perms
     *
     * @type {Perms}
     */
    this.individualPerms = null;

    /**
     * Create an Account
     *
     * @param {object}      data    Parameters to create a new Account
     * @param {callback}    next    Callback(err, doc)
     */
    this.create = function (data, next) {
    };

    /**
     * Get Account by id
     *
     * @param {string}      id      Account Id to find
     * @param {callback}    next    Callback(err, doc)
     */
    this.getById = function (id, next) {
    };


    /**
     * Authenticate by username & password
     *
     * @param {string}      username    Username of the Account to auth
     * @param {string}      password    Password of the Account to auth
     * @param {callback}    next        Callback(err, doc)
     */
    this.auth = function (username, password, next) {
    };


    /**
     * Remove Account
     *
     * @param {callback}    next        Callback(err, doc). doc - Found Account
     */
    this.remove = function (next) {
    };

    /**
     * Update Account data by parameters in the self object
     * Example:
     * someAccount.name = "ivan233";
     * someAccount.update(function(...){ ... });
     *
     * @param {callback}    next        Callback(err, newDoc). newDoc - Updated Account data
     */
    this.update = function (next) {
    };

};