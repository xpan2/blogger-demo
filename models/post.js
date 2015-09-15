let mongoose = require('mongoose')

let PostSchema = mongoose.Schema({
    username: String,
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