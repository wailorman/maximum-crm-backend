var restify     = require( 'restify' ),
    mongoose    = require( 'mongoose' ),
    async       = require( 'async' ),
    sugar       = require( 'sugar' ),
    ObjectId    = mongoose.Types.ObjectId,
    Q = require( 'q' ),

    LessonModel = require( '../../models/lesson.js' ),
    GroupModel = require( '../../models/group.js' ),
    HallModel = require( '../../models/hall.js' ),
    CoachModel = require( '../../models/coach.js' );

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




var getLessonCoachesRoute = function ( req, res, next ) {

    var lessonId = req.params.id;

    getNestedLessonObjectsByIdAndResourceName( lessonId, 'coaches' )
        .then( function ( objects ) {
            res.send( 200, objects );
        }, next );
};

var getLessonHallsRoute = function ( req, res, next ) {

    var lessonId = req.params.id;

    getNestedLessonObjectsByIdAndResourceName( lessonId, 'halls' )
        .then( function ( objects ) {
            res.send( 200, objects );
        }, next );
};

var getLessonGroupsRoute = function ( req, res, next ) {

    var lessonId = req.params.id;

    getNestedLessonObjectsByIdAndResourceName( lessonId, 'groups' )
        .then( function ( objects ) {
            res.send( 200, objects );
        }, next );
};




var getNestedLessonObjectsByIdAndResourceName = function ( lessonId, resourceName ) {

    var lessonObjectId,
        deferred = Q.defer();

    try {
        lessonObjectId = new ObjectId( lessonId );
    } catch ( e ) {
        return deferred.reject( new Error( 'Invalid lesson id: ' + e.message ) );
    }

    if ( !resourceName.match( /(coaches|halls|groups)/ ) )
        throw new Error( 'Invalid resourceName: ' + resourceName );

    // getting lesson document
    LessonModel
        .findById( lessonObjectId )
        .exec( function ( err, lessonDocument ) {

            if ( err ) return deferred.reject( err );

            if ( !lessonDocument ) return deferred.reject( new restify.ResourceNotFoundError( 'Can not find lesson with such id' ) );

            getObjectsByDocAndResourceName( lessonDocument, resourceName )
                .then( deferred.resolve, deferred.reject );

        } );

    return deferred.promise;

};

/**
 *
 * @param {Document} document
 * @param {string} resourceName coaches | halls | groups
 *
 * @return {IPromise|*}
 * resolve( docs ) on success
 * reject( {Error}|{ValidationError} )
 */
var getObjectsByDocAndResourceName = function ( document, resourceName ) {

    var convertArrayOfStringIdsToObjectIds = function ( array ) {

        for ( var i = 0; array[i]; i++ ) {

            try {
                array[i] = new ObjectId( array[i] );
            } catch ( e ) {
                throw new Error( '#' + i + ' id of passed is not valid (' + String( array[i] ) + ')' );
            }
        }

        return array;

    };

    var getModelByString = function ( str ) {
        switch ( str ) {
            case 'coaches':
                return CoachModel;
            case 'halls':
                return HallModel;
            case 'groups':
                return GroupModel;
            default:
                throw new Error( 'Invalid resourceName string' );
        }
    };

    var generateMongoQueryByArrayOfIds = function ( arrayOfIds ) {

        var resultObject = { $or: [] };

        arrayOfIds.forEach( function ( id ) {

            resultObject.$or.push( { _id: id } );

        } );

        return resultObject;

    };

    //////////////////////////////////////////////////////////////////////

    var ModelOfNestedResource = getModelByString( resourceName );
    var convertedIds;
    var deferred = Q.defer();

    //////////////////////////////////////////////////////////////////////

    // converting ids to local format
    try {
        convertedIds = convertArrayOfStringIdsToObjectIds( document[resourceName] );
    } catch ( e ) {
        return deferred.reject( e );
    }

    ModelOfNestedResource
        .find( generateMongoQueryByArrayOfIds( convertedIds ) )
        .exec( function ( err, docs ) {

            if ( err ) return deferred.reject( err );

            deferred.resolve( docs );

        } );

    return deferred.promise;

};

var validateData = function ( data, next ) {

    var checkExistent = function ( Model, id, next ) {

        Model.findById( new ObjectId( id ), function ( err, doc ) {

            if ( err ) return next( new restify.InternalError( 'Mongo read: ' + err ) );

            if ( ! doc ) return next( new restify.InvalidArgumentError( "Can't find " + id + " in " + Model.collection ) );

            return next();

        } )

    };

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

            },

            // duplication
            function ( pcb ) {

                var uniqueGroups = Array.create( data.groups ).unique();
                var uniqueCoaches = Array.create( data.coaches ).unique();
                var uniqueHalls = Array.create( data.halls ).unique();

                if ( data.groups && uniqueGroups.length !== data.groups.length )
                    return pcb( new restify.InvalidArgumentError( "Groups duplication" ) );

                if ( data.coaches && uniqueCoaches.length !== data.coaches.length )
                    return pcb( new restify.InvalidArgumentError( "Coaches duplication" ) );

                if ( data.halls && uniqueHalls.length !== data.halls.length )
                    return pcb( new restify.InvalidArgumentError( "Halls duplication" ) );

                pcb();

            },

            // existent. groups
            function ( pcb ) {

                if ( ! data.groups ) return pcb();

                async.each(
                    data.groups,
                    function ( group, ecb ) {
                        checkExistent( GroupModel, group, ecb );
                    },
                    pcb
                );

            },

            // existent. coaches
            function ( pcb ) {

                if ( ! data.coaches ) return pcb();

                async.each(
                    data.coaches,
                    function ( coach, ecb ) {
                        checkExistent( CoachModel, coach, ecb );
                    },
                    pcb
                );

            },

            // existent. halls
            function ( pcb ) {

                if ( ! data.halls ) return pcb();

                async.each(
                    data.halls,
                    function ( hall, ecb ) {
                        checkExistent( HallModel, hall, ecb );
                    },
                    pcb
                );

            }
        ],
        next
    );

};

module.exports.createLessonRoute = createLessonRoute;
module.exports.getOneLessonRoute = getOneLessonRoute;

module.exports.getCoachesByLessonRoute = getLessonCoachesRoute;
module.exports.getHallsByLessonRoute = getLessonHallsRoute;
module.exports.getGroupsByLessonRoute = getLessonGroupsRoute;

module.exports.getLessonsRoute = getLessonsRoute;
module.exports.updateLessonRoute = updateLessonRoute;
module.exports.deleteLessonRoute = deleteLessonRoute;