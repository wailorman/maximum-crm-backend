var Perms = require('../../../classes/perms/perms.js');
var async = require('async');

describe('Perms class testing', function () {

    var examplePerms = {
        hall: {
            create: true
        }
    };

    it('should construct new Perms', function (done) {
        var newPerms = new Perms(examplePerms);
        newPerms.should.be.instanceof(Perms);
        done();
    });

    it('should validate new Perms', function (done) {

        async.eachSeries(
            [
                examplePerms,
                {},
                null,
                '',
                {
                    hall: {
                        create: null
                    }
                }
            ],
            function (perms, eachSeriesCallback) {
                var newPerms = new Perms(perms);
                newPerms.isValid().should.eql(true);
                eachSeriesCallback();
            },
            function (err) {
                should.not.exist(err);
                done();
            }
        );

        var newPerms = new Perms(examplePerms);
        newPerms.isValid().should.eql(true);
        done();
    });

    it('should not validate new Perms', function (done) {
        async.eachSeries(
            [
                {
                    hall: {
                        create: 'maybe'
                    }
                },
                true,
                'some string',
                {
                    hall: 'first-level string'
                },
                {
                    hall: {
                        create: function(){}
                    }
                }
            ],
            function (perms, eachSeriesCallback) {
                var newPerms = new Perms(perms);
                newPerms.isValid().should.eql(false);
                eachSeriesCallback();
            },
            function (err) {
                should.not.exist(err);
                done();
            }
        );
    });

    it('should return string', function (done) {
        var newPerms = new Perms(examplePerms);
        newPerms.toString().should.eql( JSON.stringify(examplePerms) );
    });

});