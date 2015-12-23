(function() {
"use strict";

// Copy properties from one object to another. Overwrites allowed.
function extend(to, from, whitelist) {
	for (var property in from) {
		if (whitelist) {
			var type = $.type(whitelist);

			if (whitelist === "own" && !from.hasOwnProperty(property) ||
				type === "array" && whitelist.indexOf(property) === -1 ||
				type === "regexp" && !whitelist.test(property) ||
				type === "function" && !whitelist.call(from, property)) {
				continue;
			}
		}

		// To copy gettters/setters, preserve flags etc
		var descriptor = Object.getOwnPropertyDescriptor(from, property);

		if (descriptor && (!descriptor.writable || !descriptor.configurable || !descriptor.enumerable || descriptor.get || descriptor.set)) {
			delete to[property];
			Object.defineProperty(to, property, descriptor);
		}
		else {
			to[property] = from[property];
		}
	}

	return to;
}

var $ = self.Bliss = extend(function(expr, context) {
	return $.type(expr) === "string"? (context || document).querySelector(expr) : expr || null;
}, self.Bliss);

extend($, {
	extend: extend,

	property: $.property || "_",

	sources: {},

	noop: function(){},

	$: function(expr, context) {
		if (expr instanceof Node || expr instanceof Window) {
			return [expr];
		}

		return Array.from(typeof expr == "string"? (context || document).querySelectorAll(expr) : expr || []);
	},

	/**
	 * Returns the [[Class]] of an object in lowercase (eg. array, date, regexp, string etc)
	 */
	type: function(obj) {
		if (obj === null) { return 'null'; }

		if (obj === undefined) { return 'undefined'; }

		var ret = (Object.prototype.toString.call(obj).match(/^\[object\s+(.*?)\]$/)[1] || "").toLowerCase();

		if(ret == 'number' && isNaN(obj)) {
			return 'nan';
		}

		return ret;
	},

	/*
	 * Return first non-undefined value. Mainly used internally.
	 */
	defined: function () {
		for (var i=0; i<arguments.length; i++) {
			if (arguments[i] !== undefined) {
				return arguments[i];
			}
		}
	},

	create: function (tag, o) {
		// 4 signatures: (tag, o), (tag), (o), ()
		if (arguments.length === 1) {
			if ($.type(tag) === "string") {
				o = {};
			}
			else {
				o = tag;
				tag = o.tag;
				delete o.tag;
			}
		}

		return $.set(document.createElement(tag || "div"), o);
	},

	each: function(obj, callback, ret) {
		ret = ret || {};

		for (var property in obj) {
			ret[property] = callback.call(obj, property, obj[property]);
		}

		return ret;
	},

	ready: function(context) {
		context = context || document;

		return new Promise(function(resolve, reject){
			if (context.readyState !== "loading") {
				resolve();
			}
			else {
				context.addEventListener("DOMContentLoaded", function(){
					resolve();
				});
			}
		});
	},

	// Helper for defining OOP-like “classes”
	Class: function(o) {
		var init = $.noop;

		if (o.hasOwnProperty("constructor")) {
			init = o.constructor;
			delete o.constructor;
		}

		var abstract = o.abstract;
		delete o.abstract;

		var ret = function() {
			if (abstract && this.constructor === ret) {
				throw new Error("Abstract classes cannot be directly instantiated.");
			}

			if (this.constructor.super && this.constructor.super != ret) {
				// FIXME This should never happen, but for some reason it does if ret.super is null
				// Debugging revealed that somehow this.constructor !== ret, wtf. Must look more into this
				this.constructor.super.apply(this, arguments);
			}

			return init.apply(this, arguments);
		};

		ret.super = o.extends || null;
		delete o.extends;

		ret.prototype = $.extend(Object.create(ret.super? ret.super.prototype : Object), {
			constructor: ret
		});

		$.extend(ret, o.static);
		delete o.static;

		for (var property in o) {
			if (property in $.classProps) {
				$.classProps[property].call(ret, ret.prototype, o[property]);
				delete o[property];
			}
		}

		// Anything that remains is an instance method/property or ret.prototype.constructor
		$.extend(ret.prototype, o);

		// For easier calling of super methods
		// This doesn't save us from having to use .call(this) though
		ret.prototype.super = ret.super? ret.super.prototype : null;

		return ret;
	},

	// Properties with special handling in classes
	classProps: {
		// Lazily evaluated properties
		lazy: function(obj, property, getter) {
			if (arguments.length >= 3) {
				Object.defineProperty(obj, property, {
					get: function() {
						// FIXME this does not work for instances if property is defined on the prototype
						delete this[property];

						return this[property] = getter.call(this);
					},
					configurable: true,
					enumerable: true
				});
			}
			else if (arguments.length === 2) {
				for (var prop in property) {
					$.lazy(obj, prop, property[prop]);
				}
			}

			return obj;
		},

		// Properties that behave like normal properties but also execute code upon getting/setting
		live: function(obj, property, descriptor) {
			if (arguments.length >= 3) {
				if ($.type(descriptor) === "function") {
					descriptor = {set: descriptor};
				}

				Object.defineProperty(obj, property, {
					get: function() {
						var value = this["_" + property];
						var ret = descriptor.get && descriptor.get.call(this, value);
						return ret !== undefined? ret : value;
					},
					set: function(v) {
						var value = this["_" + property];
						var ret = descriptor.set && descriptor.set.call(this, v, value);
						this["_" + property] = ret !== undefined? ret : v;
					},
					configurable: descriptor.configurable,
					enumerable: descriptor.enumerable
				});
			}
			else if (arguments.length === 2) {
				for (var prop in property) {
					$.live(obj, prop, property[prop]);
				}
			}

			return obj;
		},
	},

	// Includes a script, returns a promise
	include: function() {
		var url = arguments[arguments.length - 1];
		var loaded = arguments.length === 2? arguments[0] : false;

		var script = document.createElement("script");

		return loaded? Promise.resolve() : new Promise(function(resolve, reject){
			$.set(script, {
				async: true,
				onload: function() {
					resolve();
					$.remove(script);
				},
				onerror: function() {
					reject();
				},
				src: url,
				inside: document.head
			});
		});

	},

	/*
	 * Fetch API inspired XHR wrapper. Returns promise.
	 */
	fetch: function(url, o) {
		if (!url) {
			throw new TypeError("URL parameter is mandatory and cannot be " + url);
		}

		// Set defaults & fixup arguments
		var env = extend({
			url: new URL(url, location),
			data: "",
			method: "GET",
			headers: {},
			xhr: new XMLHttpRequest()
		}, o);

		env.method = env.method.toUpperCase();

		$.hooks.run("fetch-args", env);

		// Start sending the request

		if (env.method === "GET" && env.data) {
			env.url.search += env.data;
		}

		document.body.setAttribute('data-loading', env.url);

		env.xhr.open(env.method, env.url.href, env.async !== false, env.user, env.password);

		for (var property in o) {
			if (property in env.xhr) {
				try {
					env.xhr[property] = o[property];
				}
				catch (e) {
					self.console && console.error(e);
				}
			}
		}

		if (env.method !== 'GET' && !env.headers['Content-type'] && !env.headers['Content-Type']) {
			env.xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		}

		for (var header in env.headers) {
			env.xhr.setRequestHeader(header, env.headers[header]);
		}

		return new Promise(function(resolve, reject){
			env.xhr.onload = function(){
				document.body.removeAttribute('data-loading');

				if (env.xhr.status === 0 || env.xhr.status >= 200 && env.xhr.status < 300 || env.xhr.status === 304) {
					// Success!
					resolve(env.xhr);
				}
				else {
					reject(Error(env.xhr.statusText));
				}

			};

			env.xhr.onerror = function() {
				document.body.removeAttribute('data-loading');
				reject(Error("Network Error"));
			};

			env.xhr.send(env.method === 'GET'? null : env.data);
		});
	},

	value: function(obj) {
		var hasRoot = $.type(obj) !== "string";

		return $$(arguments).slice(+hasRoot).reduce(function(obj, property) {
	        return obj && obj[property];
	    }, hasRoot? obj : self);
	}
});

$.Hooks = new $.Class({
	add: function (name, callback) {
		this[name] = this[name] || [];
		this[name].push(callback);
	},

	run: function (name, env) {
		(this[name] || []).forEach(function(callback) {
			callback(env);
		});
	}
});

$.hooks = new $.Hooks();

var _ = $.property;

$.Element = function (subject) {
	this.subject = subject;

	// Author-defined element-related data
	this.data = {};

	// Internal Bliss element-related data
	this.bliss = {};
};

$.Element.prototype = {
	set: function (properties) {
		if ($.type(arguments[0]) === "string") {
			properties = {};
			properties[arguments[0]] = arguments[1];
		}

		for (var property in properties) {
			if (property in $.setProps) {
				$.setProps[property].call(this, properties[property]);
			}
			else if (property in this) {
				this[property] = properties[property];
			}
			else {
				if (!this.setAttribute) {
					console.log(this);
				}
				this.setAttribute(property, properties[property]);
			}
		}
	},

	// Run a CSS transition, return promise
	transition: function(props, duration) {
		duration = +duration || 400;

		return new Promise(function(resolve, reject){
			if ("transition" in this.style) {
				// Get existing style
				var previous = $.extend({}, this.style, /^transition(Duration|Property)$/);

				$.style(this, {
					transitionDuration: (duration || 400) + "ms",
					transitionProperty: Object.keys(props).join(", ")
				});

				$.once(this, "transitionend", function(){
					clearTimeout(i);
					$.style(this, previous);
					resolve(this);
				});

				// Failsafe, in case transitionend doesn’t fire
				var i = setTimeout(resolve, duration+50, this);

				$.style(this, props);
			}
			else {
				$.style(this, props);
				resolve(this);
			}
		}.bind(this));
	},

	// Fire a synthesized event on the element
	fire: function (type, properties) {
		var evt = document.createEvent("HTMLEvents");

		evt.initEvent(type, true, true );

		this.dispatchEvent($.extend(evt, properties));
	}
};

/*
 * Properties with custom handling in $.set()
 * Also available as functions directly on element._ and on $
 */
$.setProps = {
	// Set a bunch of inline CSS styles
	style: function (val) {
		$.extend(this.style, val);
	},

	// Set a bunch of attributes
	attributes: function (o) {
		for (var attribute in o) {
			this.setAttribute(attribute, o[attribute]);
		}
	},

	// Set a bunch of properties on the element
	properties: function (val) {
		$.extend(this, val);
	},

	// Bind one or more events to the element
	events: function (val) {
		if (val && val.addEventListener) {
			// Copy events from other element (requires Bliss Full)
			var me = this;

			// Copy listeners
			if (val[_] && val[_].bliss) {
				var listeners = val[_].bliss.listeners;

				for (var type in listeners) {
					listeners[type].forEach(function(l){
						me.addEventListener(type, l.callback, l.capture);
					});
				}
			}

			// Copy inline events
			for (var onevent in val) {
				if (onevent.indexOf("on") === 0) {
					this[onevent] = val[onevent];
				}
			}
		}
		else {
			for (var events in val) {
				events.split(/\s+/).forEach(function (event) {
					this.addEventListener(event, val[events]);
				}, this);
			}
		}
	},

	once: function(val) {
		if (arguments.length == 2) {
			val = {};
			val[arguments[0]] = arguments[1];
		}

		var me = this;

		$.each(val, function(events, callback){
			events = events.split(/\s+/);

			var once = function() {
				events.forEach(function(event){
					me.removeEventListener(event, once);
				});

				return callback.apply(me, arguments);
			};

			events.forEach(function (event) {
				me.addEventListener(event, once);
			});
		});
	},

	// Event delegation
	delegate: function(val) {
		if (arguments.length === 3) {
			// Called with ("type", "selector", callback)
			val = {};
			val[arguments[0]] = {};
			val[arguments[0]][arguments[1]] = arguments[2];
		}
		else if (arguments.length === 2) {
			// Called with ("type", selectors & callbacks)
			val = {};
			val[arguments[0]] = arguments[1];
		}

		var element = this;

		$.each(val, function (type, callbacks) {
			element.addEventListener(type, function(evt) {
				for (var selector in callbacks) {
					if (evt.target.closest(selector)) {
						callbacks[selector].call(this, evt);
					}
				}
			});
		});
	},

	// Set the contents as a string, an element, an object to create an element or an array of these
	contents: function (val) {
		if (val || val === 0) {
			(Array.isArray(val)? val : [val]).forEach(function (child) {
				var type = $.type(child);

				if (/^(string|number)$/.test(type)) {
					child = document.createTextNode(child + "");
				}
				else if (type === "object") {
					child = $.create(child);
				}

				if (child instanceof Node) {
					this.appendChild(child);
				}
			}, this);
		}
	},

	// Append the element inside another element
	inside: function (element) {
		element.appendChild(this);
	},

	// Insert the element before another element
	before: function (element) {
		element.parentNode.insertBefore(this, element);
	},

	// Insert the element after another element
	after: function (element) {
		element.parentNode.insertBefore(this, element.nextSibling);
	},

	// Insert the element before another element's contents
	start: function (element) {
		element.insertBefore(this, element.firstChild);
	},

	// Wrap the element around another element
	around: function (element) {
		if (element.parentNode) {
			$.before(this, element);
		}

		(/^template$/i.test(this.nodeName)? this.content || this : this).appendChild(element);
	}
};

$.Array = function (subject) {
	this.subject = subject;
};

$.Array.prototype = {
	all: function(method) {
		var args = $$(arguments).slice(1);

		return this[method].apply(this, args);
	}
};

// Extends Bliss with more methods
$.add = function (methods, on, noOverwrite) {
	on = $.extend({$: true, element: true, array: true}, on);

	if ($.type(arguments[0]) === "string") {
		methods = {};
		methods[arguments[0]] = arguments[1];
	}

	$.each(methods, function(method, callback){
		if ($.type(callback) == "function") {
			if (on.element && (!(method in $.Element.prototype) || !noOverwrite)) {
				$.Element.prototype[method] = function () {
					return this.subject && $.defined(callback.apply(this.subject, arguments), this.subject);
				};
			}

			if (on.array && (!(method in $.Array.prototype) || !noOverwrite)) {
				$.Array.prototype[method] = function() {
					var args = arguments;
					return this.subject.map(function(element) {
						return element && $.defined(callback.apply(element, args), element);
					});
				};
			}

			if (on.$) {
				$.sources[method] = $[method] = callback;

				if (on.array || on.element) {
					$[method] = function () {
						var args = [].slice.apply(arguments);
						var subject = args.shift();
						var Type = on.array && Array.isArray(subject)? "Array" : "Element";

						return $[Type].prototype[method].apply({subject: subject}, args);
					};
				}
			}
		}
	});
};

$.add($.Array.prototype, {element: false});
$.add($.Element.prototype);
$.add($.setProps);
$.add($.classProps, {element: false, array: false});

// Add native methods on $ and _
var dummy = document.createElement("_");
$.add($.extend({}, HTMLElement.prototype, function(method){
	return $.type(dummy[method]) === "function";
}), null, true);


})();

