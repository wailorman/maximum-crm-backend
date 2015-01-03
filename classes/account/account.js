var restify      = require( 'restify' ),
    mongoose     = require( 'mongoose' ),
    //Document     = require( '../../node_modules/mongoose/lib/document.js' ),
    passwordHash = require( 'password-hash' ),
    async        = require( 'async' ),
    sugar        = require( 'sugar' ),

    mf           = require( '../../libs/mini-funcs.js' ),
    AccountModel = require( './account-model.js' ).AccountModel,
    AccountGroup = require( '../account-group/account-group.js' );


var Account = function () {
    var self = this;
};


Account.prototype._validators = {

    /**
     * Id validator
     *
     * @param {string} value
     * @param {function} next
     *
     * @throws {InvalidArgumentError}   'id|not ObjectId'
     *
     * @returns {*}
     */
    id: function ( value, next ) {

        if ( value ) {
            if ( ! mf.isObjectId( value ) ) {
                // incorrect
                return next( new restify.InvalidArgumentError( 'id|not ObjectId' ) );
            } else {
                // correct
                next( null );
            }
        } else
            return next( new restify.InvalidArgumentError( 'id|null' ) );
    },

    /**
     * Name validator
     *
     * @param {string} value
     * @param {function} next
     *
     * @throws {InvalidArgumentError}   'name|not string'
     *
     * @returns {*}
     */
    name: function ( value, next ) {

        if ( value ) {
            if ( typeof value !== 'string' ) {
                return next( new restify.InvalidArgumentError( 'name|not string' ) );
            } else {
                next( null );
            }
        } else
            return next( new restify.InvalidArgumentError( 'name|null' ) );

    },

    /**
     * AccountGroup validator
     *
     * @param {string|AccountGroup} value
     *
     * @throws {InvalidArgumentError}   'group|not string or not AccountGroup'
     * @throws {ResourceNotFoundError}  'group|404'
     * @throws {InvalidArgumentError}   'group|type error'
     * @param next
     */
    group: function ( value, next ) {

        if ( value ) {

            var foundAccountGroup, // redeclare as local to avoid conflicts with current validator
                groupId;


            // Getting groupId for validating
            if ( value instanceof AccountGroup && value.id ) {

                groupId = value.id;

            } else if ( typeof value === 'string' ) {

                groupId = value;

            } else {

                return next( new restify.InvalidArgumentError( 'group|not string and not AccountGroup' ) );

            }


            // Validating group for existence

            //var AccGr = require( '../account-group/account-group.js' );

            foundAccountGroup = new AccountGroup();

            foundAccountGroup.findOneShort( { id: groupId }, function ( err ) { // need to be short

                if ( err ) {

                    if ( err instanceof restify.ResourceNotFoundError ) {

                        return next( new restify.ResourceNotFoundError( 'group|404' ) );

                    } else if ( err instanceof restify.InvalidArgumentError ) {

                        return next( new restify.InvalidArgumentError( 'group|type error: ' + err.message ) );

                    } else {

                        return next( new restify.InternalError( 'group: ' + err.message ) );

                    }

                } else {

                    return next();

                }

            } );

        } else
            return next( new restify.InvalidArgumentError( 'group|null' ) );
    },

    /**
     * Password validator
     *
     * @param {string} value
     * @param {function} next
     *
     * @throws {InvalidArgumentError}   'password|invalid'
     */
    password: function ( value, next ) {

        if ( value ) {
            if ( typeof value === 'string' ) {

                next();

            } else {

                next( new restify.InvalidArgumentError( 'password|invalid' ) );

            }
        } else
            return next( new restify.InvalidArgumentError( 'password|null' ) );
    }
};

/**
 * Validate passed filter
 *
 * @example
 * self._validateParameters( { name: [ 'wailorman', 'snoberik' ] }, function( err ){ ... } )
 *
 * @param {object}                  filter
 * @param {function}                next    ( err, {boolean} isValid )
 *
 * @throws {InvalidArgumentError|ResourceNotFoundError}   see Account.prototype._validators
 */
