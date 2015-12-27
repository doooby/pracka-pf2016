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

        PF.scene.removeAll = function () {
            this._objects = [];
            this._texts = [];
            this._buttons = [];
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
        PF.scene.removeAll();



    },


    char_choose: function () {
        PF.scene.removeAll();

        //PF.scene.addText("Vyber", new D2O.Vector2(17, 13), 5);
        //PF.scene.addText("postavu", new D2O.Vector2(12, 19), 5);

        PF.scene.addText("Vyber", new D2O.Vector2(21, 11), 3.7);
        PF.scene.addText("postavu", new D2O.Vector2(18, 16), 3.7);

        // 54     - 27  - 13.5
        //    1 9 1     1 9 1

        var width = 11;
        var height = 25;
        var arr = [
            {char: "brouk",      x: 11.5, y: 21.5, name: "Pan Brouk"},
            {char: "oplatka",    x: 33.5, y: 21.5, name: "Pan Oplatka"},
            {char: "kluk",       x: 11.5, y: 55.5, name: "Pan Kluk"},
            {char: "chobotnice", x: 33.5, y: 55.5, name: "Pan Chobotnice"}
        ];

        arr.forEach(function (char) {
            var s = new D2O.Sprite(PF.images[char.char]);
            s.position.x = char.x + width/2;
            s.position.y = char.y + height/2;
            PF.scene.add(s);

            var btn = new PF.utils.Button(char.x, char.y, width, height);
            btn.on_hover = function () {
                this.do_render = true;
                PF.scene.singleFrame();
            };
            btn.on_leave = function () {
                this.do_render = false;
                PF.scene.singleFrame();
            };
            btn.render = function () {
                if (!this.do_render) return;
                var style = new D2O.StyleHolder(PF.canvas.buffer_ctx, "stroke", "black");
                PF.canvas.buffer_ctx.strokeRect(btn.position.x, btn.position.y, btn.size.x, btn.size.y);
                style.reset();
            };
            PF.scene.add(btn);
            PF.scene.addButton(btn);

            PF.scene.addText(char.name, new D2O.Vector2(char.x - 5, char.y + height + 3), 1.8);
        });

        PF.scene.singleFrame();
    },


    gameplay: function () {
        PF.scene.removeAll();

        // player
        PF.player.createSprite();
        PF.player.gameplay = true;
        PF.scene.add(PF.player.sprite);

        //gizmos
        PF.gizmos.objects.length = 0;
        PF.scene.add(PF.gizmos.creator);
        PF.scene.add(PF.gizmos);

        PF.scene.commenseTickingAnimation(100);
    }



};
