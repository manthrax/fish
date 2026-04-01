import * as THREE from "three";

export default class Bubbles {
    constructor(app, count = 100) {
        this.app = app;
        const { scene } = app;

        // Use a simple sphere for bubbles
        const geometry = new THREE.SphereGeometry(1, 12, 12);
        geometry.scale(1, 1, 1)
        // Metal reflective material
        // We use MeshStandardMaterial with high metalness/roughness for that chrome look
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,//0x99ccff,
            metalness: 1.0,
            roughness: 0.0,
            transparent: true,
            depthWrite: false,
            opacity: 0.6,
            envMapIntensity: 2,
            blending: THREE.AdditiveBlending

        });

        this.mesh = new THREE.InstancedMesh(geometry, material, count);
        this.mesh.castShadow = true;
        this.mesh.frustumCulled = false;
        this.mesh.renderOrder = 100;
        scene.add(this.mesh);

        this.count = count;
        this.bubbleData = [];

        // Dummy matrix for updates
        this.dummy = new THREE.Object3D();

        this.initBubbles();

        // Listen for frame events
        app.addEventListener('frame', (e) => this.update(e.deltaT));
    }

    initBubbles() {
        for (let i = 0; i < this.count; i++) {
            this.resetBubble(i);
            // Randomize initial age so they don't all start at once
            this.bubbleData[i].age = Math.random() * this.bubbleData[i].life;
        }
    }

    resetBubble(i) {
        // Find a random location near the "bubbler" center or scattered
        // Let's put a bubbler at a specific reef point or random clusters
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * .51; // tight cluster

        this.bubbleData[i] = {
            pos: new THREE.Vector3(
                Math.cos(angle) * dist,
                .1, // Start just above floor
                Math.sin(angle) * dist
            ),
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                Math.random() * 0.1 + 0.3, // Upward speed
                (Math.random() - 0.5) * 0.1
            ),
            scale: Math.random() * 0.1 + 0.01,
            age: 0,
            life: Math.random() * 10 + 5,
            wiggle: Math.random() * 50,
            wiggleSpeed: Math.random() * 44 + 42
        };
    }

    update(dt) {
        let ticks = window.SimConfig.TICK_RATE || 1;
        let subDt = dt / ticks;

        for (let t = 0; t < ticks; t++) {
            this.step(subDt);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
    }

    step(dt) {
        dt *= 0.001; // ms to s

        for (let i = 0; i < this.count; i++) {
            const b = this.bubbleData[i];
            b.age += dt;

            if (b.age > b.life || b.pos.y > 50) {
                this.resetBubble(i);
                continue;
            }

            // Move up
            b.pos.addScaledVector(b.velocity, 10 * dt); // speed scale
            b.velocity.y += .003;
            b.velocity.x *= .99;
            b.velocity.z *= .99;
            // Add some zig-zag wiggle
            b.pos.x += Math.sin(b.age * b.wiggleSpeed + b.wiggle) * 0.002;
            b.pos.z += Math.cos(b.age * b.wiggleSpeed + b.wiggle) * 0.002;


            // Grow slightly over time
            const growth = 1.0 + (b.age / b.life) * 3.0;
            const currentScale = b.scale * growth;

            this.dummy.position.copy(b.pos);
            this.dummy.scale.setScalar(currentScale);
            this.dummy.updateMatrix();
            this.mesh.setMatrixAt(i, this.dummy.matrix);
        }
    }
}
