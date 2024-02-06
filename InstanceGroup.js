import*as THREE from "three"

class InstanceCache {
  constructor(geometry, material, startingCount) {
    const mesh = (this.mesh = new THREE.InstancedMesh(
      geometry.clone(),
      material.clone(),
      startingCount
    ));
      mesh.frustumCulled = false;
    mesh.userData.max = startingCount;
    mesh.count = 0;
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);


let m = new Float32Array( startingCount*3 )
for(let i=0;i<m.length;i++)m[i]=Math.random()
    mesh.instanceColors = new THREE.InstancedBufferAttribute( m, 3 )
    mesh.geometry.setAttribute( 'color', mesh.instanceColors);
mesh.material.vertexColors = true;
    //mesh.castShadow = mesh.receiveShadow = true;
  }
  alloc() {
    let mesh = this.mesh;
    if (mesh.count == mesh.userData.max) {
      let nmesh = new THREE.InstancedMesh(
        mesh.geometry,
        mesh.material,
        mesh.count * 2
      );
      mesh.frustumCulled = false;
      nmesh.copy(mesh);
      nmesh.userData.max = mesh.userData.max *= 2;
      nmesh.instanceMatrix.array = new Float32Array(
        mesh.instanceMatrix.array.length * 2
      );
      nmesh.instanceMatrix.array.set(mesh.instanceMatrix.array);
      mesh.parent.add(nmesh);
      mesh.parent.remove(mesh);
      console.log("realloc:", nmesh.instanceMatrix.array.length);
  
      if(mesh.material.vertexColors){
            let m  = new Float32Array(mesh.instanceColors.array.length * 2);
            nmesh.instanceColors = new THREE.InstancedBufferAttribute( m, 3 )
            nmesh.geometry.setAttribute( 'color', mesh.instanceColors);
            for(let i=m.length;i;)m[--i]=Math.random()
            nmesh.instanceColors.array.set(mesh.instanceColors.array);
      }
      //nmesh.instanceColors.needsUpdate = true;
      mesh = this.mesh = nmesh;
    }
    return ++mesh.count - 1;
  }
}

class InstanceGroup extends THREE.Object3D {
  constructor() {
    super();
    this.instances = [];
    this.instanceMeshRoot = new THREE.Group();
    this.instanceMeshCache = {};
    this.objects = new THREE.Group();

    let instanced = true;
    if (instanced) {
      THREE.Object3D.prototype.add.call(this, this.instanceMeshRoot);
      this.objects.visible = false;
    } else {
      THREE.Object3D.prototype.add.call(this, this.objects);
      this.instanceMeshRoot.visible = false;
    }
    //this.visible = false;
  }
  cacheObject(object) {
    let k = "";
    let root = this;
    //debugger
    object.traverse(e => {
      if (e.isMesh) {
        k += e.geometry.uuid;
        let im = this.instanceMeshCache[k];
        if (!im) {
          im = this.instanceMeshCache[k] = new InstanceCache(
            e.geometry.clone(),
            e.material.clone(),
            4096
          );
          this.instanceMeshRoot.add(im.mesh);
          im.mesh.material.vertexColor = true;
          im.mesh.castShadow = e.castShadow
          im.mesh.receiveShadow = e.receiveShadow
        }
        object.userData.instanceIndex = im.alloc();
        object.updateMatrixWorld();
        object.instancedMesh = im;
        //im.mesh.setMatrixAt(object.userData.instanceIndex, object.matrix);
        object.updateInstanceMatrix=function(){
            this.instancedMesh.mesh.setMatrixAt(this.userData.instanceIndex, this.matrixWorld);
            this.instancedMesh.mesh.instanceMatrix.needsUpdate = true;
        }
        object.setInstanceColor=function(cr){
          let id =this.userData.instanceIndex*3;
          let ca = this.instancedMesh.mesh.instanceColors.array
          if(typeof cr==='number'){
            ca[id]=((cr/65536)&255)/255
            ca[id+1]=((cr/256)&255)/255
            ca[id+2]=(cr&255)/255
          }else{
            ca[id]=cr.x;
            ca[id+1]=cr.y;
            ca[id+2]=cr.z;
          }
          this.instancedMesh.mesh.instanceColors.needsUpdate = true;
        }
        object.updateInstanceMatrix();
      }
    });
    //console.log(k);
  }
  add(object) {
    this.objects.add(object);
    let elem = this.cacheObject(object);
  }
  remove(object) {
    return this.objects.remove(object);
  }
}




