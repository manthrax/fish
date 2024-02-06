
import CausticShader from "./CausticShader.js"
import FishShader from "./FishShader.js"
import FishSchools from "./FishSchools.js"
import FishParams from "./FishParams.js"


import CanvasRecorder from "./CanvasRecorder.js"
let canvRec;
document.addEventListener('keydown', evt=>{
    if (evt.code == 'KeyR') {
        if(canvRec){canvRec.close();canvRec=null;}
        else canvRec = new CanvasRecorder(app.renderer.domElement,null)
    }
})

import {InstanceGroup} from "./InstanceGroup.js"

//let NUM_FISH = 2000
//let HIGH_RES_FISH = true;
//let UPDATE_FISH = true;


class FishSwarm {
    constructor(app) {
let {renderer,scene,THREE,App3} = app;
        //new FishTank(app)

        App3.startLoadPhase(2)

        let igroup = new InstanceGroup()
        scene.add(igroup)
        let radius = FishParams.swarmRadius;
        let radiusY = FishParams.swarmHeight;

        let int2v3 = (i,v)=>v.set(((i / 65536) & 255) / 255, ((i / 256) & 255) / 255, (i & 255) / 255)
        this.fishList = []
        let rnd = (rng=1.)=>Math.random() * rng
        let srnd = (rng=1)=>(Math.random() - .5) * rng * 2
        let arnd = (a)=>a[(Math.random() * a.length) | 0]

let fishShader = new FishShader(app)

        App3.glbLoader.load(app.assetRoot+"assets/tropicalFeesh2.glb", (gltf)=>{
            //app.scene.add(gltf.scene)
            let meshes = []
            gltf.scene.traverse(e=>e.isMesh && (e.name.indexOf("fh") == (FishParams.HIGH_RES_FISH ? 0 : -1)) && meshes.push(e))
            gltf.scene.rotation.x = Math.PI * .5
            gltf.scene.updateMatrixWorld(true)
            meshes.forEach(m=>{
                scene.attach(m)
                scene.remove(m)
                m.scale.set(1, 1, 1)
                m.rotation.set(0, 0, 0)
                m.position.set(0, 0, 0)
                m.geometry.scale(.3, .3, .3)
                m.geometry.rotateZ(Math.PI * .5)
                m.geometry.rotateX(Math.PI * .5)

                m.material.roughness = 1;
                m.material.metalness = 0;
//m.material.map.encoding = THREE.sRGBEncoding;
                m.castShadow = m.receiveShadow = true;

                m.customDepthMaterial = m.material.clone()

                FishShader.makeFishMaterial(m.material)
            }
            )
meshes = meshes.sort((a,b)=>a.name.localeCompare(b.name))
            for (let i = 0; i < FishParams.NUM_FISH; i++) {
                let id = rnd(meshes.length) | 0
                let f = meshes[id].clone()
                f.userData.type = id;
                //let f = arnd(meshes).clone()
                let s = FishSchools.getSchool(id,app)
                f.swarm = s

                spawn(f)
            }
            let imc = igroup.instanceMeshCache;
            for (let k in imc)
                FishShader.makeFishMaterial(imc[k].mesh.material);
            App3.loadPhaseComplete()
        }
        )

        //'#40a0ea'
        let mixers = []

        let colVec = new THREE.Vector3();
let {min,max,abs} = Math;
        let rad = radius / 2
        let rady = radius / 4
        let pmod = (x,rad)=>{
            x = (x + rad) % (rad * 2);
            if (x < 0)
                x += (rad * 2);
            return x - rad;
        }
        let vmod = (v)=>{
            v.set(pmod(v.x, rad), pmod(v.y, rady), pmod(v.z, rad))
        }

        let time, deltaT
        let tv0=new THREE.Vector3()
        let tv1=new THREE.Vector3()

        let spawn = (fish)=>{
            let s = fish.userData.state = {
                start: new THREE.Vector3(),
                current: new THREE.Vector3(),
                end: new THREE.Vector3(),
                fadeEndTime: 0,
                nextChangeTime: 0,
                velocity: new THREE.Vector3(),
                normalAge: rnd()
            }
            s.size = (s.normalAge * 2.5) + .5
            s.steering = new THREE.Vector3();


                let p = FishParams[fish.userData.type]
                if(p){
                    p.baseScale && (s.size*=p.baseScale)
                }

            fish.scale.multiplyScalar(s.size)

            let rang = srnd()*Math.PI
            let rad = rnd()*radius;
            fish.position.set(Math.sin(rang)*rad, srnd(radiusY) + 5, Math.cos(rang)*rad);

            fish.position.add(fish.swarm.spawnCenter)
            fish.rotation.y += srnd(Math.PI)

                //app.scene.add(f)
                //f.updateMatrix();
                //f.updateMatrixWorld();
            this.fishList.push(fish)
                int2v3((Math.random() * 0x1000000) | 0, fish.userData.state.current)
                fish.userData.state.current.y = .5;
                igroup.add(fish);
                fish.setInstanceColor(fish.userData.state.current)
        }
        let updateOneFish = (f)=>{
            //    let b = f.userData.behavior;

            let state = f.userData.state;
            let speed = (state.current.z + .5) * state.size * .001



            state.steering.set(0.,0.)
            state.velocity.set(state.steering.x,state.steering.y, speed * deltaT).applyQuaternion(f.quaternion)

            tv1.copy(f.swarm.averageCenter).sub(f.position);

            let attraction = 0;
            if (tv1.lengthSq() > (16 ** 2))
                attraction = 1;
            else if(tv1.lengthSq() < (8 ** 2))attraction=-1
            
            f.position.y = min(FishParams.oceanSurfaceY,max(FishParams.oceanFloorY,f.position.y));
            if(attraction){
                tv1.normalize().multiplyScalar((.00001+(.00001*state.normalAge)*attraction)*deltaT)
                state.velocity.add(tv1)
                tv0.copy(f.position).add(state.velocity);
                //.sub(f.position).normalize().multiplyScalar(0.01).add(f.position)
                f.lookAt(tv0)
            }
            f.position.add(state.velocity)

            //mainSwarm.update(f)
            //vmod(f.position)

            f.swarm.update(f)


            f.updateMatrixWorld();
            f.updateInstanceMatrix && f.updateInstanceMatrix() && (f.instanceMesh.needsUpdate = true);

            if (state.nextChangeTime < time) {
                state.nextChangeTime = time + 1000 + (Math.random() * 4000)
                state.fadeDuration = 1000
                state.fadeStartTime = time
                state.fadeEndTime = time + state.fadeDuration
                
                int2v3((Math.random() * 0x1000000) | 0, tv0)

state.end.set(tv0.x,  .5 + srnd((1 - state.normalAge)*.1) , tv0.z)
            }
            if (time < state.fadeEndTime) {
                let prog = (time - state.fadeStartTime) / state.fadeDuration
                let iprog = 1 - prog;
                let s = state.start;
                let c = state.current;
                let n = state.end;
                c.set((s.x * iprog) + (n.x * prog), (s.y * iprog) + (n.y * prog), (s.z * iprog) + (n.z * prog))
                f.setInstanceColor && f.setInstanceColor(c)
            } else if (time > state.fadeStartTime) {
                state.start.copy(state.end)
                state.fadeStartTime = state.nextChangeTime
            }

        }
this.updateFish = (e)=>{
            time = e.time
            deltaT = e.deltaT * 1;
            let base = (this.fishList.length * Math.random()) | 0

            FishShader.update(time)

            FishSchools.beginUpdate(time);

            if (FishParams.UPDATE_FISH)
                this.fishList.forEach(updateOneFish)

            mixers.forEach(m=>{
                m.update(e.deltaT * .001);
                let f = m.getRoot();
            })
        }
        document.addEventListener('frame',this.updateFish)
        App3.loadPhaseComplete()
    }
}

export default FishSwarm
