import*as THREE from "three"

class InstanceCache {
    constructor(geometry, material, startingCount) {
        const mesh = (this.mesh = new THREE.InstancedMesh(geometry.clone(),material.clone(),startingCount));
        mesh.frustumCulled = false;
        mesh.userData.max = startingCount;
        mesh.count = 0;
        mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

        let m = new Float32Array(startingCount * 3)
        for (let i = 0; i < m.length; i++)
            m[i] = Math.random()
        mesh.instanceColors = new THREE.InstancedBufferAttribute(m,3)
        mesh.geometry.setAttribute('color', mesh.instanceColors);
        mesh.material.vertexColors = true;
        //mesh.castShadow = mesh.receiveShadow = true;
    }
    alloc() {
        let mesh = this.mesh;
        if (mesh.count == mesh.userData.max) {
            let nmesh = new THREE.InstancedMesh(mesh.geometry,mesh.material,mesh.count * 2);
            mesh.frustumCulled = false;
            nmesh.copy(mesh);
            nmesh.userData.max = mesh.userData.max *= 2;
            nmesh.instanceMatrix.array = new Float32Array(mesh.instanceMatrix.array.length * 2);
            nmesh.instanceMatrix.array.set(mesh.instanceMatrix.array);
            mesh.parent.add(nmesh);
            mesh.parent.remove(mesh);
            console.log("realloc:", nmesh.instanceMatrix.array.length);

            if (mesh.material.vertexColors) {
                let m = new Float32Array(mesh.instanceColors.array.length * 2);
                nmesh.instanceColors = new THREE.InstancedBufferAttribute(m,3)
                nmesh.geometry.setAttribute('color', mesh.instanceColors);
                for (let i = m.length; i; )
                    m[--i] = Math.random()
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
        object.traverse(e=>{
            if (e.isMesh) {
                k += e.geometry.uuid;
                let im = this.instanceMeshCache[k];
                if (!im) {
                    im = this.instanceMeshCache[k] = new InstanceCache(e.geometry.clone(),e.material.clone(),4096);
                    this.instanceMeshRoot.add(im.mesh);
                    im.mesh.material.vertexColor = true;
                    im.mesh.castShadow = e.castShadow
                    im.mesh.receiveShadow = e.receiveShadow
                }
                object.userData.instanceIndex = im.alloc();
                object.updateMatrixWorld();
                object.instancedMesh = im;
                //im.mesh.setMatrixAt(object.userData.instanceIndex, object.matrix);
                object.updateInstanceMatrix = function() {
                    this.instancedMesh.mesh.setMatrixAt(this.userData.instanceIndex, this.matrixWorld);
                    this.instancedMesh.mesh.instanceMatrix.needsUpdate = true;
                }
                object.setInstanceColor = function(cr) {
                    let id = this.userData.instanceIndex * 3;
                    let ca = this.instancedMesh.mesh.instanceColors.array
                    if (typeof cr === 'number') {
                        ca[id] = ((cr / 65536) & 255) / 255
                        ca[id + 1] = ((cr / 256) & 255) / 255
                        ca[id + 2] = (cr & 255) / 255
                    } else {
                        ca[id] = cr.x;
                        ca[id + 1] = cr.y;
                        ca[id + 2] = cr.z;
                    }
                    this.instancedMesh.mesh.instanceColors.needsUpdate = true;
                }
                object.updateInstanceMatrix();
            }
        }
        );

    }
    add(object) {
        this.objects.add(object);
        let elem = this.cacheObject(object);
    }
    remove(object) {
        return this.objects.remove(object);
    }
}

export {InstanceGroup, InstanceCache};
