var is                = require( '../../libs/mini-funcs.js' ).is,
    restify           = require( 'restify' ),
    AccountGroupModel = require( './account-group-model.js' ).AccountGroupModel,
    async             = require( 'async' ),
    mf                = require( '../../libs/mini-funcs.js' );
//Account           = require( '../account/account.js' );

//initializeAccount = new Account();


//Array.prototype.findShortAccounts = require( '../../classes/account/account.js' ).prototype.;


/**
 * AccountGroup object
 *
 * @property {stringObjectId}     id          Id of the AccountGroup
 * @property {string}       name        Name of the AccountGroup
 * @property {object}       perms       Permissions for the AccountGroup
 *
 * @constructor
 */
var AccountGroup = function () {
    var self = this;
};


/**
 * Create a new AccountGroup
 *
 * @param {object|function}     data        Data of the new AccountGroup
 * @param {string}              data.name   Name
 * @param {object=}             data.perms  Perms
 *
 * @param {function}            next        callback(err, doc)
 */
AccountGroup.prototype.create = function ( data, next ) {


    var self = this;


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


    if ( typeof data != 'object' || ! data )
        return next( new restify.InvalidArgumentError( 'data|not object' ) );

    if ( typeof data.name != 'string' || ! data.name )
        return next( new restify.InvalidArgumentError( 'name|not string or empty' ) );

    if ( data.perms ) {

        // We can don't pass perms. It will be AccountGroup without any perms

        if ( is( data.perms ).not.object )
            return next( new restify.InvalidArgumentError( 'data.perms is not object' ) );

    } else {

        // If we didn't passed any perms

        data.perms = {}; // Make it empty, because Model says: "perms are required"
    }

    AccountGroupModel.findOne(
        { name: data.name, deleted: false },
        function ( err, doc ) {
            if ( err ) return next( err );

            // If we didn't find any AccountGroups with the same name
            if ( ! doc ) {

                // Now, let's create a new AccountGroup
                AccountGroupModel.create(
                    {
                        // Generate data object again to avoid injections
                        name:    data.name,
                        perms:   data.perms,
                        deleted: false
                    },
                    function ( err, doc ) {
                        if ( err ) return next( err );


                        //var theNewAccountGroup = new AccountGroup();

                        self.id = doc._id.toString();
                        self.name = doc.name;

                        if ( doc.perms ) {
                            self.perms = doc.perms;
                        } else {
                            self.perms = {};
                        }

                        //self.deleted = doc.deleted;

                        //delete self.constructorData;

                        next( null, self );
                    }
                );


            } else {
                return next( new restify.InvalidArgumentError( 'name|engaged' ) );
            }
        }
    )

};


/**
 * Remove AccountGroup
 * prototype method
 *
 * @param {function}    next    callback(err)
 */
