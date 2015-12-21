
PF.player = {

    move_speed: 10,

    go_left: false,
    //dragg_left: false,
    go_right: false,
    //dragg_right: false,

    prepareForTestPlay: function () {
        this.createSprite();
        this.gameplay = true;
        PF.scene.add(this.sprite);
    },

    createSprite: function () {
        var p = this, sprite = new D2O.Sprite(PF.images["player"]);
        var half_width = sprite.width / 2;

        sprite.position.set(25, 70);

        sprite.update = function (delta) {
            var x_motion = 0;
            if (p.go_left) {
            //if (p.dragg_left || p.go_left) {
                x_motion -= p.move_speed;
                //p.dragg_left = false;
            }
            if (p.go_right) {
            //if (p.dragg_right || p.go_right) {
                x_motion += p.move_speed;
                //p.dragg_right = false;
            }

            this.position.x += x_motion * delta;
            if (this.position.x < half_width) {
                this.position.x = half_width;
            }
            if (this.position.x > PF.canvas.buffer.width - half_width) {
                this.position.x = PF.canvas.buffer.width - half_width;
            }

            //p.dragg_left = p.go_left;
            //p.dragg_right = p.go_right;
        };

        sprite.hit_circle = new D2O.Sprite.HitCircle(sprite, sprite.width/2,
            new D2O.Vector2(0, -sprite.height/3.2));
        sprite.hit_circle.stroke_style = "yellow";
        sprite.render_more = function (ctx) {
            sprite.hit_circle.render(ctx);
        };

        this.sprite = sprite;
    }

};

document.addEventListener("keydown", function (e) {
    if (!PF.player.gameplay) return;
    if (e.keyCode===37) {
        PF.player.go_left = true;
        //PF.player.dragg_left = true;
    }
    if (e.keyCode===39) {
        PF.player.go_right = true;
        //PF.player.dragg_right = true;
    }
});
document.addEventListener("keyup", function (e) {
    if (!PF.player.gameplay) return;
    if (e.keyCode===37) PF.player.go_left = false;
    if (e.keyCode===39) PF.player.go_right = false;
});