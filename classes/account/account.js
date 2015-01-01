var restify      = require( 'restify' ),
    mongoose     = require( 'mongoose' ),
    //Document     = require( '../../node_modules/mongoose/lib/document.js' ),
    passwordHash = require( 'password-hash' ),
    async        = require( 'async' ),
    sugar        = require( 'sugar' ),

    mf           = require( '../../libs/mini-funcs.js' ),
    AccountModel = require( './account-model.js' ).AccountModel,
    AccountGroup = require( '../account-group/account-group.js' );


/**
 * Account class
 *
 * @param {object=}         data                    Passing if you want to create a new Account. New Account data
 * @param {string}          data.id
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
     * @param {object}              data                    Arguments
     * @param {string}              data.name
     * @param {string}              data.password
     * @param {AccountGroup}        data.group
     * @param                       data.individualPerms
     *
     *
     * @param {function}    next
     *
     * @throws InvalidArgumentError( 'parameter|error string' )
     *
     * @throws InternalError( 'document coverting: ...')
     * @throws InternalError( 'mongoose: ...')
     */
    this.create = function ( data, next ) {

        var accountDocument;

        async.series(
            [

                // . Validate parameters
                function ( scb ) {

                    async.parallel(
                        [

                            // name
                            function ( pcb ) {
                                self.validators.name( data.name, pcb );
                            },

                            // password
                            function ( pcb ) {
                                self.validators.password( data.password, pcb );
                            },

                            // group
                            function ( pcb ) {

                                if ( data.group )
                                    self.validators.group( data.group, pcb );
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

                    self.documentToFullObject( accountDocument, null, function ( err ) {

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


    this.validators = {

        /**
         * Id validator
         *
         * @param {string} value
         * @param {function} next
         *
         * @throws InvalidArgumentError( 'id|not ObjectId' )
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
         * @throws InvalidArgumentError( 'name|not string' )
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
         * Token validator
         *
         * @param {string} value
         * @param {function} next
         *
         * @throws InvalidArgumentError( 'token|not token' )
         *
         * @returns {*}
         */
        token: function ( value, next ) {

            if ( value ) {
                if ( ! mf.isToken( value ) ) {
                    return next( new restify.InvalidArgumentError( 'token|not token' ) );
                } else {
                    next( null );
                }
            } else
                return next( new restify.InvalidArgumentError( 'token|null' ) );

        },

        /**
         * AccountGroup validator
         *
         * @param {string|AccountGroup} value
         * @param {function} next
         *
         * @throws InvalidArgumentError( 'group|not string or not AccountGroup' )
         * @throws ResourceNotFoundError( 'group|404' )
         * @throws InvalidArgumentError( 'group|type error' )
         */
        group: function ( value, next ) {

            if ( value ) {

                var foundAccountGroup; // redeclare as local to avoid conflicts with current validator

                var groupId;


                // Getting groupId for validating
                if ( value instanceof AccountGroup && value.id ) {

                    groupId = value.id;

                } else if ( typeof value === 'string' ) {

                    groupId = value;

                } else {

                    return next( new restify.InvalidArgumentError( 'group|not string and not AccountGroup' ) );

                }


                // Validating group for existence

                foundAccountGroup = new AccountGroup();

                foundAccountGroup.getById( groupId, function ( err ) { // need to be short

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
         * @throws InvalidArgumentError( 'password|invalid' )
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
     * validateParameters( { name: [ 'wailorman', 'snoberik' ] }, function( err ){ ... } )
     *
     * @param {object}      filter
     * @param {function}    next    ( err, {boolean} isValid )
     *
     * @throws InvalidArgumentError( 'id|not ObjectId' )
     * @throws InvalidArgumentError( 'name|not string' )
     * @throws InvalidArgumentError( 'token|not token' )
     * @throws InvalidArgumentError( 'group|not string or not AccountGroup' )
     * @throws ResourceNotFoundError( 'group|404' )
     * @throws InvalidArgumentError( 'group|type error' )
     */
    this.validateParameters = function ( filter, next ) {

        if ( filter ) {

            async.parallel(
                [
                    // 1. id
                    function ( pcb ) {

                        if ( filter.id ) {

                            if ( ! ( filter.id instanceof Array ) )
                                filter.id = [ filter.id ];

                            async.each( filter.id, self.validators.id, pcb );

                        } else
                            pcb();

                    },

                    // 2. name
                    function ( pcb ) {

                        if ( filter.name ) {

                            if ( ! ( filter.name instanceof Array ) )
                                filter.name = [ filter.name ];

                            async.each( filter.name, self.validators.name, pcb );

                        } else
                            pcb();

                    },

                    // 3. token
                    function ( pcb ) {

                        if ( filter.token ) {

                            if ( ! ( filter.token instanceof Array ) )
                                filter.token = [ filter.token ];

                            async.each( filter.token, self.validators.token, pcb );

                        } else
                            pcb();

                    },

                    // 4. group
                    function ( pcb ) {

                        if ( filter.group ) {

                            if ( ! ( filter.group instanceof Array ) )
                                filter.group = [ filter.group ];

                            async.each( filter.group, self.validators.group, pcb );

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
     *
     * @param {object}      filter
     * @param {function}    next
     * @param               next.err
     * @param {object}      next.query
     *
     * @throws InvalidArgumentError
     * @throws InternalError
     */
    this.prepareFindQuery = function ( filter, next ) {

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
     * Find one full Account object
     *
     * @param {object}      filter
     *
     * @param filter.id
     * @param filter.name
     * @param filter.group    AccountGroup string id
     * @param filter.token    string token
     *
     * @param next
     */
    this.findOne = function ( filter, next ) {

        var preparedQuery, accountDocument;

        async.series(
            [

                // 1. Validate filter
                function ( scb ) {


                    self.validateParameters( filter, function ( err ) {

                        if ( err ) return scb( err );

                        scb();

                    } );

                },

                // 2. Prepare query
                function ( scb ) {

                    self.prepareFindQuery( filter, function ( err, query ) {

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

                    self.documentToFullObject( accountDocument, null, function ( err ) {

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
     * @param {object}                  filter
     *
     * @param {string}                  [filter.id]
     * @param {string}                  [filter.name]
     * @param {AccountGroup|string}     [filter.group]
     *
     * @param next
     */
    this.findOneShort = function ( filter, next ) {

        var preparedQuery, accountDocument;

        async.series(
            [

                // 1. Validate filter
                function ( scb ) {


                    self.validateParameters( filter, function ( err ) {

                        if ( err ) return scb( err );

                        scb();

                    } );

                },

                // 2. Prepare query
                function ( scb ) {

                    self.prepareFindQuery( filter, function ( err, query ) {

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

                    self.documentToShortObject( accountDocument, function ( err ) {

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
     * @param {object}      filter
     *
     * @param {string=}     filter.id
     * @param {string=}     filter.name
     * @param {string=}     filter.group    AccountGroup string id
     * @param {string=}     filter.token    string token
     *
     * @param next
     */
    Array.prototype.findAccounts = function ( filter, next ) {

        var accountDocuments, query, ArrayInstance;

        ArrayInstance = this;

        async.series(
            [

                // . Validate filter
                function ( scb ) {

                    self.validateParameters( filter, function ( err ) {

                        if ( err ) return scb( err );

                        scb();

                    } );

                },

                // . Prepare query
                function ( scb ) {

                    self.prepareFindQuery( filter, function ( err, preparedQuery ) {

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

                    var i;

                    async.eachSeries(
                        accountDocuments,
                        function ( document, escb ) {

                            var accountObject = new Account();

                            accountObject.documentToFullObject( document, null, function ( err ) {

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
     * @param {object}      filter
     *
     * @param {string=}     filter.id
     * @param {string=}     filter.name
     * @param {string=}     filter.group    AccountGroup string id
     * @param {string=}     filter.token    string token
     *
     * @param next
     */
    Array.prototype.findShortAccounts = function ( filter, next ) {


        var accountDocuments, query, ArrayInstance;

        ArrayInstance = this;

        async.series(
            [

                // . Validate filter
                function ( scb ) {

                    self.validateParameters( filter, function ( err ) {

                        if ( err ) return scb( err );

                        scb();

                    } );

                },

                // . Prepare query
                function ( scb ) {

                    self.prepareFindQuery( filter, function ( err, preparedQuery ) {

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

                    var i;

                    async.eachSeries(
                        accountDocuments,
                        function ( document, escb ) {

                            var accountObject = new Account();

                            accountObject.documentToShortObject( document, function ( err ) {

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
     * Convert Document to full Account object.
     *
     * This function does not validate parameters
     *
     * @param               document
     * @param {object}      propertiesToAdd     Allowed: password, token
     * @param {function}    next (err,new Account)
     *
     * @throws InternalError( 'Add group to object: ' + err.message )
     */
    this.documentToFullObject = function ( document, propertiesToAdd, next ) {

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


        async.series(
            [

                // . Add basic req. properties
                function ( scb ) {


                    self.id = document._id.toString();

                    if ( document.name )
                        self.name = document.name;

                    if ( document.individualPerms )
                        self.individualPerms = document.individualPerms;

                    var groupPerms = (self.group && self.group.perms) ? self.group.perms : {},
                        individualPerms = self.individualPerms ? self.individualPerms : {};


                    scb();

                },

                // . Add group req. property
                function ( scb ) {

                    if ( document.group ) {

                        self.group = new AccountGroup();

                        self.group.getById( document.group.toString(), function ( err ) {

                            if ( err )
                                return scb( new restify.InternalError( 'Add group to object: ' + err.message ) );

                            scb();

                        } );


                    } else {
                        scb();
                    }

                },


                // . Merge permissions
                function ( scb ) {

                    if ( self.group ) {

                        self.perms = mf.mergePerms( self.group.perms, self.individualPerms );

                    } else if ( self.individualPerms ) {

                        self.perms = self.individualPerms;

                    } else {

                        self.perms = {};

                    }

                    scb();

                },


                // . Add not req. properties
                function ( scb ) {

                    // password
                    if ( mf.isInArray( 'password', propertiesToAdd ) )
                        self.password = document.password;

                    // token
                    // TODO token

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
     *
     * This function does not validate anything
     *
     * @param               document
     * @param {function}    next (err,new Account)
     *
     * @throws InternalError( 'Add group to object: ' + err.message )
     */
    this.documentToShortObject = function ( document, next ) {

        /*

         Fields in short Account object
         - id
         - name
         - group (if exists)

         */


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

                        self.group.getById( document._id.toString(), function ( err ) {

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
     * Get Account by id
     *
     * @param {string}      id      Account Id to find
     * @param {function}    next    Callback(err, doc)
     */
    this.getById = function ( id, next ) {

        if ( ! id )
            return next( new restify.InvalidArgumentError( 'id|null' ) );

        if ( ! mf.isObjectId( id ) )
            return next( new restify.InvalidArgumentError( 'id|not ObjectId' ) );


        AccountModel.findOne(
            { _id: id, deleted: false },
            function ( err, accountDocument ) {
                if ( err ) return next( err );
                if ( ! accountDocument ) return next( new restify.ResourceNotFoundError( '404' ) );

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

        if ( ! name )
            return next( new restify.InvalidArgumentError( 'id|null' ) );

        if ( typeof name != 'string' )
            return next( new restify.InvalidArgumentError( 'id|not ObjectId' ) );


        AccountModel.findOne(
            { name: name, deleted: false },
            function ( err, accountDocument ) {
                if ( err ) return next( err );
                if ( ! accountDocument ) return next( new restify.ResourceNotFoundError( '404' ) );

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

        async.series(
            [

                // . Validate id
                function ( scb ) {

                    self.validators.id( self.id, function ( err ) {

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

                            if ( err ) return scb( new restify.InternalError( 'Mark document error. Mongoose: ' + err.message ) );
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
     * @param {function}    next        Callback(err, newDoc). newDoc - Updated Account data
     *
     * @throws {InternalError}
     * @throws InternalError( 'Account to updated has not been found' )
     * @throws InternalError( 'Getting object for compare: ...')
     * @throws InternalError( 'Name engage checking: ...')
     * @throws InternalError( 'Write changes error. Mongoose: ...')
     * @throws InternalError( 'Get updated _ Account object: ...')
     *
     * @throws {InvalidArgumentError}
     * @throws InvalidArgumentError( 'group|not Array and not AccountGroup' )
     * @throws InvalidArgumentError( 'individualPerms|invalid' )
     * @throws InvalidArgumentError( 'name|engaged' )
     * @throws InvalidArgumentError( 'name|null' )
     */
    this.update = function ( next ) {

        var originalAccount, changes, size, addPasswordProperty, updatedAccountDocument;

        size = self.isFull() ? 'full' : 'short';

        changes = {};

        async.series(
            [

                // . Get object for compare
                function ( scb ) {

                    originalAccount = new Account();
                    originalAccount.findOne( { id: self.id }, function ( err ) {

                        if ( err instanceof restify.ResourceNotFoundError ) return scb( new restify.InternalError( 'Account to updated has not been found' ) );
                        if ( err ) return scb( new restify.InternalError( 'Getting object for compare: ' + err.restCode + ' ' + err.message ) );

                        scb();


                    } );


                },


                // . Find changes
                function ( scb ) {

                    async.parallel(
                        [

                            // name
                            function ( pcb ) {

                                if ( self.name ) {

                                    if ( self.name !== originalAccount.name ) {


                                        async.series(
                                            [

                                                // validate
                                                function ( nameScb ) {

                                                    self.validators.name( self.name, function ( err ) {

                                                        if ( err ) return nameScb( err );
                                                        changes.name = self.name;
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
                                                            return nameScb( new restify.InternalError( 'Name engage checking: ' + err.message ) );
                                                        else
                                                            return nameScb( new restify.InvalidArgumentError( 'name|engaged' ) );

                                                    } );

                                                },
                                            ],
                                            function ( err ) {
                                                if ( err ) return pcb( err );
                                                pcb();
                                            }
                                        );

                                    } else
                                        pcb();

                                } else
                                    return pcb( new restify.InvalidArgumentError( 'name|null' ) );

                            },

                            // group
                            function ( pcb ) {

                                if ( self.group ) {

                                    if ( self.group !== originalAccount.group ) {

                                        self.validators.group( self.group, function ( err ) {

                                            if ( err ) return pcb( err ); // group|...

                                            if ( self.group instanceof AccountGroup ) {

                                                changes.group = new mf.ObjectId( self.group.id );

                                            } else
                                                return pcb( new restify.InvalidArgumentError( 'group|not Array and not AccountGroup' ) );

                                            pcb();

                                        } )

                                    } else
                                        pcb();


                                }

                            },

                            // individualPerms
                            function ( pcb ) {

                                if ( self.individualPerms ) {

                                    if ( self.individualPerms !== originalAccount.individualPerms ) {

                                        if ( mf.validatePerms( self.individualPerms ) ) {

                                            changes.individualPerms = self.individualPerms;

                                            pcb();

                                        } else
                                            return pcb( new restify.InvalidArgumentError( 'individualPerms|invalid' ) );


                                    } else
                                        pcb();

                                }

                            },

                            // password
                            function ( pcb ) {

                                if ( self.password ) {

                                    self.validators.password( self.password, function ( err ) {

                                        if ( err ) return pcb( err ); // password|...

                                        changes.password = passwordHash.generate( self.password );

                                        addPasswordProperty = true;

                                        pcb();

                                    } );

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


                // . Write changes to DB
                function ( scb ) {

                    AccountModel.update(
                        { _id: mf.ObjectId( self.id ) },
                        { $set: changes },
                        { multi: false },
                        function ( err, newAccountDocument ) {

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

                    if ( size === 'full' ) {

                        self.findOne( { id: originalAccount.id }, function ( err ) {

                            if ( err ) return scb( new restify.InternalError( 'Get updated full Account object: ' + err.message ) );

                            scb();

                        } );

                    } else if ( size === 'short' ) {

                        self.findOneShort( { id: originalAccount.id }, function ( err ) {

                            if ( err ) return scb( new restify.InternalError( 'Get updated short Account object: ' + err.message ) );

                            scb();

                        } );

                    } else
                        return scb( new restify.InternalError( 'Get updated ' + size + ' Account object: object size error' ) );


                }

            ],
            function ( err ) {

                if ( err ) return next( err );

                next();

            }
        );

    };

    /**
     * Clean object instance
     *
     * @return {}
     */
    this.clean = function () {

        if ( self.id )              delete self.id;
        if ( self.name )            delete self.name;
        if ( self.group )           delete self.group;
        if ( self.perms )           delete self.perms;
        if ( self.individualPerms ) delete self.individualPerms;
        if ( self.token )           delete self.token;
        if ( self.password )        delete self.password;


    };

    this.isShort = function () {

        /*var allowedProperties = [ 'id', 'name' ];

         for ( var propertyName in self ) {

         if ( self.hasOwnProperty( propertyName ) && typeof self[ propertyName ] !== 'function' ) {


         // If propertyName is not in allowedProperties

         if ( ! mf.isInArray( propertyName, allowedProperties ) && propertyName !== 'group' ) {

         return false;

         }

         }


         }

         return true;*/

        // TODO add group object size checking

        return self.hasOwnProperty( 'id' ) && self.hasOwnProperty( 'name' ) && ! self.hasOwnProperty( 'perms' ) && ! self.hasOwnProperty( 'individualPerms' );

    };

    this.isFull = function () {

        // Minimum requirements to bee a full object

        /*return self.hasOwnProperty( 'id' ) &&
         self.hasOwnProperty( 'name' ) &&
         self.hasOwnProperty( 'perms' );*/

        return self.hasOwnProperty( 'id' ) && self.hasOwnProperty( 'name' ) && self.hasOwnProperty( 'perms' );

    };

    this.value = function () {
        return self;
    };

};

module.exports = Account;