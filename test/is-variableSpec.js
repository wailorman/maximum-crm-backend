var is = require('../libs/mini-funcs.js').is;
var ObjectId = require('mongoose').Types.ObjectId;

describe('Testing is() statements', function () {
    it('should detect stringObjectId', function (done) {
        var variable = '545f4581209a4af013cace0f';
        var isVariable = is(variable);

        isVariable.stringObjectId.should.eql(true);
        isVariable.string.should.eql(true);

        //isVariable.ObjectId.should.eql(false);
        isVariable.stringNumber.should.eql(false);
        isVariable.Date.should.eql(false);
        isVariable.null.should.eql(false);
        isVariable.object.should.eql(false);
        isVariable.boolean.should.eql(false);
        isVariable.undefined.should.eql(false);
        isVariable.number.should.eql(false);

        is('545f4581209a4af013cace').stringObjectId.should.eql(false); // 22 (not 24 as usual) bit hex
        is('54').stringObjectId.should.eql(false);
        is('some string').stringObjectId.should.eql(false);
        is({}).stringObjectId.should.eql(false);
        is(null).stringObjectId.should.eql(false);
        is(true).stringObjectId.should.eql(false);
        is(50).stringObjectId.should.eql(false);


        done();
    });

    it('should detect stringNumber', function (done) {
        var variable = '54505';
        var isVariable = is(variable);

        isVariable.stringNumber.should.eql(true);
        isVariable.string.should.eql(true);

        isVariable.Date.should.eql(false);
        isVariable.null.should.eql(false);
        isVariable.object.should.eql(false);
        isVariable.boolean.should.eql(false);
        isVariable.undefined.should.eql(false);
        isVariable.number.should.eql(false);

        is('545f4581209a4af013cace0f').stringNumber.should.eql(false);
        is('aa').stringNumber.should.eql(false);
        is(123).stringNumber.should.eql(false);
        is({}).stringNumber.should.eql(false);
        is(false).stringNumber.should.eql(false);
        is(null).stringNumber.should.eql(false);
        is().stringNumber.should.eql(false);

        done();

    });

    it('should detect Date', function (done) {
        var variable = new Date();
        var isVariable = is(variable);

        isVariable.Date.should.eql(true);
        isVariable.object.should.eql(true);

        isVariable.null.should.eql(false);
        isVariable.undefined.should.eql(false);
        isVariable.boolean.should.eql(false);
        isVariable.number.should.eql(false);
        isVariable.string.should.eql(false);

        is('545f4581209a4af013cace0f').Date.should.eql(false);
        is('aa').Date.should.eql(false);
        is(123).Date.should.eql(false);
        is({}).Date.should.eql(false);
        is(false).Date.should.eql(false);
        is(null).Date.should.eql(false);
        is().Date.should.eql(false);

        done();
    });

    it('should detect null', function (done) {
        var variable = null;
        var isVariable = is(variable);

        isVariable.null.should.eql(true);

        isVariable.string.should.eql(false);
        isVariable.Date.should.eql(false);
        isVariable.object.should.eql(false);
        isVariable.undefined.should.eql(false);
        isVariable.boolean.should.eql(false);
        isVariable.number.should.eql(false);

        is('545f4581209a4af013cace0f').null.should.eql(false);
        is('aa').null.should.eql(false);
        is(123).null.should.eql(false);
        is(false).null.should.eql(false);
        is().null.should.eql(false);

        done();
    });

    it('should detect object', function (done) {
        var variable = {foo: 'bar'};
        var isVariable = is(variable);

        isVariable.object.should.eql(true);

        isVariable.string.should.eql(false);
        isVariable.Date.should.eql(false);
        isVariable.null.should.eql(false);
        isVariable.undefined.should.eql(false);
        isVariable.boolean.should.eql(false);
        isVariable.number.should.eql(false);

        is('545f4581209a4af013cace0f').object.should.eql(false);
        is('aa').object.should.eql(false);
        is(123).object.should.eql(false);
        is(false).object.should.eql(false);
        is(null).object.should.eql(false);
        is().object.should.eql(false);

        done();
    });

    it('should detect undefined', function (done) {
        var variable;
        var isVariable = is(variable);

        isVariable.undefined.should.eql(true);

        isVariable.string.should.eql(false);
        isVariable.Date.should.eql(false);
        isVariable.null.should.eql(false);
        isVariable.object.should.eql(false);
        isVariable.boolean.should.eql(false);
        isVariable.number.should.eql(false);

        is('545f4581209a4af013cace0f').undefined.should.eql(false);
        is('aa').undefined.should.eql(false);
        is(123).undefined.should.eql(false);
        is(false).undefined.should.eql(false);
        is({}).undefined.should.eql(false);
        is(null).undefined.should.eql(false);

        done();
    });

    it('should detect string', function (done) {

        var variable = "some string";
        var isVariable = is(variable);

        isVariable.string.should.eql(true);

        isVariable.Date.should.eql(false);
        isVariable.null.should.eql(false);
        isVariable.object.should.eql(false);
        isVariable.boolean.should.eql(false);
        isVariable.number.should.eql(false);

        is(123).string.should.eql(false);
        is(false).string.should.eql(false);
        is({}).string.should.eql(false);
        is({foo: 'bar'}).string.should.eql(false);
        is(null).string.should.eql(false);

        done();
    });

    it('should detect number', function (done) {
        var variable = 123;
        var isVariable = is(variable);

        isVariable.number.should.eql(true);

        isVariable.string.should.eql(false);
        isVariable.Date.should.eql(false);
        isVariable.null.should.eql(false);
        isVariable.object.should.eql(false);
        isVariable.boolean.should.eql(false);
        isVariable.undefined.should.eql(false);

        done();
    });
});