Account.prototype._validateParameters = function ( filter, next ) {

    var self = this;

    if ( filter ) {

        async.parallel(
            [
                // 1. id
                function ( pcb ) {

                    if ( filter.id ) {

                        if ( ! ( filter.id instanceof Array ) )
                            filter.id = [ filter.id ];

                        async.each( filter.id, Account.prototype._validators.id, pcb );

                    } else
                        pcb();

                },

                // 2. name
                function ( pcb ) {

                    if ( filter.name ) {

                        if ( ! ( filter.name instanceof Array ) )
                            filter.name = [ filter.name ];

                        async.each( filter.name, Account.prototype._validators.name, pcb );

                    } else
                        pcb();

                },

                // 3. token
                function ( pcb ) {

                    if ( filter.token ) {

                        if ( ! ( filter.token instanceof Array ) )
                            filter.token = [ filter.token ];

                        async.each( filter.token, self._validators.token, pcb );

                    } else
                        pcb();

                },

                // 4. group
                function ( pcb ) {

                    if ( filter.group ) {

                        if ( ! ( filter.group instanceof Array ) )
                            filter.group = [ filter.group ];

                        async.each( filter.group, Account.prototype._validators.group, pcb );

                    } else
                        pcb();

                }

            ],
            function ( err ) {

                if ( err ) return next( err );

                next( null );

            }
        );

    } else
        return next( new restify.InvalidArgumentError( 'filter|null' ) );


};

/**
 * Prepare query for mongoDB
 * Calling only after validating!
 *
 * @example
 * self._prepareFindQuery( { name: [ 'wailorman', 'snoberik' ] }, function( err ){ ... } )
 *
 * @param {object}                  filter
 * @param {function}                next
 * @param {object}                  next.err
 * @param {object}                  next.query
 *
 * @throws {InvalidArgumentError}   'filter[.prop]|error'
 * @throws {InternalError}
 */
Account.prototype._prepareFindQuery = function ( filter, next ) {

    /*
     Allowed filter parameters:
     - id
     - name
     - group
     - token
     */

    var andStatements = [];


    if ( typeof filter !== 'object' )
        return next( new restify.InvalidArgumentError( 'filter|not object' ) );

    async.parallel(
        [
            // 1. id
            function ( pcb ) {

                var idOrStatements = [];

                if ( filter.id ) {

                    if ( typeof filter.id === 'string' ) filter.id = [ filter.id ];

                    if ( filter.id instanceof Array ) {

                        async.each( filter.id, function ( id, ecb ) {

                            if ( typeof id === 'string' ) {

                                idOrStatements.push( { _id: new mf.ObjectId( id ) } );
                                ecb();

                            } else
                                return pcb( new restify.InvalidArgumentError( 'filter.id(' + id + ')|not string' ) );


                            //andStatements.push( { _id: id } );
                            //ecb();


                        }, function () {

                            andStatements.push( { $or: idOrStatements } );
                            pcb();

                        } );

                    } else
                        return pcb( new restify.InvalidArgumentError( 'filter.id|not Array' ) );


                } else
                    pcb();

            },

            // 2. name
            function ( pcb ) {

                var nameOrStatements = [];

                if ( filter.name ) {

                    if ( typeof filter.name === 'string' ) filter.name = [ filter.name ];

                    if ( filter.name instanceof Array ) {

                        async.each( filter.name, function ( name, ecb ) {

                            if ( typeof name === 'string' ) {

                                nameOrStatements.push( { name: name } );
                                ecb();

                            } else
                                return pcb( new restify.InvalidArgumentError( 'filter.name(' + name + ')|not string' ) );


                        }, function () {

                            andStatements.push( { $or: nameOrStatements } );
                            pcb();

                        } );

                    } else
                        return pcb( new restify.InvalidArgumentError( 'filter.name|not Array' ) );

                } else
                    pcb();

            },

            // 3. token

            // 4. group
            function ( pcb ) {

                var groupIds = [];

                if ( filter.group ) {

                    if ( filter.group instanceof AccountGroup ) filter.group = [ filter.group ];

                    if ( filter.group instanceof Array ) {

                        async.each( filter.group, function ( group, ecb ) {

                            if ( group instanceof AccountGroup && group.id ) {

                                groupIds.push( new mf.ObjectId( group.id ) );

                            } else if ( typeof group === 'string' ) {

                                groupIds.push( new mf.ObjectId( group ) );

                            } else
                                return pcb( new restify.InternalError( ' Account prepareFindQuery: filter.group|not AccountGroup & not string' ) );


                            ecb();

                        }, function () {

                            andStatements.push( { group: { $in: groupIds } } );
                            pcb();

                        } );

                    } else
                        return pcb( new restify.InternalError( 'Account prepareFindQuery: group|not Array' ) );


                } else
                    pcb();

            }

        ],
        function ( err ) {

            if ( err ) return next( err );

            var preparedQuery = andStatements.length > 0 ? { $and: andStatements } : {};

            preparedQuery.deleted = false;


            next( null, preparedQuery );

        }
    );


};

