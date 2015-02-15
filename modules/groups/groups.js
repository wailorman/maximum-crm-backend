var restify    = require( 'restify' ),
    mongoose   = require( 'mongoose' ),
    async      = require( 'async' ),
    sugar      = require( 'sugar' ),
    ObjectId     = mongoose.Types.ObjectId,

    GroupModel = require( '../../models/group.js' );

var getOneGroupRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id" ) );
    }

    GroupModel.findOne( { _id: new ObjectId( id ) }, function ( err, doc ) {

        if ( err ) return next( new restify.InternalError( 'Mongo find: ' + err.message ) );

        if ( !doc ) return next( new restify.ResourceNotFoundError( "Can't find group with such id" ) );

        res.send( 200, doc );
        return next();

    } );

};

var getGroupsRoute = function ( req, res, next ) {

    GroupModel
        .find( {} )
        .limit( 1000 )
        .sort( { _id: -1 } )
        .exec( function ( err, docs ) {

            if ( err ) return next( new restify.InternalError( "Mongo find: " + err.message ) );

            if ( docs.length == 0 ) return next( new restify.ResourceNotFoundError( "No groups was find" ) );

            res.send( 200, docs );
            return next();

        } );

};

var createGroupRoute = function ( req, res, next ) {

    var newGroupDocument = new GroupModel({
        name: req.params.name
    });

    newGroupDocument.save( function ( err, doc ) {

        if ( err ) return next( new restify.InternalError( "Mongo write: " + err.message ) );

        res.send( 200, doc );
        return next();

    } );

};

var deleteGroupRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id: " + err.message ) );
    }

    GroupModel
        .findOne( { _id: id } )
        .exec( function ( err, doc ) {

            if ( err ) return next( new restify.InternalError( "Mongo find: " + err.message ) );

            if ( !doc ) return next( new restify.ResourceNotFoundError( "Can't find group with such id" ) );

            doc.remove( function ( err ) {

                if ( err ) return next( new restify.InternalError( "Mongo remove: " + err.message ) );

                res.send( 200, 'Group was deleted!' );
                return next();

            } );

        } );

};

module.exports.getOneGroupRoute = getOneGroupRoute;
module.exports.getGroupsRoute = getGroupsRoute;
module.exports.createGroupRoute = createGroupRoute;
module.exports.deleteGroupRoute = deleteGroupRoute;
