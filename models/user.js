let mongoose = require('mongoose')
let crypto = require('crypto')
let nodeify = require('bluebird-nodeify')

require('songbird')

let SALT = 'CodePathHeartNodeJS'

let UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    blogTitle: String,
    blogDescription: String
})

UserSchema.pre('save', function (callback) {
    nodeify(async() => {
        if (!this.isModified('password')) return callback()
        this.password = (await crypto.promise.pbkdf2(this.password, SALT, 4096, 512, 'sha256')).toString('hex')
    }(), callback)
})

UserSchema.path('password').validate((pw) => {
    return pw.length >= 4 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw)
})

module.exports = mongoose.model('User', UserSchema)