const points = [1, 0, -1, .5, -1, -.5];

const scale = 10;
const sped = 100;

const halfViewAngle = 2 * Math.PI / 3;
const viewDist = 150;

class Boid {

    constructor(x, y, rot, speed, halfViewAngle, viewDist) {
        this.x = x;
        this.y = y;
        this.rot = rot;
        this.sepBuffer = 0;
        this.alignBuffer = 0;
        this.cohBufferX = 0;
        this.cohBufferY = 0;
        this.lastAlignBuffer = 0;
        this.checkedBoids = 0;
        this.speed = speed;
        this.halfViewAngle = halfViewAngle;
        this.viewDist = viewDist;
    }

    render() {
        const sin = Math.sin(this.rot);
        const cos = Math.cos(this.rot);
        var rendered = new Array(points.length);
        rendered[0] = (points[0] * cos - points[1] * sin) * scale + this.x;
        rendered[1] = (points[0] * sin + points[1] * cos) * scale + this.y;
        rendered[2] = (points[2] * cos - points[3] * sin) * scale + this.x;
        rendered[3] = (points[2] * sin + points[3] * cos) * scale + this.y;
        rendered[4] = (points[4] * cos - points[5] * sin) * scale + this.x;
        rendered[5] = (points[4] * sin + points[5] * cos) * scale + this.y;
        return rendered;
    }

    drawDirection() {
        return [this.x, this.y, this.x + Math.cos(this.rot) * viewDist, this.y + Math.sin(this.rot) * viewDist];
    }

    near(x, y, dist) {
        return (this.x - x) * (this.x - x) + (this.y - y) * (this.y - y) < dist * dist;
    }
    dist(x, y) {
        return Math.sqrt((this.x - x) * (this.x - x) + (this.y - y) * (this.y - y));
    }

    update(dt, width, height) {
            this.x += Math.cos(this.rot) * this.speed * dt;
            this.y += Math.sin(this.rot) * this.speed * dt;

            if (this.x > width) {
                this.x = 0;
            } else if (this.x < 0) {
                this.x = width;
            }

            if (this.y > height) {
                this.y = 0;
            } else if (this.y < 0) {
                this.y = height;
            }

            if (this.checkedBoids != 0) {
                this.rot += 0.05 * (this.alignBuffer / this.checkedBoids);
                this.lastAlignBuffer = this.alignBuffer / this.checkedBoids;
                this.alignBuffer = 0;

                this.rot += 0.1 * (this.sepBuffer / this.checkedBoids);
                this.sepBuffer = 0;
                this.checkedBoids = 0;

                if (this.cohBufferX != 0 && this.cohBufferY != 0)
                    this.rot += 0.05 * (this.rot - signedTan(this.cohBufferX, this.cohBufferY));
                this.cohBufferX = 0;
                this.cohBufferY = 0;
            }

        }
        /**
         * Check wether boid is in view with current boid.
         * 
         * @param {Boid} boid check if this boid is in view
         * 
         * @return {{relAngle:Number,inView:boolean}}
         */
    check(boid) {
        if (boid == this) return false;
        this.recalcAngle();
        var angle = signedTan(boid.x - this.x, boid.y - this.y) - this.rot % TWO_PI;
        if (angle > Math.PI) angle -= TWO_PI;
        else if (angle < Math.PI) angle += TWO_PI;
        angle %= TWO_PI;
        if (angle > Math.PI) angle -= TWO_PI;
        return { relAngle: angle, dist: this.dist(boid.x, boid.y), inView: angle <= this.halfViewAngle && angle >= -this.halfViewAngle && this.near(boid.x, boid.y, this.viewDist) };
    }
    recalcAngle() {
        if (this.rot > Math.PI) this.rot -= TWO_PI;
        if (this.rot < -Math.PI) this.rot += TWO_PI;
    }

    seperate(boid, relAngle, dist) {
        this.sepBuffer -= Math.exp(-dist) * relAngle * 1.1;
    }

