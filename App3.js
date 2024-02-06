import*as THREE from "three"
import {OrbitControls} from "three/addons/controls/OrbitControls.js"
import {DRACOLoader} from "three/addons/loaders/DRACOLoader.js"
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js"

export default class App3 {
    constructor() {
        let renderer = this.renderer = new THREE.WebGLRenderer({
            antialias: true,
        });

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        var gl = renderer.getContext();
        var debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        try {
            var vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            var gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            console.log(vendor, gpu);
        } catch (err) {
            gpu = "NVIDIA";
        }
        let c = this.domElement = renderer.domElement

        c.style.position = 'absolute'
        c.style.left = '0px'
        c.style.top = '0px'
        document.body.appendChild(c)
        let camera = this.camera = new THREE.PerspectiveCamera(25)
        let scene = this.scene = new THREE.Scene();
        let controls = this.controls = new OrbitControls(camera,c);
        controls.enableDamping = true
        controls.dampingFactor = .33

        controls.autoRotate = true;
        controls.autoRotateSpeed = .1;
        camera.position.set(0, 0, 70)
        camera.lookAt(scene.position)
        scene.add(camera)

        controls.target.y = camera.position.y = 25
        let checkResize = ()=>{
            if ((c.width != window.innerWidth) || (c.height !== window.innerHeight)) {
                renderer.setSize(window.innerWidth, window.innerHeight, false)
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
            }
        }
        let frameEvt = new Event('frame')
        let lastTime = performance.now();
        checkResize();
        renderer.render(scene, camera)
        this.renderLoop = (time)=>{
            checkResize();
            frameEvt.time = time;
            frameEvt.deltaT = time - lastTime;
            lastTime = time;
            document.dispatchEvent(frameEvt)
            controls.update();
            renderer.render(scene, camera)
        }

        this.startRendering = ()=>renderer.setAnimationLoop(this.renderLoop);
        this.removeEventListener = (evt,fn)=>document.removeEventListener(evt, fn)
        this.addEventListener = (evt,fn)=>document.addEventListener(evt, fn)
        this.dispatchEvent = (evt)=>document.dispatchEvent(evt)

        this.interaction = new Interaction3(this)
    }
}

App3.THREE = THREE;

App3.glbLoader = new GLTFLoader()
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://threejs.org/examples/jsm/libs/draco/');
App3.glbLoader.setDRACOLoader(dracoLoader);
App3.getApp = ()=>{
    return App3.app || (App3.app = new App3())
}

let loadPhase = 0;

App3.startLoadPhase = (count=1)=>{
    loadPhase += count
}
App3.loadPhaseComplete = (count=1)=>{
    loadPhase -= count;
    if (loadPhase == 0) {
        let app = App3.getApp()
        let fadeEvt = new Event('fadeIn')
        app.dispatchEvent(fadeEvt)
        let m = App3.fadePlane = new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({
            color: 'black',
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1
        }))

        m.position.z = app.camera.near * -1.1
        app.camera.add(m)
        let fadeRate = .001
        let fev = (e)=>{
            m.material.opacity -= fadeRate;
            fadeRate *= 1.03
            if (m.material.opacity <= 0) {
                m.parent.remove(m)
                app.removeEventListener('frame', fev)
            }
        }
        app.addEventListener('frame', fev);

        app.renderer.compile(app.scene, app.camera);
        app.startRendering();
    } else if (loadPhase < 0) {
        console.warn("Load phase imbalance.. plz increment loadPhase?")
    }
}

class Interaction3 {
    constructor(app) {
        let {scene, camera} = app;
        let dragStart = new THREE.Vector2();
        let dragEnd = new THREE.Vector2();
        let moveEvent = new Event('canvasMouseMove')
        let dragEvent = new Event('canvasDrag')
        dragEvent.dragStart = moveEvent.dragStart = dragStart;
        dragEvent.dragEnd = moveEvent.dragEnd = dragEnd;
        let iroot = document;
        let el1, el2;

        let fireMove = (evt)=>{
            if (evt.buttons)
                return false;
            moveEvent.srcEvent = evt;
            dragStart.set(evt.x, evt.y)
            moveEvent.buttons = evt.buttons;
            document.dispatchEvent(moveEvent)
            return true;
        }

        iroot.addEventListener('mousemove', fireMove)

        iroot.addEventListener('mousedown', (evt)=>{
            //if(evt.buttons==1)controls.enabled = false;
            dragStart.set(evt.x, evt.y)
            let fireDrag = (evt)=>{
                dragEvent.srcEvent = evt;
                dragEnd.set(evt.x, evt.y)
                dragEvent.buttons = evt.buttons;
                document.dispatchEvent(dragEvent)
            }
            iroot.addEventListener('mousemove', fireDrag)
            let el2 = (evt)=>{
                //controls.enabled = false;
                iroot.removeEventListener('mousemove', fireDrag)
                iroot.removeEventListener('mouseup', el2)
                fireDrag(evt)
            }
            iroot.addEventListener('mouseup', el2)
            fireDrag(evt)
        }
        )
        let raycaster = this.raycaster = new THREE.Raycaster();
        raycaster.params.Line.threshold = .05;
        let castp = new THREE.Vector2()
        this.raycastPixel = (pix,objects=scene.children)=>{
            let c = app.domElement;
            castp.set((pix.x / c.width) * 2 - 1., -(pix.y / c.height) * 2 + 1.)
            raycaster.setFromCamera(castp, camera);
            return raycaster.intersectObjects(objects);
        }
    }
}
