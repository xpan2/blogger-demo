let mongoose = require('mongoose')
require('songbird')

let PostSchema = mongoose.Schema({
    userId: String,
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        data: Buffer,
        contentType: String
    },
    createdAt: Date,
    lastUpdated: Date
})

module.exports = mongoose.model('Post', PostSchema)