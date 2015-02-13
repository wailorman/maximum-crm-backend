var should   = require( 'should' ),
    restify  = require( 'restify' ),
    mongoose = require( 'mongoose' ),
    AccountModel = require('../../../models/account.js');

var restifyClient = restify.createJsonClient( {
    url:     'http://localhost:21080/',
    version: '*'
} );

var cleanUp = function ( done ) {
    mongoose.connect( 'mongodb://mongo.local/maximum-crm', {}, function ( err ) {

        if ( err ) return done( err );

        AccountModel.find().remove().exec( done );

    } );
};

var tpls = {

    /**
     *
     * @param params
     * @param doesShouldReturnError
     * @param done
     */
    register: function ( params, doesShouldReturnError, done ) {

        restifyClient.post( '/accounts', params, function ( err, req, res, data ) {

            if ( doesShouldReturnError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );

            data.should.eql( 'Successful register!' );

            done();

        } );

    },


    /**
     *
     * @param params
     * @param doesShouldReturnError
     * @param done
     */
    auth: function ( params, doesShouldReturnError, done ) {

        restifyClient.get( '/accounts/' + params.username + '/token?password=' + params.password, function ( err, req, res, data ) {

            if ( doesShouldReturnError ) {
                should.exist( err );
                done();
            }

            should.exist( data.token );
            data.token.should.type( 'string' );

            done( data.token );

        } );

    },

    /**
     *
     * @param token
     * @param expectedUsername
     * @param doesShouldReturnError
     * @param done
     */
    getInfoByToken: function ( token, expectedUsername, doesShouldReturnError, done ) {

        restifyClient.get( '/accounts/' + token, function ( err, req, res, data ) {

            if ( doesShouldReturnError ) {
                should.exist( err );
                done();
            }

            data.name.should.eql( expectedUsername );

            done();

        } );

    }

};


describe( 'E2E Accounts', function () {

    before( function ( done ) {
        cleanUp( done );
    } );

    describe( 'register', function () {

        it( 'should register user with unique username and correct password', function ( done ) {

            tpls.register( { username: 'Clerk', password: '1234' }, false, done );

        } );

        it( 'should return error when pass only username', function ( done ) {

            tpls.register( { username: 'Clerk' }, true, done );

        } );

        it( 'should return error when pass only password', function ( done ) {

            tpls.register( { password: '1234' }, true, done );

        } );

        it( 'should return error when trying to register user with engaged name', function ( done ) {

            tpls.register( { username: 'Clerk', password: '1234' }, true, done );

        } );

    } );

    var tokenToUse;

    describe( 'auth', function () {

        it( 'should authenticate user with correct username & password and return token', function ( done ) {

            tpls.auth( { username: 'Clerk', password: '1234' }, false, function ( token ) {

                tokenToUse = token;
                done();

            } );

        } );

        it( 'should not auth only with username', function ( done ) {

            tpls.auth( { username: 'Clerk' }, true, done );

        } );

        it( 'should not auth only with password', function ( done ) {

            tpls.auth( { password: '1234' }, true, done );

        } );

        it( 'should not auth nonexistent account', function ( done ) {

            tpls.auth( { username: 'NoClerk', password: '1234' }, true, done );

        } );

    } );

    describe( 'get account info by token', function () {

        it( 'should return info', function ( done ) {

            tpls.getInfoByToken( tokenToUse, 'Clerk', false, done );

        } );

        it( 'should not return info if no token was passed', function ( done ) {

            tpls.getInfoByToken( null, 'Clerk', true, done );

        } );

        it( 'should not return info if passed nonexistent token', function ( done ) {

            tpls.getInfoByToken( '00000000000000000000', 'Clerk', true, done );

        } );

    } );

} );