var mongoose     = require( 'mongoose' ),
    Schema       = mongoose.Schema,
    ObjectId     = mongoose.Types.ObjectId,
    randToken    = require( 'rand-token' ),
    passwordHash = require( 'password-hash' ),
    restify      = require( 'restify' ),
    async        = require( 'async' );

//// SCHEMAS ///////////////////////////////////////

var accountSchema = new Schema( {

    name: {
        type: String,
        unique: true,
        required: true
    },

    password: {
        type: String,
        required: true
    }

}, {

    collection: 'accounts'

} );

var tokenSchema = new Schema( {

    account: {
        type: Schema.Types.ObjectId,
        required: true
    },

    token: {
        type: String,
        required: true
    }

}, {

    collection: 'tokens'

} );

//// METHODS ///////////////////////////////////////

/**
 * Generate new token for account
 *
 * @param {string|ObjectId} accountId
 * @param cb err, token
 */
tokenSchema.statics.generateNew = function ( accountId, cb ) {

    if ( !accountId ) return cb( new restify.InvalidArgumentError( 'accountId cant be empty' ) );

    var generatedToken;

    if ( !(accountId instanceof ObjectId) ) accountId = new ObjectId( accountId );

    async.series( [

        // check account existent
        function ( scb ) {

            AccountModel.findOne( { _id: accountId }, function ( err, doc ) {

                if ( err ) return scb( new restify.InternalError( 'Mongo find: ' + err.message ) );
                if ( !doc ) return scb( new restify.InvalidArgumentError( 'generate token: Account with such id does not exists' ) );

                scb();

            } );

        },

        // write document
        function ( scb ) {

            generatedToken = randToken.uid( 20 );

            var newTokenDocument = new TokenModel( {
                account: accountId,
                token: generatedToken
            } );

            newTokenDocument.save( function ( err ) {

                if ( err ) return scb( new restify.InternalError( 'Mongo write token: ' + err.message ) );
                scb();

            } );

        }

    ], function ( err ) {

        if ( err ) cb( err );
        cb( null, generatedToken );

    } );

};

/**
 *
 * @param {string} username
 * @param {string} password Not hashed!
 * @param cb err, doc
 */
accountSchema.statics.register = function ( username, password, cb ) {

    if ( !username || !password ) return cb( new restify.InvalidArgumentError( 'username or password can\'t be empty' ) );

    var hashedPassword = passwordHash.generate( password );

    var newAccountDocument = new AccountModel( {
        name: username,
        password: hashedPassword
    } );

    newAccountDocument.save( function ( err, doc ) {

        if ( err ) return cb( new restify.InternalError( 'Mongo write: ' + err.message ) );

        cb( null, doc );

    } );

};

/**
 *
 * @param {string} username
 * @param {string} password
 * @param cb err, token
 * @returns {*}
 */
accountSchema.statics.auth = function ( username, password, cb ) {

    if ( !username || !password ) return cb( new restify.InvalidArgumentError( 'username or password can not be empty' ) );

    AccountModel.findOne( { name: username }, function ( err, doc ) {

        if ( err ) return cb( new restify.InternalError( 'Mongo find: ' + err.message ) );

        if ( !doc ) return cb( new restify.ResourceNotFoundError( 'Cant find account with such username' ) );

        // verifying password

        var isPasswordCorrect = passwordHash.verify( password, doc.password );

        if ( !isPasswordCorrect ) return cb( new restify.InvalidArgumentError( 'password is incorrect' ) );

        TokenModel.generateNew( doc._id, function ( err, token ) {

            if ( err ) return cb( new restify.InternalError( 'token generation: ' + err.message ) );

            cb( null, token );

        } );

    } );

};

accountSchema.statics.findByToken = function ( token, cb ) {

    if ( !token ) return cb( new restify.InvalidArgumentError( 'token missing' ) );

    TokenModel.findOne( { token: token }, function ( err, doc ) {

        if ( err ) return cb( new restify.InternalError( 'Mongo find token: ' + err.message ) );

        if ( !doc ) return cb( new restify.ResourceNotFoundError( 'Cant find account with such token' ) );

        AccountModel.findOne( { _id: new ObjectId( doc.account ) }, function ( err, doc ) {

            if ( err ) return cb( new restify.InternalError( 'Mongo find account: ' + err.message ) );

            cb( null, doc );

        } );

    } );

};

//// MODEL DEFINING ////////////////////////////////

var TokenModel = mongoose.model( 'TokenModel', tokenSchema );
var AccountModel = mongoose.model( 'AccountModel', accountSchema );

module.exports = AccountModel;