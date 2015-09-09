let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let User = require('../models/user')
let util = require('util')
let crypto = require('crypto')

let SALT = 'CodePathHeartNodeJS'

module.exports = (app) => {
    let passport = app.passport

    passport.serializeUser(nodeifyit(async (user) => user._id))
    passport.deserializeUser(nodeifyit(async (id) => {
        return await User.promise.findById(id)
    }))

    passport.use(new LocalStrategy({
        usernameField: 'email',
        failureFlash: true
    }, nodeifyit(async (email, password) => {
        console.log('start authenticate')
        email = email.toLowerCase()
        let user
        if (email.indexOf('@') > 0) {
            user = await User.promise.findOne({email})
        } else {
            let regexp = new RegExp(email, 'i')
            user = await User.promise.findOne({
                username: {$regex: regexp}
            })
        }

        if (!user) {
            return [false, {message: 'User could not be found'}]
        }

        let passwordHash = await crypto.promise.pbkdf2(password, SALT, 4096, 512, 'sha256')
        if (passwordHash.toString('hex') != user.password) {
            return [false, {message: 'Invalid password'}]
        }

        console.log('authenticated!')
        return user
    }, {spread: true})))


    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        failureFlash: true,
        passReqToCallback: true
    }, nodeifyit(async (req, email, password) => {
        console.log('starting signup')
        email = (email || '').toLowerCase()
        // Is the username taken?
        if (await User.promise.findOne({email})) {
            return [false, {message: 'That email is already taken.'}]
        }

        let {username, title, description} = req.body
        let regexp = new RegExp(username, 'i')
        let query = {username: {$regex: regexp}}
        if (await User.promise.findOne(query)) {
            return [false, {message: 'That username is already taken.'}]
        }

        // create the user
        let user = new User()
        user.username = username
        user.email = email
        user.blogTitle = title
        user.blogDescription = description
        user.password = password

        try {
            return await user.save()
        } catch (e) {
            console.log(util.inspect(e))
            return [false, {message: e.message}]
        }
    }, {spread: true})))
}
