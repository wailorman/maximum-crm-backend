var restify     = require( 'restify' ),
    mongoose    = require( 'mongoose' ),
    async       = require( 'async' ),
    sugar       = require( 'sugar' ),
    ObjectId    = mongoose.Types.ObjectId,

    GroupModel  = require( '../../models/group.js' ),
    ClientModel = require( '../../models/client.js' );

// @todo /groups/:id/members

// @todo periodicity
// @todo study cost

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

            res.send( 200, docs );
            return next();

        } );

};

var createGroupRoute = function ( req, res, next ) {

    var newGroupDocument = new GroupModel( {
        name: req.params.name
    } );

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

            var groupIdToRemove = req.params.id;

            async.series(
                [
                    // Find Clients consists in this Group
                    function ( scb ) {

                        ClientModel.find( { consists: doc._id }, function ( err, docs ) {

                            if ( err ) return scb( new restify.InternalError( "Mongo find clients consists this group: " + err ) );

                            if ( !docs ) return scb();

                            async.each(
                                docs,
                                function ( client, ecb ) {
                                    /** @namespace client.$save */
                                    client.consists.remove( groupIdToRemove );
                                    client.save( function ( err ) {
                                        if ( err ) return ecb( new restify.InternalError( "Mongo save consists: " + err ) );
                                        ecb();
                                    } );
                                },
                                scb
                            );

                        } );

                    },

                    // Remove Group
                    function ( scb ) {

                        doc.remove( function ( err ) {

                            if ( err ) return scb( new restify.InternalError( "Mongo remove: " + err ) );

                            res.send( 200, 'Group was deleted!' );
                            return scb();

                        } );

                    }
                ],
                next
            );

        } );

};

var putGroupRoute = function ( req, res, next ) {
    /** @namespace req.body.__v */


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

    GroupModel
        .findOne( { _id: id } )
        .exec( function ( err, group ) {

            if ( err ) return next( err );

            if ( !group ) return next( new restify.ResourceNotFoundError( "Can't find group with such id" ) );

            // start merging changes

            Object.merge( group, req.body );

            group.increment();
            group.save( function ( err, group ) {

                if ( err ) return next( err );
                res.send( 200, group );
                return next();

            } );

        } );

};

module.exports.getOneGroupRoute = getOneGroupRoute;
module.exports.getGroupsRoute = getGroupsRoute;
module.exports.createGroupRoute = createGroupRoute;
module.exports.deleteGroupRoute = deleteGroupRoute;
module.exports.putGroupRoute = putGroupRoute;
