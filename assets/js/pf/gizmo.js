
PF.gizmos = {

    objects: [],

    update: function () {
        var self = this;
        this.objects.forEach(function (g, i) {
            if (g) {
                g.position.y += g.motion_vector.y;
                if (g.position.y > PF.canvas.buffer.height) {
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

    getNextEmptyPosition: function () {
        var i;
        for (i=0; i<this.objects.length; i+=1) {
            if (!this.objects[i]) return i;
        }
        return this.objects.length;
    },

    creator: new D2O.Looper(1, function () {
        var g = new D2O.Sprite(PF.images["gizmo"]);
        g.position.x = Math.random() * PF.canvas.buffer.width;
        g.motion_vector.y = 0.5;

        g.hit_circle = new D2O.Sprite.HitCircle(g, g.calcInnerRadius());
        g.hit_circle.stroke_style = "green";
        //g.render_more = function (ctx) {
        //    g.hit_circle.render(ctx);
        //};

        PF.gizmos.objects[PF.gizmos.getNextEmptyPosition()] = g;
    })






};