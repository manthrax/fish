
import CausticShader from "./CausticShader.js"

let CAUSTICS = true;
let HUE_SHIFT = true;

class FishShader {
    constructor(app) {
        let {THREE, App3} = app;
        FishShader.causticUniform = {
            value: null // caustics.texture
        }

        FishShader.timeUniform = {
            value: performance.now()
        }
        FishShader.paramUniform = {
            value: new THREE.Vector4(4.,.006,.03)//freq,rate,mag
        }

        let caustics = new CausticShader()

        FishShader.update = (time)=>{
            FishShader.timeUniform.value = time

            caustics.update(app.renderer, time * .001)

        }

        FishShader.causticUniform.value = caustics.texture;

        FishShader.makeFishMaterial = (material)=>{

            material.onBeforeCompile = function(mat, renderer) {
                mat.vertexShader = mat.vertexShader.replace("#include <common>", `
#include <common>
uniform float time;
uniform vec4 paramUniform;

varying vec4 vWorldPosition;

                `)
                mat.vertexShader = mat.vertexShader.replace("#include <begin_vertex>", `
vec3 warped = position;

float warpFreq = paramUniform.x;//4.;
float warpRate = paramUniform.y;//.006;
float warpMag = paramUniform.z;//.02;
#ifdef USE_COLOR
    vec3 icol = color.rgb;
    warpMag *=  (icol.r*1.)+.5;
    //warpRate *= (icol.g*.5)+1.;
    warpFreq *= (icol.b*1.5)+.4;
#endif
warped.x += sin((warped.z*warpFreq)+(time*warpRate))*warpMag;
vec3 transformed = vec3( warped );

                `)

                if (1)
                    mat.vertexShader = mat.vertexShader.replace("#include <project_vertex>", `
#include <project_vertex>

vWorldPosition = vec4( warped, 1.0 );
#ifdef USE_INSTANCING
    vWorldPosition = instanceMatrix * vWorldPosition;
#endif
vWorldPosition = modelMatrix * vWorldPosition;

//vWorldPosition = (modelMatrix * vec4(warped,1.));
//mvPosition = modelViewMatrix * mvPosition;
//float vl = length(mvPosition.xy); 
//if( vl < 15.5)mvPosition*=15.5/vl;
//gl_Position = projectionMatrix * mvPosition;  

`);

                //mat.vertexShader = mat.vertexShader.replace("#include <color_vertex>","vColor = vec3( 1.0 );")  //Get rid of built in color per vertex bc we're using as DATA
                mat.fragmentShader = mat.fragmentShader.replace("#include <color_pars_fragment>", `
#include <color_pars_fragment>

uniform sampler2D tCaustic;
varying vec4 vWorldPosition;
uniform mat4 uProjectionMatrix;
vec3 hueShift(vec3 color, float hue) {
    const vec3 k = vec3(0.57735, 0.57735, 0.57735);
    float cosAngle = cos(hue);
    return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
}
`);

                if (CAUSTICS)
                    mat.fragmentShader = mat.fragmentShader.replace("#include <map_fragment>", `
#include <map_fragment>
//vUv
vec4 caustic = texture2D(tCaustic,(uProjectionMatrix * vWorldPosition).xy*.3);

diffuseColor.rgb = diffuseColor.rgb+((caustic.rgb-.5)*.5);



//diffuseColor.rgb = mix(diffuseColor.rgb,caustic.rgb,.4);
//diffuseColor.rgb = min(diffuseColor.rgb,caustic.rgb);
//diffuseColor.rgb = diffuseColor.rgb*caustic.rgb;
//diffuseColor.rgb = mix(diffuseColor.rgb*caustic.rgb,diffuseColor.rgb,.2);

`);

                if (HUE_SHIFT)
                    mat.fragmentShader = mat.fragmentShader.replace("#include <map_fragment>", `
#include <map_fragment>
diffuseColor.rgb = hueShift(diffuseColor.rgb,(vColor.g-.5)*6.282);
`)

                mat.fragmentShader = mat.fragmentShader.replace("#include <color_fragment>", ``);

                mat.uniforms.time = FishShader.timeUniform
                mat.uniforms.paramUniform = FishShader.paramUniform
                //console.log(mat.vertexShader)

                mat.uniforms.tCaustic = FishShader.causticUniform
                let pm = new THREE.Matrix4()
                mat.uniforms.uProjectionMatrix = {
                    value: pm
                }
                // pm.makeRotationAxis(new THREE.Vector3(1,1,1).normalize(),Math.PI)

                mat.vertexColors = true;
            }
        }

    }
}

