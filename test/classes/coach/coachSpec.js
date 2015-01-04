var restify    = require( 'restify' ),
    mongoose   = require( 'mongoose' ),
    async      = require( 'async' ),
    sugar      = require( 'sugar' ),
    mf         = require( '../../../libs/mini-funcs.js' ),
    should     = require( 'sugar' ),


    CoachModel = require( '../../../classes/coach/coach-model.js' ).CoachModel,
    Coach      = require( '../../../classes/coach/coach.js' );


describe( 'Coach class testing', function () {

    describe( '.create()', function () {

        describe( 'should create', function () {

            it( 'with fullname, secondname, patron' );

            it( 'with fullname, secondname, patron, account' );

            it( 'with fullname, account' );

            it( 'with fullname' );

        } );

        it( 'should create with string account' );

        describe( 'should not create with invalid params', function () {

            it( 'no parameters' );

            it( 'secondname, patron, account' );

            it( 'not string fullname' );

            it( 'nonexistent account' );

        } );

    } );

    describe( '.findOne()', function () {

        describe( 'should find', function () {

            it( 'by id' );

            it( 'by names' );

            it( 'by account' );

            it( 'by multiplie filter' );

        } );

        describe( 'should not find', function () {

            it( 'nonexistent Coach' );

            it( 'removed Coach' );

            it( 'by nonexistent Account' );

            it( 'by null filter' );

        } );

        it( 'should find full object' );

    } );

    describe( '.findOneShort()', function () {

        describe( 'should find', function () {

            it( 'by id' );

            it( 'by names' );

            it( 'by account' );

            it( 'by multiplie filter' );

        } );

        describe( 'should not find', function () {

            it( 'nonexistent Coach' );

            it( 'removed Coach' );

            it( 'by nonexistent Account' );

            it( 'by null filter' );

        } );

        it( 'should find short object' );

    } );

    describe( 'Array.findShortCoaches()', function () {

        it( 'should not find any Coaches' );

        it( 'should find all Coaches' );

    } );

    describe( '.update()', function () {

        describe( 'firstname', function () {

            it( 'should not remove' );

            it( 'should edit' );

            it( 'should not update to invalid' );

        } );

        describe( 'secondname', function () {

            it( 'should remove' );

            it( 'should edit' );

            it( 'should not update to invalid' );

        } );

        describe( 'patron', function () {

            it( 'should remove' );

            it( 'should edit' );

            it( 'should not update to invalid' );

        } );

        describe( 'account', function () {

            it( 'should remove' );

            it( 'should edit' );

            it( 'should not update to invalid (nonexistent)' );

        } );

    } );

    describe( '.remove()', function () {

        it( 'should not remove nonexistent Coach' );

        it( 'should not remove already removed Coach' );

        it( 'should remove Coach' );

        it( 'should not find removed Coach' );

        it( 'should mark {deleted: true} deleted Coach' );

    } );

} );