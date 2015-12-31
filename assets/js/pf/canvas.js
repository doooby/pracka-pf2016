
PF.canvas = {
    container: null,

    buffer: null,
    buffer_ctx: null,
    buffer_wh_ratio: null,

    target: null,
    target_ctx: null,
    projectIntoTarget: null,

    to_target_ratio: NaN,

    keyboard_events: {},

    prepare: function (height, wh_ratio) {
        this.buffer = document.createElement("CANVAS");
        this.buffer.id = "buffer";
        this.buffer.width = Math.floor(height * wh_ratio);
        this.buffer.height = height;
        this.buffer_ctx = this.buffer.getContext("2d");
        //this.buffer_ctx.mozImageSmoothingEnabled = false;
        //this.buffer_ctx.webkitImageSmoothingEnabled = false;
        //this.buffer_ctx.msImageSmoothingEnabled = false;
        //this.buffer_ctx.imageSmoothingEnabled = false;
        this.buffer_wh_ratio = wh_ratio;

        this.container = document.getElementById("container");
    },

    rebuildTarget: function () {
        var width, height, self = this;
        this.container.innerHTML = '';
        width = this.container.clientWidth;
        height = this.container.clientHeight;

        this.target = document.createElement("CANVAS");
        this.target.width = width;
        this.target.height = height;
        this.container.appendChild(this.target);

        this.target_ctx = this.target.getContext("2d");
        this.target_ctx.mozImageSmoothingEnabled = false;
        this.target_ctx.oImageSmoothingEnabled = false;
        this.target_ctx.webkitImageSmoothingEnabled = false;
        this.target_ctx.msImageSmoothingEnabled = false;
        this.target_ctx.imageSmoothingEnabled = false;

        this.projectIntoTarget = function () {
            self.target_ctx.drawImage(self.buffer, 0, 0, width, height);
        };

        this.target.addEventListener("mousemove", function (e) {
            var last_btn = PF.scene.mouse_on_button, current_btn;
            var v = new D2O.Vector2(e.pageX - PF.canvas.target.offsetLeft, e.pageY - PF.canvas.target.offsetTop);
            current_btn = PF.scene.checkButtons(v.mulScalar(1 / PF.canvas.to_target_ratio));
            if (last_btn!==current_btn) {
                if (last_btn && last_btn.on_leave) last_btn.on_leave();
                if (current_btn && current_btn.on_hover) current_btn.on_hover();
            }
        });

        //this.target.addEventListener("click", function (e) {
        //    var v = new D2O.Vector2(e.pageX - PF.canvas.target.offsetLeft, e.pageY - PF.canvas.target.offsetTop);
        //    var btn = PF.scene.checkButtons(v.mulScalar(1 / PF.canvas.to_target_ratio));
        //    if (btn && btn.on_click) btn.on_click();
        //});


        this.target.addEventListener("mousedown", function (e) {
            var v = new D2O.Vector2(e.pageX - PF.canvas.target.offsetLeft, e.pageY - PF.canvas.target.offsetTop);
            var btn = PF.scene.checkButtons(v.mulScalar(1 / PF.canvas.to_target_ratio));
            if (btn && btn.on_down) btn.on_down();
        });

        this.target.addEventListener("mouseup", function (e) {
            var v = new D2O.Vector2(e.pageX - PF.canvas.target.offsetLeft, e.pageY - PF.canvas.target.offsetTop);
            var btn = PF.scene.checkButtons(v.mulScalar(1 / PF.canvas.to_target_ratio));
            if (btn && btn.on_up) btn.on_up();
            PF.player.go_nowhere();
        });

        this.target.addEventListener("mouseout", function () {
            PF.player.go_nowhere();
        });


    },

    inTargetSpace: function (val) {
        return Math.floor(this.to_target_ratio * val);
    },

    _on_resize: function () {
        if (!PF.canvas.container) return;

        var w, h, page = document.getElementsByClassName(".page")[0];
        h = page.clientHeight - 10;
        w = Math.floor(h * PF.canvas.buffer_wh_ratio);
        if (w > page.clientWidth) {
            w = page.clientWidth;
            h = Math.floor(w / PF.canvas.buffer_wh_ratio);
        }
        PF.canvas.container.style.width = ""+w+"px";
        PF.canvas.container.style.height = ""+h+"px";

        PF.canvas.to_target_ratio = w / PF.canvas.buffer.width;

        PF.canvas.rebuildTarget();
        if (PF.scene) {
            PF.scene.repositionTexts();
            PF.scene.singleFrame();
        }
    },

    attachKeayboardEvents: function (events) {
        if (this.keyboard_events.keydown) {
            root.removeEventListener("keydown", this.keyboard_events.keydown);
            this.keyboard_events.keydown = null;
        }
        if (this.keyboard_events.keyup) {
            root.removeEventListener("keyup", this.keyboard_events.keyup);
            this.keyboard_events.keyup = null;
        }
        if (events.keydown) {
            root.addEventListener("keydown", events.keydown);
            this.keyboard_events.keydown = events.keydown;
        }
        if (events.keyup) {
            root.addEventListener("keyup", events.keyup);
            this.keyboard_events.keyup = events.keyup;
        }
    }
};

root.addEventListener("resize", PF.utils.throttle(PF.canvas._on_resize, 300));