(function($) {
"use strict";

if (!Bliss || Bliss.shy) {
	return;
}

var _ = Bliss.property;

// Methods requiring Bliss Full
$.add({
	// Clone elements, with events
	clone: function () {
		var clone = this.cloneNode(true);
		var descendants = $.$("*", clone).concat(clone);

		$.$("*", this).concat(this).forEach(function(element, i, arr) {
			$.events(descendants[i], element);
		});

		return clone;
	}
}, {array: false});

// Define the _ property on arrays and elements

Object.defineProperty(Node.prototype, _, {
	// Written for IE compatability (see #49)
	get: function getter () {
		Object.defineProperty(Node.prototype, _, {
			get: undefined
		});
		Object.defineProperty(this, _, {
			value: new $.Element(this)
		});
		Object.defineProperty(Node.prototype, _, {
			get: getter
		});
		return this[_];
	},
	configurable: true
});

Object.defineProperty(Array.prototype, _, {
	get: function () {
		Object.defineProperty(this, _, {
			value: new $.Array(this)
		});
		
		return this[_];
	},
	configurable: true
});

// Hijack addEventListener and removeEventListener to store callbacks

if (self.EventTarget && "addEventListener" in EventTarget.prototype) {
	var addEventListener = EventTarget.prototype.addEventListener,
	    removeEventListener = EventTarget.prototype.removeEventListener,
	    equal = function(callback, capture, l){
	    	return l.callback === callback && l.capture == capture;
	    },
	    notEqual = function() { return !equal.apply(this, arguments); };

	EventTarget.prototype.addEventListener = function(type, callback, capture) {
		if (this[_] && callback) {
			var listeners = this[_].bliss.listeners = this[_].bliss.listeners || {};
			
			listeners[type] = listeners[type] || [];
			
			if (listeners[type].filter(equal.bind(null, callback, capture)).length === 0) {
				listeners[type].push({callback: callback, capture: capture});
			}
		}

		return addEventListener.call(this, type, callback, capture);
	};

	EventTarget.prototype.removeEventListener = function(type, callback, capture) {
		if (this[_] && callback) {
			var listeners = this[_].bliss.listeners = this[_].bliss.listeners || {};

			if (listeners[type]) {
				listeners[type] = listeners[type].filter(notEqual.bind(null, callback, capture));
			}
		}

		return removeEventListener.call(this, type, callback, capture);
	};
}

// Set $ and $$ convenience methods, if not taken
self.$ = self.$ || $;
self.$$ = self.$$ || $.$;

})(Bliss);

