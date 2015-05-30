var restify = require( 'restify' ),
    server = restify.createServer(),
    mongoose = require( 'mongoose' ),
    localAuth = require( './modules/auth/local.js' ),
    coachesModule = require( './modules/coaches/coaches.js' ),
    clientsModule = require( './modules/clients/clients.js' ),
    hallsModule = require( './modules/halls/halls.js' ),
    groupsModule = require( './modules/groups/groups.js' ),
    lessonsModule = require( './modules/lessons/lessons.js' );


/** @namespace process.env.MONGO_HOST */
/** @namespace process.env.MONGO_DBNAME */
/** @namespace process.env.APP_PORT */
var mongoHost = process.env.MONGO_HOST || 'localhost',
    mongoDb = process.env.MONGO_DBNAME || 'maximum-crm',
    appPort = process.env.APP_PORT || 21080,
    dbURI = 'mongodb://' + mongoHost + '/' + mongoDb;


mongoose.connect( dbURI );

mongoose.connection.on( 'connected', function () {
    console.log( 'Mongoose connected to ' + dbURI );
} );

// If the connection throws an error
mongoose.connection.on( 'error', function ( err ) {
    console.log( 'Mongoose connection error: ' + err );
} );

// When the connection is disconnected
mongoose.connection.on( 'disconnected', function () {
    console.log( 'Mongoose connection disconnected' );
} );


server.use( restify.queryParser() );
server.use( restify.bodyParser() );
server.use( restify.fullResponse() );


server.use( function ( req, res, next ) {

    res.charSet( 'UTF-8' );
    return next();

} );

server.get( '/accounts/:query', localAuth.findAccountByTokenRoute );
server.get( '/accounts/:username/token', localAuth.authRoute );
server.post( '/accounts', localAuth.registerRoute );

server.get( '/coaches', coachesModule.getCoachesRoute );
server.get( '/coaches/:id', coachesModule.getOneCoachRoute );
server.post( '/coaches', coachesModule.createCoachRoute );
server.del( '/coaches/:id', coachesModule.deleteCoachRoute );
server.put( '/coaches/:id', coachesModule.putCoachRoute );

server.get( '/clients', clientsModule.getClientsRoute );
server.get( '/clients/:id', clientsModule.getOneClientRoute );
server.post( '/clients', clientsModule.createClientRoute );
server.del( '/clients/:id', clientsModule.deleteClientRoute );
server.put( '/clients/:id', clientsModule.putClientRoute );

server.get( '/groups', groupsModule.getGroupsRoute );
server.get( '/groups/:id', groupsModule.getOneGroupRoute );
server.post( '/groups', groupsModule.createGroupRoute );
server.del( '/groups/:id', groupsModule.deleteGroupRoute );
server.put( '/groups/:id', groupsModule.putGroupRoute );

server.get( '/halls', hallsModule.getHallsRoute );
server.get( '/halls/:id', hallsModule.getOneHallRoute );
server.post( '/halls', hallsModule.createHallRoute );
server.del( '/halls/:id', hallsModule.deleteHallRoute );
server.put( '/halls/:id', hallsModule.putHallRoute );

server.get( '/lessons/', lessonsModule.getLessonsRoute );
server.get( '/lessons/:id', lessonsModule.getOneLessonRoute );
server.post( '/lessons', lessonsModule.createLessonRoute );
server.del( '/lessons/:id', lessonsModule.deleteLessonRoute );
server.put( '/lessons/:id', lessonsModule.updateLessonRoute );


function unknownMethodHandler( req, res ) {
    if (req.method.toLowerCase() === 'options') {
        console.log( 'received an options method request' );
        var allowHeaders = [
            'Accept',
            'Accept-Version',
            'Content-Type',
            'Api-Version',
            'Origin',
            'X-Requested-With'
        ];

        if (res.methods.indexOf( 'OPTIONS' ) === -1) res.methods.push( 'OPTIONS' );
        if (res.methods.indexOf( 'DELETE' ) === -1) res.methods.push( 'DELETE' );

        res.header( 'Access-Control-Allow-Credentials', true );
        res.header( 'Access-Control-Allow-Headers', allowHeaders.join( ', ' ) );
        res.header( 'Access-Control-Allow-Methods', res.methods.join( ', ' ) );
        res.header( 'Access-Control-Allow-Origin', req.headers.origin );

        return res.send( 200 );
    }
    else
        return res.send( new restify.MethodNotAllowedError() );
}

server.on( 'MethodNotAllowed', unknownMethodHandler );


server.listen( appPort, function () {
    console.log( 'Maximum CRM REST API server started on port ' + appPort );
} );


