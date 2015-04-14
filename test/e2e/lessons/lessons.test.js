var should      = require( 'should' ),
    sugar       = require( 'sugar' ),
    async       = require( 'async' ),
    restify     = require( 'restify' ),
    mongoose    = require( 'mongoose' ),
    LessonModel = require( '../../../models/lesson.js' );

var restifyClient = restify.createJsonClient( {
    url: 'http://localhost:21080/',
    version: '*'
} );

var tpls = {

    /**
     *
     * @param params
     * @param expectedData
     * @param expectingError
     * @param done
     * @param callback
     */
    post: function ( params, expectedData, expectingError, done, callback ) {

        restifyClient.post( '/lessons', params, function ( err, req, res, data ) {

            if ( expectingError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );

            Object.each( expectedData, function ( key, value ) {

                data[ key ].should.eql( value );

            } );

            if ( callback ) callback( err, req, res, data );
            else done();

        } );

    },

    /**
     *
     * @param expectedIds
     * @param expectingError
     * @param done
     * @param callback
     */
    get: function ( expectedIds, expectingError, done, callback ) {

        restifyClient.get( '/lessons', function ( err, req, res, data ) {

            if ( expectingError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );


            /** {Array} data */
            data.each( function ( value, key ) {

                value._id.should.eql( expectedIds[ key ] );

            } );

            if ( callback ) callback( err, req, res, data );
            else done();

        } );

    },

    /**
     *
     * @param id
     * @param expectedData
     * @param expectingError
     * @param done
     * @param callback
     */
    getOne: function ( id, expectedData, expectingError, done, callback ) {

        restifyClient.get( '/lessons/' + id, function ( err, req, res, data ) {

            if ( expectingError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );

            data._id.should.eql( id );

            Object.each( expectedData, function ( key, value ) {

                data[ key ].should.eql( value );

            } );

            if ( callback ) callback( err, req, res, data );
            else done();

        } );

    },

    /**
     *
     * @param id
     * @param params
     * @param expectedData
     * @param expectingError
     * @param done
     * @param callback
     */
    put: function ( id, params, expectedData, expectingError, done, callback ) {

        restifyClient.put( '/lessons/' + id, params, function ( err, req, res, data ) {

            if ( expectingError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );

            Object.each( expectedData, function ( key, value ) {

                data[ key ].should.eql( value );

            } );

            if ( callback ) callback( err, req, res, data );
            else done();

        } );

    },

    /**
     *
     * @param id
     * @param expectingError
     * @param done
     * @param callback
     */
    del: function ( id, expectingError, done, callback ) {

        restifyClient.del( '/lessons/' + id, function ( err, req, res, data ) {

            if ( expectingError ) {
                should.exist( err );
                done();
            }

            should.not.exist( err );

            if ( callback ) callback( err, req, res, data );
            else done();

        } );

    }

};

var cleanUp = function ( done ) {

    async.series( [

        // check [ and establish ] mongoose connection
        function ( scb ) {

            if ( !mongoose.connection.readyState ) {
                mongoose.connect( 'mongodb://localhost/maximum-crm', {}, function ( err ) {
                    if ( err ) return scb( err );
                    scb();
                } );
            } else scb();

        },

        // cleanup collection
        function ( scb ) {
            LessonModel.find().remove().exec( scb );
        }

    ], done );

};

var coachIdsForTesting = [],
    groupIdsForTesting = [],
    hallIdsForTesting  = [];

