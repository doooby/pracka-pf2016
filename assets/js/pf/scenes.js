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

        PF.scene.addText("Copak ti v příštím roce", new D2O.Vector2(3, 40), 3);
        PF.scene.addText(" spadne na hlavu?", new D2O.Vector2(7.5, 60), 3);

        this.create_switcher("credits");

        PF.scene.singleFrame();
    },

    credits: function () {
        PF.scene.clear();
        PF.scene.bg = "bg1";
        var x_middle = PF.canvas.buffer.width / 2;
        ["tygr", "zela", "koci"].forEach(function (name, i) {
            var item_y = 18 + i*(74 / 3);
            PF.scene.addText(name, new D2O.Vector2(x_middle - 4, item_y), 3);
            var s = new D2O.Sprite(PF.images[name]);
            s.position.x = x_middle;
            s.position.y = item_y + 8;
            PF.scene.add(s);
        });

        this.create_switcher("char_choose", 3000);

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
        ].forEach(function (char) {
            var s = new D2O.Sprite(PF.images[char.char]);
            s.position.x = char.x + width/2;
            s.position.y = char.y + height/2;
            PF.scene.add(s);

            var btn = new PF.utils.Button(char.x, char.y, width, height);
            if (char.char==="chobotnice") {
                btn.position.x -= 1;
                btn.size.x += 1;
            }
            btn.on_hover = function () {
                this.do_render = true;
                PF.scene.singleFrame();
            };
            btn.on_leave = function () {
                this.do_render = false;
                PF.scene.singleFrame();
            };
            btn.on_click = function () {
                PF.player.character = char.char;
                PF.scenes.gameplay();
            };
            PF.scene.add(btn);
            PF.scene.addButton(btn);

            PF.scene.addText(char.name, new D2O.Vector2(char.x + char.text_x, char.y + height + 3), 1.8);
        });

        PF.scene.singleFrame();
    },


    gameplay: function () {
        PF.scene.clear();
        PF.scene.bg = "bg2";

        // player
        PF.player.createSprite();
        PF.player.attachKeyboard();
        PF.player.gameplay = true;
        PF.scene.add(PF.player.sprite);

        //gizmos
        PF.gizmos.objects.length = 0;
        PF.scene.add(PF.gizmos.creator);
        PF.scene.add(PF.gizmos);

        PF.scene.commenseTickingAnimation(100);
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
        btn.on_click = function () {
            next_scene();
        };
        PF.scene.addButton(btn);
    }


};
