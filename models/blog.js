let mongoose = require('mongoose');

let BlogSchema = mongoose.Schema({
    postId: String,
    username: String,
    comment: String,
    created: Date
});

module.exports = mongoose.model('Blog', BlogSchema);