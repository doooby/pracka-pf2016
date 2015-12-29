
PF.player = {

    move_speed: 7,
    character: "chobotnice",

    go_left: false,
    go_right: false,


    createSprite: function () {
        var p = this, sprite = new D2O.Sprite(PF.images[this.character]);
        var half_width = sprite.width / 2;

        sprite.position.set(Math.floor(PF.canvas.buffer.width/2), -50);

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
    },

    attachKeyboard: function () {
        PF.canvas.attachKeayboardEvents({
            keydown: function (e) {
                if (!PF.player.gameplay) return;
                if (e.keyCode===37) PF.player.go_left = true;
                if (e.keyCode===39) PF.player.go_right = true;
            },
            keyup: function (e) {
                if (!PF.player.gameplay) return;
                if (e.keyCode===37) PF.player.go_left = false;
                if (e.keyCode===39) PF.player.go_right = false;
            }
        });
    },

    landYPosition: function () {
        return PF.canvas.buffer.height - 27;
    },

    fallDown: function () {
        this.sprite.position.y = -this.sprite.height / 2 + 4;
        return this.landYPosition() - this.sprite.position.y;
    },

    flyUp: function () {
        this.sprite.position.y = this.landYPosition();
        return this.landYPosition() + this.sprite.height/2 - 4;
    }

};