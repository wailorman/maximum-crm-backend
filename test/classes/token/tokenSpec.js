var Token = require('../../../classes/token/token.js');
var async = require('async');
var should = require('should');

var newToken;

describe('Token class testing', function () {

    var exampleTokenString = "08GRZAABr59xBwuR9bpx6HO9";

    it('should construct new Token', function (done) {
        newToken = new Token(exampleTokenString);
        newToken.should.be.instanceof(Token);
        done();
    });

    it('should validate constructed token', function (done) {
        newToken = new Token(exampleTokenString);
        newToken.isValid().should.eql(true);
        done();
    });

    it('should not validate constructed token', function (done) {
        async.eachSeries(
            [
                'lol string',
                {str: 'not string!'},
                '08GRZAABr59xBw',
                '',
                true
            ],
            function( token, eachSeriesCallback ) {
                newToken = new Token(token);
                newToken.isValid().should.eql(false);
                eachSeriesCallback();
            },
            function(err) {
                should.not.exist(err);
                done();
            }
        );
    });

    it('should return string', function(done) {
        var newToken = new Token(exampleTokenString);
        newToken.toString().should.eql(exampleTokenString);
        done();
    });


});