    align(boid, relAngle) {
        this.alignBuffer += boid.rot - this.rot;
    }

    cohesion(boid) {
        this.cohBufferX += boid.x - this.x;
        this.cohBufferY += boid.y - this.y;
    }

    getAlignment() {
        return { line: [this.x, this.y, Math.cos(this.lastAlignBuffer) * viewDist + this.x, Math.sin(this.lastAlignBuffer) * viewDist + this.y], error: this.lastAlignBuffer - this.rot };
    }

}

function signedTan(x, y) {
    const a = Math.atan(y / x);
    if (y < 0)
        if (x < 0) return a - Math.PI;
        else return a;
    else if (x < 0) return Math.PI + a;
    else return a;
}

class P5jsBoidParticleSystem {

    constructor(num, maxX, maxY, minX, minY, maxSpeed, minSpeed, maxViewAngle, minViewAngle, maxViewDist, minViewDist) {
        this.boids = generateRandomBoids(num, maxX, maxY, minX, minY, maxSpeed, minSpeed, maxViewAngle, minViewAngle, maxViewDist, minViewDist);
    }

    draw() {
        for (var i = 0; i < this.boids.length; i++) {
            if (selected == this.boids[i]) fill(0, 255, 0);
            else fill(255, 255, 255);

            const rendered = this.boids[i].render();
            triangle(rendered[0], rendered[1], rendered[2], rendered[3], rendered[4], rendered[5]);
        }
    }

    update(w, h) {
        for (var i = 0; i < this.boids.length; i++) {
            for (var j = 0; j < this.boids.length; j++) {
                const yeet = this.boids[i].check(this.boids[j]);
                if (yeet.inView) {
                    this.boids[i].align(this.boids[j], yeet.relAngle);
                    this.boids[i].cohesion(this.boids[j], yeet.relAngle);
                    this.boids[i].seperate(this.boids[j], yeet.relAngle, yeet.dist);
                    this.boids[i].checkedBoids++;
                }
            }
        }
        for (var i = 0; i < this.boids.length; i++) {
            this.boids[i].update(deltaTime / 1000, w, h);
        }
    }
    drawAndUpdate(w, h) {
        fill(255, 255, 255);
        for (var i = 0; i < this.boids.length; i++) {
            const rendered = this.boids[i].render();
            triangle(rendered[0], rendered[1], rendered[2], rendered[3], rendered[4], rendered[5]);
        }
        for (var i = 0; i < this.boids.length; i++) {
            for (var j = 0; j < this.boids.length; j++) {
                const yeet = this.boids[i].check(this.boids[j]);
                if (yeet.inView) {
                    this.boids[i].align(this.boids[j], yeet.relAngle);
                    this.boids[i].cohesion(this.boids[j], yeet.relAngle);
                    this.boids[i].seperate(this.boids[j], yeet.relAngle, yeet.dist);
                    this.boids[i].checkedBoids++;
                }
            }
        }
        for (var i = 0; i < this.boids.length; i++) {
            this.boids[i].update(deltaTime / 1000, w, h);
        }
    }
}

/**
 * 
 * @param {Number} num How many boids you want to generate
 * @param {Number} maxX Maximum x position
 * @param {Number} maxY Maximum y position
 * @param {Number} minX Minimum x position
 * @param {Number} minY Minimum y position
 * 
 * @return {Array<Boid>} Generated Boids
 */
function generateRandomBoids(num, maxX, maxY, minX, minY, maxSpeed, minSpeed, maxViewAngle, minViewAngle, maxViewDist, minViewDist) {
    var out = [];
    for (var i = 0; i < num; i++) {
        out.push(new Boid((maxX - minX) * Math.random() + minX, (maxY - minY) * Math.random() + minY, TWO_PI, (maxSpeed - minSpeed) * Math.random() + minSpeed, (maxViewAngle - minViewAngle) * Math.random() + minViewAngle, (maxViewDist - minViewDist) * Math.random() + minViewDist));
    }
    return out;
}