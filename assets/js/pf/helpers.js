(function () {

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
        }

    };


    PF.utils.CustomTextField = function (text, rel_position, rel_size) {
        this.text = text;
        this.rel_position = rel_position;
        this.rel_size = rel_size;
    };
    PF.utils.CustomTextField.prototype = D2O.TextField.prototype;
    PF.utils.CustomTextField.prototype.recalc = function () {
        this.position = new D2O.Vector2(PF.canvas.inTargetSpace(this.rel_position.x),
            PF.canvas.inTargetSpace(this.rel_position.y));
        this.font = PF.canvas.inTargetSpace(this.rel_size).toString()+"px best_font";
    };


    PF.utils.Button = function (x, y, w, h) {
        this.position = new D2O.Vector2(x, y);
        this.size = new D2O.Vector2(w,h);
    };
    PF.utils.Button.prototype = {

        containsPoint: function (v) {
            var tl = this.position;
            var br = tl.clone().add(this.size);
            return v.x>=tl.x && v.x<=br.x && v.y>=tl.y && v.y<=br.y;
        }

    };

} ());