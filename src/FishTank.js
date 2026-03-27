
import CausticShader from "./CausticShader.js"

class FishTank {
    constructor(app) {
        let { THREE, App3 } = app;
        let fogColor = `#57a5ed`//#050c0d`;//'#57a5edff
        app.scene.fog = new THREE.Fog(fogColor, -150, 500);



        App3.startLoadPhase()
        App3.glbLoader.load(app.assetRoot + "assets/waterdunes.glb", (gltf) => {
            let m
            gltf.scene.traverse(e => { if (e.isMesh) m = e; })
            let a = m.geometry.attributes.uv.array;
            for (let i = 0; i < a.length; i += 2) {
                a[i] *= .025;
                a[i + 1] *= .025;
            }
            m.material.map = CausticShader.texture;
            app.scene.add(m);
            m.scale.multiplyScalar(10)
            // m.position.y-= 10;
            //  m.material.color.set('#101020')
            m.material.color.set('#bcb188')          /// Sand color
            m.receiveShadow = true
            let visMesh = this.visMesh = new THREE.Mesh(new THREE.PlaneGeometry(500, 500, 100, 100), new THREE.MeshStandardMaterial({
                side: THREE.DoubleSide,
                color: '#ffffff',
                map: CausticShader.texture,
                //displacementMap: CausticShader.texture,
                displacementScale: 30,
                transparent: true,
                opacity: .99
            }))
            CausticShader.texture.repeat.set(5, 5);//.35, .35)
            visMesh.position.y += 50;
            visMesh.rotation.x = -Math.PI * .5

            new THREE.TextureLoader().load(`assets/background.jpg`, (tex) => {
                //app.renderer.environment = tex;
                //app.scene.background = tex;


                //app.scene.fog = new THREE.Fog();
                //tex.encoding = THREE.sRGBEncoding;
                tex.colorSpace = 'srgb'


                let spr = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 32), new THREE.MeshBasicMaterial({
                    map: tex,
                    side: THREE.BackSide,
                    fog: true
                }))
                app.scene.add(spr)

            })
            /*
                    let spr = new THREE.Mesh(new THREE.SphereBufferGeometry(200,32,32),new THREE.ShaderMaterial({
                        side: THREE.BackSide,
                        uniforms:{
                            uColor:{value:new THREE.Color(fogColor)}
                        }
                    }))
                    app.scene.add(spr)
                    let m = spr.material;
                    m.vertexShader = `
                    varying vec2 vUv;
                    ` + m.vertexShader.replace('gl_Position', 'vUv=uv; gl_Position')
                    m.fragmentShader = 'varying vec2 vUv;uniform vec3 uColor;' + m.fragmentShader.replace('gl_FragColor', `
                    vec3 clr = uColor;//vec3(10., 36., 38.)/160.;
                    gl_FragColor=vec4(clr,1.);//vec4(clr*vec3(min(1.,(vUv.y*1.5)-.5)),1.);
                    //`)
                    spr.renderOrder = -1;
            */
            //app.scene.background = caustics.texture
            //app.scene.background = caustics.texture

            app.scene.add(visMesh)

            app.renderer.setClearColor(fogColor)
            app.scene.fog.color.set(fogColor)


            App3.loadPhaseComplete()
        })


        //--------------------------


    }
}

export default FishTank