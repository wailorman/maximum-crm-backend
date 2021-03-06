var should = require( 'should' ),
    sugar = require( 'sugar' ),
    async = require( 'async' ),
    restify = require( 'restify' ),
    mongoose = require( 'mongoose' ),
    CoachModel = require( '../../../models/coach.js' ),
    testConfig = require( '../config.js' ),
    restifyClient = testConfig.connectToApp();

var postedIds = {};

var tpls = {

    /**
     *
     * @param {object} params
     * @param {boolean} expectingError
     * @param done
     * @param callback
     */
    post: function ( params, expectingError, done, callback ) {

        restifyClient.post( '/coaches', params, function ( err, req, res, data ) {

            if (expectingError) {
                should.exist( err );
                return done();
            } else
                should.not.exist( err );

            should.exist( data );

            should.exist( data._id );
            should.exist( data.name );

            data.name.should.eql( params.name );

            postedIds[ params.name ] = data._id;

            if (callback) callback( err, req, res, data );
            else done();

        } );

    },

    /**
     *
     * @param {string} id
     * @param {string} expectedName
     * @param {boolean} expectingError
     * @param done
     * @param callback
     */
    getOne: function ( id, expectedName, expectingError, done, callback ) {

        restifyClient.get( '/coaches/' + id, function ( err, req, res, data ) {

            if (expectingError) {
                should.exist( err );
                return done();
            } else
                should.not.exist( err );

            should.exist( data );

            data._id.should.eql( id );
            data.name.should.eql( expectedName );

            if (callback) callback( err, req, res, data );
            else done();

        } );

    },

    /**
     *
     * @param {Array} expectedNames
     * @param {boolean} expectingError
     * @param done
     * @param callback
     */
    get: function ( expectedNames, expectingError, done, callback ) {

        restifyClient.get( '/coaches', function ( err, req, res, data ) {

            if (expectingError) {
                should.exist( err );
                return done();
            } else
                should.not.exist( err );

            should.exist( data );

            expectedNames.each( function ( expectedName, index ) {

                data[ index ].name.should.eql( expectedName );

            } );

            if (callback) callback( err, req, res, data );
            else done();

        } );

    },

    /**
     *
     * @param {string} id
     * @param {boolean} expectingError
     * @param done
     * @param callback
     */
    del: function ( id, expectingError, done, callback ) {

        restifyClient.del( '/coaches/' + id, function ( err, req, res, data ) {

            if (expectingError) {
                should.exist( err );
                return done();
            } else
                should.not.exist( err );

            should.exist( data );

            data.should.eql( 'Coach was deleted!' );

            if (callback) callback( err, req, res, data );
            else done();

        } );

    },

    put: function ( id, newData, expectingError, done, callback ) {

        var documentToEdit, putResult, mergeResult, callbackParams = {},

            url = '/coaches/' + id;

        async.series( [

            // get document to edit
            function ( scb ) {

                restifyClient.get( url, function ( err, req, res, data ) {

                    should.not.exist( err );
                    documentToEdit = data;
                    scb();

                } );

            },

            // update document
            function ( scb ) {

                mergeResult = Object.merge(
                    documentToEdit,
                    newData
                );

                restifyClient.put( url, newData, function ( err, req, res, data ) {

                    callbackParams = {
                        err: err,
                        req: req,
                        res: res,
                        data: data
                    };

                    if ( expectingError ){
                        should.exist( err );
                        return done();
                    } else {
                        should.not.exist( err );
                    }

                    putResult = data;

                    Object.each( data, function ( field ) {

                        if ( field != '_id' && field != '__v' ){
                            data[ field ].should.eql( mergeResult[ field ] );
                        }

                    } );

                    scb();

                } );

            },

            // check changes
            function ( scb ) {

                restifyClient.get( url, function ( err, req, res, data ) {

                    should.not.exist( err );

                    Object.each( data, function ( field ) {

                        if (field != '_id' && field != '__v') {
                            data[ field ].should.eql( mergeResult[ field ] );
                        }

                    } );

                    scb();

                } );

            }

        ], function ( err ) {

            if (callback) callback( callbackParams.err, callbackParams.req, callbackParams.res, callbackParams.data );
            else done( err );

        } );

    }

};

var cleanUp = function ( done ) {
    CoachModel.find().remove().exec( done );
};

describe( 'E2E Coaches', function () {

    // connect to mongoose
    before( function ( done ) {
        testConfig.connectToDb( done );
    } );

    // cleanup
    before( function ( done ) {
        cleanUp( done );
    } );

    after( function ( done ) {
        cleanUp( done );
    } );

    it( '0. should return error if empty params in post', function ( done ) {

        tpls.post( {}, true, done );

    } );

    it( '1. should post coach #1', function ( done ) {

        tpls.post(
            { name: 'Coach 1' },
            false,
            done
        );

    } );

    it( '2. should get coach #1', function ( done ) {

        tpls.getOne(
            postedIds[ 'Coach 1' ],
            'Coach 1',
            false,
            done
        );

    } );

    it( '3. should post coach #2', function ( done ) {

        tpls.post(
            { name: 'Coach 2' },
            false,
            done
        );

    } );

    it( '4. should get coach #2', function ( done ) {

        tpls.getOne(
            postedIds[ 'Coach 2' ],
            'Coach 2',
            false,
            done
        );

    } );

    it( '5. should get all coaches and return #1 & #2', function ( done ) {

        tpls.get(
            [ 'Coach 2', 'Coach 1' ],
            false,
            done
        );

    } );

    it( '6. should delete coach #1', function ( done ) {

        tpls.del(
            postedIds[ 'Coach 1' ],
            false,
            done
        );

    } );

    it( '7. should not get coach #1', function ( done ) {

        tpls.getOne(
            postedIds[ 'Coach 1' ],
            '',
            true,
            done
        );

    } );

    it( '8. should not delete coach #1', function ( done ) {

        tpls.del(
            postedIds[ 'Coach 1' ],
            true,
            done
        );

    } );

    it( '9. should get all coaches and return #2', function ( done ) {

        tpls.get(
            [ 'Coach 2' ],
            false,
            done
        );

    } );

    it( '9.1. should change name of #2', function ( done ) {

        tpls.put(
            postedIds[ 'Coach 2' ],
            {
                name: 'New Coach 2'
            },
            false,
            done
        );

    } );

    it( '9.2. should not remove name', function ( done ) {

        tpls.put(
            postedIds[ 'Coach 2' ],
            {
                name: null
            },
            true,
            done
        );

    } );

    it( '10. should delete #2', function ( done ) {

        tpls.del(
            postedIds[ 'Coach 2' ],
            false,
            done
        );

    } );

    it( '11. should get all coaches and return 200', function ( done ) {

        tpls.get(
            [],
            false,
            null,
            function ( err, req, res, data ) {

                res.statusCode.should.eql( 200 );
                done();

            }
        );

    } );

    it( 'should return error when passing to getOne empty id', function ( done ) {

        tpls.getOne(
            '',
            'no name!',
            true,
            done
        );

    } );

} );