// AccountGroup

var is = require('../libs/mini-funcs.js').is;
var restify = require('restify');

module.exports = {
    create: function ( data, next ) {
        if ( is(data).not.object || !data )
            return next( new restify.InvalidArgumentError('data argument is not object') );

        if ( is(data.name).not.string || !data )
            return next( new restify.InvalidArgumentError('data.name argument is not string') );

        if ( data.perms ){ // we can don't pass perms. It will be AccountGroup without any perms
            if ( is(data.perms).not.object )
                return next( new restify.InvalidArgumentError('data.perms is not object') );
        } else {
            
        }
    }
};