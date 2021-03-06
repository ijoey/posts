var Observable = function(){
	var observers = {};
	var self = {
		observe: function(key, observer){
			if(observers[key] === undefined) observers[key] = [];
			observers[key].push(observer);
		}
		, stopObserving: function(observer){
			for(var key in observers){
				var i = 0;
				var ubounds = observers[key].length;				
				for(i; i < ubounds; i++){
					if(observers[key][i] === observer){
						observers[key].splice(i, 1);
						if(observers[key].length === 0) delete observers[key];
						break;
					}
				}
			}
		}
		, changed: function(key, old, v){
			if(observers[key] === undefined) return;
			var i = 0;
			var ubounds = observers[key].length;
			for(i; i<ubounds; i++){
				observers[key][i](key, old, v, this);
			}
		}
		, release: function(){
			var key = null;
			for(key in observers){
				var observer = null;
				while(observer = observers[key].pop()){}			
			}
		}
	};
	return self;
};
module.exports = Observable;