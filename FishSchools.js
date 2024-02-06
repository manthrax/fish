
let DEBUG_SCHOOL = false

//import App3 from "./App3.js"
//let app = App3.getApp()
//let THREE = App3.THREE


let rnd = (rng=1.)=>Math.random() * rng
let srnd = (rng=1)=>(Math.random() - .5) * rng * 2
let arnd = (a)=>a[(Math.random() * a.length) | 0]
let swarmList = [];
//new Swarm();
let swarmMap = {}

let cohesion = .01;

let rndmm = (min,max)=>(Math.random() *(max-min))+min;

import FishParams from "./FishParams.js"

class FishSchool {

    constructor(app) {
        let {THREE,App3}=app;
        let spawnCenter = this.spawnCenter = new THREE.Vector3(srnd(FishParams.swarmSpawnRadius),rndmm(FishParams.oceanSurfaceY-FishParams.swarmHeight,FishParams.oceanFloorY) + 5,srnd(FishParams.swarmSpawnRadius))
        let averageCenter = this.averageCenter = new THREE.Vector3()
        let sumCenter = new THREE.Vector3()
        let averageVel = this.averageVel = new THREE.Vector3()
        let sumVel = new THREE.Vector3()
        let sumWeight = 0;

        let moveVel = new THREE.Vector3()
        let tv0 = new THREE.Vector3()
        let tv1 = new THREE.Vector3()

        let mk = new THREE.Mesh(new THREE.BoxGeometry(.2,.2,4.))
        mk.castShadow = mk.receiveShadow = true;
        let count = 0;
        DEBUG_SCHOOL && app.scene.add(mk)
        this.beginUpdate = ()=>{
            this.recompute();
            sumWeight = count = 0;
            sumCenter.copy(sumVel.set(0, 0, 0))
        }
        this.recompute = ()=>{
            if (!count)
                return;
            let irat = 1 / sumWeight
            averageCenter.copy(sumCenter).multiplyScalar(irat)
            averageVel.copy(sumVel).multiplyScalar(irat).normalize()

            //            averageCenter.set(0,20,0)
/*
            if (rnd() < .01) {
                moveVel.set(srnd(1), srnd(.5), srnd(1))
                if (moveVel.dot(averageCenter) > 0)
                    moveVel.multiplyScalar(-1);
            }
            averageCenter.add(moveVel)
*/

//Prevent swarms from moving too far away
let safeZone = 50
let ty = averageCenter.y
averageCenter.y=0;
let len = averageCenter.length()
if(len>safeZone)averageCenter.multiplyScalar(safeZone/len)
if(ty<FishParams.oceanFloorY) ty+=5;
if(ty>FishParams.oceanSurfaceY) ty-=5;
averageCenter.y=ty;
//-----------------------


            mk.lookAt(tv0.copy(averageCenter).add(averageVel));

            mk.position.copy(averageCenter)

        }
        this.update = (f)=>{
            count++;
            let state = f.userData.state
            let weight = state.size
            sumWeight += weight;
            tv0.copy(state.velocity).multiplyScalar(weight)
            sumVel.add(tv0)

            tv0.copy(f.position).multiplyScalar(weight);
            sumCenter.add(tv0)
        }
    }
}

class FishSchools {

}
;
FishSchools.beginUpdate = (time)=>{
    swarmList.forEach(e=>e.beginUpdate())
}
FishSchools.getSchool = (id,app)=>{
    let s = swarmMap[id]
    if (!s)
        swarmList.push(s = swarmMap[id] = new FishSchool(app));
    return s;
}

export default FishSchools
