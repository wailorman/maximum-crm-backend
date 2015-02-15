var restify    = require( 'restify' ),
    mongoose   = require( 'mongoose' ),
    async      = require( 'async' ),
    sugar      = require( 'sugar' ),
    ObjectId     = mongoose.Types.ObjectId,

    ClientModel = require( '../../models/client.js' );

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

            if ( docs.length == 0 ) return next( new restify.ResourceNotFoundError( "No clients was find" ) );

            res.send( 200, docs );
            return next();

        } );

};

var createClientRoute = function ( req, res, next ) {

    var newClientDocument = new ClientModel({
        name: req.params.name
    });

    newClientDocument.save( function ( err, doc ) {

        if ( err ) return next( new restify.InternalError( "Mongo write: " + err.message ) );

        res.send( 200, doc );
        return next();

    } );

};

var deleteClientRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id: " + err.message ) );
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

module.exports.getOneClientRoute = getOneClientRoute;
module.exports.getClientsRoute = getClientsRoute;
module.exports.createClientRoute = createClientRoute;
module.exports.deleteClientRoute = deleteClientRoute;
