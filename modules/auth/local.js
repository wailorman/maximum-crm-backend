var restify       = require( 'restify' ),
    mongoose      = require( 'mongoose' ),
    async         = require( 'async' ),
    sugar         = require( 'sugar' ),

    AccountModel  = require( '../../models/account.js' );

var authRoute = function ( req, res, next ) {

    AccountModel.auth( req.params.username, req.params.password, function ( err, token ) {

        if ( err ) return next( err );

        res.send( 200, { token: token } );
        next();

    } );

};

var registerRoute = function ( req, res, next ) {

    AccountModel.register( req.params.username, req.params.password, function ( err ) {

        if ( err ) return next( err );

        res.send( 200, 'Successful register!' );
        next();

    } );

};

var findAccountByTokenRoute = function ( req, res, next ) {

    if ( !req.params.query || req.params.query == 'null' ) return next( new restify.InvalidArgumentError( 'query can not be empty' ) );
    if ( typeof req.params.query != 'string' ) return next( new restify.InvalidArgumentError( 'query must be string' ) );
    if ( req.params.query.length != 20 ) return next();

    AccountModel.findByToken( req.params.query, function ( err, account ) {

        if ( err ) return next( err );

        res.send( 200, account );
        next();

    } );

};


module.exports.authRoute = authRoute;
module.exports.registerRoute = registerRoute;
module.exports.findAccountByTokenRoute = findAccountByTokenRoute;