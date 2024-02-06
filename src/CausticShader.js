import*as THREE from "three"

class CausticShader extends THREE.ShaderMaterial {
    constructor() {
        super({vertexShader:CausticShader.vertex,fragmentShader: CausticShader.header + CausticShader.fragment,uniforms:{iTime:{value:performance.now()/1000.}}})
        let causticMesh = new THREE.Mesh(new THREE.BoxGeometry(2,2,2),this)
        causticMesh.position.z-=10;
        const rtScene = new THREE.Scene();
        rtScene.background = new THREE.Color('red');
        rtScene.add(causticMesh)
        let rtCam = new THREE.OrthographicCamera()
        rtScene.add(rtCam)
        const rtSize = 512;
        const renderTarget = new THREE.WebGLRenderTarget(rtSize,rtSize);
        

        CausticShader.texture = this.texture = renderTarget.texture;
        this.texture.wrapS = this.texture.wrapT = THREE.RepeatWrapping;


        this.update=(renderer,time)=>{
            this.uniforms.iTime.value = time;
            let saveTarg = renderer.getRenderTarget()

        //let saveEncoding = renderer.outputEncoding;
       // renderer.outputEncoding=THREE.LinearEncoding

            renderer.setRenderTarget(renderTarget)
            renderer.render(rtScene,rtCam)
            renderer.setRenderTarget(saveTarg)            
        
       // renderer.outputEncoding=saveEncoding

        }
    }
}

CausticShader.vertex=`
varying vec2 vUv;
void main(){
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);         
}            
`

CausticShader.fragment=`
void main(){
    mainImage(gl_FragColor,vUv); 
}
`
CausticShader.header=`
// Made by k-mouse (2016-11-23)
// Modified from David Hoskins (2013-07-07) and joltz0r (2013-07-04)
varying vec2 vUv;
uniform float iTime;

#define TAU 6.28318530718
       
#define TILING_FACTOR 1.0
#define MAX_ITER 8
vec2 iResolution = vec2(1.);

float waterHighlight(vec2 p, float time, float foaminess)
{
    vec2 i = vec2(p);
    float c = 0.0;
    float foaminess_factor = mix(1.0, 6.0, foaminess);
    float inten = .005 * foaminess_factor;

    for (int n = 0; n < MAX_ITER; n++) 
    {
        float t = time * (1.0 - (3.5 / float(n+1)));
        i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
        c += 1.0/length(vec2(p.x / (sin(i.x+t)),p.y / (cos(i.y+t))));
    }
    c = 0.2 + c / (inten * float(MAX_ITER));
    c = 1.17-pow(c, 1.4);
    c = pow(abs(c), 8.0);
    return c / sqrt(foaminess_factor);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord ) 
{
    float time = iTime * 0.63+123.0;
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec2 uv_square = vec2(uv.x * iResolution.x / iResolution.y, uv.y);
    float dist_center = pow(2.0*length(uv - 0.5), 2.0);

    float foaminess = smoothstep(0.4, 1.8, 0.);//dist_center);
    float clearness = 0.1 + 0.9*smoothstep(0.1, 0.5, 1.);// dist_center);

    vec2 p = mod(uv_square*TAU*TILING_FACTOR, TAU)-250.0;

    float c = waterHighlight(p, time, foaminess);

    vec3 water_color = vec3(0.0, 0.35, 0.5);
    vec3 color = vec3(c);
    color = clamp(color + water_color, 0.0, 1.0);

    color = mix(water_color, color, clearness);

    fragColor = vec4(color, 1.0);
}`

export default CausticShader;