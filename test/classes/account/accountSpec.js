/**
 * Created by Сергей on 12.12.2014.
 */

var should = require( 'should' );
var mongoose = require( 'mongoose' );
var async = require( 'async' );
var passwordHash = require( 'password-hash' );
var mf = require( '../../../libs/mini-funcs.js' );

var Account = require( '../../../classes/account/account.js' );
var AccountModel = require( '../../../classes/account/account-model.js' );

var AccountGroup = require( '../../../classes/account-group/account-group.js' );
var AccountGroupModel = require( '../../../classes/account-group/account-group-model.js' );


var cleanUp = {
    Accounts: function ( next ) {

        AccountModel.find().remove().exec( function ( err ) {
            should.not.exist( err );
            next();
        } );

    },

    AccountGroups: function ( next ) {

        AccountGroupModel.find().remove().exec( function ( err ) {
            should.not.exist( err );
            next();
        } );

    },

    full: function ( next ) {

        async.series(
            [
                this.Accounts,
                this.AccountGroups
            ],
            function ( err ) {
                should.not.exist( err );
                next();
            }
        );
    }
};

var theNewAccount, theNewAccountGroup;

describe( 'Account class', function () {

    // clean up database
    before( function ( done ) {

        mongoose.connect('mongodb://localhost/test', {}, function(err) {
            should.not.exist( err );

            cleanUp.full( function () {
                done();
            } );
        });

    } );

    describe( '.create', function () {

        it( 'should create Account with correct params' );

        it( 'should not create Account with incorrect params types' );

        it( 'should not create Account without some of the required params' );

        it( 'should not create Account with the same name twice' );

        it( 'should not create Account with nonexistent AccountGroup' );

    } );

    describe( '.getOne', function () {

        it( 'should find Account by id, name, token, AccountGroup' );

        it( 'should not find nonexistent Account' );

        it( 'should not find removed Account' );

        it( 'should call error when we trying to find Account by password or individualPerms' );

    } );

    describe( '.get', function () {

        it( 'should find one Account by id, name, token' );

        it( 'should find more than one Account by AccountGroup' );

        it( 'should not find nonexistent Account' );

        it( 'should not find removed Account' );

        it( 'should call error when we trying to find Account by password or individualPerms' );

    } );

    describe( '.update', function () {

        it( 'should not update Account.id' );

        it( 'should update Account.name' );

        it( 'should update Account.password' );

        it( 'should update Account.individualPerms' );

        it( 'should not update Account.perms' );

        it( 'should update Account.group' );

    } );


    describe( '.remove', function() {

        it( 'should remove Account and mark them as deleted: true' );

        it( 'should not remove already removed Account' );

    } );

    describe( '.auth', function () {

        it( 'should auth Account and return Account object with token property' );

        it( 'should not auth with incorrect password' );

        it( 'should not auth nonexistent Account' );

        it( 'should auth twice and return two different tokens' );

    } );


    describe( '.logout', function () {

        it( 'should logout one session' );

        it( 'should logout all current sessions' );

        it( 'should not logout nonexistent session' );

    } );



} );
