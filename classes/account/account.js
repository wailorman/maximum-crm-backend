var restify = require( 'restify' );
var mongoose = require( 'mongoose' );
var passwordHash = require( 'password-hash' );
var async = require( 'async' );

var mf = require( '../../libs/mini-funcs.js' );
var AccountModel = require( './account-model.js' ).AccountModel;
var AccountGroup = require( '../account-group/account-group.js' );


var document2Object = function ( document, next ) {

};

Array.prototype.Account = {};
Array.prototype.Account.find = function () {
};

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
var Account = function ( data ) {

    if ( data ) {
        this.constructorData = data;
    }

    var self = this;

    /**
     * Create an Account
     *
     * @param {object}      data    Arguments
     * @param {function}    next    Callback(err, doc)
     */
    this.create = function ( data, next ) {

        // 0. Move data from constructor
        if ( self.constructorData ) {
            self.name = self.constructorData.name;
            self.password = self.constructorData.password;

            if ( self.constructorData.group ) {
                self.group = self.constructorData.group;
            } else {
                self.group = null;
            }


            if ( self.constructorData.individualPerms ) {
                self.individualPerms = self.constructorData.individualPerms;
            } else {
                self.individualPerms = null;
            }
        }


        // 1. Check variables types

        if ( !self.name )
            return next( new restify.InvalidArgumentError( 'name|null' ) );

        if ( !self.password )
            return next( new restify.InvalidArgumentError( 'password|null' ) );

        if ( typeof self.name != 'string' )
            return next( new restify.InvalidArgumentError( 'name|not string' ) );

        if ( typeof self.password != 'string' )
            return next( new restify.InvalidArgumentError( 'password|not string' ) );

        if ( self.group && !(self.group instanceof AccountGroup) )
            return next( new restify.InvalidArgumentError( 'group|not AccountGroup' ) );

        if ( self.individualPerms && !mf.validatePerms( self.individualPerms ) )
            return next( new restify.InvalidArgumentError( 'individualPerms|invalid' ) );


        async.waterfall(
            [
                // 2. Check name engaged
                function ( wcb ) {
                    AccountModel.findOne(
                        { name: self.name, deleted: false },
                        function ( err, accountDocument ) {
                            if ( err ) return wcb( err );

                            // name is engaged
                            if ( accountDocument )
                                return wcb( new restify.InvalidArgumentError( 'name|engaged' ) );

                            wcb();
                        }
                    );
                },

                // 3. Check group existent
                function ( wcb ) {
                    if ( self.group ) {

                        var accountGroupToFind = new AccountGroup();

                        accountGroupToFind.getById(
                            self.group.id,
                            function ( err ) {
                                if ( err ) return wcb( err );

                                wcb();
                            }
                        );

                    } else {
                        wcb();
                    }
                },

                // 4. Write data to DB
                function ( wcb ) {
                    var dataToWriteToDb = {};

                    dataToWriteToDb.name = self.name;
                    dataToWriteToDb.password = passwordHash.isHashed( self.password ) ?
                        self.password :
                        passwordHash.generate( self.password );

                    dataToWriteToDb.group = self.group ? self.group.id : null;
                    dataToWriteToDb.individualPerms = self.individualPerms;
                    dataToWriteToDb.deleted = false;

                    AccountModel.create( dataToWriteToDb, function ( err, accountDocument ) {
                        if ( err ) return wcb( err );
                        wcb( null, accountDocument );
                    } );
                },

                // 5. Return new Account object
                function ( accountDocument, wcb ) {

                    async.series( [
                            function ( scb ) {

                                if ( accountDocument.group ) {
                                    self.group = new AccountGroup();
                                    self.group.getById( accountDocument.group.toString(), function ( err ) {
                                        if ( err ) return scb( err );

                                        scb();
                                    } );
                                } else {
                                    self.group = null;
                                    scb();
                                }

                            },
                            function ( scb ) {

                                self.id = accountDocument._id.toString();
                                self.name = accountDocument.name;
                                self.password = accountDocument.password;
                                self.individualPerms = accountDocument.individualPerms;
                                self.deleted = accountDocument.deleted;

                                self.perms = self.group ?
                                    mf.mergePerms( self.group.perms, self.individualPerms ) :
                                    self.individualPerms;

                                scb();
                            }
                        ],
                        function ( err ) {
                            if ( err ) return wcb( err );
                            wcb();
                        } );

                }
            ],
            function ( err ) {
                if ( err ) return next( err );

                next( null, self );
            }
        );


    };


    /**
     * Find one full Account object
     *
     * @param {object}      filter
     * @param {function}    next
     */
    this.findOne = function ( filter, next ) {
    };


    /**
     * Find one short Account object
     *
     * @param {object}      filter
     * @param {function}    next
     */
    this.findOneShort = function ( filter, next ) {
    };


    /**
     * Find many Account objects
     *
     * @param {object}      filter
     * @param {function}    next
     */
    this.find = function ( filter, next ) {
    };


    /**
     * Find many short Account objects
     *
     * @param {object}      filter
     * @param {function}    next
     */
    this.findShort = function ( filter, next ) {
    };


    /**
     * Get Account by id
     *
     * @param {string}      id      Account Id to find
     * @param {function}    next    Callback(err, doc)
     */
    this.getById = function ( id, next ) {

        if ( !id )
            return next( new restify.InvalidArgumentError( 'id|null' ) );

        if ( !mf.isObjectId( id ) )
            return next( new restify.InvalidArgumentError( 'id|not ObjectId' ) );


        AccountModel.findOne(
            { _id: id, deleted: false },
            function ( err, accountDocument ) {
                if ( err ) return next( err );
                if ( !accountDocument ) return next( new restify.ResourceNotFoundError( '404' ) );

                var theAccountGroup = new AccountGroup();

                async.series(
                    [
                        // Get AccountGroup
                        function ( scb ) {
                            if ( accountDocument.group ) {

                                theAccountGroup.getById(
                                    accountDocument.group.toString(),
                                    function ( err ) {
                                        if ( err ) return scb( err );

                                        scb();
                                    }
                                );

                            } else {

                                theAccountGroup = null;
                                scb();

                            }
                        },

                        // Write info into self object
                        function ( scb ) {

                            self.id = accountDocument._id.toString();
                            self.name = accountDocument.name;
                            self.group = theAccountGroup;
                            self.individualPerms = accountDocument.individualPerms;
                            self.password = null;

                            self.perms = self.group ?
                                mf.mergePerms( self.group.perms, self.individualPerms ) :
                                self.individualPerms;

                            scb();

                        }
                    ],

                    function ( err ) {
                        if ( err ) return next( err );
                        next( null, self );
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
    this.getByName = function ( name, next ) {

        if ( !name )
            return next( new restify.InvalidArgumentError( 'id|null' ) );

        if ( typeof name != 'string' )
            return next( new restify.InvalidArgumentError( 'id|not ObjectId' ) );


        AccountModel.findOne(
            { name: name, deleted: false },
            function ( err, accountDocument ) {
                if ( err ) return next( err );
                if ( !accountDocument ) return next( new restify.ResourceNotFoundError( '404' ) );

                var theAccountGroup = new AccountGroup();

                async.series(
                    [
                        // Get AccountGroup
                        function ( scb ) {
                            if ( accountDocument.group ) {

                                theAccountGroup.getById(
                                    accountDocument.group.toString(),
                                    function ( err ) {
                                        if ( err ) return scb( err );

                                        scb();
                                    }
                                );

                            } else {

                                theAccountGroup = null;
                                scb();

                            }
                        },

                        // Write info into self object
                        function ( scb ) {

                            self.id = accountDocument._id.toString();
                            self.name = accountDocument.name;
                            self.group = theAccountGroup;
                            self.individualPerms = accountDocument.individualPerms;
                            self.password = null;

                            self.perms = self.group ?
                                mf.mergePerms( self.group.perms, self.individualPerms ) :
                                self.individualPerms;

                            scb();

                        }
                    ],

                    function ( err ) {
                        if ( err ) return next( err );
                        next( null, self );
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
    this.getByToken = function ( token, next ) {
    };

    /**
     * Authenticate by username & password
     *
     * @param {string}      username    Username of the Account to auth
     * @param {string}      password    Password of the Account to auth
     *
     * @param {function}    next        Callback(err, doc)
     */
    this.auth = function ( username, password, next ) {
    };


    /**
     * Terminate user session
     *
     * @param {string}         token     Token to logout.
     *
     * @param {function}       next      Callback(err, Account)
     */
    this.logout = function ( token, next ) {

    };


    /**
     * Terminate all user sessions
     *
     * @param {function}    next    callback(err, doc)
     */
    this.logoutAll = function ( next ) {
    };

    /**
     * Remove Account
     *
     * @param {function}    next        Callback(err, doc). doc - Found Account
     */
    this.remove = function ( next ) {
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
    this.update = function ( next ) {

        if ( !self.id )
            return next( new restify.InvalidArgumentError( 'id|null' ) );

        if ( !mf.isObjectId( self.id ) )
            return next( new restify.InvalidArgumentError( 'id|not ObjectId' ) );

        var accountDocument;

        async.series(
            [
                // 0. Get accountDocument for validating
                function ( scb ) {
                    AccountModel.findOne(
                        { _id: self.id, deleted: false },
                        function ( err, doc ) {
                            if ( err ) return scb( err );
                            if ( !doc ) return scb( new restify.ResourceNotFoundError( 'id|404' ) );

                            accountDocument = doc;
                            scb();
                        }
                    );
                },

                // 1. is name was modified
                function ( scb ) {
                    if ( self.name != accountDocument.name ) {

                        // Check name
                        // is name already engaged?
                        var testAccount = new Account();
                        testAccount.getByName(
                            self.name, // new name
                            function ( err ) {
                                if ( err && err instanceof restify.ResourceNotFoundError ) {

                                    // not engaged

                                    // If was called error & if this error is 404 error
                                    // it means that API can't find Account with
                                    // same name => this name isn't engaged

                                    accountDocument.name = self.name;
                                    scb();

                                    // success

                                } else {

                                    // engaged

                                    // If err wasn't called. Maybe, account.old with
                                    // the same name is exists => this name is engaged

                                    if ( !err ) {
                                        scb( new restify.InvalidArgumentError( 'name|engaged' ) );
                                    } else {

                                        // If error been called and it is not 404 error
                                        scb( err );
                                    }
                                }
                            }
                        );

                    } else {
                        scb();
                    }
                },

                // 2. is group was modified
                function ( scb ) {

                    if ( self.group ) {

                        if ( !( self.group instanceof AccountGroup ) || !self.group.hasOwnProperty( 'id' ) )
                            return scb( new restify.InvalidArgumentError( 'group|invalid object' ) );

                        var groupId = self.group.id;

                        self.group = new AccountGroup();
                        self.group.getById( groupId, function ( err ) {

                            if ( err && err instanceof restify.ResourceNotFoundError ) {

                                // New AccountGroup wasn't find and so we can't use this
                                // AccountGroup in Account info

                                return scb( new restify.ResourceNotFoundError( 'group|404' ) );
                            }
                            if ( err ) {

                                // If trying to find new AccountGroup called an error, but
                                // not 404 error, we call error with a received error

                                return scb( err );
                            }


                            // If new AccountGroup exists, we can use them in new Account info

                            accountDocument.group = self.group.id;
                            scb();

                        } );

                    } else {

                        // If we remove Account.group parameter or this Account did not
                        // ever been an AccountGroup member

                        // In the way, we should (to avoid any errors) rewrite .group parameter
                        // to null

                        accountDocument.group = null;
                        scb();

                    }

                },

                // 3. is password was modified
                function ( scb ) {

                    // By default password not passed to the Account properties
                    // It means that if password not null, it was modified
                    if ( self.password ) {

                        if ( passwordHash.isHashed( self.password ) ) {
                            accountDocument.password = self.password;
                        } else {
                            accountDocument.password = passwordHash.generate( self.password );
                        }

                        scb();

                    } else {

                        // If the password is not changed, we simply fo to
                        // the next step of the series
                        scb();

                    }

                },

                // 4. is individualPerms was modified
                function ( scb ) {

                    if ( self.individualPerms != accountDocument.individualPerms ) {

                        // 4.1 Validating new perms
                        if ( mf.validatePerms( self.individualPerms ) ) {
                            accountDocument.individualPerms = self.individualPerms;
                            scb();
                        } else {

                            // if new individualPerms not been validated

                            scb( new restify.InvalidArgumentError( 'individualPerms|invalid' ) );
                        }

                    } else {
                        scb();
                    }

                },

                // We already recreated AccountGroup object. Even if new
                // AccountGroup is incorrect, group validator will call an error
                // and we would not be on this step


                // 6. Update accountDocument and self
                function ( scb ) {

                    accountDocument.save( function ( err, newAccountDocument ) {

                        self.group = self.group;
                        self.id = newAccountDocument._id.toString();
                        self.name = newAccountDocument.name;
                        self.individualPerms = newAccountDocument.individualPerms ?
                            newAccountDocument.individualPerms : {};
                        self.password = null;
                        self.perms = self.group ?
                            mf.mergePerms( self.group.perms, self.individualPerms ) :
                            self.individualPerms;

                        scb();

                    } );

                }
            ],
            function ( err ) {
                if ( err ) return next( err );
                next( null, self );
            }
        );

    };

};

module.exports = Account;