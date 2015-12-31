
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

    clearStats: function () {
        this.stats = {
            mazlicek: 0,
            penize: 0,
            stesti: 0,
            srdce: 0,
            uspech: 0,
            zdravi: 0
        }
    },

    collect: function (name) {
        this.stats[name] += 1;
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

    addArrowsToScene: function () {
        [
            {texture: "vlevo",  pos: new D2O.Vector2(10, 84)},
            {texture: "vpravo", pos: new D2O.Vector2(PF.canvas.buffer.width - 10, 84)}
        ].forEach(function (definition) {
            var s = new D2O.Sprite(PF.images[definition.texture]);
            s.position = definition.pos;

            var btn = new PF.utils.Button(s.position.x - s.width/2, s.position.y - s.height/2, s.width, s.height);
            btn.on_hover = function () {
                s.texture = PF.images[definition.texture + "_on"];
                PF.scene.singleFrame();
            };
            btn.on_leave = function () {
                s.texture = PF.images[definition.texture];
                PF.scene.singleFrame();
            };
            btn.on_down = function () {
                if (!PF.player.gameplay) return;
                switch (definition.texture) {
                    case "vlevo":
                        PF.player.go_left = true;
                        break;
                    case "vpravo":
                        PF.player.go_right = true;
                        break;
                }
            };

            PF.scene.add(s);
            PF.scene.add(btn);
            PF.scene.addButton(btn);
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
    },

    go_nowhere: function () {
        if (!PF.player.gameplay) return;
        PF.player.go_left = false;
        PF.player.go_right = false;
    },

    getMaxStat: function () {
        var types = [], max = -9999, val;
        PF.gizmos.types.forEach(function (t) {
            val = PF.player.stats[t];
            if (val > max) {
                max = val;
                types = [t];
            } else if (val === max) {
                types.push(t);
            }
        });
        return types[Math.floor(Math.random() * types.length)];
    },

    getMinStat: function () {
        var types = [], min = 9999, val;
        PF.gizmos.types.forEach(function (t) {
            val = PF.player.stats[t];
            if (val === min) {
                types.push(t);
            } else if (val < min) {
                min = val;
                types = [t];
            }
        });
        return types[Math.floor(Math.random() * types.length)];
    },

    addResumeStatus: function () {
        var min, max = this.getMaxStat();
        for (var i=0; i<50; i+=1) {
            min = this.getMinStat();
            if (min !== max) break;
        }
        PF.resumes[max][max].concat(PF.resumes[max][min]).forEach(function (t, i) {
            PF.scene.addText(t, new D2O.Vector2(4, 40 + i*5), 2.8);
        });
        max = new D2O.Sprite(PF.images[max]);
        max.position.x = 10;
        max.position.y = 30;
        PF.scene.add(max);
        min = new D2O.Sprite(PF.images[min]);
        min.position.x = PF.canvas.buffer.width - 10;
        min.position.y = 30;
        PF.scene.add(min);
    }

};

PF.player.clearStats();