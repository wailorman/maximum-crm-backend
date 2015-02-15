var restify    = require( 'restify' ),
    mongoose   = require( 'mongoose' ),
    async      = require( 'async' ),
    sugar      = require( 'sugar' ),
    ObjectId     = mongoose.Types.ObjectId,

    CoachModel = require( '../../models/coach.js' );

var getOneCoachRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id" ) );
    }

    CoachModel.findOne( { _id: new ObjectId( id ) }, function ( err, doc ) {

        if ( err ) return next( new restify.InternalError( 'Mongo find: ' + err.message ) );

        if ( !doc ) return next( new restify.ResourceNotFoundError( "Can't find coach with such id" ) );

        res.send( 200, doc );
        return next();

    } );

};

var getCoachesRoute = function ( req, res, next ) {

    CoachModel
        .find( {} )
        .limit( 1000 )
        .sort( { _id: -1 } )
        .exec( function ( err, docs ) {

            if ( err ) return next( new restify.InternalError( "Mongo find: " + err.message ) );

            if ( docs.length == 0 ) return next( new restify.ResourceNotFoundError( "No coaches was find" ) );

            res.send( 200, docs );
            return next();

        } );

};

var createCoachRoute = function ( req, res, next ) {

    var newCoachDocument = new CoachModel({
        name: req.params.name
    });

    newCoachDocument.save( function ( err, doc ) {

        if ( err ) return next( new restify.InternalError( "Mongo write: " + err.message ) );

        res.send( 200, doc );
        return next();

    } );

};

var deleteCoachRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id: " + err.message ) );
    }

    CoachModel
        .findOne( { _id: id } )
        .exec( function ( err, doc ) {

            if ( err ) return next( new restify.InternalError( "Mongo find: " + err.message ) );

            if ( !doc ) return next( new restify.ResourceNotFoundError( "Can't find coach with such id" ) );

            doc.remove( function ( err ) {

                if ( err ) return next( new restify.InternalError( "Mongo remove: " + err.message ) );

                res.send( 200, 'Coach was deleted!' );
                return next();

            } );

        } );

};

module.exports.getOneCoachRoute = getOneCoachRoute;
module.exports.getCoachesRoute = getCoachesRoute;
module.exports.createCoachRoute = createCoachRoute;
module.exports.deleteCoachRoute = deleteCoachRoute;