AccountGroup.prototype.remove = function ( next ) {

    var self = this;

    var membersOfTheGroup = [];

    async.series(
        [

            // . Find Accounts which are members of this group
            function ( scb ) {

                membersOfTheGroup.findShortAccounts( { group: self.id }, function ( err ) {


                    if ( err && err instanceof restify.ResourceNotFoundError ) return scb();

                    if ( err ) return scb( new restify.InternalError( 'Cant find members of this AccountGroup: ' + err.message ) );

                    scb();

                } );

            },

            // . Update Accounts. Remove group field
            function ( scb ) {

                // No members, no cascade removing and no any updates in accounts
                if ( membersOfTheGroup.length == 0 ) return scb();

                async.each(
                    membersOfTheGroup,
                    function ( accountToUpdate, ecb ) {

                        accountToUpdate.group = null;
                        accountToUpdate.update( function ( err ) {

                            if ( err ) return ecb( new restify.InternalError( 'Error on cascade removing. On Account ' + accountToUpdate.name + ': ' + err.message ) );
                            ecb();

                        } );

                    },
                    function ( err ) {

                        if ( err ) return scb( err );
                        scb();

                    }
                );

            },

            // . Mark documents as deleted
            function ( scb ) {

                AccountGroupModel.findOne(
                    { _id: self.id, deleted: false },
                    function ( err, doc ) {
                        if ( err ) {
                            return scb( err );
                        }
                        if ( ! doc ) {
                            return scb( new restify.InvalidContentError( 'cant find AccountGroup ' + self.id ) );
                        }

                        doc.deleted = true;

                        doc.save( function ( err ) {
                            if ( err ) return scb( err );

                            //self.deleted = true;

                            scb();
                        } );
                    }
                );

            }

        ],
        function ( err ) {

            if ( err ) return next( err );
            next();

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
AccountGroup.prototype.update = function ( next ) {

    var self = this;

    if ( ! self.id )
        return next( new restify.InvalidArgumentError( 'id|null' ) );

    if ( ! mf.isObjectId( self.id ) )
        return next( new restify.InvalidArgumentError( 'id|not ObjectId' ) );


    //var dataForWrite;
    var accountGroupDocument;

    async.series(
        [

            // 1. Get AccountGroup document to update
            function ( mainScb ) {

                AccountGroupModel.findOne(
                    { _id: self.id, deleted: false },
                    function ( err, doc ) {
                        if ( err ) return next( err );
                        if ( ! doc ) return next( new restify.InvalidArgumentError( 'id|404' ) );
                        accountGroupDocument = doc;
                        mainScb();
                    } );

            },

            // 2. What parameters was modified & update Object
            function ( mainScb ) {


                async.series(
                    [
                        // 2.1  if name modified
                        function ( scb ) {

                            if ( accountGroupDocument.name != self.name ) {

                                // Check type
                                if ( ! self.name )
                                    return next( new restify.InvalidArgumentError( 'name|null' ) );

                                if ( typeof self.name != 'string' ) // if name empty or not string
                                    return next( new restify.InvalidArgumentError( 'name|not string' ) );

                                //dataForWrite.name = self.name;

                                // Check for name existing
                                AccountGroupModel.findOne(
                                    { name: self.name, deleted: false },
                                    function ( err, isNameEngagedAccountGroupDocument ) {
                                        if ( err ) return next( err );


                                        // Is name for update is already engaged

                                        if ( isNameEngagedAccountGroupDocument ) {
                                            return next( new restify.InvalidArgumentError( 'name|engaged' ) );
                                        } else {
                                            accountGroupDocument.name = self.name;
                                            scb();
                                        }

                                    }
                                );

                            } else {
                                scb();
                            }
                        },

                        // 2.2  if perms modified
                        function ( scb ) {

                            // If perms was modify
                            if ( accountGroupDocument.perms != self.perms ) {
                                if ( self.perms ) {


                                    // But if perms is not null, we should validate them
                                    if ( ! mf.validatePerms( self.perms ) ) {


                                        // And if they are validated with errors, we can't use this perms
                                        // to write to DB
                                        return next( new restify.InvalidArgumentError( 'perms|invalid' ) );
                                    }

                                } else {

                                    // If perms became null, we shouldn't validate them
                                    // But just in case, we will set perms to null by ourselves

                                    self.perms = {};

                                }


                                // Check type
                                accountGroupDocument.perms = self.perms;

                                scb();
                            } else {
                                scb();
                            }

                        }
                    ],

                    // Main callback
                    function ( err ) {
                        if ( err ) return next( err );
                        mainScb();
                    }
                );

            },

            // 3. Update AccountGroup
            function ( mainScb ) {


                accountGroupDocument.save( function ( err, updatedAccountGroupDocument ) {
                    if ( err ) return next( err );


                    // Just in case update already updated AccountGroup object data
                    self.id = updatedAccountGroupDocument._id.toString();
                    self.name = updatedAccountGroupDocument.name;

                    if ( Object.isEmpty( updatedAccountGroupDocument.perms ) )
                        self.perms = null;
                    else
                        self.perms = updatedAccountGroupDocument.perms;



                    // Return AccountGroup object
                    mainScb();
                } );
            }

        ],
        function ( err ) {
            if ( err ) return next( err );

            next( null, self );
        }
    );


};

AccountGroup.prototype._validators = {

    /**
     *
     * @param value
     * @param next
     *
     * @throws InvalidArgumentError( 'id|null. invalid' )
     * @throws InvalidArgumentError( 'id|not string. invalid type' )
     */
    id: function ( value, next ) {

        if ( ! value ) return next( new restify.InvalidArgumentError( 'id|null. invalid' ) );
        if ( typeof value !== 'string' ) return next( new restify.InvalidArgumentError( 'id|not string. invalid type' ) );

        next();

    },

    /**
     *
     * @param value
     * @param next
     *
     * @throws InvalidArgumentError( 'name|null. invalid' )
     * @throws InvalidArgumentError( 'name|not string. invalid type' )
     */
    name: function ( value, next ) {

        if ( ! value ) return next( new restify.InvalidArgumentError( 'name|null. invalid' ) );
        if ( typeof value !== 'string' ) return next( new restify.InvalidArgumentError( 'name|not string. invalid type' ) );

        next();

    }
};

/**
 *
 * @param document
 * @param next
 */
AccountGroup.prototype._documentToFullObject = function ( document, next ) {

    var self = this;

    async.series(
        [

            // . Add simple properties
            function ( scb ) {

                self.id = document._id.toString();
                self.name = document.name;
                self.perms = document.perms;
                scb();

            },

            // . Get members
            function ( scb ) {

                self.members = [];


                self.members.findShortAccounts( { group: self.id }, function ( err ) {


                    if ( err && err instanceof restify.ResourceNotFoundError )
                        return scb(); // Because there is no members. It's not error

                    if ( err )
                        return scb( new restify.InternalError( '_documentToFullObject error. Get members findShortAccounts: ' + err.message ) );

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

AccountGroup.prototype._documentToShortObject = function ( document, next ) {

    var self = this;

    self.id = document._id.toString();
    self.name = document.name;

    next();

};

/**
 * Show all AccountGroups
 *
 * @param {null}        filter      Function does not use this argument
 * @param {function}    next
 */
Array.prototype.findShortAccountGroups = function ( filter, next ) {

    var ArrayInstance = this,
        receivedDocuments;

    if ( filter ) return next( new restify.InvalidArgumentError( 'filter should be null' ) );

    async.series(
        [

            /*// . Clean array instance
             function ( scb ) {

             ArrayInstance = [];
             scb();

             },*/

            // . Find in DB
            function ( scb ) {

                AccountGroupModel.find( {}, function ( err, docs ) {

                    if ( err ) return scb( new restify.InternalError( 'Mongo: ' + err.message ) );

                    receivedDocuments = docs;

                    scb();

                } );

            },

            // . Convert documents
            function ( scb ) {

                async.each(
                    receivedDocuments,
                    function ( document, ecb ) {

                        var processedAccountGroup = new AccountGroup();

                        processedAccountGroup._documentToShortObject( document, function ( err ) {

                            if ( err ) return ecb( err );
                            ArrayInstance.push( processedAccountGroup );
                            ecb();

                        } );

                    },
                    function ( err ) {

                        if ( err ) return scb( new restify.InternalError( 'Converting error on group with name "' + document.name + '": ' + err.message ) );

                        return scb();

                    }
                );

            }

        ],
        function ( err ) {

            if ( err ) return next( err );

            return next();

        }
    );

};

/**
 * Find one full AccountGroup object
 *
 * @param {object}      filter
 * @param {string}      [filter.id]
 * @param {string}      [filter.name]
 * @param {function}    next
 *
 * @throws {InvalidArgumentError}
 * @throws {InternalError}
 * @throws {ResourceNotFoundError}
 */
AccountGroup.prototype.findOne = function ( filter, next ) {

    var preparedQuery, accountGroupDocument, self = this;

    async.series(
        [

            // . Validate filter
            function ( scb ) {

                if ( ! filter )
                    return scb( new restify.InvalidArgumentError( 'filter|null' ) );

                if ( filter.id && filter.name )
                    return scb( new restify.InvalidArgumentError( 'filter|you may pass ONLY id or ONLY name' ) );
                else if ( filter.id )
                    self._validators.id( filter.id, scb );
                else if ( filter.name )
                    self._validators.name( filter.name, scb );
                else
                    return scb( new restify.InvalidArgumentError( 'filter|null' ) );

            },

            // . Prepare query
            function ( scb ) {

                if ( filter.id )
                    preparedQuery = { _id: new mf.ObjectId( filter.id ), deleted: false };
                else if ( filter.name )
                    preparedQuery = { name: filter.name, deleted: false };
                else
                    return scb( new restify.InternalError( 'Prepare query: Something goes wrong... I cant find any filter parameter' ) );

                scb();
            },

            // . Find in DB
            function ( scb ) {

                AccountGroupModel.findOne( preparedQuery, function ( err, doc ) {

                    if ( err ) return scb( new restify.InternalError( 'Mongo error: ' + err.message ) );
                    if ( ! doc ) return scb( new restify.ResourceNotFoundError( '404' ) );

                    accountGroupDocument = doc;

                    scb();

                } );

            },


            // . Convert document
            function ( scb ) {

                self.clean();
                self._documentToFullObject( accountGroupDocument, scb );

            }

        ],
        function ( err ) {

            if ( err ) return next( err );
            next( null, self );

        }
    );

};

/**
 * Find one short Account object
 *
 * @param               filter
 *
 * @param {string}      [filter.id]
 * @param {string}      [filter.name]
 *
 * @param {function}    next
 *
 * @throws {InvalidArgumentError}
 * @throws {InternalError}
 * @throws {ResourceNotFoundError}
 */
AccountGroup.prototype.findOneShort = function ( filter, next ) {

    var preparedQuery, accountGroupDocument, self = this;

    async.series(
        [

            // . Validate filter
            function ( scb ) {

                if ( ! filter )
                    return scb( new restify.InvalidArgumentError( 'filter|null' ) );

                else if ( filter.id && filter.name )
                    return scb( new restify.InvalidArgumentError( 'filter|you may pass ONLY id or ONLY name' ) );

                else if ( filter.id )
                    self._validators.id( filter.id, scb );

                else if ( filter.name )
                    self._validators.name( filter.name, scb );

                else
                    return scb( new restify.InvalidArgumentError( 'filter|null' ) );

            },

            // . Prepare query
            function ( scb ) {

                if ( filter.id )
                    preparedQuery = { _id: new mf.ObjectId( filter.id ), deleted: false };
                else if ( filter.name )
                    preparedQuery = { name: filter.name, deleted: false };
                else
                    return scb( new restify.InternalError( 'Prepare query: Something goes wrong... I cant find any filter parameter' ) );

                scb();
            },

            // . Find in DB
            function ( scb ) {

                AccountGroupModel.findOne( preparedQuery, function ( err, doc ) {

                    if ( err ) return scb( new restify.InternalError( 'Mongo error: ' + err.message ) );
                    if ( ! doc ) return scb( new restify.ResourceNotFoundError( '404' ) );

                    accountGroupDocument = doc;

                    scb();

                } );

            },


            // . Convert document
            function ( scb ) {

                self.clean();
                self._documentToShortObject( accountGroupDocument, scb );

            }

        ],
        function ( err ) {

            if ( err ) return next( err );
            next( null, self );

        }
    );

};

AccountGroup.prototype.addPermissions = function ( next ) {

    var self = this,
        accountGroupDocument;

    async.series(
        [

            // . Get document
            function ( scb ) {

                AccountGroupModel.findOne( { _id: new mf.ObjectId( self.id ), deleted: false }, function ( err, doc ) {

                    if ( err ) return scb( new restify.InternalError( 'Mongo: ' + err.message ) );
                    if ( ! doc ) return scb( new restify.InvalidArgumentError( 'This AccountGroup does not exist' ) );

                    accountGroupDocument = doc;

                    scb();

                } );

            },

            // . Parse permissions
            function ( scb ) {

                if ( Object.isEmpty( accountGroupDocument.perms ) )
                    return scb();


                if ( ! mf.validatePerms( accountGroupDocument.perms ) ) return scb( new restify.InternalError( 'Received perms is invalid' ) );

                self.perms = accountGroupDocument.perms;

                scb();

            },

            // . Add permissions to the object properties
            function ( scb ) {

                if ( Object.isEmpty( accountGroupDocument.perms ) )
                    self.perms = {};
                else
                    self.perms = accountGroupDocument.perms;

                scb();

            }

        ],
        function ( err ) {

            if ( err ) return next( err );
            next( null, self.perms );

        }
    );


};

AccountGroup.prototype.isFull = function () {

    var self = this;

    return self.hasOwnProperty( 'id' ) && typeof self.id === 'string' &&
           self.hasOwnProperty( 'name' ) && typeof self.name === 'string' &&
           self.hasOwnProperty( 'perms' ) && typeof self.perms === 'object' &&
           self.hasOwnProperty( 'members' ) && self.members instanceof Array

};

AccountGroup.prototype.isShort = function () {

    var self = this;

    return self.hasOwnProperty( 'id' ) && typeof self.id === 'string' &&
           self.hasOwnProperty( 'name' ) && typeof self.name === 'string' &&
           self.hasOwnProperty( 'perms' ) == false &&
           self.hasOwnProperty( 'members' ) == false;

};

AccountGroup.prototype.clean = function () {

    var self = this;

    delete self.id;
    delete self.name;
    delete self.perms;
    delete self.members;

};


module.exports = AccountGroup;