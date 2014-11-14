// AccountGroup

var is = require('../../libs/mini-funcs.js').is;
var restify = require('restify');
var AccountGroupModel = require('./account-group-model.js').AccountGroupModel;
var async = require('async');

module.exports = {

    /**
     * Create an AccountGroup
     * @param data mixed {name:string} or {name:string, perms:object}
     * @param next callback (err, doc)
     * @returns {*}
     */
    create: function ( data, next ) {
        if ( is(data).not.object || !data )
            return next( new restify.InvalidArgumentError('data argument is not object') );

        if ( is(data.name).not.string || !data.name )
            return next( new restify.InvalidArgumentError('data.name argument is not string') );

        if ( data.perms ){

            // We can don't pass perms. It will be AccountGroup without any perms

            if ( is(data.perms).not.object )
                return next( new restify.InvalidArgumentError('data.perms is not object') );

        } else {

            // If we didn't passed any perms

            data.perms = {}; // Make it empty, because Model says: "perms are required"
        }


        async.series(
            [
                // Check for an AccountGroup with the same name
                function ( callback ) {

                    AccountGroupModel.findOne(
                        {name: data.name},
                        function (err, doc) {
                            if (err) return next(err);

                            // If we didn't find any AccountGroups with the same name
                            if (!doc) {
                                callback();
                            } else {
                                return next( new restify.InvalidArgumentError('AccountGroup with the same name is already exists') );
                            }
                        }
                    )

                },

                // Now, let's create a new AccountGroup
                function () {

                    AccountGroupModel.create(
                        {
                            // Generate data object again to avoid injections
                            name: data.name,
                            perms: data.perms,
                            deleted: false
                        },
                        function (err, doc) {
                            if (err) return next(err);

                            next(null, doc);
                        }
                    );


                }
            ]
        );


    },


    Model: AccountGroupModel
};