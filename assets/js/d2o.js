
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