(function(factory){

  var root = (typeof self == 'object' && self.self == self && self);
  if (root === false) throw "cannot attach - unknown root";
  root.D2O = factory(root, {});

}(function(root, D2O){
  "use strict";

  

D2O.Vector2 = function (x, y) {
    if (x) this.x = x;
    if (y) this.y = y;
};

D2O.Vector2.prototype = {
    x: 0,
    y: 0,

    set: function (x, y) {
        this.x = x;
        this.y = y;
        return this;
    },

    copy: function (v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    },

    clone: function () {
        return new D2O.Vector2(this.x, this.y);
    },

    add: function (v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

};

D2O.Vector2.distanceBetweenPoints = function (v1, v2) {
    return Math.pow(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2), .5);
};

D2O.Sprite = function (texture) {
    this.texture = texture;
    this.width = texture.width;
    this.height = texture.height;
    this.position = new D2O.Vector2();
    this.motion_vector = new D2O.Vector2();
};

D2O.Sprite.prototype = {

    update: function (delta) {
        this.position.x += this.motion_vector.x*delta;
        this.position.y += this.motion_vector.y*delta;
    },

    render: function (ctx) {
        var x = Math.floor(this.position.x - this.width/2);
        var y = Math.floor(this.position.y - this.height/2);
        ctx.drawImage(this.texture, x, y, this.width, this.height);
        if (this.render_more) this.render_more(ctx);
    },

    setSize: function (opt) {
        if (!opt.width) opt.width = opt.height * this.texture.width / this.texture.height;
        if (!opt.height) opt.height = opt.width * this.texture.height / this.texture.width;
        this.width = Math.floor(opt.width);
        this.height = Math.floor(opt.height);
    },

    calcInnerRadius: function () {
        var bigger = this.width;
        if (this.height > bigger) bigger = this.height;
        return bigger/2;
    },

    calcOuterRadius: function () {
        var corner = new D2O.Vector2(this.position.x + this.width/2, this.position.y + this.height/2);
        return D2O.Vector2.distanceBetweenPoints(this.position, corner);
    }

};


D2O.Sprite.HitCircle = function (sprite, r, offset) {
    this.sprite = sprite;
    this.r = r;
    this.offset = offset || new D2O.Vector2();
};

D2O.Sprite.HitCircle.prototype = {

    position: function () {
        return this.sprite.position.clone().add(this.offset);
    },

    collide: function (other) {
        return D2O.Vector2.distanceBetweenPoints(this.position(), other.position()) <= (this.r + other.r);
    },

    render: function (ctx) {
        var position = this.position(), last_style;
        if (this.stroke_style) last_style = new D2O.StyleHolder(ctx, "stroke", this.stroke_style);
        ctx.beginPath();
        ctx.arc(position.x, position.y, this.r, 0, Math.PI*2);
        ctx.stroke();
        if (last_style) last_style.reset();
    }
};

D2O.StyleHolder = function (context, type, set_value) {
    this.context = context;
    this.key = type+"Style";
    if (set_value) this.set(set_value);
};

D2O.StyleHolder.prototype = {

    set: function (value) {
        this.former_value = this.context[this.key];
        this.context[this.key] = value;
    },

    reset: function () {
        this.context[this.key] = this.former_value;
    }

};

D2O.TextField = function (string, position, font) {
    this.text = string;
    this.position = position;
    if (font) this.font = font;
};

D2O.TextField.prototype = {
    font: "14px serif",

    render: function (ctx) {
        var last_style;
        if (this.fill_style) last_style = new D2O.StyleHolder(ctx, "fill", this.fill_style);
        ctx.font = this.font;
        if (this.max_width) ctx.fillText(this.text, this.position.x, this.position.y, this.max_width);
        else ctx.fillText(this.text, this.position.x, this.position.y);
        if (last_style) last_style.reset();
    }

};


D2O.Loader = function (callback) {
    this.images = {};
    this._callback = callback;
    this._queue = [];
};

D2O.Loader.prototype = {
    done: -1,

    enqueue: function (loader) {
        this._queue.push(loader);
        return this;
    },

    enqueueImages: function (definitions) {
        this._queue.push(function () {
            var self = this;
            var to_load = Object.keys(definitions);
            to_load.forEach(function (name) {
                var img = new Image();
                img.onload = function () {
                    to_load.splice( to_load.indexOf(name), 1);
                    self.images[name] = img;
                    if (to_load.length === 0) self.doNext();
                };
                img.src = definitions[name];
                img.name = name;
            });
        });
        return this;
    },

    doNext: function () {
        this.done += 1;
        if (this._callback) this._callback.call(this, this._queue.length - this.done);
        var next = this._queue[this.done];
        if (next) next.call(this);
    },

    start: function (callback) {
        if (callback) this._callback = callback;
        this.doNext();
    }

};

D2O.Looper = function (interval, callback) {
    this._callback = callback;
    if (typeof interval === "function") this._get_next_interval = interval;
    else this.interval = interval;
    this.time_down = this._get_next_interval();
};

D2O.Looper.prototype = {

    _get_next_interval: function () {
        return this.interval || 1;
    },

    update: function (delta) {
        if (this.pause) return;
        this.time_down -= delta;
        if (this.time_down <= 0) {
            this._callback();
            this.time_down += this._get_next_interval();
        }
        if (this.time_down < 0) this.time_down = 0;
    }

};

D2O.Looper.createCountOuted = function (count, interval, callback) {
    var looper = new D2O.Looper(interval, function () {
        looper.count_down -= 1;
        if (looper.count_down <= 0) callback(true);
        else callback(false);
    });
    looper.count_down = count;
    callback();
    return looper;
};

D2O.Scene = function (drawing_context, animator) {
    this._objects = [];
    this.ctx = drawing_context;
    this.animator = animator || D2O.Scene.native_animator;
};

D2O.Scene.prototype = {

    commenseAnimation: function () {
        var self = this, last_time;
        if (this.looper) return;
        this._stop_animation = null;

        this.looper = function () {
            var delta = (Date.now() - last_time);
            if (self._checkStopAnimation()) return;
            self.singleFrame(delta/1000);
            last_time = Date.now();
            self.animator.call(null, self.looper);
        };

        last_time = Date.now();
        this.animator.call(null, this.looper);
    },

    commenseTickingAnimation: function (tick_break) {
        var self = this, last_time, since_last_tick = 0;
        if (this.looper) return;
        this._stop_animation = null;

        this.looper = function () {
            since_last_tick += Date.now() - last_time;
            if (since_last_tick > tick_break) {
                if (self._checkStopAnimation()) return;
                self.singleFrame(since_last_tick/1000);
                since_last_tick -= tick_break;
                if (since_last_tick >  tick_break) since_last_tick = 0;
            }

            last_time = Date.now();
            self.animator.call(null, self.looper);
        };

        last_time = Date.now();
        this.animator.call(null, this.looper);
    },

    singleFrame: function (since_last) {
        var ctx = this.ctx;
        if (this._before_frame) this._before_frame(self);
        this._objects.forEach(function (o) { if (o.update) o.update(since_last); });
        this._objects.forEach(function (o) { if (o.render) o.render(ctx); });
        if (this._after_frame) this._after_frame(self);
    },

    stopAnimation: function (callback) {
        if (!callback) callback = true;
        this._stop_animation = callback;
    },

    _checkStopAnimation: function () {
        if (this._stop_animation) {
            this.looper = null;
            if (typeof this._stop_animation === "function") this._stop_animation();
            this._stop_animation = null;
            return true;
        }
    },

    removeAll: function () {
        var ctx = this.ctx;
        this._objects.forEach(function (o) {
            if (o.discart) o.discart(ctx);
        });
        this._objects.length = 0;
    },

    add: function (object) {
        this._objects.push(object);
    },

    remove: function (object) {
        if (object.discart) object.discart(ctx);
        this._objects.splice(this._objects.indexOf(object), 1);
    }

};

D2O.Scene.native_animator = root.requestAnimationFrame || root.webkitRequestAnimationFrame
    || root.msRequestAnimationFrame || root.mozRequestAnimationFrame;










  return D2O;
}));




