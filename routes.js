let then = require('express-then')
let fs = require('fs')
let multiparty = require('multiparty')
let Post = require('./models/post')
let DataUri = require('datauri')

require('songbird')

function isLoggedIn(req, res, next) {
    console.log('isLoggedIn ? ')
    if (req.isAuthenticated()) return next()
    res.redirect('/')
}

module.exports = (app) => {
    let passport = app.passport

    app.get('/', (req, res) => {
        res.render('index.ejs')
    })

    app.get('/login', (req, res) => {
        res.render('login.ejs', {message: req.flash('error')})
    })

    app.post('/login', passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }))

    app.get('/signup', (req, res) => {
        res.render('signup.ejs', {message: req.flash('error')})
    })

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true
    }))

    app.get('/profile', isLoggedIn, then (async (req, res) => {
        let userId = req.user._id
        console.log('userId = ' + userId)
        let posts = await Post.promise.find({userId: userId})
        console.log('number of posts', posts.length)
        let dataUri = new DataUri
        let postImages = []
        for (var i=0; i < posts.length; i++) {
            let post = posts[i]
            let image = dataUri.format('.'+post.image.contentType.split('/').pop(), post.image.data)
            postImages.push(`data:${post.image.contentType};base64,${image.base64}`)
        }

        res.render('profile.ejs', {
            user: req.user,
            posts: posts,
            postImages: postImages
        })
    }))

    app.get('/post/:postId?', isLoggedIn, then (async (req, res) => {
        let postId = req.params.postId
        if (!postId) {
            res.render('post.ejs', {
                post: {},
                verb: 'Create'
            })
            return
        }

        let post = await Post.promise.findById(postId)
        if (!post) res.send(404, 'Not Found')

        let dataUri = new DataUri
        let image = dataUri.format('.'+post.image.contentType.split('/').pop(), post.image.data)

        res.render('post.ejs', {
            post: post,
            verb: 'Edit',
            image: `data:${post.image.contentType};base64,${image.base64}`
        })
        return
    }))

    app.post('/post/:postId?', isLoggedIn, then (async (req, res) => {
        let postId = req.params.postId
        // parse the file
        let [{title: [title], content: [content]}, {image: [file]}] = await new multiparty.Form().promise.parse(req)
        let date = new Date
        console.log(date)
        let post

        if (!postId) {
            post = new Post()
            post.image.data = await fs.promise.readFile(file.path)
            post.image.contentType = file.headers['content-type']
            post.createdAt = date
        } else {
            // edit
            post = await Post.promise.findById(postId)
            if (!post) res.send(404, 'Not Found')
        }

        post.title = title
        post.content = content
        post.userId = req.user._id
        post.lastUpdated = date

        await post.save()
        res.redirect('/profile')
        return
    }))

    app.get('/post_delete/:postId?', isLoggedIn, then (async (req, res) => {
        let postId = req.params.postId
        if (!postId) {
            res.send(500, 'post ID is needed for deletion');
            return
        }

        let post = await Post.promise.findById(postId)
        if (!post) res.send(404, 'Not Found')

        await post.remove();
        res.redirect('/profile');
        return;
    }));

    app.get('/logout', function(req, res){
        req.logout();
        res.redirect('/');
    })
}
