function Event(body){
	this.body = body;
	this.header = {
		id: (new Date()).getTime()
		, endpoint: {port: 8124, host: 'localhost'}
		, token: 'testing'
		, name: 'Event'
	};
	this.type = 'event';
}
function PostWasUpdated(post){
	Event.apply(this, [post]);
	this.header.name = 'PostWasUpdated';
}
PostWasUpdated.prototype = new Event();

function PostWasCreated(post){
	Event.apply(this, [post]);
	this.header.name = 'PostWasCreated';
}
PostWasUpdated.prototype = new Event();

function PostWasDeleted(post){
	Event.apply(this, [post]);
	this.header.name = 'PostWasDeleted';
}
PostWasDeleted.prototype = new Event();

module.exports = {
	PostWasUpdated: PostWasUpdated
	, PostWasCreated: PostWasCreated
	, PostWasDeleted: PostWasDeleted
	, Event: Event
};