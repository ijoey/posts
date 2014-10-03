var Bus = require('./bus');
var Events = require('../blog/events');
var config = require('../config');
var Persistence = require('../boundaries/persistence')(config);
var bus = new Bus.AsA_Publisher(8124);
bus.start();
bus.iHandle('AddPost', {
	handle: function(command){
		Persistence.newPostWasSubmitted(command.body, function(err, doc){
			if(!err){
				bus.publish(new Events.PostWasCreated(command.body));
			}else{
				console.log('error from AddPost handle:', err);
			}
		});
	}
});
bus.iHandle('UpdatePost', {
	handle: function(command){
		Persistence.postWasUpdated(command.body._id, command.body, function(err, doc){
			if(!err){
				bus.publish(new Events.PostWasUpdated(command.body));
			}else{
				console.log('error from UpdatePost handle:', err);
			}
		});
	}
});
bus.iHandle('DeletePost', {
	handle: function(command){
		Persistence.postWasDeleted(command.body._id, function(err, count){
			if(!err){
				bus.publish(new Events.PostWasDeleted(command.body));
			}else{
				console.log('error from DeletePost: ', err);
			}
		});
	}
});
bus.iRespondTo('PostRequest', function(request, callback){
	Persistence.post.find(request.query, {published: -1}, function(err, docs){
		callback(err, docs);
	});
});