/*
import {SkeletonUtils} from "https://threejs.org/examples/jsm/utils/SkeletonUtils.js"
        App3.glbLoader.load("../assets/feesh.glb", (gltf)=>{
            let spawnAnimated = (fish)=>{
                spawn(fish)
                let mixer = new THREE.AnimationMixer(fish);
                let inst = mixer.clipAction(gltf.animations[fish.userData.behavior], fish)
                inst.play();
                mixers.push(mixer)
            }
            gltf.scene.scale.multiplyScalar(3)
            spawnAnimated(gltf.scene)
            for (let i = 0; i < 10; i++) {
                let f2 = SkeletonUtils.clone(gltf.scene);
                spawnAnimated(f2)
                f2.traverse(e=>{
                    if (e.isMesh) {
                        e.material = e.material.clone();
                        e.material.color.set((Math.random() * 0x1000000) | 0x808080 | 0)
                    }
                }
                )
            }
        })
        
            mixers.map(m=>{
                m.update(e.deltaT * .001);
                let f = m.getRoot();
            }
            );
*/
/*
vec2 rotate2(vec2 v, float fi) {
        return v*mat2(cos(fi), -sin(fi), sin(fi), cos(fi));
}

// YIQ color rotation/hue shift
vec3 hueShiftYIQ(vec3 rgb, float hs) {
        float rotAngle = hs*-6.28318530718;
        const mat3 rgb2yiq = mat3(0.299, 0.596, 0.211,
        0.587, -0.274, -0.523,
        0.114, -0.322, 0.312);
        const mat3 yiq2rgb = mat3(1, 1, 1,
        0.956, -0.272, -1.106,
        0.621, -0.647, 1.703);
        vec3 yiq = rgb2yiq * rgb;
        yiq.yz = rotate2(yiq.yz,rotAngle);
        return yiq2rgb * yiq;
}


vec3 hueShiftAcc( vec3 color, float hueAdjust ){

    const vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);
    const vec3  kRGBToI      = vec3 (0.596, -0.275, -0.321);
    const vec3  kRGBToQ      = vec3 (0.212, -0.523, 0.311);

    const vec3  kYIQToR     = vec3 (1.0, 0.956, 0.621);
    const vec3  kYIQToG     = vec3 (1.0, -0.272, -0.647);
    const vec3  kYIQToB     = vec3 (1.0, -1.107, 1.704);

    float   YPrime  = dot (color, kRGBToYPrime);
    float   I       = dot (color, kRGBToI);
    float   Q       = dot (color, kRGBToQ);
    float   hue     = atan (Q, I);
    float   chroma  = sqrt (I * I + Q * Q);

    hue += hueAdjust;

    Q = chroma * sin (hue);
    I = chroma * cos (hue);

    vec3    yIQ   = vec3 (YPrime, I, Q);

    return vec3( dot (yIQ, kYIQToR), dot (yIQ, kYIQToG), dot (yIQ, kYIQToB) );

}
//diffuseColor.rgb = hueShiftYIQ(diffuseColor.rgb,(vColor.r-.5)*3.);
//diffuseColor.rgb = hueShift(diffuseColor.rgb,(vColor.r-.5)*3.);
*/

export default FishShader
