const can_height = 1000;
const can_width = 1000;
var run;
var boidSystem;

function setup() {

    createCanvas(can_width, can_height);
    run = true;
    boidSystem = new P5jsBoidParticleSystem(100, can_width, can_height, 0, 0, 100, 50, 3 * Math.PI / 2, Math.PI / 2, 100, 50);
    background(0);
}

function draw() {
    if (run) {
        background(0);
        boidSystem.drawAndUpdate(can_height, can_width);
    }
}