var restify   = require( 'restify' ),
    server    = restify.createServer(),
    mongoose  = require( 'mongoose' ),
    localAuth = require( './modules/auth/local.js' );

mongoose.connect( 'mongodb://mongo.local/maximum-crm' );

server.use( restify.queryParser() );
server.use( restify.bodyParser() );
server.use( restify.CORS() );

server.get( '/accounts/:query', localAuth.findAccountByTokenRoute );
server.get( '/accounts/:username/token', localAuth.authRoute );
server.post( '/accounts', localAuth.registerRoute );

server.listen( 21080, function () {
    console.log( 'Maximum CRM REST API server started on port 21080' );
} );
