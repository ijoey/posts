var test = require('tape');
var config = require('../config');
var Bus = require('../web/bus');
var Commands = require('../blog/commands');
var Events = require('../blog/events');

test('Start a Bus', function(t){
	var bus = new Bus.AsA_Server(8127);
	var server = bus.start();
	t.ok(server, "Bus should start successfully");
	bus.stop();
	t.end();
});
test('Handle a command', function(t){
	var command = new Commands.AddPost({_id: (new Date()).getTime(), body: "Testing"});
	command.header.endpoint.port = 8127;
	var client = new Bus.AsA_Client();
	var handler = new Bus.AsA_Server(8127);
	handler.start();
	handler.iHandle(command.header.name, function(command){
		t.ok(command, "Handled command from within handler");
		handler.stop();
		t.end();
	});
	client.send(command);
});
test('Subscribe to an event and be notified', function(t){
	var command = new Commands.AddPost({_id: (new Date()).getTime(), body: "Testing"});
	command.header.endpoint.port = 8127;
	var client = new Bus.AsA_Client();
	var handler = new Bus.AsA_Publisher(8127);
	var subscriber = new Bus.AsA_Subscriber(8128);
	handler.start();
	subscriber.start();
	handler.iHandle(command.header.name, function(command){
		var event = new Events.PostWasCreated(command.body);
		handler.publish(event);
	});
	subscriber.iSubscribeTo('PostWasCreated', {host: 'localhost', port: 8127}, function(event){
		handler.stop();
		subscriber.stop();
		t.ok(event.header.name === 'PostWasCreated', "Got an event notification");
		t.end();
	});
	client.send(command);
});