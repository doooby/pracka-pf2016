
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
                    PF.player.collect(g.texture.name);
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