/*




import Loaders from "./Loaders.js";






let sortTrianglesByAreaAndCreateLODDrawRanges =( geometry,options={})=> {
  if (!geometry.index) {
    let idx = geometry.attributes.position.array.length / 3;

    let arr = new Uint32Array(idx)
    for(let i=0;i<idx;i++)arr[i]=i
    
    let idxattr = new THREE.Uint32BufferAttribute(arr,1)
    geometry.setIndex(idxattr)

  }

  if (geometry.index) {
    let idx = geometry.index.array;
    let tricount = (geometry.index.count / 3) | 0;
    let tl = [];
    let vt = geometry.attributes.position.array;
    let nvt = () => new THREE.Vector3();
    let v0 = nvt();
    let v1 = nvt();
    let v2 = nvt();
    let v3 = nvt();
    let v4 = nvt();
    let getvt = (idx, v) => {
      idx *= 3;
      v.set(vt[idx], vt[idx + 1], vt[idx + 2]);
    };

    for (let i = 0; i < tricount; i++) {
      let ib = i * 3;
      getvt(idx[ib], v0);
      getvt(idx[ib + 1], v1);
      getvt(idx[ib + 2], v2);
      v3.subVectors(v2, v1);
      v4.subVectors(v0, v1);
      let area = v3.cross(v4).length() * 0.5;
      tl.push([ib, area, idx[ib], idx[ib + 1], idx[ib + 2]]);
    }
    tl = tl.sort((a, b) => b[1] - a[1]);

    let lods = options.lods || [0, 0.5, 8, 10];
    let lastar = 0;
    let outlods = [];
    //debugger
    
    for (let i = 0; i < tricount; i++) {
      let e = tl[i];
      let ei = e[0];
      let wr = i * 3;
      idx[wr++] = e[2];
      idx[wr++] = e[3];
      idx[wr++] = e[4];
      let ar = e[1];
      //for (let j = 0; j < lods.length; j++) if (ar > lods[j]) outlods[j] = i;
      for (let j = 0; j < lods.length; j++) if (ar > lods[j]) outlods[j] = i; //else outlods[j]=0
    }
    console.log("max:", tl[0][1]);
    console.log("min:", tl.pop()[1]);
    console.log("lods:", outlods);
    let maxidx = 100 * 3;
    geometry.userData.lods = {ranges:outlods,distances:options.distances||[200*200,500*500,900*900,1200*1200,Infinity]};
    //geometry.setDrawRange(0, outlods[2] * 3);
  }
};


let v0 = new THREE.Vector3();
let v1 = new THREE.Vector3();
function lodFn(renderer, scene, camera, geometry, mat) {
  let mesh = this;
  let lods = geometry.userData.lods;
  if (lods) {
    camera.localToWorld(v0.set(0, 0, 0));
    mesh.localToWorld(v1.set(0, 0, 0));
    v0.sub(v1);
   // debugger
    let ranges = lods.ranges;
    let distances = lods.distances;
    let ls = v0.lengthSq();
    let id = 0;//ranges.length-1;
    //debugger
    for(let i=0;i<distances.length;i++)if(ls<distances[i]){id=i;break}
//    if (ls > 250 * 250) id = 1;
//    if (ls > 400 * 400) id = 2;
//    if (ls > 800 * 800) id = 3;
    id=Math.min(id,ranges.length)
   // id=1;
  //  id=ranges.length-1
    geometry.setDrawRange(0, ranges[id] * 3); //geometry.index.count/2; ((Math.random()*2)|0)+1
  }
}














InstanceGroup.test = function(scene, camera) {
  let buildTasks = [];
  let prefabs;
  let list = [0, 1, 3, 4, 5];
  let buildSector = (tx, ty) => {
    let container = new InstanceGroup();
    let c = container.instanceMeshRoot.children;
    scene.add(container);

    let row = 32;
    let haf = 16;

    container.position.set(tx * row * 10, 0, ty * row * 10);
    container.updateMatrixWorld();

    for (let y = 0; y < row; y++){
      for (let x = 0; x < row; x++) {
        let e = prefabs[list[(Math.random() * list.length) | 0]%prefabs.length].clone();
        e.position.set((x - haf) * 10, 0, (y - haf) * 10);
        
        
        e.position.x-=e.userData.center.x
        e.position.z-=e.userData.center.z

        e.rotation.y = ((Math.random() * 4) | 0) * (Math.PI * 0.5);

//        if (Math.random() * 1000 < 100)
//          e.scale.multiplyScalar(Math.random() * 2 + 0.5);
        

       
//e.scale.multiplyScalar(.3);
//e.rotation.y+=Math.random()*Math.PI * 0.5;
//e.position.y+=1;
       
        container.add(e);
        e.updateMatrixWorld();
        e.matrixAutoUpdate = false;
      }
    }
    console.log(c.length);
    for (let i = 0; i < c.length; i++) {
      c[i].onBeforeRender = lodFn;
    }
  };
  
  let updateBuildTasks = (InstanceGroup.updateBuildTasks = () => {
    if (buildTasks.length) {
      let top = buildTasks.pop();
      buildSector(top.tx, top.ty);
    }
  });

  let groundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    new THREE.MeshStandardMaterial({ color: 0x050505, dithering: true })
  );
  groundPlane.rotation.x = -Math.PI * 0.5;
  scene.add(groundPlane);

  
  let generateLOD = (gscene,options)=>{
    
    let geoms = [];
    let meshes = [];
    let bufferMap = {};

    const testCount = 32 * 32;

    const root = new THREE.Group();
    root.rotation.x = Math.PI * -0.5;
    scene.add(root);
    gscene.traverse(e => {
      if (e.isMesh) {
        meshes.push(e);
        
        if (!bufferMap[e.geometry.uuid]) {
          //e.material.wireframe = true;
          let b = (bufferMap[e.geometry.uuid] = new InstanceCache(
            e.geometry,
            e.material,
            testCount
          ));

          sortTrianglesByAreaAndCreateLODDrawRanges(e.geometry);

          root.add(b.mesh);
          geoms.push(e.geometry);
        }
      }
    });
  }
  Loaders.load(
    //"https://cdn.glitch.com/6207bbcc-7f13-4482-b964-4799635eab42%2Ftree%20(11).glb?v=1609406588999"
    "https://cdn.glitch.com/ea2266e3-96a0-4fa8-8d0c-26852e5077d0%2Fbuildings.glb?v=1609143546254"
  ).then(gltf => {
    
  Loaders.load(
    //"https://cdn.glitch.com/6207bbcc-7f13-4482-b964-4799635eab42%2Ftree%20(11).glb?v=1609406588999"
  "https://cdn.glitch.com/6207bbcc-7f13-4482-b964-4799635eab42%2Ftree%20(12).glb?v=1609416883165"
  ).then(gltf1=>{
    generateLOD(gltf.scene)
    generateLOD(gltf1.scene)
    prefabs = gltf.scene.children.slice(0);
    let trees = gltf1.scene.children.slice(0)
    trees[0].scale.multiplyScalar(.25)
    prefabs = prefabs.concat(trees);
    
    for(let i=0;i<prefabs.length;i++){
      prefabs[i].updateMatrixWorld()
      prefabs[i].userData.bounds = new THREE.Box3().setFromObject(prefabs[i])
      prefabs[i].userData.center = prefabs[i].userData.bounds.getCenter(new THREE.Vector3())
    }
    
    if(prefabs.length){
      prefabs[0].traverse(e=>{if(e.isMesh&&e.material.transparent==true&&e.material.map){
        
    let leafMat = e.material;
        leafMat.depthWrite = true;
        leafMat.alphaTest = .5
        leafMat.roughness = .8
        leafMat.metalness = .0
      }})
    }
    
    
//debugger
    for (let ty = -2; ty <3; ty++)
      for (let tx = -2; tx <3; tx++) {
        buildTasks.push({
          tx,
          ty
        });
      }
  })

  });
};
*/
export { InstanceGroup, InstanceCache };