describe( 'E2E Lessons', function () {

    // cleanup
    before( function ( done ) {
        cleanUp( done );
    } );

    after( function ( done ) {
        cleanUp( done );
    } );

    // pre-create groups, coaches and halls
    before( function ( done ) {

        async.parallel( [

            // coaches
            function ( pcb ) {

                async.times( 3, function ( n, tcb ) {

                    restifyClient.post( '/coaches',
                        {
                            name: "The Coach " + n
                        },
                        function ( err, req, res, data ) {

                            should.not.exist( err );
                            coachIdsForTesting.add( data._id );
                            tcb();

                        }
                    );

                }, pcb );

            },

            // groups
            function ( pcb ) {

                async.times( 3, function ( n, tcb ) {

                    restifyClient.post( '/groups',
                        {
                            name: "The Group " + n
                        },
                        function ( err, req, res, data ) {

                            should.not.exist( err );
                            groupIdsForTesting.add( data._id );
                            tcb();

                        }
                    );

                }, pcb );

            },

            // halls
            function ( pcb ) {

                async.times( 3, function ( n, tcb ) {

                    restifyClient.post( '/halls',
                        {
                            name: "The Hall " + n
                        },
                        function ( err, req, res, data ) {

                            should.not.exist( err );
                            hallIdsForTesting.add( data._id );
                            tcb();

                        }
                    );

                }, pcb );

            }

        ], done );

    } );


    var createdLessons = [];

    it( 'should return error if pass empty data', function ( done ) {

        tpls.post(
            {},
            {},
            true,
            done
        );

    } );

    it( 'should return error if time was not passed', function ( done ) {

        tpls.post(
            {
                groups: [ groupIdsForTesting[ 0 ] ],
                coaches: [ coachIdsForTesting[ 0 ] ],
                halls: [ hallIdsForTesting[ 0 ] ]
            },
            {},
            true,
            done
        );

    } );

    it( 'should create lesson with full data', function ( done ) {

        tpls.post(
            {
                groups: [ groupIdsForTesting[ 0 ], groupIdsForTesting[ 1 ] ],
                coaches: [ coachIdsForTesting[ 0 ], coachIdsForTesting[ 1 ] ],
                halls: [ hallIdsForTesting[ 0 ], hallIdsForTesting[ 1 ] ],
                time: {
                    start: (new Date( "2015-02-19" )).toISOString(),
                    end: (new Date( (new Date( "2015-02-19" )).setHours( 10 ) ) ).toISOString()
                }
            },
            {
                groups: [ groupIdsForTesting[ 0 ], groupIdsForTesting[ 1 ] ],
                coaches: [ coachIdsForTesting[ 0 ], coachIdsForTesting[ 1 ] ],
                halls: [ hallIdsForTesting[ 0 ], hallIdsForTesting[ 1 ] ],
                time: {
                    start: (new Date( "2015-02-19" )).toISOString(),
                    end: (new Date( (new Date( "2015-02-19" )).setHours( 10 ) ) ).toISOString()
                }
            },
            false,
            null,
            function ( err, req, res, data ) {
                createdLessons[ 0 ] = data._id;
                done();
            }
        );

    } );

    it( 'should create lesson with full data e.g. halls', function ( done ) {

        tpls.post(
            {
                groups: [ groupIdsForTesting[ 0 ], groupIdsForTesting[ 1 ] ],
                coaches: [ coachIdsForTesting[ 0 ], coachIdsForTesting[ 1 ] ],
                time: {
                    start: (new Date( "2015-02-19" )).toISOString(),
                    end: (new Date( (new Date( "2015-02-19" )).setHours( 10 ) ) ).toISOString()
                }
            },
            {
                groups: [ groupIdsForTesting[ 0 ], groupIdsForTesting[ 1 ] ],
                coaches: [ coachIdsForTesting[ 0 ], coachIdsForTesting[ 1 ] ],
                time: {
                    start: (new Date( "2015-02-19" )).toISOString(),
                    end: (new Date( (new Date( "2015-02-19" )).setHours( 10 ) ) ).toISOString()
                }
            },
            false,
            null,
            function ( err, req, res, data ) {
                createdLessons[ 1 ] = data._id;
                done();
            }
        );

    } );

    it( 'should not create lesson with invalid time', function ( done ) {

        tpls.post(
            {
                groups: [ groupIdsForTesting[ 0 ], groupIdsForTesting[ 1 ] ],
                coaches: [ coachIdsForTesting[ 0 ], coachIdsForTesting[ 1 ] ],
                halls: [ hallIdsForTesting[ 0 ], hallIdsForTesting[ 1 ] ],
                time: {
                    start: (new Date( new Date( "2015-02-19" ).setHours( 10 ) )).toISOString(),
                    end: (new Date( "2015-02-19" ) ).toISOString()
                }
            },
            {},
            true,
            done
        );

    } );

    it( 'should get one lesson', function ( done ) {

        tpls.getOne(
            createdLessons[ 0 ],
            {
                _id: createdLessons[ 0 ],
                groups: [ groupIdsForTesting[ 0 ], groupIdsForTesting[ 1 ] ],
                coaches: [ coachIdsForTesting[ 0 ], coachIdsForTesting[ 1 ] ],
                halls: [ hallIdsForTesting[ 0 ], hallIdsForTesting[ 1 ] ],
                time: {
                    start: (new Date( "2015-02-19" )).toISOString(),
                    end: (new Date( (new Date( "2015-02-19" )).setHours( 10 ) )).toISOString()
                }
            },
            false,
            done
        );

    } );

    it( 'should get all created lessons', function ( done ) {

        tpls.get(
            [ createdLessons[ 0 ], createdLessons[ 1 ] ],
            false,
            done
        );

    } );

    it( 'should update lesson data', function ( done ) {

        tpls.put(
            createdLessons[ 0 ],
            {
                groups: [ groupIdsForTesting[ 0 ] ],
                coaches: [ coachIdsForTesting[ 0 ] ],
                halls: [ hallIdsForTesting[ 0 ] ],
                time: {
                    start: (new Date( "2015-02-20" )).toISOString(),
                    end: (new Date( (new Date( "2015-02-20" )).setHours( 10 ) )).toISOString()
                }
            },
            {
                _id: createdLessons[ 0 ],
                groups: [ groupIdsForTesting[ 0 ] ],
                coaches: [ coachIdsForTesting[ 0 ] ],
                halls: [ hallIdsForTesting[ 0 ] ],
                time: {
                    start: (new Date( "2015-02-20" )).toISOString(),
                    end: (new Date( (new Date( "2015-02-20" )).setHours( 10 ) ) ).toISOString()
                }
            },
            false,
            done
        );

    } );

    it( 'should remove halls', function ( done ) {

        tpls.put(
            createdLessons[ 0 ],
            {
                groups: [ groupIdsForTesting[ 0 ] ],
                coaches: [ coachIdsForTesting[ 0 ] ],
                time: {
                    start: new Date( "2015-02-20" ),
                    end: (new Date( "2015-02-20" )).setHours( 10 )
                }
            },
            {
                _id: createdLessons[ 0 ],
                groups: [ groupIdsForTesting[ 0 ] ],
                coaches: [ coachIdsForTesting[ 0 ] ],
                time: {
                    start: (new Date( "2015-02-20" )).toISOString(),
                    end: (new Date( (new Date( "2015-02-20" )).setHours( 10 ) ) ).toISOString()
                }
            },
            false,
            done
        );

    } );

    it( 'should not remove groups & coaches', function ( done ) {

        tpls.put(
            createdLessons[ 0 ],
            {
                time: {
                    start: new Date( "2015-02-20" ),
                    end: (new Date( "2015-02-20" )).setHours( 10 )
                }
            },
            {},
            true,
            done
        );

    } );

    it( 'should not set invalid time', function ( done ) {

        tpls.put(
            createdLessons[ 0 ],
            {
                groups: [ groupIdsForTesting[ 0 ] ],
                coaches: [ coachIdsForTesting[ 0 ] ],
                time: {
                    start: new Date( "2015-02-20" ).setHours( 10 ),
                    end: (new Date( "2015-02-20" ))
                }
            },
            {},
            true,
            done
        );

    } );

    it( 'should return 404 when trying to update nonexistent lesson', function ( done ) {

        tpls.put(
            "0000000000000000000005a0",
            {},
            {},
            true,
            done
        );

    } );

    it( 'should delete lesson #0 & #1', function ( done ) {

        async.parallel( [

            function ( pcb ) {
                tpls.del( createdLessons[ 0 ], false, pcb );
            },

            function ( pcb ) {
                tpls.del( createdLessons[ 1 ], false, pcb );
            }

        ], done );

    } );

    it( 'should not delete nonexistent lesson', function ( done ) {

        tpls.del( createdLessons[ 1 ], true, done );

    } );

    it( 'should not get nonexistent lesson', function ( done ) {

        tpls.getOne( createdLessons[ 1 ], {}, true, done );

    } );

    it( 'should return 200 on getAll when no lessons', function ( done ) {

        tpls.get(
            [],
            false,
            null,
            function ( err, req, res, data ) {

                res.statusCode.should.eql( 200 );
                done();

            } );

    } );

} );