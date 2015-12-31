PF.scenes = {

    createSceneHolder: function () {
        PF.scene = new D2O.Scene(PF.canvas.buffer_ctx);
        PF.scene._texts = [];
        PF.scene._buttons = [];
        PF.scene.bg = "bg1";

        PF.scene.addText = function (text, rel_position, rel_size) {
            var t = new PF.utils.CustomTextField(text, rel_position, rel_size);
            t.recalc();
            t.fill_style = "white";
            this._texts.push(t);
        };

        PF.scene.addButton = function (btn) {
            this._buttons.push(btn);
        };

        PF.scene.clear = function () {
            this._objects = [];
            this._texts = [];
            this._buttons = [];
            this.mouse_on_button = null;
        };

        PF.scene.repositionTexts = function () {
            this._texts.forEach(function (t) { t.recalc(); });
        };

        PF.scene.checkButtons = function (v) {
            this.mouse_on_button = null;
            for (var i=0; i<this._buttons.length; i+=1) {
                if (this._buttons[i].containsPoint(v)) {
                    this.mouse_on_button = this._buttons[i];
                    break;
                }
            }
            return this.mouse_on_button;
        };

        PF.scene.singleFrame = function (since_last) {
            if (since_last !== undefined) this._objects.forEach(function (o) { if (o.update) o.update(since_last); });

            PF.canvas.buffer_ctx.drawImage(PF.images[this.bg], 0, 0, PF.canvas.buffer.width, PF.canvas.buffer.height);
            this._objects.forEach(function (o) { if (o.render) o.render(PF.canvas.buffer_ctx); });

            PF.canvas.projectIntoTarget();
            this._texts.forEach(function (o) { o.render (PF.canvas.target_ctx); });
        };
    },

    intro: function () {
        PF.scene.clear();
        PF.scene.bg = "bg1";

        PF.scene.addText("Copak Ti asi", new D2O.Vector2(10, 25), 4);
        PF.scene.addText("v příštím roce", new D2O.Vector2(6, 32), 4);
        PF.scene.addText("spadne na hlavu?", new D2O.Vector2(1.5, 39), 4);

        this.create_switcher("char_choose");

        PF.scene.singleFrame();
    },

    credits: function () {
        PF.scene.clear();
        PF.scene.bg = "bg1";
        var x_middle = PF.canvas.buffer.width / 2;
        ["tygr", "zela", "koci"].forEach(function (name, i) {
            var item_y = 27 + i*(65 / 3);
            PF.scene.addText((name==="zela" ? "žela" : name), new D2O.Vector2(x_middle - 4, item_y), 3);
            var s = new D2O.Sprite(PF.images[name]);
            s.position.x = x_middle;
            s.position.y = item_y + 8;
            PF.scene.add(s);
        });
        PF.scene.addText("Autoři:", new D2O.Vector2(13, 15), 7);
        this.create_switcher("resume", 5000);

        PF.scene.singleFrame();
    },


    char_choose: function () {
        PF.scene.clear();
        PF.scene.bg = "bg1";

        PF.scene.addText("Vyber", new D2O.Vector2(21, 11), 3.7);
        PF.scene.addText("postavu", new D2O.Vector2(18, 16), 3.7);

        var width = 11;
        var height = 25;
        [
            {char: "brouk",      x: 10.5, y: 21.5, name: "Pan Brouk", text_x: -1},
            {char: "oplatka",    x: 33.5, y: 21.5, name: "Pan Oplatka", text_x: -2.5},
            {char: "kluk",       x: 10.5, y: 55.5, name: "Pan Kluk", text_x: 0},
            {char: "chobotnice", x: 33.5, y: 55.5, name: "Pan Chobotnice", text_x: -5}
        ].forEach(function (definition) {
            var s = new D2O.Sprite(PF.images[definition.char]);
            s.position.x = definition.x + width/2;
            s.position.y = definition.y + height/2;

            var btn = new PF.utils.Button(definition.x, definition.y, width, height);
            if (definition.char==="chobotnice") {
                btn.position.x -= 1;
                btn.size.x += 1;
            }
            btn.on_hover = function () {
                s.texture = PF.images[definition.char + "_tmavy"];
                PF.scene.singleFrame();
            };
            btn.on_leave = function () {
                s.texture = PF.images[definition.char];
                PF.scene.singleFrame();
            };
            btn.on_up = function () {
                PF.player.character = definition.char;
                PF.scenes.gameplay();
            };

            PF.scene.add(s);
            PF.scene.addButton(btn);
            PF.scene.addText(definition.name,
                new D2O.Vector2(definition.x + definition.text_x, definition.y + height + 3), 1.8);
        });

        PF.scene.singleFrame();
    },


    gameplay: function () {
        if (this.audio_loaded !== true) {
            this.audio_loaded = function () {
                this.audio_loaded = true;
              PF.scenes.gameplay();
            };
            this.waiting();
            return;
        }

        PF.scene.clear();
        PF.scene.bg = "bg2";
        PF.scene.singleFrame();

        var downer, step, upper;
        PF.player.createSprite();
        PF.player.clearStats();
        PF.player.attachKeyboard();
        PF.player.addArrowsToScene();
        PF.gizmos.counter.count = 0;

        downer = new D2O.Looper(0.67, function () {
            if (downer.ticks === 6) step = PF.player.fallDown() / 8;
            if (downer.ticks >= 14) {
                PF.scene.remove(downer);
                PF.player.gameplay = true;
                PF.scene._texts = [];
                PF.scene.add(PF.gizmos.creator);
                PF.gizmos.counter.addToScene();
            }
            if (downer.ticks >= 7) PF.player.sprite.position.y += step;
            downer.ticks += 1;
        });
        downer.ticks = 0;

        upper = new D2O.Looper(0.67, function () {
            if (upper.ticks === 17) step = PF.player.flyUp() / 8;
            if (upper.ticks >= 27) {
                PF.scene.remove(upper);
                PF.scenes.credits();
            }
            if (upper.ticks >= 18) {
                PF.player.gameplay = false;
                PF.player.go_left = false;
                PF.player.go_right = false;
                PF.player.sprite.position.y -= step;
            }
            upper.ticks += 1;
        });
        upper.ticks = 0;

        PF.scene.add(PF.player.sprite);
        PF.scene.add(PF.gizmos);
        PF.scene.add(downer);
        PF.scene.addText("Sbírej padající symboly.", new D2O.Vector2(3, 30), 3);
        PF.scene.addText("Pro pohyb použij šipky.", new D2O.Vector2(3, 45), 3);

        PF.scenes.audio_play = function () {
            PF.scenes.audio_play = null;
            PF.scene.commenseTickingAnimation(100);

            setTimeout(function () {
                PF.scene.add(upper);
                PF.scene.remove(PF.gizmos.creator);
            },102000);
        };
        PF.audio.fadeIn(1, 5000);
    },

    waiting: function () {
        PF.scene.clear();
        PF.scene.bg = "bg1";
        PF.scene.addText("nahrávám ...", new D2O.Vector2(3, 45), 3);
        PF.scene.singleFrame();
    },

    resume: function () {
        PF.scene.clear();
        PF.scene.bg = "bg1";

        PF.scene.addText("V příštím roce:", new D2O.Vector2(3, 15), 4.6);
        PF.scene.addText("PF", new D2O.Vector2(20, 70), 9);
        PF.scene.addText("2016", new D2O.Vector2(14, 80), 9);

        PF.player.addResumeStatus();

        PF.scene.singleFrame();
    },

    create_switcher: function (scene_name, timeout) {
        var timer, btn, next_scene;

        next_scene = function () {
            clearTimeout(timer);
            PF.canvas.attachKeayboardEvents({});
            PF.scenes[scene_name]();
        };

        if (typeof timeout === "number") timer = setTimeout(function () {
            next_scene();
        }, timeout);

        PF.canvas.attachKeayboardEvents({keydown: function (e) {
            if (e.keyCode === 32) next_scene();
        }});

        btn = new PF.utils.Button(0, 0, PF.canvas.buffer.width, PF.canvas.buffer.height);
        btn.on_up = function () {
            next_scene();
        };
        PF.scene.addButton(btn);
    },

    test_resumes: function () {
        PF.scene.clear();
        PF.scene.bg = "bg1";

        PF.gizmos.types.forEach(function (type, i) {
            var texture = PF.images[type], row_top = 4, tw2 = texture.width/ 2, th2 = texture.height/2;
            var s1, s2, b1, b2;

            s1 = new D2O.Sprite(texture);
            s1.position = new D2O.Vector2(tw2 + i*8, row_top + th2);
            b1 = new PF.utils.Button(i*8, row_top, texture.width, texture.height);
            b1.on_down = function () {
                var max = PF.player.getMaxStat();
                PF.player.stats[type] = PF.player.stats[max] + 1;
                PF.scenes.test_resumes();
            };

            row_top += 10;
            s2 = new D2O.Sprite(texture);
            s2.position = new D2O.Vector2(tw2 + i*8, row_top + th2);
            b2 = new PF.utils.Button(i*8, row_top, texture.width, texture.height);
            b2.on_down = function () {
                var min = PF.player.getMinStat();
                PF.player.stats[type] = PF.player.stats[min] - 1;
                PF.scenes.test_resumes();
            };


            PF.scene.add(s1);
            PF.scene.addButton(b1);
            PF.scene.add(s2);
            PF.scene.addButton(b2);

        });

        PF.player.addResumeStatus();
        PF.scene.singleFrame();
    }

};
