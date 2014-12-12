should = require 'should'
mongoose = require 'mongoose'
async = require 'async'
passwordHash = require 'password-hash'
mf = require '../../../libs/mini-funcs.js';

Account = require '../../../classes/account/account.js';
AccountModel = require '../../../classes/account/account-model.js'

AccountGroup = require '../../../classes/account-group/account-group.js'
AccountGroupModel = require '../../../classes/account-group/account-group-model.js'

theNewAccount = theNewAccountGroup = null


cleanUpAccounts = (next) ->
    AccountModel.find().remove().exec (err) ->
        next(err) if err
        next();


cleanUpAccountGroups = (next) ->
    AccountGroupModel.find().remove().exec (err) ->
        next(err) if err
        next();


createTheNewAccountGroup = (next) ->
    theNewAccountGroup = new AccountGroup();

    theNewAccountGroup.create(
        {
            name: 'some-group'
            perms: {
                hall: {
                    create: true
                }
            }
        },
        (err, newGroup) ->
            next(err) if err
            theNewAccount = newGroup;
            next();
    )

cleanUpDb = (next) ->
    async.series [
            (scb) ->
                cleanUpAccounts(scb)

            (scb) ->
                cleanUpAccountGroups(scb)

            (scb) ->
                createTheNewAccountGroup(scb)
        ],
        (err) ->
            next err if err


describe 'Account class testing', ->


    # Remove old docs and create new test Account and AccountGroup
    before (done) ->
        mongoose.connect 'mongodb://localhost/test', null, (err) ->
            should.not.exist err

            cleanUpDb (err) ->
                should.not.exist err
                done()


    describe '.create', ->
        it 'should create Account', (done) ->
            async.eachSeries [
                    {
                        name : 'some-name'
                        password : '1234'
                        group : theNewAccountGroup
                        individualPerms : {}
                    },
                    {
                        name : 'some-name2'
                        password : '1234'
                        individualPerms : {}
                    },
                    {
                        name : 'some-name'
                        password : '1234'
                        group : theNewAccountGroup
                    }
                ],
                (validData, escb) ->




            theNewAccount = Account.create(
                {
                    name: 'some-name'
                    password: '1234'
                    group: theNewAccountGroup
                    individualPerms: {}
                },
                (err) ->
                    should.not.exist err;
                    done();
            )

        it 'should not create Account with invalid params', (done) ->
            theNewAccount = Account.create(
                {
                    name: 'some-name'
                    password: '1234'
                    group: theNewAccountGroup
                    individualPerms: {}
                },
                (err) ->
                    should.not.exist err
                    done()
            )


#some comment