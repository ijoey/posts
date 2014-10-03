var Datastore = require('nedb');
var Post = require('../blog/entities/post');
var config = null;

function replaceLastPost(id, post){
	lastPostDb.remove({}, {multi: true}, function(err, numRemoved){
		if(err) console.log('error replaceLastPost: ', err, id);
	});
	post.postId = id;
	lastPostDb.insert(post, function(err, docs){
		if(err) console.log('error replaceLastPost inserting: ', err, id);
	});
}
var Db = {
	postWasDeleted: function postWasDeleted(id, callback){
		db.remove({_id: id}, {multi:false}, function(err, numRemoved){
			if(callback) callback(err, numRemoved);
		});
		lastPostDb.remove({postId: id}, {multi:false}, function(err, numRemoved){});
	}
	, post:{
		findOne: function findOne(query, callback){
			db.findOne(query, function(err, doc){
				if(err) return callback(err, doc);
				if(!doc) return callback(null, null);
				callback(err, new Post(doc));
			});
		}
		, find: function find(query, sortBy, callback){
			if(sortBy){
				db.find(query).sort(sortBy).exec(function(err, docs){
					if(err) return callback(err, null);
					var list = [];
					for(var i = 0; i < docs.length; i++){
						list.push(new Post(docs[i]));
					}
					callback(null, list);
				});
			}else{
				db.find(query, function(err, docs){
					if(err) return callback(err, null);
					var list = [];
					for(var i = 0; i < docs.length; i++){
						list.push(new Post(docs[i]));
					}
					callback(null, list);
				});
			}
		}
		, findMostRecentlyPublished: function(query, callback){
			db.find(query).sort({published: -1}).limit(1).exec(function(err, docs){
				if(err) return callback(err, null);
				if(docs.length === 0) return callback(null, null);
				callback(null, new Post(docs[0]));
			});
		}
		, findPublished: function(callback){
			db.find({published: {"$lt": (new Date()).getTime()}}).sort({published: -1}).exec(function(err, docs){
				if(err) return callback(err, null);
				var list = [];
				for(var i = 0; i < docs.length; i++){
					list.push(new Post(docs[i]));
				}
				callback(null, list);
			});
		}
	}
	, lastPostWasDeleted: function lastPostWasDeleted(post){
		var post = null;
		db.find({"published <=":(new Date()).getTime()}, function(err, docs){
			if(err) throw err;
			if(docs.length === 0) return;
			var list = [];
			for(var i = 0; i < docs.length; i++){
				list.push(new Post(docs[i]));
			}
			post = posts[0];
			post.postId = post._id;
			lastPostDb.insert(post, function(err, doc){
				if(err) throw err;
			});
		});
	}
	, postWasUpdated: function postWasUpdated(id, post, callback){
		db.update({_id: id}, {title: post.title, content: post.content, author: post.author
			, published: post.published, slug: post.slug, time: (new Date()).getTime()}, function(err, doc){
			if(err) console.log('postWasUpdated: ', id, err, doc);
			if(callback) callback(err, doc);
		});
		if(post.published <= (new Date()).getTime()) replaceLastPost(id, post);
	}
	, newPostWasSubmitted: function newPostWasSubmitted(post, callback){
		db.insert(post, function(err, doc){
			if(err) console.log('newPostWasSubmitted error:', err);
			if(doc.published <= (new Date()).getTime()){
				lastPostDb.remove({}, {multi: true}, function(err, numRemoved){
					doc.postId = doc._id;
					lastPostDb.insert(doc, function(err, docs){
						if(err) console.log('newPostWasSubmitted error inserting last post:', err);
					});
				});
			}
			if(callback) callback(err, doc);
		});
	}
	, getLastPost: function getLastPost(callback){
		lastPostDb.findOne({}, function(err, doc){
			callback(new Post(doc));
		});
	}
	, refresh: function(){
		db.loadDatabase();
		lastPostDb.loadDatabase();
	}
};
var db = null;
var lastPostDb = null;
module.exports = function(c){
	config = c;
	db = new Datastore({filename: config.dataPath + '/posts.db', autoload: true});
	lastPostDb = new Datastore({filename: config.dataPath + '/lastpost.db', autoload: true});
	return Db;
};