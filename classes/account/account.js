var restify = require( 'restify' );
var mongoose = require( 'mongoose' );
var Document = require( '../../node_modules/mongoose/lib/document.js' );
var passwordHash = require( 'password-hash' );
var async = require( 'async' );

var mf = require( '../../libs/mini-funcs.js' );
var AccountModel = require( './account-model.js' ).AccountModel;
var AccountGroup = require( '../account-group/account-group.js' );


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
    Array.prototype.Account = {};


    /**
     * Create an Account
     *
     * @param {object}      data    Arguments
     * @param {function}    next    Callback(err, doc)
     */
    this.create = function ( data, next ) {

        /*// 0. Move data from constructor
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
         }*/


        // 1. Check variables types

        if ( ! data.name )
            return next( new restify.InvalidArgumentError( 'name|null' ) );

        if ( ! data.password )
            return next( new restify.InvalidArgumentError( 'password|null' ) );

        if ( typeof data.name != 'string' )
            return next( new restify.InvalidArgumentError( 'name|not string' ) );

        if ( typeof data.password != 'string' )
            return next( new restify.InvalidArgumentError( 'password|not string' ) );

        if ( data.group && ! (data.group instanceof AccountGroup) )
            return next( new restify.InvalidArgumentError( 'group|not AccountGroup' ) );

        if ( data.individualPerms && ! mf.validatePerms( data.individualPerms ) )
            return next( new restify.InvalidArgumentError( 'individualPerms|invalid' ) );


        async.waterfall(
            [
                // 2. Check name engaged
                function ( wcb ) {
                    AccountModel.findOne(
                        { name: data.name, deleted: false },
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
                    if ( data.group ) {

                        var accountGroupToFind = new AccountGroup();

                        accountGroupToFind.getById(
                            data.group.id,
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

                    dataToWriteToDb.name = data.name;
                    dataToWriteToDb.password = passwordHash.isHashed( data.password ) ?
                        data.password :
                        passwordHash.generate( data.password );

                    dataToWriteToDb.group = data.group ? data.group.id : null;
                    dataToWriteToDb.individualPerms = data.individualPerms;
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
                                    //self.group = null;
                                    delete self.group;
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


    this.validators = {
        id:    function ( value, next ) {

            if ( ! mf.isObjectId( value ) ) {
                // incorrect
                return next( new restify.InvalidArgumentError( 'id|not ObjectId' ) );
            } else {
                // correct
                next( null );
            }
        },
        name:  function ( value, next ) {

            if ( typeof value !== 'string' ) {
                return next( new restify.InvalidArgumentError( 'name|not string' ) );
            } else {
                next( null );
            }

        },
        token: function ( value, next ) {

            if ( ! mf.isToken( value ) ) {
                return next( new restify.InvalidArgumentError( 'token|not token' ) );
            } else {
                next( null );
            }

        },
        group: function ( value, next ) {

            var foundAccountGroup; // redeclare as local to avoid conflicts with current validator

            var groupId;


            // Getting groupId for validating
            if ( value instanceof AccountGroup && value.id ) {

                groupId = value.id;

            } else if ( typeof value === 'string' ) {

                groupId = value;

            } else {

                next( new restify.InvalidArgumentError( 'group|not string or not AccountGroup' ) );

            }


            // Validating group for existence

            foundAccountGroup = new AccountGroup();

            foundAccountGroup.getById( groupId, function ( err ) { // need to be short

                if ( err ) {

                    if ( err instanceof restify.ResourceNotFoundError ) {

                        next( new restify.InvalidArgumentError( 'group|404' ) );

                    } else if ( err instanceof restify.InvalidArgumentError ) {

                        next( new restify.InvalidArgumentError( 'group|type error' ) );

                    } else {

                        next( err );

                    }

                } else {

                    next( null );

                }

            } );

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
     */
    this.validateParameters = function ( filter, next ) {

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

                if ( err ) next( err );

                next( null );

            }
        );

    };


    /**
     * Prepare query for mongoDB
     *
     * @param {object}      filter
     * @param {function}    next    ( err, {object} query )
     */
    this.prepareQuery = function ( filter, next ) {

        /*
         Allowed filter parameters:
         - id
         - name
         - group
         - token
         */

        var andStatements = [];

        /*if ( filter === null || filter == {} )
         return next( null, {} );*/

        if ( typeof filter !== 'object' )
            return next( new restify.InvalidArgumentError( 'filter|not object' ) );

        async.parallel(
            [
                // 1. id
                function ( pcb ) {

                    var curOrStatements = [];

                    if ( filter.hasOwnProperty( 'id' ) ) {

                        if ( typeof filter.id === 'string' ) filter.id = [ filter.id ];

                        if ( filter.id instanceof Array ) {

                            async.each( filter.id, function ( id, ecb ) {

                                if ( typeof id === 'string' ) {

                                    curOrStatements.push( { _id: new mf.ObjectId( id ) } );
                                    ecb();

                                } else
                                    return next( new restify.InvalidArgumentError( 'filter.id(' + id + ')|not string' ) );


                                //andStatements.push( { _id: id } );
                                //ecb();


                            }, function () {

                                andStatements.push( { $or: curOrStatements } );
                                pcb();

                            } );

                        } else
                            return next( new restify.InvalidArgumentError( 'filter.id|not Array' ) );


                    } else
                        pcb();

                },

                // 2. name
                function ( pcb ) {

                    var curOrStatements = [];

                    if ( filter.hasOwnProperty( 'name' ) ) {

                        if ( typeof filter.name === 'string' ) filter.name = [ filter.name ];

                        if ( filter.name instanceof Array ) {

                            async.each( filter.name, function ( name, ecb ) {

                                if ( typeof name === 'string' ) {

                                    curOrStatements.push( { name: name } );
                                    ecb();

                                } else
                                    return next( new restify.InvalidArgumentError( 'filter.name(' + name + ')|not string' ) );


                            }, function () {

                                andStatements.push( { $or: curOrStatements } );
                                pcb();

                            } );

                        } else
                            return next( new restify.InvalidArgumentError( 'filter.name|not Array' ) );

                    } else
                        pcb();

                },

                // 3. token

                // 4. group
                function ( pcb ) {

                    var groupIds = [];

                    if ( filter.hasOwnProperty( 'group' ) ) {

                        if ( filter.group instanceof AccountGroup ) filter.group = [ filter.group ];

                        if ( filter.group instanceof Array ) {

                            async.each( filter.group, function ( group, ecb ) {

                                if ( group instanceof AccountGroup && group.id ) {

                                    groupIds.push( group.id );

                                } else if ( typeof group === 'string' ) {

                                    groupIds.push( group );

                                } else
                                    return next( new restify.InternalError( ' Account prepareQuery: filter.group|not AccountGroup & not string' ) );


                                ecb();

                            }, function () {

                                andStatements.push( { group: { $in: groupIds } } );
                                pcb();

                            } );

                        } else
                            return next( new restify.InternalError( 'Account prepareQuery: group|not Array' ) );


                    } else
                        pcb();

                }

            ],
            function () {

                var result = andStatements.length > 0 ? { $and: andStatements } : {};

                // required param deleted: false
                result.deleted = false;

                next( null, result );

            }
        );


    };


    /**
     * Find one full Account object
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
    this.findOne = function ( filter, next ) {

        var query, accountDocument;

        async.series(
            [

                // 1. Validate filter
                function ( scb ) {

                    self.validateParameters( filter, function ( err ) {

                        if ( err ) return next( err );

                        scb();

                    } );

                },

                // 2. Prepare query
                function ( scb ) {

                    self.prepareQuery( filter, function ( err, preparedQuery ) {

                        if ( err ) return next( err );

                        query = preparedQuery;

                        scb();

                    } );

                },

                // 3. Find in DB
                function ( scb ) {

                    AccountModel.findOne( query, function ( err, doc ) {

                        if ( err ) return next( err );

                        accountDocument = doc;

                        scb();

                    } );

                },

                // 4. Convert document
                function ( scb ) {

                    self.documentToFullObject( accountDocument, null, function ( err ) {

                        if ( err ) return next( err );

                        scb();

                    } );

                }

            ],
            function () {
                next( null, self );
            }
        );

    };


    /**
     * Find one short Account object
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
    this.findOneShort = function ( filter, next ) {
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
    Array.prototype.Account.find = function ( filter, next ) {
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
    Array.prototype.Account.findShort = function ( filter, next ) {
    };


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

        //var document = this;
        var object = self;

        //var allowedPropertiesToAdd = [ 'password', 'token' ];


        // Some of required properties for full Account object
        var documentFieldsConvertRules = [

            /* [ fieldInDocument, propertyInObject ] */

            [ '_id', 'id' ],
            [ 'name', 'name' ],
            [ 'password', 'password' ],
            [ 'individualPerms', 'individualPerms' ]
            // + group (because we can get it only in async mode)
        ];

        var i, curDocumentFiled, curObjectProperty;


        async.series(
            [

                // . Add basic req. properties
                function ( scb ) {

                    /*for ( i in documentFieldsConvertRules ) {

                        // for^ check statement
                        if ( documentFieldsConvertRules.hasOwnProperty( i ) ) {

                            // Does document has filed we find
                            if ( document.hasOwnProperty( documentFieldsConvertRules[ i ][ 0 ] ) ) {

                                curDocumentFiled = documentFieldsConvertRules[ i ][ 0 ];
                                curObjectProperty = documentFieldsConvertRules[ i ][ 1 ];

                                object[ curObjectProperty ] = document[ curDocumentFiled ];

                                scb();

                            }

                        }

                    }*/

                    if ( document._id )
                        self.id = document._id.toString();

                    if ( document.name )
                        self.name = document.name;

                    if ( document.individualPerms )
                        self.individualPerms = document.individualPerms;

                    scb();

                },

                // . Add group req. property
                function ( scb ) {

                    if ( document.group ) {

                        self.group = new AccountGroup();
                        self.group.getById( document.group.toString(), function ( err ) {

                            if ( err ) return next( err );
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

                    }else if( self.individualPerms ){

                        self.perms = self.individualPerms;

                    }else{

                        self.perms = {};

                    }

                    scb();

                },


                // . Add not req. properties
                function ( scb ) {

                    // password
                    if ( mf.isInArray( 'password', propertiesToAdd ) )
                        object.password = document.password;

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

    this.documentToShortObject = function ( document, object, next ) {

        /*

         Fields in short Account object
         - id
         - name
         - group (if exists)

         */

        //var document = this;

        async.series(
            [
                // 1. Add static (synchronously get) properties from document
                function ( scb ) {

                    object.id = document._id.toString();
                    object.name = document.name;

                    scb();

                },

                // 2. Asynchronously adding group
                function ( scb ) {

                    if ( document.group ) {

                        object.group = new AccountGroup();
                        object.group.getById( document.group.toString(), function ( err ) {

                            if ( err ) return next( err );

                            scb();

                        } );

                    } else {
                        scb();
                    }

                }
            ],
            function () {
                next( null, object );
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

        if ( ! self.id )
            return next( new restify.InvalidArgumentError( 'id|null' ) );

        if ( ! mf.isObjectId( self.id ) )
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
                            if ( ! doc ) return scb( new restify.ResourceNotFoundError( 'id|404' ) );

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

                                    // If err wasn't called. Maybe, account with
                                    // the same name is exists => this name is engaged

                                    if ( ! err ) {
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

                        if ( ! ( self.group instanceof AccountGroup ) || ! self.group.hasOwnProperty( 'id' ) )
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

                        //self.group = self.group;
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

    this.isShort = function () {

        var allowedProperties = [ 'id', 'name' ];

        for ( var propertyName in self ) {

            if ( self.hasOwnProperty( propertyName ) && typeof self[ propertyName ] !== 'function' ) {


                // If propertyName is not in allowedProperties

                if ( ! mf.isInArray( propertyName, allowedProperties ) && propertyName !== 'group' ) {

                    return false;

                }

            }


        }

        return true;

    };

    this.isFull = function () {

        // Minimum requirements to bee a full object

        return self.hasOwnProperty( 'id' ) &&
               self.hasOwnProperty( 'name' ) &&
               self.hasOwnProperty( 'perms' );

    };

    this.value = function () {
        return self;
    };

};

module.exports = Account;