var restify       = require( 'restify' ),
    server        = restify.createServer(),
    mongoose      = require( 'mongoose' ),
    localAuth     = require( './modules/auth/local.js' ),
    coachesModule = require( './modules/coaches/coaches.js' );
    hallsModule = require( './modules/halls/halls.js' );

mongoose.connect( 'mongodb://mongo.local/maximum-crm' );

server.use( restify.queryParser() );
server.use( restify.bodyParser() );
server.use( restify.CORS() );

server.get( '/accounts/:query', localAuth.findAccountByTokenRoute );
server.get( '/accounts/:username/token', localAuth.authRoute );
server.post( '/accounts', localAuth.registerRoute );

server.get( '/coaches', coachesModule.getCoachesRoute );
server.get( '/coaches/:id', coachesModule.getOneCoachRoute );
server.post( '/coaches', coachesModule.createCoachRoute );
server.del( '/coaches/:id', coachesModule.deleteCoachRoute );

server.get( '/halls', hallsModule.getHallsRoute );
server.get( '/halls/:id', hallsModule.getOneHallRoute );
server.post( '/halls', hallsModule.createHallRoute );
server.del( '/halls/:id', hallsModule.deleteHallRoute );

server.listen( 21080, function () {
    console.log( 'Maximum CRM REST API server started on port 21080' );
} );
