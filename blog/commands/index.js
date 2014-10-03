function Command(body){
	this.body = body;
	this.header = {
		tried: 0
		, endpoint: {port: 8124, host:'localhost'}
		, retries: 3
		, name: 'Message'
		, token: null
		, id: (new Date()).getTime()
	};
	this.type = 'command';
}
function AddPost(post){
	Command.apply(this, [post]);
	this.header.name = 'AddPost';
}
AddPost.prototype = new Command();

function UpdatePost(post){
	Command.apply(this, [post]);
	this.header.name = 'UpdatePost';
}
UpdatePost.prototype = new Command();

function DeletePost(post){
	Command.apply(this, [post]);
	this.header.name = 'DeletePost';
}
DeletePost.prototype = new Command();

module.exports = {
	AddPost: AddPost
	, UpdatePost: UpdatePost
	, DeletePost: DeletePost
	, Command: Command
};