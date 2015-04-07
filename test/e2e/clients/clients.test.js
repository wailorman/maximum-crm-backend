var should      = require( 'should' ),
    sugar       = require( 'sugar' ),
    async       = require( 'async' ),
    restify     = require( 'restify' ),
    mongoose    = require( 'mongoose' ),
    ClientModel = require( '../../../models/client.js' );

var restifyClient = restify.createJsonClient( {
    url:     'http://localhost:21080/',
    version: '*'
} );

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

        restifyClient.post( '/clients', params, function ( err, req, res, data ) {

            if ( expectingError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );
            should.exist( data );

            should.exist( data._id );
            should.exist( data.name );

            data.name.should.eql( params.name );

            postedIds[ params.name ] = data._id;

            if ( callback ) callback( err, req, res, data );
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

        restifyClient.get( '/clients/' + id, function ( err, req, res, data ) {

            if ( expectingError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );
            should.exist( data );

            data._id.should.eql( id );
            data.name.should.eql( expectedName );

            if ( callback ) callback( err, req, res, data );
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

        restifyClient.get( '/clients', function ( err, req, res, data ) {

            if ( expectingError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );
            should.exist( data );

            expectedNames.each( function ( expectedName, index ) {

                data[ index ].name.should.eql( expectedName );

            } );

            if ( callback ) callback( err, req, res, data );
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

        restifyClient.del( '/clients/' + id, function ( err, req, res, data ) {

            if ( expectingError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );
            should.exist( data );

            data.should.eql( 'Client was deleted!' );

            if ( callback ) callback( err, req, res, data );
            else done();

        } );

    },

    put: function ( id, newData, expectingError, done, callback ) {

        var documentToEdit, putResult, mergeResult, callbackParams = {},

            url = '/clients/' + id;

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

                    if ( expectingError ) {
                        should.exist( err );
                        done();
                    } else {
                        should.not.exist( err );
                    }

                    putResult = data;

                    Object.each( data, function ( field ) {

                        if ( field != '_id' && field != '__v' ) {
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

                        if ( field != '_id' && field != '__v' ) {
                            data[ field ].should.eql( mergeResult[ field ] );
                        }

                    } );

                    scb();

                } );

            }

        ], function ( err ) {

            if ( callback ) callback( callbackParams.err, callbackParams.req, callbackParams.res, callbackParams.data );
            else done( err );

        } );

    }

};

var cleanUp = function ( done ) {

    async.series( [

        // check [ and establish ] mongoose connection
        function ( scb ) {

            if ( !mongoose.connection.readyState ) {
                mongoose.connect( 'mongodb://mongo.local/maximum-crm', {}, function ( err ) {
                    if ( err ) return scb( err );
                    scb();
                } );
            } else scb();

        },

        // cleanup collection
        function ( scb ) {
            ClientModel.find().remove().exec( scb );
        }

    ], done );
};

describe( 'E2E Clients', function () {

    before( function ( done ) {
        cleanUp( done );
    } );

    after( function ( done ) {
        cleanUp( done );
    } );

    it( '0. should return error if empty params in post', function ( done ) {

        tpls.post( {}, true, done );

    } );

    it( '1. should post client #1', function ( done ) {

        tpls.post(
            { name: 'Client 1' },
            false,
            done
        );

    } );

    it( '2. should get client #1', function ( done ) {

        tpls.getOne(
            postedIds[ 'Client 1' ],
            'Client 1',
            false,
            done
        );

    } );

    it( '3. should post client #2', function ( done ) {

        tpls.post(
            { name: 'Client 2' },
            false,
            done
        );

    } );

    it( '4. should get client #2', function ( done ) {

        tpls.getOne(
            postedIds[ 'Client 2' ],
            'Client 2',
            false,
            done
        );

    } );

    it( '5. should get all clients and return #1 & #2', function ( done ) {

        tpls.get(
            [ 'Client 2', 'Client 1' ],
            false,
            done
        );

    } );

    it( '6. should delete client #1', function ( done ) {

        tpls.del(
            postedIds[ 'Client 1' ],
            false,
            done
        );

    } );

    it( '7. should not get client #1', function ( done ) {

        tpls.getOne(
            postedIds[ 'Client 1' ],
            '',
            true,
            done
        );

    } );

    it( '8. should not delete client #1', function ( done ) {

        tpls.del(
            postedIds[ 'Client 1' ],
            true,
            done
        );

    } );

    it( '9. should get all clients and return #2', function ( done ) {

        tpls.get(
            [ 'Client 2' ],
            false,
            done
        );

    } );

    it( '9.1. should change name of #2', function ( done ) {

        tpls.put(
            postedIds[ 'Client 2' ],
            {
                name: 'New Client 2'
            },
            false,
            done
        );

    } );

    it( '9.2. should not remove name', function ( done ) {

        tpls.put(
            postedIds[ 'Client 2' ],
            {
                name: null
            },
            true,
            done
        );

    } );

    it( '10. should delete #2', function ( done ) {

        tpls.del(
            postedIds[ 'Client 2' ],
            false,
            done
        );

    } );

    it( '11. should get all clients and return 200', function ( done ) {

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

    it( '12. should return error when passing to getOne empty id', function ( done ) {

        tpls.getOne(
            '',
            'no name!',
            true,
            done
        );

    } );

    describe( 'consists field', function () {

        var groupsForTesting = [];
        var clientForTesting;

        // create groups for testing
        before( function ( done ) {

            async.times( 2, function ( n, tcb ) {

                restifyClient.post(
                    '/groups',
                    { name: 'Test Group ' + n },
                    function ( err, req, res, data ) {

                        should.not.exist( err );
                        groupsForTesting.add( data );
                        tcb();

                    }
                );

            }, done );

        } );

        it( 'should post client with consists field', function ( done ) {

            restifyClient.post(
                '/clients',
                {
                    name:     'Test Client',
                    consists: [ groupsForTesting[ 0 ]._id, groupsForTesting[ 1 ]._id ]
                },
                function ( err, req, res, data ) {

                    should.not.exist( err );

                    clientForTesting = data._id;
                    data.consists.should.eql( [ groupsForTesting[ 0 ]._id, groupsForTesting[ 1 ]._id ] );

                    done();

                }
            );

        } );

        it( 'should remove consists field', function ( done ) {

            restifyClient.put(
                '/clients/' + clientForTesting,
                {
                    consists: null
                },
                function ( err, req, res, data ) {

                    should.not.exist( err );
                    should.not.exist( data.consists );

                    done();

                }
            );

        } );

        it( 'should add consists field', function ( done ) {

            restifyClient.put(
                '/clients/' + clientForTesting,
                {
                    consists: [ groupsForTesting[ 0 ]._id ]
                },
                function ( err, req, res, data ) {

                    should.not.exist( err );

                    data.consists.should.eql( [ groupsForTesting[ 0 ]._id ] );

                    done();

                }
            );

        } );

        it( 'should return error after passing nonexistent group', function ( done ) {

            restifyClient.put(
                '/clients/' + clientForTesting,
                {
                    consists: [ '00000000000000000000005a' ]
                },
                function ( err, req, res, data ) {

                    should.exist( err );

                    //err.should.match( /(00000000000000000000005a)/igm );

                    done();

                }
            );

        } );

        it( 'should return error when consists is not an array', function ( done ) {

            restifyClient.put(
                '/clients/' + clientForTesting,
                {
                    consists: groupsForTesting[ 0 ]._id
                },
                function ( err, req, res, data ) {

                    should.exist( err );

                    //err.should.match( /(00000000000000000000005a)/igm );

                    done();

                }
            );

        } );

    } );


} );