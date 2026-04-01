
import CausticShader from "./CausticShader.js"
import FishShader from "./FishShader.js"

class FishTank {
    constructor(app) {
        let { THREE, App3 } = app;
        this.THREE = THREE;
        this.App3 = App3;
        let fogColor = `#57a5ed`//#050c0d`;//'#57a5edff
        app.scene.fog = new THREE.Fog(fogColor, 100, 600);



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
            this.duneMesh = m;
            m.material.color.set(window.SimConfig.duneColor)          /// Sand color
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
                tex.mapping = THREE.EquirectangularReflectionMapping;
                app.scene.environment = tex;
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
            App3.glbLoader.load(app.assetRoot + "assets/coral.glb", async (coralGltf) => {
                let { LoopSubdivision } = await import("three-subdivide");
                let BufferGeometryUtils = await import("three/addons/utils/BufferGeometryUtils.js");
                let subdivParams = {
                    split: false,
                    uvSmooth: false,
                    preserveEdges: false,
                    flatOnly: false,
                    maxTriangles: Infinity
                };

                this.coralTemplates = [];
                let geometryCache = new Map();
                let materialCache = new Map();

                coralGltf.scene.traverse(e => {
                    if (e.isMesh) {
                        // Process identical geometries only once
                        if (!geometryCache.has(e.geometry)) {
                            /*
                            let g = LoopSubdivision.modify(e.geometry, 1, subdivParams);
                            g = BufferGeometryUtils.mergeVertices(g);
                            g.computeVertexNormals();
                            g.computeBoundingSphere();
                            geometryCache.set(e.geometry, g);
                        */
                            geometryCache.set(e.geometry, e.geometry);
                        }
                        e.geometry = geometryCache.get(e.geometry);

                        // Process identical materials only once
                        let processMat = (m) => {
                            if (!materialCache.has(m)) {
                                let mClone = m.clone();
                                this.applyCausticsToMaterial(mClone);
                                materialCache.set(m, mClone);
                            }
                            return materialCache.get(m);
                        };

                        if (Array.isArray(e.material)) {
                            e.material = e.material.map(processMat);
                        } else {
                            e.material = processMat(e.material);
                        }

                        this.coralTemplates.push(e);
                    }
                });

                this.rebuildCorals = () => {
                    if (!this.coralTemplates || this.coralTemplates.length === 0) return;

                    if (this.coralGroup) app.scene.remove(this.coralGroup);
                    this.coralGroup = new THREE.Group();
                    app.scene.add(this.coralGroup);

                    Math.random = Math.seededRandom(window.SimConfig.SEED + 100);
                    let count = window.SimConfig.CORAL_COUNT;
                    let scaleBase = window.SimConfig.CORAL_SCALE;
                    let scaleVar = window.SimConfig.CORAL_SCALE_VAR;

                    for (let i = 0; i < count; i++) {
                        let coralTemplate = this.coralTemplates[Math.floor(Math.random() * this.coralTemplates.length)];
                        let coral = coralTemplate.clone();

                        let angle = Math.random() * Math.PI * 2;
                        let dist = Math.random() * 125 + 15;
                        coral.position.set(Math.cos(angle) * dist, -.5, Math.sin(angle) * dist);
                        coral.rotation.y = Math.random() * Math.PI * 2;

                        coral.scale.setScalar(Math.random() * scaleVar + scaleBase);
                        coral.castShadow = true;
                        coral.receiveShadow = true;
                        this.coralGroup.add(coral);
                        coral.updateMatrixWorld(true);
                        coral.matrixAutoUpdate = coral.matrixWorldAutoUpdate = false;
                    }
                };
                this.rebuildCorals();
            });

            App3.loadPhaseComplete()
        })


        //--------------------------


    }

    applyCausticsToMaterial(material) {
        material.customProgramCacheKey = function () {
            return "caustics_coral";
        };
        material.onBeforeCompile = (shader) => {
            // Use the same shared texture as the fish and floors
            shader.uniforms.tCaustic = FishShader.causticUniform;
            shader.uniforms.uProjectionMatrix = { value: new this.THREE.Matrix4() };

            shader.vertexShader = shader.vertexShader.replace("#include <common>", `
#include <common>
varying vec3 vCausticWorldPos;
            `);

            // Capture the world position after all transforms are applied
            shader.vertexShader = shader.vertexShader.replace("#include <worldpos_vertex>", `
#include <worldpos_vertex>
vCausticWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
            `);

            shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `
#include <common>
uniform sampler2D tCaustic;
varying vec3 vCausticWorldPos;
uniform mat4 uProjectionMatrix;
            `);

            // Use the recalculated factor (0.0125) to match the seafloor UVs/repeat exactly
            shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
#include <map_fragment>
vec4 causticCol = texture2D(tCaustic, vCausticWorldPos.xz * 0.0125);
// Height-based attenuation. Seafloor is around -5 to -10, surface is around 40-50.
float heightFactor = smoothstep(-5.0, 40.0, vCausticWorldPos.y);
float causticIntensity = mix(1., 1., heightFactor);

// Mute the caustics at depth: fade towards white (no shadow effect) or fade the additive portion.
vec3 blendedCaustic = mix(vec3(1.0), causticCol.rgb + 0.05, causticIntensity);
diffuseColor.rgb = min(diffuseColor.rgb, blendedCaustic);
            `);
        };
    }
}

export default FishTank