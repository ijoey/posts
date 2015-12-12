var express = require('express');
var app = express();
var fs = require('fs');
var rootPath = __dirname.replace('/web', '');
var staticServer = require('serve-static');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var Post = require('../blog/entities/post');
var config = require('../config');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var Datastore = require('nedb');
var membersDbFilePath = config.dataPath + '/members.db';
var signer = require('jws');
var Editor = require(rootPath + '/blog/entities/editor');
var Persistence = require('../boundaries/persistence')(config);
var postPath = __dirname + '/data/posts/';
var DateParser = require('../dateParser');
var Marked = require('marked');

function Resource(obj){
	for(var key in obj) this[key] = obj[key];
}
Resource.prototype = {
	layout: 'default'
	, title: config.site.title
	, js: []
	, css: []
	, header: {}
	, user: null
	, status: {code: 200, description: 'Ok'}
	, posts: []
};
var represent = require('represent').Represent({
	themeRoot: rootPath + '/web/themes/' + config.theme
	, appPath: rootPath + '/web'
});
express.response.represent = require('./withRepresent')(represent, config);

app.use(compression());
app.use("/public", staticServer(represent.themeRoot));
app.set("views", rootPath + "/themes/default/templates");
app.set("view engine", function(view, options, fn){ return fn(view, options);});
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride(function(req, res){
	if(req.body._method) return req.body._method;
	return req.method;
}));
app.use(cookieSession({ keys: [config.cookie.key, ':blah:'], secret: config.cookie.secret}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(member, done) {
	var signature = signer.sign({
		header: {alg: 'HS256'}
		, payload: member.token
		, secret: config.secret
	});
	done(null, signature);
});
passport.deserializeUser(function deserializeUser(token, done) {
	var decodedSignature = signer.decode(token);
	if(!decodedSignature) return done(null, null);
	var db = new Datastore({filename: membersDbFilePath, autoload: true});
	db.findOne({token: decodedSignature.payload}, function(err, member) {
		if(err) console.log(err);
		done(err, member);
	});
});
function handleDatastoreError(err){
	if(err) console.log("An error occurred when manipulating a db file", err);
}
passport.use(new TwitterStrategy({
	consumerKey: config.twitter.consumer.key
	, consumerSecret: config.twitter.consumer.secret
	, callbackURL: config.twitter.callbackUrl
	, passReqToCallback: true
  }
  , function(request, token, tokenSecret, profile, done) {
	  var allowedTwitterUsers = ['ijoeyguerra', 'joseguerra', 'Hubot'];
	  if(allowedTwitterUsers.indexOf(profile.username) === -1) return done(null, null);
	  var db = new Datastore({filename: membersDbFilePath, autoload: true});
	  db.findOne({"token":token}, function(err, member){
			if(err) return done(err);
			if(member) return done(null, member);
			var memberDb = new Datastore({filename: membersDbFilePath, autoload: true});
			var editor = Editor({
				token: token
				, name: profile.displayName
				, avatar: profile._json.profile_background_image_url
				, username: profile.username
			});
			process.nextTick(function(){
				memberDb.insert(editor, function(err, docs){
					if(err) return done(err);
					done(null, docs);
				});
			});
	  });
  }
));

var posts = [];
app.get('/' + config.google.verification + '\.html', function(req, resp){
	resp.represent(200, 'google-site-verification: ' + config.google.verification + '.html');
});
app.get("/robots.txt", function(req, resp, next){
	resp.represent({
		view: 'robots/index'
		, resource: new Resource({
			posts: posts}
		)
		, model: {}});
});
app.get("/humans.txt", function(req, resp, next){
	resp.represent({
		view: 'humans/index'
		, resource: new Resource({
			posts: posts}
		)
		, model: {}});
});
app.get("/sitemap.:format", function(req, resp, next){
	resp.represent({
		view: 'sitemap/index'
		, resource: new Resource({
			posts: posts}
		)
		, model: posts});
});

app.get('/index:format?', function(req, resp, next){
	var post = new Post();
	fs.readFile(__dirname + '/data/index.json', null, function(err, data){
		if(err) console.log(err);
		post = new Post(JSON.parse(data));
		resp.represent({view: 'index/index'
			, resource: new Resource({
				posts: posts
			})
			, model: post});
	});
});
app.get('/', function(req, resp, next){
	var post = null;
	fs.readFile(__dirname + '/data/index.json', null, function(err, data){
		if(err){
			console.log(err);
			return next(404);
		}
		post = new Post(JSON.parse(data));
		resp.represent({view: 'index/index'
		, resource: new Resource({
			title: post.title
			, posts: posts
		})
		, model: post});
	});
});

// authenticated endpoints
app.get(['/posts.:format?', "/post.:format?", "/post/:title"], function(req, resp, next){
	if(!req.isAuthenticated()) return next(401);
	next();
});

app.post("/post.:format?", function(req, resp, next){
	if(!req.isAuthenticated()) return next(401);
	next();
});
app.get('/logout', function(req, resp, next){
	req.logout();
	resp.redirect('/');
});

// twitter auth endpoints
app.get('/auth/twitter\??', passport.authenticate('twitter'));
app.get("/auth/twitter/callback", passport.authenticate('twitter', { successRedirect: '/', failureRedirect: '/' }));

// posts endpoints
app.delete("/posts.:format?", function(req, resp, next){
	var id = req.body._id;
	Persistence.post.findOne({_id: id}, function(err, post){
		if(err) console.log(err);
		if(post && post._id !== null){
			client.send(new Commands.DeletePost(post));
		}
	});
	resp.redirect('/posts');
});

app.get("/posts.:format?", function(req, resp, next){
	var docs = [];
	Persistence.post.find({}, {published: -1}, function(err, docs){
		if(err){
			console.log(err);
			next(500);
		}
		resp.represent({view: 'post/index'
			, resource: new Resource({title: "List of Posts"
			, posts: posts})
			, model: docs});
	});
});
app.get('/posts/:_id.:format?', function(req, resp, next){
	Persistence.post.findOne({_id: req.params._id}, function(err, doc){
		if(err) return next(500);
		if(doc === null) return next(404);
		resp.represent({view: 'post/show'
			, resource: new Resource({title: doc.title, posts: posts, css: ['post'], js: ['post']})
			, model: doc});
	});
});
app.get("/post/:_id.:format?", function getPostById(req, resp, next){
	Persistence.post.findOne({_id: req.params._id}, function(err, doc){
		if(err) return next(500);
		if(doc === null) return next(404);
		resp.represent({view: 'post/edit'
			, resource: new Resource({title: doc.title, posts: posts, css: ['post'], js: ['post']})
			, model: doc});
	});
});
app.get("/post.:format?", function getPostEditForm(req, resp, next){
	resp.represent({view: 'post/edit'
		, resource: new Resource({title: "New Post", posts: posts
			, css: ['post']
			, js: ['post']
		})
		, model: {
			title: ''
			, content: ''
			, author: req.user
			, published: new Date()
		}
	});
});
app.get('/reader.:format?', function(req, resp, next){
	resp.represent({view: 'reader/index'
		, resource: new Resource({
			title: "WillRead"
			, posts: posts
			})
			, model: {}
		});
});

app.put("/post/:_id.:format?", function updatePostById(req, resp, next){
	var postKey = null;
	var post = new Post();
	var id = req.params._id;
	Persistence.post.findOne({_id: id}, function(err, doc){
		if(!doc) return next(404);
		doc.title = req.body.title;
		doc.content = req.body.content;
		doc.author = req.user;
		doc.published = DateParser(req.body.published);
		client.send(new Commands.UpdatePost(doc));
		resp.redirect('/posts');
	});
});

app.post("/post.:format?", function(req, resp, next){
	var post = new Post();
	post.title = req.body.title;
	post.content = req.body.content;
	post.author = req.user;
	post.published = DateParser(req.body.published);
	client.send(new Commands.AddPost(post));
	resp.redirect('/posts');
});

app.get("/:slug.:format?", function (request, response, next){
	var filePath = postPath + request.params.slug + '.json';
	fs.exists(filePath, function(exists){
		if(!exists){
			return next(404);
		}
		fs.readFile(filePath, null, function(err, data){
			if(err){
				console.log(err);
				return next(500);
			}
			post = new Post(JSON.parse(data));
			response.represent({view: 'post/show', resource: new Resource({title: post.title, description: post.excerpt(255), author: post.author.name, posts: posts}), model: post});
		});
	})
});
function HttpStatus(code){
	this.code = code;
	var self = this;
	function messageFromCode(c){
		var message = 'Ok';
		switch(c){
			case(401):
				message = "Unauthorized";
				break;
			case(404):
				message = "Not Found";
				break;
		}
		return message;
	}
	Object.defineProperty(this, 'message', {
		get: function(){
			return messageFromCode(self.code);
		}
		, enumerable: true
	});
}

app.use(function(err, req, res, next){
	res.status(typeof err != 'number' ? 404 : err);
	var status = new HttpStatus(typeof err != 'number' ? 404 : err);
	res.send(status.message);
});
process.argv.forEach(function(value, fileName, args){
	if(/as:/.test(value)) config.runAsUser = /as\:([a-zA-Z-]+)/.exec(value)[1];
	if(/port:/.test(value)) config.port = /port:(\d+)/.exec(value)[1];
});
process.on('exit', function() {
	console.log('web server exited.');
});
process.on('SIGTERM', function(){
	console.log('SIGTERM.');
	process.exit(1);
});
process.on('SIGINT', function(){
	console.log('SIGINT.');
	process.exit(1);
});

var Server = app.listen(config.port, function(){
	console.log('Server started, on port ', Server.address().port);
});

var Commands = require('../blog/commands');
var Events = require('../blog/events');
var Bus = require('../web/bus');
var bus = new Bus.AsA_Subscriber(8125);
var client = new Bus.AsA_Client();
client.request(new PostRequest({published: {"$lt":(new Date()).getTime()}}), function(err, docs){
	console.log('post request replied with ', err, docs ? docs.length : ' docs is null');
});
bus.start();
console.log('starting subscriber');
bus.iSubscribeTo('PostWasUpdated', {host: 'localhost', port: 8124}, {
	update: function(event){
		Persistence.refresh();
		var post = event.body;
		postSyncher();
	}
});
bus.iSubscribeTo('PostWasCreated', {host: 'localhost', port: 8124}, {
	update: function(event){
		Persistence.refresh();
		var post = event.body;
		postSyncher();
	}
});
bus.iSubscribeTo('PostWasDeleted', {host: 'localhost', port: 8124}, {
	update: function(event){
		Persistence.refresh();
		var post = event.body;
		postSyncher();
	}
});
function PostRequest(query){
	this.query = query;
	this.header = {
		id: (new Date()).getTime()
		, endpoint: {port: 8124, host: 'localhost'}
		, token: ''
		, name: 'PostRequest'
	};
	this.type = 'request';
}
function synchMostRecentPost(){
	Persistence.post.findMostRecentlyPublished({published: {"$lt":(new Date()).getTime()}}, function(err, post){
		fs.writeFile(__dirname + '/data/index.json', JSON.stringify(post), function(err){
			if(err) console.log(err);
		});
	});
}
function postSyncher(){
	var files = fs.readdirSync(postPath);
	files.forEach(function(file){
		fs.unlinkSync(postPath + file);
	});
	Persistence.post.findPublished(function(err, docs){
		posts = [];
		docs.forEach(function(doc){
			fs.writeFile(rootPath + '/web/data/posts/' + doc.slug + '.json', JSON.stringify(doc), function(err){
				if(err) console.log(err);
			});
			posts.push(new Post(doc));
		});
		synchMostRecentPost();
	});
}
postSyncher();
