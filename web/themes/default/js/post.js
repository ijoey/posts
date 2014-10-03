(function(){
	
/*	View.Post = function(container, model){
		var self = View.apply(this, [container, model]);
		this.form = document.createElement('form');
		this.title = document.createElement('input');
		this.content = document.createElement('textarea');
		this.button = document.createElement('button');
		this.button.type = 'submit';
		this.editButton = document.querySelector('button[name="edit"]');
		[this.title, this.content,this.button].forEach(function(elem){
			self.form.appendChild(elem);
		});
		this.form.focus();
		this.release = function(){
			this.form = null;
			this.title = null;
			this.content = null;
			this.button = null;
		};
		function makeEditable(){
			
		}
		function makeUneditable(){
			
		}
		var editable = false;
		Object.defineProperty(this, 'editable', {
			set: function(v){
				if(v){
					makeEditable();
				}else{
					makeUneditable();
				}
				editable = v;
			}
			, get: function(){return editable;}
			, enumerable: true
		});
	};
	Controller.Post = function(view, model, delegate){
		var self = Controller.apply(this, [view, model, delegate]);
		view.title.addEventListener('keyup', this, true);
		view.content.addEventListener('keyup', this, true);
		view.form.addEventListener('submit', this, true);
		view.editButton.addEventListener('click', this, true);
		this.handleEvent = function(e){
			if(this[e.type]) this[e.type](e);
		};
		this.load = function(e){
			var post = JSON.parse(e.target.responseText);
			Object.keys(post).forEach(function(key){
				model[key] = post[key];
			});
		};
		this.error = function(e){
			console.log(e);
		}
		this.click = function(e){
			view.editable = e.target.innerHTML === "Edit";
			if(view.editable) e.target.innerHTML = "Save";
			else e.target.innerHTML = "Edit";
			var request = new XMLHttpRequest();
			request.addEventListener('load', this, true);
			request.addEventListener('error', this, true);
			request.open('get', '/posts/' + model.key, true);
			request.responseType = 'json';
			request.setRequestHeader('Content-Type', 'application/json');
			request.send();
		};
		this.submit = function(e){
			e.preventDefault();
			model.time = (new Date()).getTime();
			if(delegate.postShouldSave) delegate.postShouldSave(model);
		};
		this.keyup = function(e){
			console.log(e.target);
			model.content = e.target.value;
		};
		this.release = function(){
			view.title.removeEventListener('keyup', this);
			view.content.removeEventListener('keyup', this);
			view.form.removeEventListener('submit', this);
		};
	};
	
	var app = {
		postShouldSave: function(post){
			
		}
	};
	var post = {key: document.querySelector('article footer form input[name="key"]').value};
	var controller = new Controller.Post(new View.Post(null, post), post, app);*/
	
	
	View.Textarea = function(container, model){
		var self = View.apply(this, [container, model]);
		this.release = function(){};
		this.offset = {top: container.offsetTop};
		Object.defineProperty(this, 'height', {
			get: function(){return parseInt(container.style.height.replace('px', ''), 10);}
			, set: function(v){ container.style.height = v+'px';}
			, enumerable: true
		});
	};
	Controller.Textarea = function(delegate, view, model){
		var self = Controller.apply(this, [delegate, view, model]);
		this.resize = function(viewportSize){
			view.height = viewportSize.h - view.offset.top - 40;
		};
		this.release = function(){
			
		};
	};
	var app = (function(win){
		var post = {title: '', content: '', key: null};
		var controller = new Controller.Textarea(app, new View.Textarea(document.querySelector('textarea')), post);
		win.addEventListener('resize', this, true);
		this.handleEvent = function(e){
			if(this[e.type]) this[e.type](e);
		};
		this.resize = function(e){
			controller.resize({h: e.target.document.documentElement.clientHeight, w: e.target.document.documentElement.clientWidth});
		};
		controller.resize({h: window.document.documentElement.clientHeight});
	})(window);
})();