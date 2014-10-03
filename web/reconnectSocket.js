var net = require('net');
function ReconnectSocket(o, delegate){
	var socket = null;
	var options = o;
	var delegate = delegate || {};
	var tried = 0;
	options.listener = o.listener ? o.listener : function(){};
	options.reconnects = o.reconnects || 5;
	var messageSocket = {
		send: function(message){
			loggingReconnector.reset();
			if(socket && socket.writable){
				socket.write(message);
				socket.end();
			}
		}
		, open: function(){
			socket = createSocket(options);
		}
		, close: function(){
			socket.end();
		}
	};
	
	var reconnector = {
		execute: function(s, options){
			var self = this;
			this.tried++;
			if(this.delegate.willReconnect) this.delegate.willReconnect(options);
			s.removeAllListeners('connect');
			s.removeAllListeners('error');
			s.removeAllListeners('data');
			s.removeAllListeners('timeout');
			s.removeAllListeners('drain');
			s.removeAllListeners('close');
			s = null;
			setTimeout(function(){
				self.socket = createSocket(options);
			}, options.timeout || 2*1000);
		}
		, tried: 0
		, reconnects: 0
		, reset: function(){
			this.tried = 0;
		}
		, shouldReconnect: function(){
			return this.tried < this.reconnects;
		}
		, socket: null
	}
	reconnector.socket = socket;
	reconnector.delegate = delegate;
	reconnector.reconnects = options.reconnects;
	
	function didClose(hadErr){
		if(delegate.didClose) delegate.didClose(hadErr);
	}
	function didSendData(data){
		if(delegate.didSendData) delegate.didSendData(data);
	}
	function didConnect(){
		if(delegate.didConnect) delegate.didConnect(arguments);
	}
	function didError(err){
		if(delegate.didError) delegate.didError(err);
		if(!err) return;
		if(err.code !== 'ECONNREFUSED') return;
		if(loggingReconnector.shouldReconnect()){
			loggingReconnector.execute(socket, options);
		}else if(delegate.didFailAfterReconnects){
			delegate.didFailAfterReconnects(err);
		}
	}
	function createSocket(options){
		var s = net.connect(options.port, options.host, options.listener);
		s.setEncoding('utf8');
		s.on('connect', didConnect)
		s.on('error', didError);
		s.on('data', didSendData);
		s.on('close', didClose);
		return s;
	}
	
	var loggingReconnector = (function(r){
		return {
			execute: function(s, options){
				console.log('reconnecting ', r.tried+1, r.reconnects);
				r.execute(s, options);
			}
			, reset: function(){
				r.reset();
			}
			, shouldReconnect: function(){
				return r.shouldReconnect();
			}
			, socket: r.socket
		};
	})(reconnector);
	var loggingSocket = (function(c){
		return {
			send: function(message){
				c.send(message);
			}
			, open: function(){
				c.open();
			}
			, close: function(){
				c.close();
			}
		};
	})(messageSocket);
	return loggingSocket;
}
module.exports = ReconnectSocket;
