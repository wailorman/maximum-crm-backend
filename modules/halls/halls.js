var restify    = require( 'restify' ),
    mongoose   = require( 'mongoose' ),
    async      = require( 'async' ),
    sugar      = require( 'sugar' ),
    ObjectId     = mongoose.Types.ObjectId,

    HallModel = require( '../../models/hall.js' );

var getOneHallRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id" ) );
    }

    HallModel.findOne( { _id: new ObjectId( id ) }, function ( err, doc ) {

        if ( err ) return next( new restify.InternalError( 'Mongo find: ' + err.message ) );

        if ( !doc ) return next( new restify.ResourceNotFoundError( "Can't find hall with such id" ) );

        res.send( 200, doc );
        return next();

    } );

};

var getHallsRoute = function ( req, res, next ) {

    HallModel
        .find( {} )
        .limit( 1000 )
        .sort( { _id: -1 } )
        .exec( function ( err, docs ) {

            if ( err ) return next( new restify.InternalError( "Mongo find: " + err.message ) );

            res.send( 200, docs );
            return next();

        } );

};

var createHallRoute = function ( req, res, next ) {

    var newHallDocument = new HallModel({
        name: req.params.name
    });

    newHallDocument.save( function ( err, doc ) {

        if ( err ) return next( new restify.InternalError( "Mongo write: " + err.message ) );

        res.send( 200, doc );
        return next();

    } );

};

var deleteHallRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id: " + err.message ) );
    }

    HallModel
        .findOne( { _id: id } )
        .exec( function ( err, doc ) {

            if ( err ) return next( new restify.InternalError( "Mongo find: " + err.message ) );

            if ( !doc ) return next( new restify.ResourceNotFoundError( "Can't find hall with such id" ) );

            doc.remove( function ( err ) {

                if ( err ) return next( new restify.InternalError( "Mongo remove: " + err.message ) );

                res.send( 200, 'Hall was deleted!' );
                return next();

            } );

        } );

};

var putHallRoute = function ( req, res, next ) {

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

    HallModel
        .findOne( { _id: id } )
        .exec( function ( err, hall ) {

            if ( err ) return next( err );

            if ( ! hall ) return next( new restify.ResourceNotFoundError( "Can't find hall with such id" ) );

            // start merging changes

            Object.merge( hall, req.body );

            hall.increment();
            hall.save( function ( err, hall ) {

                if ( err ) return next( err );
                res.send( 200, hall );
                return next();

            } );

        } );

};

module.exports.getOneHallRoute = getOneHallRoute;
module.exports.getHallsRoute = getHallsRoute;
module.exports.createHallRoute = createHallRoute;
module.exports.deleteHallRoute = deleteHallRoute;
module.exports.putHallRoute = putHallRoute;
