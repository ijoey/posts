var Readline = require('readline');
var net = require('net');
var app = {
	didSendData: function(data){
		console.log(data);
		interface.prompt();
	}
	, didError: function(){
		console.log('did error out:', arguments);
	}
	, didFailAfterReconnects: function(err){
		console.log('failed after reconnects: ', err);
	}
	, didClose: function(hadErr){
		console.log('closed:', hadErr);
	}
};

var ReconnectSocket = require('./reconnectSocket');
var socket = new ReconnectSocket({port: 8124
	, host: 'localhost'}
	, app);
socket.open();


var interface = Readline.createInterface({
	input: process.stdin
	, output: process.stdout
	, terminal: false
});
interface.setPrompt('bot: ');
function handleLine(line){
	line = line.trim();
	if(line === 'exit') return interface.close();
	else socket.send(line);
	interface.prompt();
}
function didClose(){
	process.exit(0);
}
interface.on('line', handleLine);
interface.on('close', didClose);
interface.prompt();
