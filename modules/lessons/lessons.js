var restify     = require( 'restify' ),
    mongoose    = require( 'mongoose' ),
    async       = require( 'async' ),
    sugar       = require( 'sugar' ),
    ObjectId    = mongoose.Types.ObjectId,

    LessonModel = require( '../../models/lesson.js' );

// @todo /lessons/:id/participants

// @todo journal

var createLessonRoute = function ( req, res, next ) {

    var newLesson = new LessonModel();

    newLesson = Object.merge( newLesson, req.body );

    async.series( [

        // validate
        function ( scb ) {
            validateData( req.body, scb );
        },

        // save
        function ( scb ) {

            newLesson.save( function ( err, lesson ) {

                if ( err ) return scb( new restify.InternalError( "Mongo write: " + err ) );

                res.send( 200, lesson );
                scb();

            } );

        }

    ], next );

};

var getOneLessonRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id" ) );
    }

    LessonModel
        .findOne( { _id: req.params.id } )
        .exec( function ( err, lesson ) {

            if ( err ) return next( new restify.InternalError( "Mongo find: " + err ) );

            if ( !lesson ) return next( new restify.ResourceNotFoundError( "Can't find lesson with such id" ) );

            res.send( 200, lesson );
            next();

        } );

};

var getLessonsRoute = function ( req, res, next ) {

    LessonModel
        .find( {} )
        .exec( function ( err, lessons ) {

            if ( err ) return next( new restify.InternalError( "Mongo find: " + err ) );

            res.send( 200, lessons );
            next();

        } );

};

/**
 *
 * @param newData
 * @param document
 */
var updateData = function ( newData, document ) {

    var Model = LessonModel,
        paths = Model.schema.paths;

    Object.each( paths, function ( key ) {

        if ( key != '_id' && key != '__v' ) {

            key = key.split( "." )[ 0 ];

            document[ key ] = newData[ key ];
        }

    } );

    return document;

};

var updateLessonRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id" ) );
    }

    async.series( [

        // @todo Find document before update it

        // validate
        function ( scb ) {
            validateData( req.body, scb );
        },

        // update
        function ( scb ) {

            LessonModel.findOne( { _id: id }, function ( err, lesson ) {

                if ( err ) return scb( new restify.InternalError( "Mongo find: " + err ) );

                if ( !lesson ) return scb( new restify.ResourceNotFoundError( "Can't find lesson with such id" ) );

                lesson = updateData( req.body, lesson );

                lesson.save( function ( err, lesson ) {

                    if ( err ) return scb( new restify.InternalError( "Mongo write: " + err ) );

                    res.send( 200, lesson );
                    scb();

                } );

            } );

        }

    ], next );

};

var deleteLessonRoute = function ( req, res, next ) {

    try {
        var id = new ObjectId( req.params.id );
    }
    catch (e) {
        return next( new restify.InvalidArgumentError( "Invalid id" ) );
    }

    LessonModel
        .findOne( { _id: id } )
        .exec( function ( err, lesson ) {

            if ( err ) return next( new restify.InternalError( "Mongo: " + err ) );

            if ( !lesson ) return next( new restify.ResourceNotFoundError( "Can't find lesson with such id" ) );

            lesson.remove( function ( err ) {

                res.send( 200, "Successfully deleted!" );
                next();

            } );

        } );

};

var validateData = function ( data, next ) {

    async.parallel(
        [
            // time
            function ( pcb ) {

                // @todo Check data.time existent

                data.time.start = new Date( data.time.start );
                data.time.end = new Date( data.time.end );

                if ( !data.time ) return pcb();

                if ( data.time.start.getTime() >= data.time.end.getTime() )
                    return pcb( new restify.InvalidArgumentError( "Invalid lesson time" ) );

                pcb();

            }
        ],
        next
    );

};

module.exports.createLessonRoute = createLessonRoute;
module.exports.getOneLessonRoute = getOneLessonRoute;
module.exports.getLessonsRoute = getLessonsRoute;
module.exports.updateLessonRoute = updateLessonRoute;
module.exports.deleteLessonRoute = deleteLessonRoute;