/**
 * Create an Account
 *
 * @param                           data                    Arguments
 * @param {string}                  data.name
 * @param {string}                  data.password
 * @param {AccountGroup}            [data.group]
 * @param                           [data.individualPerms]
 *
 * @param {function}                next
 *
 * @throws {InvalidArgumentError}   'parameter|error'
 *
 * @throws {InternalError}          'document converting: ...'
 * @throws {InternalError}          'mongoose: ...'
 */
Account.prototype.create = function ( data, next ) {

    var accountDocument, self = this;

    async.series(
        [

            // . Validate parameters
            function ( scb ) {

                async.parallel(
                    [

                        // name
                        function ( pcb ) {
                            self._validators.name( data.name, pcb );
                        },

                        // password
                        function ( pcb ) {
                            self._validators.password( data.password, pcb );
                        },

                        // group
                        function ( pcb ) {

                            if ( data.group )
                                self._validators.group( data.group, pcb );
                            else
                                pcb();

                        },

                        // individualPerms
                        function ( pcb ) {

                            if ( data.individualPerms ) {
                                if ( mf.validatePerms( data.individualPerms ) )
                                    pcb();
                                else
                                    return pcb( new restify.InvalidArgumentError( 'individualPerms|invalid' ) );
                            } else
                                pcb();
                        }

                    ],
                    function ( err ) {

                        if ( err ) return scb( err );

                        scb();

                    }
                );

            },

            // . Check name engaged
            function ( scb ) {

                var checkEngageAccount = new Account();

                checkEngageAccount.findOne( { name: data.name }, function ( err ) {

                    if ( err && err instanceof restify.ResourceNotFoundError ) // not found
                        return scb();
                    else // already engaged name
                        return scb( new restify.InvalidArgumentError( 'name|engaged' ) );

                } );

            },

            // . Write to DB
            function ( scb ) {

                var dataToInsert = {};

                dataToInsert.name = data.name;
                dataToInsert.password = passwordHash.generate( data.password );
                dataToInsert.deleted = false;

                if ( data.group ) dataToInsert.group = new mf.ObjectId( data.group.id );

                if ( data.individualPerms ) dataToInsert.individualPerms = data.individualPerms;

                var newAccountModelObject = new AccountModel( dataToInsert );

                newAccountModelObject.save( function ( err, doc ) {

                    if ( err ) return scb( new restify.InternalError( 'mongoose: ' + err.message ) );

                    accountDocument = doc;

                    scb();

                } );

            },

            // . Clean object
            function ( scb ) {

                self.clean();
                scb();

            },

            // . doc to full object
            function ( scb ) {

                self._documentToFullObject( accountDocument, null, function ( err ) {

                    if ( err ) return scb( new restify.InternalError( 'document converting: ' + err.message ) );
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

/**
 * Find one full Account object
 *
 * @param                           filter              Should be not null
 * @param {string}                  [filter.id]
 * @param {string}                  [filter.name]
 * @param {string|AccountGroup}     [filter.group]      AccountGroup string id
 *
 * @param {function}                next
 */
Account.prototype.findOne = function ( filter, next ) {

    var preparedQuery, accountDocument, self = this;

    async.series(
        [

            // 1. Validate filter
            function ( scb ) {


                self._validateParameters( filter, function ( err ) {

                    if ( err ) return scb( err );

                    scb();

                } );

            },

            // 2. Prepare query
            function ( scb ) {

                self._prepareFindQuery( filter, function ( err, query ) {

                    if ( err ) return scb( err );

                    if ( Object.equal( query, { deleted: false } ) ) return scb( new restify.ResourceNotFoundError( '404' ) );

                    preparedQuery = query;

                    scb();

                } );

            },

            // 3. Find in DB
            function ( scb ) {

                AccountModel.findOne( preparedQuery, function ( err, doc ) {

                    if ( err ) return scb( err );
                    if ( ! doc ) return scb( new restify.ResourceNotFoundError( '404' ) );

                    accountDocument = doc;

                    scb();

                } );

            },

            // 4. Convert document
            function ( scb ) {

                self._documentToFullObject( accountDocument, null, function ( err ) {

                    if ( err ) return scb( err );

                    scb();

                } );

            }

        ],
        function ( err ) {
            if ( err ) return next( err );
            next( null, self );
        } );

};

/**
 * Find one short Account object
 *
 * @param                           filter              Should be not null
 *
 * @param {string}                  [filter.id]
 * @param {string}                  [filter.name]
 * @param {AccountGroup|string}     [filter.group]
 *
 * @param {function}                next
 */
Account.prototype.findOneShort = function ( filter, next ) {

    var preparedQuery, accountDocument, self = this;

    async.series(
        [

            // 1. Validate filter
            function ( scb ) {


                self._validateParameters( filter, function ( err ) {

                    if ( err ) return scb( err );

                    scb();

                } );

            },

            // 2. Prepare query
            function ( scb ) {

                self._prepareFindQuery( filter, function ( err, query ) {

                    if ( err ) return scb( err );

                    // If empty query, return 404
                    if ( Object.equal( query, { deleted: false } ) ) return scb( new restify.ResourceNotFoundError( '404' ) );

                    preparedQuery = query;

                    scb();

                } );

            },

            // 3. Find in DB
            function ( scb ) {

                AccountModel.findOne( preparedQuery, function ( err, doc ) {

                    if ( err ) return scb( err );
                    if ( ! doc ) return scb( new restify.ResourceNotFoundError( '404' ) );
                    //if ( ! preparedQuery || preparedQuery == { deleted: false } ) return scb( new restify.ResourceNotFoundError( '404' ) );

                    accountDocument = doc;

                    scb();

                } );

            },

            // 4. Convert document
            function ( scb ) {

                self._documentToShortObject( accountDocument, function ( err ) {

                    if ( err ) return scb( err );

                    scb();

                } );

            }

        ],
        function ( err ) {
            if ( err ) return next( err );
            next( null, self );
        } );

};

/**
 * Find several full Accounts objects by filter
 *
 * @param                           filter              May be null
 *
 * @param {string}                  [filter.id]
 * @param {string}                  [filter.name]
 * @param {string|AccountGroup}     [filter.group]      AccountGroup string id
 *
 * @param {function}                next
 */
Array.prototype.findAccounts = function ( filter, next ) {

    var accountDocuments, query, ArrayInstance;

    ArrayInstance = this;

    async.series(
        [

            // . Validate filter
            function ( scb ) {

                Account.prototype._validateParameters( filter, function ( err ) {

                    if ( err ) return scb( err );

                    scb();

                } );

            },

            // . Prepare query
            function ( scb ) {

                Account.prototype._prepareFindQuery( filter, function ( err, preparedQuery ) {

                    if ( err ) return scb( err );

                    //if ( ! preparedQuery ) return scb( new restify.ResourceNotFoundError( '404' ) );

                    query = preparedQuery;

                    scb();

                } );

            },

            // . Find in DB
            function ( scb ) {

                AccountModel.find( query, function ( err, docs ) {

                    if ( err ) return scb( err );
                    if ( ! docs ) return scb( new restify.ResourceNotFoundError( '404' ) );

                    accountDocuments = docs;

                    scb();

                } );

            },

            // . Convert documents
            function ( scb ) {

                async.eachSeries(
                    accountDocuments,
                    function ( document, escb ) {

                        var accountObject = new Account();

                        accountObject._documentToFullObject( document, null, function ( err ) {

                            if ( err ) return escb( err );

                            ArrayInstance.push( accountObject );

                            escb();

                        } );

                    },
                    function ( err ) {

                        if ( err ) return scb( err );

                        if ( ArrayInstance.length === 0 ) return scb( new restify.ResourceNotFoundError( '404' ) );

                        scb();

                    }
                );

            }

        ],
        function ( err ) {

            if ( err ) return next( err );

            next( null );

        }
    );

};

/**
 * Find several short Accounts objects by filter
 *
 * @param                           filter              May be null
 *
 * @param {string}                  [filter.id]
 * @param {string}                  [filter.name]
 * @param {string|AccountGroup}     [filter.group]      AccountGroup string id
 *
 * @param {function}                next
 */
Array.prototype.findShortAccounts = function ( filter, next ) {


    var accountDocuments, query, ArrayInstance;

    ArrayInstance = this;

    async.series(
        [

            // . Validate filter
            function ( scb ) {

                Account.prototype._validateParameters( filter, function ( err ) {

                    if ( err ) return scb( err );

                    scb();

                } );

            },

            // . Prepare query
            function ( scb ) {

                Account.prototype._prepareFindQuery( filter, function ( err, preparedQuery ) {

                    if ( err ) return scb( err );

                    query = preparedQuery;

                    scb();

                } );

            },

            // . Find in DB
            function ( scb ) {

                AccountModel.find( query, function ( err, docs ) {

                    if ( err ) return scb( err );
                    if ( ! docs ) return scb( new restify.ResourceNotFoundError( '404' ) );

                    accountDocuments = docs;

                    scb();

                } );

            },

            // . Convert documents
            function ( scb ) {

                async.eachSeries(
                    accountDocuments,
                    function ( document, escb ) {

                        var accountObject = new Account();

                        accountObject._documentToShortObject( document, function ( err ) {

                            if ( err ) return escb( err );

                            ArrayInstance.push( accountObject );

                            escb();

                        } );

                    },
                    function ( err ) {

                        if ( err ) return scb( err );

                        //if ( ArrayInstance.length === 0 ) return scb( new restify.ResourceNotFoundError( '404' ) );

                        scb();

                    }
                );

            }

        ],
        function ( err ) {

            if ( err ) return next( err );

            next( null );

        }
    );


};

/**
 * Convert Document to full Account object.
 *
 * This function does not validate parameters
 *
 * @param                           document
 * @param {Array}                   [propertiesToAdd]     Allowed: password
 *
 * @param {function}                next
 *
 * @throws {InternalError}          'Add group to object error: ...'
 */
Account.prototype._documentToFullObject = function ( document, propertiesToAdd, next ) {

    /*

     Requires properties for full Account object:
     - id
     - name
     - group
     - perms
     - individualPerms

     Allowed properties for full Account object:
     - token
     - password (hashed)

     */

    var self = this;


    async.series(
        [

            // . Add basic req. properties
            function ( scb ) {                                                                                          // Properties which can add in sync mode


                self.id = document._id.toString();
                self.name = document.name;

                scb();

            },

            // . Add group req. property
            function ( scb ) {

                if ( document.group ) {

                    self.group = new AccountGroup();

                    self.group.findOneShort( { id: document.group.toString() }, function ( err ) {

                        if ( err )
                            return scb( new restify.InternalError( 'Add group to object: ' + err.message ) );

                        scb();

                    } );


                } else {
                    scb();
                }

            },

            // . Add permissions
            function ( scb ) {

                if ( ! self.group ) return scb();

                self.group.addPermissions( function ( err, perms ) {

                    if ( err ) return scb( new restify.InternalError( 'Add permissions error: ' + err.message ) );

                    //self.group.perms = perms;

                    scb();

                } );

            },


            // . Merge permissions
            function ( scb ) {

                self.perms = ( self.group && ! Object.isEmpty( self.group.perms ) ) ? self.group.perms : {};

                self.individualPerms = ! Object.isEmpty( document.individualPerms ) ? document.individualPerms : {};

                if ( ! Object.isEmpty( self.individualPerms ) )
                    self.perms = mf.mergePerms( self.perms, self.individualPerms );

                scb();

            },


            // . Add not req. properties
            function ( scb ) {

                // password
                if ( mf.isInArray( 'password', propertiesToAdd ) )
                    self.password = document.password;

                scb();

            }

        ],
        function () {

            next( null, self );

        }
    );


};

/**
 * Convert Document to short Account object
 * Should be called after validating
 *
 * @param                           document
 * @param {function}                next (err,new Account)
 *
 * @throws {InternalError}          'Add group to object error: ...'
 */
Account.prototype._documentToShortObject = function ( document, next ) {

    /*

     Fields in short Account object
     - id
     - name
     - group (if exists)

     */

    var self = this;


    async.series(
        [
            // 1. Add static (synchronously get) properties from document
            function ( scb ) {

                self.id = document._id.toString();
                self.name = document.name;

                scb();

            },

            // 2. Asynchronously adding group
            function ( scb ) {

                if ( document.group ) {

                    self.group = new AccountGroup();

                    self.group.findOneShort( document._id.toString(), function ( err ) {

                        if ( err )
                            return scb( new restify.InternalError( 'Add group to object: ' + err.message ) );

                        scb();

                    } );


                } else {
                    scb();
                }

            }
        ],
        function () {
            next( null, self );
        }
    );


};

/**
 * Remove Account
 *
 * @param {function}                next        Callback(err, doc). doc - Found Account
 *
 * @throws {InternalError}          'id is not valid: ...'
 * @throws {InternalError}          'Marking document error. Mongoose: ...'
 */
Account.prototype.remove = function ( next ) {

    var self = this;

    async.series(
        [

            // . Validate id
            function ( scb ) {

                self._validators.id( self.id, function ( err ) {

                    if ( err ) return scb( new restify.InternalError( 'id is not valid: ' + err.message ) );

                    scb();

                } );

            },

            // . Mark document as deleted in DB
            function ( scb ) {

                AccountModel.update(
                    { _id: new mf.ObjectId( self.id ) },
                    { $set: { deleted: true } },
                    { multi: false },
                    function ( err ) {

                        if ( err ) return scb( new restify.InternalError( 'Marking document error. Mongoose: ' + err.message ) );
                        scb();

                    }
                );

            },

            // . Clean object
            function ( scb ) {

                self.clean();

                scb();

            }

        ],
        function ( err ) {

            if ( err ) return next( err );
            next();

        }
    );

};

/**
 * Update Account data by parameters in the self object
 *
 * @example
 * someAccount.name = "ivan233";
 * someAccount.update(function(err, Account){ ... });
 *
 * Allowed to change parameters: name, group, individualPerms, password
 *
 * @param {function}    next
 *
 * @throws {InvalidArgumentError}   name cant be null
 * @throws {InvalidArgumentError}   validate errors
 * @throws {InvalidArgumentError}   name|engaged
 *
 * @throws {InternalError}          Account for update has not been found
 * @throws {InternalError}          Getting object for compare changes error: ...
 * @throws {InternalError}          Name engage checking error: ...
 * @throws {InternalError}          Write changes error. Mongoose
 * @throws {InternalError}          Get updated Account object error: ...
 */
Account.prototype.update = function ( next ) {

    var originalAccount, updSet, updUnset, size, addPasswordProperty,
        self = this;

    size = self.isFull() ? 'full' : 'short';

    updSet = {};
    updUnset = {};

    async.series(
        [

            // . Get object for compare
            function ( scb ) {

                originalAccount = new Account();
                originalAccount.findOne( { id: self.id }, function ( err ) {

                    if ( err instanceof restify.ResourceNotFoundError ) return scb( new restify.InternalError( 'Account for update has not been found' ) );
                    if ( err ) return scb( new restify.InternalError( 'Getting object for compare changes error: ' + err.restCode + ' ' + err.message ) );

                    scb();


                } );


            },


            // . Find changes
            function ( scb ) {

                async.parallel(
                    [

                        // name
                        function ( pcb ) {

                            // Name is required prop
                            if ( ! self.name ) return pcb( new restify.InvalidArgumentError( 'name cant be null' ) );

                            // No changes
                            if ( self.name === originalAccount.name ) return pcb();


                            async.series(
                                [

                                    // validate
                                    function ( nameScb ) {

                                        self._validators.name( self.name, function ( err ) {

                                            if ( err ) return nameScb( err );

                                            nameScb();

                                        } );

                                    },

                                    // check engage
                                    function ( nameScb ) {

                                        var testNameEngageAccount = new Account();

                                        testNameEngageAccount.findOneShort( { name: self.name }, function ( err ) {

                                            if ( err && err instanceof restify.ResourceNotFoundError )
                                                return nameScb(); // not engaged

                                            else if ( err )
                                                return nameScb( new restify.InternalError( 'Name engage checking error: ' + err.message ) );

                                            else
                                                return nameScb( new restify.InvalidArgumentError( 'name|engaged' ) );

                                        } );

                                    }
                                ],
                                function ( err ) {
                                    if ( err ) return pcb( err );

                                    updSet.name = self.name;

                                    pcb();
                                }
                            );


                        },

                        // group
                        function ( pcb ) {

                            // No changes
                            if ( ! self.group && ! originalAccount.group ) return pcb();

                            // Field removing
                            if ( ! self.group && originalAccount.group ) {
                                updUnset.group = 1;
                                return pcb();
                            }


                            // New data
                            self._validators.group( self.group, function ( err ) {

                                if ( err ) return pcb( err ); // group|...

                                if ( self.group instanceof AccountGroup ) {
                                    updSet.group = new mf.ObjectId( self.group.id );
                                } else
                                    return pcb( new restify.InvalidArgumentError( 'group|not AccountGroup' ) );

                                pcb();

                            } )


                        },

                        // individualPerms
                        function ( pcb ) {

                            // No changes
                            if ( ! self.individualPerms && ! originalAccount.individualPerms ) return pcb();

                            // Field removing
                            if ( ! self.individualPerms && originalAccount.individualPerms ) {
                                updUnset.individualPerms = 1;
                                return pcb();
                            }

                            // New data
                            if ( mf.validatePerms( self.individualPerms ) ) {

                                updSet.individualPerms = self.individualPerms;

                                pcb();

                            } else
                                return pcb( new restify.InvalidArgumentError( 'individualPerms|invalid' ) );


                        },

                        // password
                        function ( pcb ) {

                            if ( self.password ) {

                                self._validators.password( self.password, function ( err ) {

                                    if ( err ) return pcb( err ); // password|...

                                    updSet.password = passwordHash.generate( self.password );

                                    addPasswordProperty = true;

                                    pcb();

                                } );

                            } else
                                return pcb();

                        }

                    ],

                    function ( err ) {

                        if ( err ) return scb( err );

                        scb();

                    }
                );

            },


            // . Write changes to DB
            function ( scb ) {

                var updateParameters = {};

                if ( ! Object.isEmpty( updSet ) )      updateParameters.$set = updSet;
                if ( ! Object.isEmpty( updUnset ) )  updateParameters.$unset = updUnset;

                // No changes
                if ( Object.isEmpty( updateParameters ) ) return scb();

                AccountModel.update(
                    { _id: mf.ObjectId( self.id ) },
                    updateParameters,
                    { multi: false },
                    function ( err ) {

                        if ( err ) return scb( new restify.InternalError( 'Write changes error. Mongoose: ' + err.message ) );

                        //updatedAccountDocument = newAccountDocument[0];

                        scb();

                    }
                );

            },


            // . Clean self object
            function ( scb ) {

                self.clean();

                scb();

            },


            // . Get updated Account object
            function ( scb ) {

                if ( ! size.has( /(short|full)/ ) )
                    return scb( new restify.InternalError( 'Get updated Account object error: size error' ) );


                var functionToCall = (size === 'full') ? 'findOne' : 'findOneShort';

                self[ functionToCall ]( { id: originalAccount.id }, function ( err ) {

                    if ( err ) return scb( new restify.InternalError( 'Get updated ' + size + ' Account object error: ' + err.message ) );

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

/**
 * Clean object instance
 */
Account.prototype.clean = function () {

    var self = this;

    if ( self.id )              delete self.id;
    if ( self.name )            delete self.name;
    if ( self.group )           delete self.group;
    if ( self.perms )           delete self.perms;
    if ( self.individualPerms ) delete self.individualPerms;
    if ( self.token )           delete self.token;
    if ( self.password )        delete self.password;


};

Account.prototype.isShort = function () {

    var self = this;

    // TODO add group object size checking

    return self.hasOwnProperty( 'id' ) && self.hasOwnProperty( 'name' ) && ! self.hasOwnProperty( 'perms' ) && ! self.hasOwnProperty( 'individualPerms' );

};

Account.prototype.isFull = function () {

    var self = this;

    return self.hasOwnProperty( 'id' ) && self.hasOwnProperty( 'name' ) && self.hasOwnProperty( 'perms' );

};


module.exports = Account;