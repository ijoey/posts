module.exports = function(represent, config){
	return function(result){
		if(result === undefined) return this.req.next(result);
		if(!result.view){
			this.statusCode = result;
			this.set('Content-Type', 'text/plain');
			return this.end(arguments.length > 1 ? arguments[1] : null);
		}
		result.resource.user = this.req.user;
		var self = this;
		represent.execute({
			next: this.req.next
			, model: result.model
			, request: this.req
			, response: this
			, resource: result.resource
			, template: result.view
			, config: config
		}, function(output){
			self.statusCode = 200;
			if(!isNaN(output)){
				self.statusCode = output;
				output = '';
			}
			self.write(output);
			self.end();
		});
	};
};