(function (factory) {

  var root = self;
  var PF = factory(root, {});
  root.PF = PF;

}(function (root, PF) {

  "use strict";
  var load_semaphore;

  

PF.utils = {

    throttle: function (func, delay) {
        var timer = null;
        return function () {
            var context = this, args = arguments;
            if (timer == null) {
                timer = setTimeout(function () {
                    func.apply(context, args);
                    timer = null;
                }, delay);
            }
        };
    },




};

PF.canvas = {
    container: null,

    buffer: null,
    buffer_ctx: null,
    buffer_wh_ratio: null,

    target: null,
    target_ctx: null,
    projectIntoTarget: null,

    prepare: function (height, wh_ratio) {
        this.buffer = document.createElement("CANVAS");
        this.buffer.id = "buffer";
        this.buffer.width = Math.floor(height * wh_ratio);
        this.buffer.height = height;
        this.buffer_ctx = this.buffer.getContext("2d");
        //this.buffer_ctx.mozImageSmoothingEnabled = false;
        //this.buffer_ctx.webkitImageSmoothingEnabled = false;
        //this.buffer_ctx.msImageSmoothingEnabled = false;
        //this.buffer_ctx.imageSmoothingEnabled = false;
        this.buffer_wh_ratio = wh_ratio;

        this.container = $("#container");
    },

    rebuildTarget: function () {
        var width, height, self = this;
        this.container.innerHTML = '';
        width = this.container.clientWidth;
        height = this.container.clientHeight;

        this.target = document.createElement("CANVAS");
        this.target.width = width;
        this.target.height = height;
        this.container.appendChild(this.target);
        this.container.appendChild(this.buffer);

        this.target_ctx = this.target.getContext("2d");
        this.target_ctx.mozImageSmoothingEnabled = false;
        this.target_ctx.webkitImageSmoothingEnabled = false;
        this.target_ctx.msImageSmoothingEnabled = false;
        this.target_ctx.imageSmoothingEnabled = false;

        this.projectIntoTarget = function () {
            self.target_ctx.drawImage(self.buffer, 0, 0, width, height);
        };
    }

};

PF.canvas.on_resize = function () {
    if (!PF.canvas.container) return;
    var w, h, page = $(".page");
    h = page.clientHeight - 10;
    w = Math.floor(h * PF.canvas.buffer_wh_ratio);
    if (w > page.clientWidth) {
        w = page.clientWidth;
        h = Math.floor(w / PF.canvas.buffer_wh_ratio);
    }
    $.set(PF.canvas.container, {style: {
        width: ""+w+"px",
        height: ""+h+"px"
    }});
    PF.canvas.rebuildTarget();
    PF.canvas.projectIntoTarget();
}

root.addEventListener("resize", PF.utils.throttle(PF.canvas.on_resize, 300));

PF.gizmos = {

    objects: [],
    types: ["mazlicek", "penize", "srdce", "uspech", "zdravi", "stesti"],

    update: function () {
        var self = this;
        this.objects.forEach(function (g, i) {
            if (g) {
                g.position.y += g.motion_vector.y;
                if (g.position.y > PF.canvas.buffer.height - 17) {
                    self.objects[i] = null;
                }
                if (g.hit_circle.collide(PF.player.sprite.hit_circle)) {
                    self.objects[i] = null;
                }
            }
        });
    },

    render: function (ctx) {
        this.objects.forEach(function (g) {
            if (g) g.render(ctx);
        });
    },

    _getNextEmptyIndex: function () {
        var i;
        for (i=0; i<this.objects.length; i+=1) {
            if (!this.objects[i]) return i;
        }
        return this.objects.length;
    },

    getNextGizmo: function () {
        var type = this.types[Math.floor(Math.random() * this.types.length)];
        var g = new D2O.Sprite(PF.images[type]);
        g.type = type;
        g.position.x = Math.random() * PF.canvas.buffer.width;
        g.motion_vector.y = 0.5;
        //g.hit_circle = new D2O.Sprite.HitCircle(g, g.calcInnerRadius());
        g.hit_circle = new D2O.Sprite.HitCircle(g, 3.5);
        //g.hit_circle.stroke_style = "green";
        //g.render_more = function (ctx) {
        //    g.hit_circle.render(ctx);
        //};
        return g;
    },

    creator: new D2O.Looper(1, function () {
        PF.gizmos.objects[PF.gizmos._getNextEmptyIndex()] = PF.gizmos.getNextGizmo();
    })






};

PF.player = {

    move_speed: 7,
    character: "chobotnice",

    go_left: false,
    go_right: false,


    createSprite: function () {
        var p = this, sprite = new D2O.Sprite(PF.images[this.character]);
        var half_width = sprite.width / 2;

        sprite.position.set(Math.floor(PF.canvas.buffer.width/2), PF.canvas.buffer.height - 27);

        sprite.update = function (delta) {
            var x_motion = 0;
            if (p.go_left) x_motion -= p.move_speed;
            if (p.go_right) x_motion += p.move_speed;

            this.position.x += x_motion * delta;
            if (this.position.x < half_width) {
                this.position.x = half_width;
            }
            if (this.position.x > PF.canvas.buffer.width - half_width) {
                this.position.x = PF.canvas.buffer.width - half_width;
            }
        };

        sprite.hit_circle = new D2O.Sprite.HitCircle(sprite, sprite.width/2,
            new D2O.Vector2(0, -sprite.height/3.2));
        //sprite.hit_circle.stroke_style = "yellow";
        //sprite.render_more = function (ctx) {
        //    sprite.hit_circle.render(ctx);
        //};

        this.sprite = sprite;
    }

};

document.addEventListener("keydown", function (e) {
    if (!PF.player.gameplay) return;
    if (e.keyCode===37) PF.player.go_left = true;
    if (e.keyCode===39) PF.player.go_right = true;
});
document.addEventListener("keyup", function (e) {
    if (!PF.player.gameplay) return;
    if (e.keyCode===37) PF.player.go_left = false;
    if (e.keyCode===39) PF.player.go_right = false;
});
PF.scenes = {

    intro: function () {
        PF.scene.removeAll();

        //var t1 = new D2O.TextField("ěščřžýáí dsflsdajfůl", new D2O.Vector2(4, 50), "8px Verdana");
        var t1 = new D2O.TextField("ěščřžýáí dsflsdajfůl", new D2O.Vector2(4, 50), "25px Pixel7");
        t1.fill_style = "black";
        PF.scene.add(t1);


        PF.scene.singleFrame();
        PF.aaa = function (font) {
            t1.font = font;
            PF.scene.singleFrame();
        };

        t1.render(PF.canvas.target_ctx);

    },

    gameplay: function () {
        PF.scene.removeAll();

        // player
        PF.player.createSprite();
        PF.player.gameplay = true;
        PF.scene.add(PF.player.sprite);

        //gizmos
        PF.gizmos.objects.length = 0;
        PF.scene.add(PF.gizmos.creator);
        PF.scene.add(PF.gizmos);

        PF.scene.commenseTickingAnimation(100);
    }



};




  document.addEventListener("DOMContentLoaded", function() {
    if (load_semaphore) load_semaphore();
    else load_semaphore = true;
  });

  (new D2O.Loader()).enqueueImages({
    "background": "/assets/pozadi-516c00712dfd2c1d306f74f719231082.png",

    "brouk": "/assets/brouk-7fe15403bc0784a2208b71cad27371d1.png",
    "kluk": "/assets/kluk-ad9749fb09b7bbf34f092118615745c1.png",
    "oplatka": "/assets/oplatka-deb2abac9a52a3a3bf02cacde60eb369.png",
    "chobotnice": "/assets/chobotnice-953418b0f48d29a0b9183b7736be6444.png",

    "mazlicek": "/assets/mazlicek-6670e0f6485bbe198b2f9c584b81d96b.png",
    "penize": "/assets/penize-11856fb479847225715d209bf12a7335.png",
    "srdce": "/assets/srdce-25edd23d1ee419d6dcc778a22f9a17b7.png",
    "uspech": "/assets/uspech-c7d91c80b14e6d79d1f4a68cda0156d9.png",
    "zdravi": "/assets/zdravi-043effd2e1f142b9353b75a3d1edcec3.png",
    "stesti": "/assets/stesti-3f0c8ce8ea2b9c0da3befcb7475fb3a0.png"
  }).enqueue(function () {
    if (load_semaphore) this.doNext();
    else load_semaphore = this.doNext;
  }).enqueue(function () {
    PF.images = this.images;
    PF.canvas.prepare(90, 3/5);
    PF.canvas.on_resize();

    PF.scene = new D2O.Scene(PF.canvas.buffer_ctx);
    PF.scene.singleFrame = function (since_last) {
      this._objects.forEach(function (o) { if (o.update) o.update(since_last); });
      PF.canvas.buffer_ctx.drawImage(PF.images["background"], 0, 0, PF.canvas.buffer.width, PF.canvas.buffer.height);
      this._objects.forEach(function (o) { if (o.render) o.render(PF.canvas.buffer_ctx); });
      PF.canvas.projectIntoTarget();
    };

    PF.scenes.gameplay();

  }).start();

  return PF;
}));
