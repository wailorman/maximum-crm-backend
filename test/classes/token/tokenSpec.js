var Token = require('../../../classes/token/token.js');
var async = require('async');

describe('Token class testing', function () {

    var exampleTokenString = "08GRZAABr59xBwuR9bpx6HO9";

    it('should construct new Token', function (done) {
        var newToken = new Token(exampleTokenString);
        newToken.should.be.instanceof(Token);
        done();
    });

    it('should validate constructed token', function (done) {
        var newToken = new Token(exampleTokenString);
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
                token.isValid().should.eql(false);
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