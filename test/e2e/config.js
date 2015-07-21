var mongoose = require( 'mongoose' ),
    restify = require( 'restify' );


/** @namespace process.env.MAXCRM_APP_URI */
module.exports.appUri = process.env.MAXCRM_APP_URI || 'http://localhost:21080/';
module.exports.dbUri = process.env.MAXCRM_DB_URI || 'mongodb://localhost/maximum-crm';
module.exports.connectToDb = function ( next ) {

    if (!mongoose.connection.readyState) {
        mongoose.connect( module.exports.dbUri, {}, function ( err ) {
            if (err) {
                console.log( 'Can\'t connect to mongodb server at ' + module.exports.dbUri );
                console.log( err );
                return next( err );
            }

            return next();
        } );
    } else return next();

};
module.exports.connectToApp = function () {

    return restify.createJsonClient( {
        url: module.exports.appUri,
        version: '*'
    } );

};