var Observable = require('./observable');
var Editor = function Editor(obj){
	var self = Observable();
	var _id = null;
	Object.defineProperty(self, '_id', {
		get: function(){return _id;}
		, set: function(v){
			var old = _id;
			self.changed('_id', old, v);
			_id = v;
		}
		, enumerable: true
	});
	var token = null;
	Object.defineProperty(self, 'token', {
		get: function(){return token;}
		, set: function(v){
			var old = token;
			self.changed('token', old, v);
			token = v;
		}
		, enumerable: true
	});
	var name = null;
	Object.defineProperty(self, 'name', {
		get: function(){return name;}
		, set: function(v){
			var old = name;
			self.changed('name', old, v);
			name = v;
		}
		, enumerable: true
	});
	var avatar = null;
	Object.defineProperty(self, 'avatar', {
		get: function(){return avatar;}
		, set: function(v){
			var old = avatar;
			self.changed('avatar', old, v);
			avatar = v;
		}
		, enumerable: true
	});
	var username = null;
	Object.defineProperty(self, 'username', {
		get: function(){return username;}
		, set: function(v){
			var old = username;
			self.changed('username', old, v);
			username = v;
		}
		, enumerable: true
	});
	
	for(var key in obj){
		self[key] = obj[key];
	}
	return self;
};

module.exports = Editor;