var should     = require( 'should' ),
    sugar      = require( 'sugar' ),
    async      = require( 'async' ),
    restify    = require( 'restify' ),
    mongoose   = require( 'mongoose' ),
    HallModel = require( '../../../models/hall.js' );

var restifyClient = restify.createJsonClient( {
    url: 'http://localhost:21080/',
    version: '*'
} );

var postedIds = {};

var tpls = {

    /**
     *
     * @param {object} params
     * @param {boolean} expectingError
     * @param done
     */
    post: function ( params, expectingError, done ) {

        restifyClient.post( '/halls', params, function ( err, req, res, data ) {

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

            done();

        } );

    },

    /**
     *
     * @param {string} id
     * @param {string} expectedName
     * @param {boolean} expectingError
     * @param done
     */
    getOne: function ( id, expectedName, expectingError, done ) {

        restifyClient.get( '/halls/' + id, function ( err, req, res, data ) {

            if ( expectingError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );
            should.exist( data );

            data._id.should.eql( id );
            data.name.should.eql( expectedName );

            done();

        } );

    },

    /**
     *
     * @param {Array} expectedNames
     * @param {boolean} expectingError
     * @param done
     */
    get: function ( expectedNames, expectingError, done ) {

        restifyClient.get( '/halls', function ( err, req, res, data ) {

            if ( expectingError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );
            should.exist( data );

            expectedNames.each( function ( expectedName, index ) {

                data[ index ].name.should.eql( expectedName );

            } );

            done();

        } );

    },

    /**
     *
     * @param {string} id
     * @param {boolean} expectingError
     * @param done
     */
    del: function ( id, expectingError, done ) {

        restifyClient.del( '/halls/' + id, function ( err, req, res, data ) {

            if ( expectingError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );
            should.exist( data );

            data.should.eql( 'Hall was deleted!' );

            done();

        } );

    },

    put: function ( id, newData, expectingError, done ) {

        var documentToEdit, putResult, mergeResult,

            url = '/halls/' + id;

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

        ], done );

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
            HallModel.find().remove().exec( scb );
        }

    ], done );
};

describe( 'E2E Halls', function () {

    before( function ( done ) {
        cleanUp( done );
    } );

    after( function ( done ) {
        cleanUp( done );
    } );

    it( '0. should return error if empty params in post', function ( done ) {

        tpls.post( {}, true, done );

    } );

    it( '1. should post hall #1', function ( done ) {

        tpls.post(
            { name: 'Hall 1' },
            false,
            done
        );

    } );

    it( '2. should get hall #1', function ( done ) {

        tpls.getOne(
            postedIds[ 'Hall 1' ],
            'Hall 1',
            false,
            done
        );

    } );

    it( '3. should post hall #2', function ( done ) {

        tpls.post(
            { name: 'Hall 2' },
            false,
            done
        );

    } );

    it( '4. should get hall #2', function ( done ) {

        tpls.getOne(
            postedIds[ 'Hall 2' ],
            'Hall 2',
            false,
            done
        );

    } );

    it( '5. should get all halls and return #1 & #2', function ( done ) {

        tpls.get(
            [ 'Hall 2', 'Hall 1' ],
            false,
            done
        );

    } );

    it( '6. should delete hall #1', function ( done ) {

        tpls.del(
            postedIds[ 'Hall 1' ],
            false,
            done
        );

    } );

    it( '7. should not get hall #1', function ( done ) {

        tpls.getOne(
            postedIds[ 'Hall 1' ],
            '',
            true,
            done
        );

    } );

    it( '8. should not delete hall #1', function ( done ) {

        tpls.del(
            postedIds[ 'Hall 1' ],
            true,
            done
        );

    } );

    it( '9. should get all halls and return #2', function ( done ) {

        tpls.get(
            [ 'Hall 2' ],
            false,
            done
        );

    } );

    it( '9.1. should change name of #2', function ( done ) {

        tpls.put(
            postedIds[ 'Hall 2' ],
            {
                name: 'New Hall 2'
            },
            false,
            done
        );

    } );

    it( '9.2. should not remove name', function ( done ) {

        tpls.put(
            postedIds[ 'Hall 2' ],
            {
                name: null
            },
            true,
            done
        );

    } );

    it( '10. should delete #2', function ( done ) {

        tpls.del(
            postedIds[ 'Hall 2' ],
            false,
            done
        );

    } );

    it( '11. should get all halls and return 404', function ( done ) {

        tpls.get(
            [],
            true,
            done
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