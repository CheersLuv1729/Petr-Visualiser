var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
(function () {
    var canvas = document.getElementById("mainCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var ctx = canvas.getContext("2d");
    var State;
    (function (State) {
        State[State["STATE_BEGIN"] = 0] = "STATE_BEGIN";
        State[State["STATE_ADD_POINT"] = 1] = "STATE_ADD_POINT";
        State[State["STATE_VIEW"] = 2] = "STATE_VIEW";
        State[State["STATE_DRAG_POINT"] = 3] = "STATE_DRAG_POINT";
    })(State || (State = {}));
    var Pos = /** @class */ (function () {
        function Pos(x, y) {
            this.x = x;
            this.y = y;
        }
        Pos.prototype.getDist = function (other) {
            var dx = this.x - other.x;
            var dy = this.y - other.y;
            return Math.sqrt(dx * dx + dy * dy);
        };
        Pos.prototype.getVecTo = function (other) {
            return new Vec(other.x - this.x, other.y - this.y);
        };
        Pos.prototype.getMidPoint = function (other) {
            return new Pos((this.x + other.x) / 2, (this.y + other.y) / 2);
        };
        Pos.prototype.getAddVector = function (v) {
            return new Pos(this.x + v.x, this.y + v.y);
        };
        return Pos;
    }());
    var Vec = /** @class */ (function () {
        function Vec(x, y) {
            this.x = x;
            this.y = y;
        }
        Vec.prototype.getCrossProduct = function () {
            return new Vec(this.y, -this.x);
        };
        Vec.prototype.getLength = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        };
        Vec.prototype.getNormal = function () {
            return this.getMult(1 / this.getLength());
        };
        Vec.prototype.getMult = function (l) {
            return new Vec(this.x * l, this.y * l);
        };
        return Vec;
    }());
    var Point = /** @class */ (function () {
        function Point(pos, colour, border) {
            if (colour === void 0) { colour = 'red'; }
            if (border === void 0) { border = 'black'; }
            this.pos = pos;
            this.colour = colour;
            this.border = border;
        }
        return Point;
    }());
    var points = [];
    var selected = null;
    var getClosestPoint = function (pos) {
        if (points.length == 0)
            return null;
        return points.reduce(function (a, b) {
            var aDist = pos.getDist(a.pos);
            var bDist = pos.getDist(b.pos);
            return aDist < bDist ? a : b;
        });
    };
    canvas.onmousedown = function (e) {
        var mousePos = new Pos(e.offsetX, e.offsetY);
        console.info("Canvas click [".concat(mousePos.x, " : ").concat(mousePos.y, "] Button: ").concat(e.button));
        if (e.button == 0) // On left click
         {
            var closest = getClosestPoint(mousePos);
            if (closest && closest.pos.getDist(mousePos) < 7) {
                if (e.ctrlKey) {
                    selected = new Point(mousePos);
                    // ctrl makes a copy of the current point
                    var index = points.indexOf(closest);
                    points.splice(index + 1, 0, selected);
                }
                else {
                    selected = closest;
                }
            }
            else {
                selected = new Point(mousePos);
                points.push(selected);
                console.info("Points ".concat(points.map(function (p) { return "[".concat(p.pos.x, " : ").concat(p.pos.y, "]"); }).join(", ")));
            }
        }
        else if (e.button == 2) {
            var closest = getClosestPoint(mousePos);
            if (closest && closest.pos.getDist(mousePos) < 7) {
                var index = points.indexOf(closest);
                points.splice(index, 1);
            }
        }
        e.preventDefault();
    };
    canvas.onmousemove = function (e) {
        var mousePos = new Pos(e.offsetX, e.offsetY);
        if (selected) {
            selected.pos = mousePos;
        }
    };
    canvas.onmouseup = function (e) {
        selected = null;
    };
    canvas.oncontextmenu = function (e) {
        return false;
    };
    var running = true;
    window.onkeydown = function (e) {
        console.log(e.key);
        if (e.key == 'Escape') {
            running = false;
        }
    };
    var render = function () {
        if (running)
            window.requestAnimationFrame(render);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var toRads = function (d) {
            return d / 180 * Math.PI;
        };
        var drawLineQueue = [];
        var drawPointsQueue = [];
        var drawLine = function (start, end, col, thickness) {
            if (col === void 0) { col = 'black'; }
            if (thickness === void 0) { thickness = 1; }
            drawLineQueue.push({
                start: start,
                end: end,
                col: col,
                thickness: thickness
            });
        };
        var drawPoint = function (p) {
            drawPointsQueue.push(p);
        };
        for (var i = 0; i < points.length; i++) {
            var currPoint = points[i];
            var nextPoint = points[(i + 1) % points.length];
            drawLine(currPoint.pos, nextPoint.pos, 'red', 2);
        }
        points.forEach(drawPoint);
        var lastLayer = __spreadArray([], points, true);
        var grads = ['#bbbbbb', '#999999', '#777777', '#555555'];
        var pointsCols = ['#ff0000', '#ff7f00', '#ffff00', '#7fff00', '#00ff7f', '#00ffff', '#007fff', '#0000ff', '#7f00ff', '#ff00ff', '#ff007f'];
        for (var i = 0; i < points.length - 2; i++) {
            var angle = (360 / points.length) * (i + 1);
            var currentLayer = [];
            for (var j = 0; j < points.length; j++) {
                var currPoint = lastLayer[j];
                var nextPoint = lastLayer[(j + 1) % points.length];
                var midPoint = currPoint.pos.getMidPoint(nextPoint.pos);
                var vecTo = currPoint.pos.getVecTo(nextPoint.pos);
                var tanA = Math.tan(toRads(angle) / 2);
                var len = (vecTo.getLength() / 2 / tanA);
                var cross = vecTo.getCrossProduct();
                var crossNorm = cross.getNormal();
                var crossMult = crossNorm.getMult(-len);
                var newPos = midPoint.getAddVector(crossMult);
                var newPoint = new Point(newPos, pointsCols[i + 1]);
                drawPoint(newPoint);
                currentLayer.push(newPoint);
                drawLine(currPoint.pos, newPos, grads[i]);
                drawLine(nextPoint.pos, newPos, grads[i]);
            }
            for (var j = 0; j < points.length; j++) {
                var currPoint = currentLayer[j];
                var nextPoint = currentLayer[(j + 1) % points.length];
                drawLine(currPoint.pos, nextPoint.pos, pointsCols[i + 1], 2);
            }
            console.log("Last: [".concat(lastLayer.map(function (p) { return "{".concat(p.pos.x, " , ").concat(p.pos.y, "}"); }).join(", "), "]"));
            console.log("Curr: [".concat(currentLayer.map(function (p) { return "{".concat(p.pos.x, " , ").concat(p.pos.y, "}"); }).join(", "), "]"));
            lastLayer = currentLayer;
        }
        drawLineQueue.reverse().forEach(function (_a) {
            var start = _a.start, end = _a.end, col = _a.col, thickness = _a.thickness;
            ctx.strokeStyle = col;
            ctx.lineWidth = thickness;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        });
        drawPointsQueue.reverse().forEach(function (p) {
            ctx.beginPath();
            ctx.arc(p.pos.x, p.pos.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = p.colour;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = p.border;
            ctx.stroke();
        });
    };
    render();
})();
