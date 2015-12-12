var moment = require('moment');
var Observable = require('./observable');
var Post = function Post(obj){
	var self = Observable();
	var title = null;
	Object.defineProperty(this, 'title', {
		get: function(){return title;}
		, set: function(v){
			var old = title;
			self.changed('title', old, v);
			title = v;
		}
		, enumerable: true
	});

	var content = null;
	Object.defineProperty(this, 'content', {
		get: function(){return content;}
		, set: function(v){
			var old = content;
			self.changed('content', old, v);
			content = v;
		}
		, enumerable: true
	});

	var author = null;
	Object.defineProperty(this, 'author', {
		get: function(){return author;}
		, set: function(v){
			var old = author;
			self.changed('author', old, v);
			author = v;
		}
		, enumerable: true
	});

	var published = null;
	Object.defineProperty(this, 'published', {
		get: function(){return published;}
		, set: function(v){
			var old = published;
			self.changed('published', old, v);
			published = v;
		}
		, enumerable: true
	});

	var slug = null;
	Object.defineProperty(this, 'slug', {
		get: function(){return title !== null ? title.toLowerCase().replace(/[^0-9a-zA-Z]+/ig, '-') : null;}
		, enumerable: true
	});

	var time = (new Date()).getTime();
	Object.defineProperty(this, 'time', {
		get: function(){return time;}
		, set: function(v){
			var old = time;
			self.changed('time', old, v);
			time = v;
		}
		, enumerable: true
	});
	for(var key in obj){
		this[key] = obj[key];
	}
	return this;
};
function byDate(a, b){
	if(a.time === b.time) return 0;
	if(a.time > b.time) return -1;
	return 1;
}
Post.prototype = {
	humanFriendlyDate: function(date){
		return moment(date).format("dddd, MMMM DD, YYYY");
	}
	, w3cFormat: function(date){
		return moment.utc(date).format();
	}
	, excerpt: function(length){
		var excerpt = String(this.content).replace(/<\/?[^>]+>/gi, '');
	    excerpt = excerpt.replace(/(\r\n|\n|\r)+/gm, ' ');
		var words = excerpt.split(' ');
		while(words.length > length) words.pop();
		return words.join(' ') + ' ... ';
	}
};
Post.sortByDate = function(list){
	return list.sort(byDate);
};

module.exports = Post;
