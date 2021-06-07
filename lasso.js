export default class LassoCanvas {
    constructor() {
        this.points = [];
        this.isDrawing = false;
    }

    init(canvas, items, selectItemsCb, initItemsCb, renderCb, endSelectionCb) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.items = items;

        this.selectItemsCb = selectItemsCb;
        this.initItemsCb = initItemsCb;
        this.renderCb = renderCb;

        if (endSelectionCb) {
            this.onEnd = endSelectionCb;
        } else {
            this.onEnd = renderCb;
        }

        this.onMouseDown();
        this.onMouseMove();
        this.onMouseUp();
    }

    onMouseDown() {
        this.canvas.onmousedown = (e) => {
            this.isDrawing = true;
            this.initItemsCb(this.items);

            let rect = e.target.getBoundingClientRect();
            let x = e.clientX - rect.left; //x position within the element.
            let y = e.clientY - rect.top;  //y position within the element.
            this.start = {x: x, y: y};
            this.points = [];
            this.points.push(this.start);
            this.renderSelection();
        }
    }

    onMouseMove() {
        this.canvas.onmousemove = (e) => {
            if (this.isDrawing == false) {
                return;
            }

            let rect = e.target.getBoundingClientRect();
            let x = e.clientX - rect.left; //x position within the element.
            let y = e.clientY - rect.top;  //y position within the element.
            this.points.push({x: x, y: y} );
            this.render();
        };
    }

    onMouseUp() {
        this.canvas.onmouseup = (e) => {
            this.isDrawing = false;
            this.points.push(this.start);
            this.selectItems();

            this.onEnd();
        };
    }

    selectItems(){
        this.selectedItems = this.items.filter(item => this.setSelection(item));
        this.selectItemsCb(this.selectedItems);
    }

    setSelection(item){
        if (this.points.length <= 1){
            return false;
        }
        // item.selected = false;
        var intercessionCount = 0;
        for (var index = 1; index < this.points.length; index++) {
            var start = this.points[index - 1];
            var end = this.points[index];
            var line = {start: start, end: end};

            var ray = {Start: {x: item.x, y: item.y}, End: {x: 99999, y: 0}};
            var segment = {Start: start, End: end};
            var rayDistance = {
                x: ray.End.x - ray.Start.x,
                y: ray.End.y - ray.Start.y
            };
            var segDistance = {
                x: segment.End.x - segment.Start.x,
                y: segment.End.y - segment.Start.y
            };

            var rayLength = Math.sqrt(Math.pow(rayDistance.x, 2) + Math.pow(rayDistance.y, 2));
            var segLength = Math.sqrt(Math.pow(segDistance.x, 2) + Math.pow(segDistance.y, 2));

            if ((rayDistance.X / rayLength == segDistance.X / segLength) &&
                (rayDistance.Y / rayLength == segDistance.Y / segLength)) {
                continue;
            }

            var T2 = (rayDistance.x * (segment.Start.y - ray.Start.y) + rayDistance.y * (ray.Start.x - segment.Start.x)) / (segDistance.x * rayDistance.y - segDistance.y * rayDistance.x);
            var T1 = (segment.Start.x + segDistance.x * T2 - ray.Start.x) / rayDistance.x;

            //Parametric check.
            if (T1 < 0) {
                continue;
            };
            if (T2 < 0 || T2 > 1) {
                continue
            };

            if (isNaN(T1)) {
                continue
            };

            intercessionCount++;
        }

        if (intercessionCount == 0) {
            return false;
        }
        if (intercessionCount & 1) {
            console.log("true");
            return true;
        } else {
            return false;
        }
    }

    renderSelection(){
      if (this.points.length <= 1){
        return;
      }

      this.ctx.strokeStyle = 'black';
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.setLineDash([5,3]);

      for (let index = 0; index < this.points.length; index ++){
        let point = this.points[index];
        if (index == 0){
            this.ctx.moveTo(point.x, point.y);
        } else {
            this.ctx.lineTo(point.x, point.y);
        }
      }

      this.ctx.lineTo(this.start.x, this.start.y);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.closePath();
    }

    render(){
        this.ctx.save();

        this.ctx.clearRect(0, 0, 1000, 1000, 'white');
        this.renderCb();
        this.renderSelection();

        this.ctx.restore();
    }
}