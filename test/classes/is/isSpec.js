//var is = require('../../../libs/mini-funcs.js').is;
//var ObjectId = require('mongoose').Types.ObjectId;
var should = require('should');
var async = require('async');

var miniFuncs = require('../../../libs/mini-funcs.js');
var isObjectId = miniFuncs.isObjectId;
var isToken = miniFuncs.isToken;

describe('IS - variable validator testing', function () {

    describe('ObjectId detecting', function () {

        it('should detect ObjectId', function (done) {
            isObjectId('5468eed1c81075901cd18d32').should.eql(true);

            done();
        });

        it('should not detect ObjectId', function (done) {
            isObjectId().should.eql(false);
            isObjectId({}).should.eql(false);
            isObjectId(true).should.eql(false);
            isObjectId('  s  ').should.eql(false);
            isObjectId('12345').should.eql(false);
            isObjectId(function(){}).should.eql(false);
            isObjectId('08GRZAABr59xBwuR9bpx6HO9').should.eql(false);

            done();
        });

    });

    describe('Token detecting', function () {

        it('should detect token', function (done) {
            isToken('08GRZAABr59xBwuR9bpx6HO9').should.eql(true);

            done();
        });

        it('should not detect token', function (done) {

            isObjectId().should.eql(false);
            isObjectId({}).should.eql(false);
            isObjectId(true).should.eql(false);
            isObjectId('  s  ').should.eql(false);
            isObjectId('12345').should.eql(false);
            isObjectId(function(){}).should.eql(false);

            done();

        });

    });

});