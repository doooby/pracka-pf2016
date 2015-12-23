PF.scenes = {

    intro: function () {
        PF.scene.removeAll();

        //var t1 = new D2O.TextField("ěščřžýáí dsflsdajfůl", new D2O.Vector2(4, 50), "8px Verdana");
        var t1 = new D2O.TextField("ěščřžýáí dsflsdajfůl", new D2O.Vector2(4, 50), "25px Pixel7");
        t1.fill_style = "black";
        PF.scene.add(t1);


        PF.scene.singleFrame();
        PF.aaa = function (font) {
            t1.font = font;
            PF.scene.singleFrame();
        };

        t1.render(PF.canvas.target_ctx);

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
