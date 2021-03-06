var should = require( 'should' ),
    sugar = require( 'sugar' ),
    async = require( 'async' ),
    restify = require( 'restify' ),
    mongoose = require( 'mongoose' ),
    GroupModel = require( '../../../models/group.js' ),
    testConfig = require( '../config.js' ),
    restifyClient = testConfig.connectToApp();

var postedIds = {};

var tpls = {

    /**
     *
     * @param {object} params
     * @param {boolean} expectingError
     * @param done
     * @param [callback]
     */
    post: function ( params, expectingError, done, callback ) {

        restifyClient.post( '/groups', params, function ( err, req, res, data ) {

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
     * @param [callback]
     */
    getOne: function ( id, expectedName, expectingError, done, callback ) {

        restifyClient.get( '/groups/' + id, function ( err, req, res, data ) {

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
     * @param [callback]
     */
    get: function ( expectedNames, expectingError, done, callback ) {

        restifyClient.get( '/groups', function ( err, req, res, data ) {

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
     * @param [callback]
     */
    del: function ( id, expectingError, done, callback ) {

        restifyClient.del( '/groups/' + id, function ( err, req, res, data ) {

            if (expectingError) {
                should.exist( err );
                return done();
            } else
                should.not.exist( err );

            should.exist( data );

            data.should.eql( 'Group was deleted!' );

            if (callback) callback( err, req, res, data );
            else done();

        } );

    },

    /**
     *
     * @param id
     * @param newData
     * @param expectingError
     * @param done
     * @param [callback]
     */
    put: function ( id, newData, expectingError, done, callback ) {

        var documentToEdit, putResult, mergeResult, callbackParams = {},

            url = '/groups/' + id;

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

                    if (expectingError) {
                        should.exist( err );
                        return done();
                    } else {
                        should.not.exist( err );
                    }

                    putResult = data;

                    Object.each( data, function ( field ) {

                        if (field != '_id' && field != '__v') {
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
    GroupModel.find().remove().exec( done );
};

describe( 'E2E Groups', function () {

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

    it( '1. should post group #1', function ( done ) {

        tpls.post(
            { name: 'Group 1' },
            false,
            done
        );

    } );

    it( '2. should get group #1', function ( done ) {

        tpls.getOne(
            postedIds[ 'Group 1' ],
            'Group 1',
            false,
            done
        );

    } );

    it( '3. should post group #2', function ( done ) {

        tpls.post(
            { name: 'Group 2' },
            false,
            done
        );

    } );

    it( '4. should get group #2', function ( done ) {

        tpls.getOne(
            postedIds[ 'Group 2' ],
            'Group 2',
            false,
            done
        );

    } );

    it( '5. should get all groups and return #1 & #2', function ( done ) {

        tpls.get(
            [ 'Group 2', 'Group 1' ],
            false,
            done
        );

    } );

    it( '6. should delete group #1', function ( done ) {

        tpls.del(
            postedIds[ 'Group 1' ],
            false,
            done
        );

    } );

    it( '7. should not get group #1', function ( done ) {

        tpls.getOne(
            postedIds[ 'Group 1' ],
            '',
            true,
            done
        );

    } );

    it( '8. should not delete group #1', function ( done ) {

        tpls.del(
            postedIds[ 'Group 1' ],
            true,
            done
        );

    } );

    it( '9. should get all groups and return #2', function ( done ) {

        tpls.get(
            [ 'Group 2' ],
            false,
            done
        );

    } );

    it( '9.1. should change name of #2', function ( done ) {

        tpls.put(
            postedIds[ 'Group 2' ],
            {
                name: 'New Group 2'
            },
            false,
            done
        );

    } );

    it( '9.2. should not remove name', function ( done ) {

        tpls.put(
            postedIds[ 'Group 2' ],
            {
                name: null
            },
            true,
            done
        );

    } );

    it( '10. should delete #2', function ( done ) {

        tpls.del(
            postedIds[ 'Group 2' ],
            false,
            done
        );

    } );

    it( '11. should get all groups and return 200', function ( done ) {

        tpls.get(
            [],
            false,
            null,
            function ( err, req, res ) {

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

    describe( 'Cascade remove', function () {

        var cascadeTestGroupsId = [],
            cascadeTestClientId;

        it( 'should create 2 test group', function ( done ) {

            async.times( 2, function ( n, tcb ) {

                restifyClient.post(
                    '/groups',
                    { name: 'Test Consists group ' + n },
                    function ( err, req, res, data ) {

                        should.not.exist( err );

                        cascadeTestGroupsId.push( data._id );

                        tcb();

                    }
                );

            }, done );

        } );

        it( 'should create Client consists in the test group', function ( done ) {

            restifyClient.post(
                '/clients',
                {
                    name: 'Test Consists client',
                    consists: cascadeTestGroupsId
                },
                function ( err, req, res, data ) {

                    should.not.exist( err );
                    data.name.should.eql( 'Test Consists client' );

                    cascadeTestClientId = data._id;

                    done();

                }
            );

        } );

        it( 'should delete first test group', function ( done ) {

            restifyClient.del(
                '/groups/' + cascadeTestGroupsId[ 0 ],
                function ( err ) {

                    should.not.exist( err );
                    done();

                }
            );

        } );

        it( 'client should consists only in second test group', function ( done ) {

            restifyClient.get(
                '/clients/' + cascadeTestClientId,
                function ( err, req, res, data ) {

                    should.not.exist( err );

                    data.consists.should.eql( [ cascadeTestGroupsId[ 1 ] ] );

                    done();

                }
            );

        } );

    } );

} );