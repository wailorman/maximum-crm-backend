var restify     = require( 'restify' ),
    mongoose    = require( 'mongoose' ),
    async       = require( 'async' ),
    sugar       = require( 'sugar' ),
    ObjectId    = mongoose.Types.ObjectId,

    ClientModel = require( '../../models/client.js' ),
    GroupModel  = require( '../../models/group.js' );

// @todo /clients/:id/invite-to-group?group=<>
// @todo /clients/:id/coaches

var getOneClientRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id" ) );
    }

    ClientModel.findOne( { _id: new ObjectId( id ) }, function ( err, doc ) {

        if ( err ) return next( new restify.InternalError( 'Mongo find: ' + err.message ) );

        if ( !doc ) return next( new restify.ResourceNotFoundError( "Can't find client with such id" ) );

        res.send( 200, doc );
        return next();

    } );

};

var getClientsRoute = function ( req, res, next ) {

    ClientModel
        .find( {} )
        .limit( 1000 )
        .sort( { _id: -1 } )
        .exec( function ( err, docs ) {

            if ( err ) return next( new restify.InternalError( "Mongo find: " + err.message ) );

            res.send( 200, docs );
            return next();

        } );

};

var createClientRoute = function ( req, res, next ) {

    var newClientDocument = new ClientModel();

    newClientDocument.name = req.body.name;
    if ( req.body.consists ) newClientDocument.consists = req.body.consists;

    async.series( [

        // validate `consists` path
        function ( scb ) {

            validateConsists( req.body.consists, scb );

        },

        // save document
        function ( scb ) {

            newClientDocument.save( function ( err, doc ) {

                if ( err ) return scb( new restify.InternalError( "Mongo write: " + err ) );

                res.send( 200, doc );
                return scb();

            } );

        }

    ], next );


};

var deleteClientRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id" ) );
    }

    ClientModel
        .findOne( { _id: id } )
        .exec( function ( err, doc ) {

            if ( err ) return next( new restify.InternalError( "Mongo find: " + err.message ) );

            if ( !doc ) return next( new restify.ResourceNotFoundError( "Can't find client with such id" ) );

            doc.remove( function ( err ) {

                if ( err ) return next( new restify.InternalError( "Mongo remove: " + err.message ) );

                res.send( 200, 'Client was deleted!' );
                return next();

            } );

        } );

};

var validateConsists = function ( consistsArray, next ) {

    var consistsMirror = [];

    if ( !consistsArray ) return next(); // consists can be empty

    if ( !(consistsArray instanceof Array) ) return next( new restify.InvalidArgumentError( "`consists` path should be an array" ) );

    async.each(
        consistsArray,
        function ( groupStrId, ecb ) {

            // check duplicate id
            if ( consistsMirror.find( groupStrId.toString() ) ) {
                return ecb( new restify.InvalidArgumentError( "Group id duplicate in consists field" ) );
            } else {
                consistsMirror.push( groupStrId.toString() );
            }


            try {
                var group = new ObjectId( groupStrId );
            }
            catch (e) {
                return ecb( new restify.InvalidArgumentError( "Invalid group id: " + groupStrId ) );
            }

            GroupModel.findOne( { _id: group }, function ( err, group ) {

                if ( err ) return ecb( new restify.InternalError( "Mongo find: " + err ) );

                if ( !group ) return ecb( new restify.InvalidArgumentError( "Can't find group with such id: " + groupStrId ) );

                ecb();

            } );

        },
        next
    );

};

var putClientRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id" ) );
    }

    // object for merge with original document

    delete req.body._id; // ignore private fields
    delete req.body.__v;

    // find document

    ClientModel
        .findOne( { _id: id } )
        .exec( function ( err, client ) {

            if ( err ) return next( err );

            if ( !client ) return next( new restify.ResourceNotFoundError( "Can't find client with such id" ) );

            // check data

            async.series( [

                // validate consists field
                function ( scb ) {

                    validateConsists( req.body.consists, scb );

                },

                // merge changes and save
                function ( scb ) {

                    Object.merge( client, req.body, true );

                    client.increment();
                    client.save( function ( err, client ) {

                        if ( err ) return scb( err );
                        res.send( 200, client );
                        return scb();

                    } );

                }

            ], next );

        } );

};

module.exports.getOneClientRoute = getOneClientRoute;
module.exports.getClientsRoute = getClientsRoute;
module.exports.createClientRoute = createClientRoute;
module.exports.deleteClientRoute = deleteClientRoute;
module.exports.putClientRoute = putClientRoute;
