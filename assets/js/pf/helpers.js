

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

    createBgCleaner: function (color) {
        return {
            render: function (ctx) {
                var style_holder = new D2O.StyleHolder(ctx, "fill", color);
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                style_holder.reset();
            }
        };
    },



};