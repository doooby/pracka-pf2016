
PF.canvas = {
    container: null,

    buffer: null,
    buffer_ctx: null,
    buffer_wh_ratio: null,

    target: null,
    target_ctx: null,
    projectIntoTarget: null,

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

        this.container = $("#container");
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
        this.container.appendChild(this.buffer);

        this.target_ctx = this.target.getContext("2d");
        this.target_ctx.mozImageSmoothingEnabled = false;
        this.target_ctx.webkitImageSmoothingEnabled = false;
        this.target_ctx.msImageSmoothingEnabled = false;
        this.target_ctx.imageSmoothingEnabled = false;

        this.projectIntoTarget = function () {
            self.target_ctx.drawImage(self.buffer, 0, 0, width, height);
        };
    }

};

PF.canvas.on_resize = function () {
    if (!PF.canvas.container) return;
    var w, h, page = $(".page");
    h = page.clientHeight - 10;
    w = Math.floor(h * PF.canvas.buffer_wh_ratio);
    if (w > page.clientWidth) {
        w = page.clientWidth;
        h = Math.floor(w / PF.canvas.buffer_wh_ratio);
    }
    $.set(PF.canvas.container, {style: {
        width: ""+w+"px",
        height: ""+h+"px"
    }});
    PF.canvas.rebuildTarget();
    PF.canvas.projectIntoTarget();
}

root.addEventListener("resize", PF.utils.throttle(PF.canvas.on_resize, 300));