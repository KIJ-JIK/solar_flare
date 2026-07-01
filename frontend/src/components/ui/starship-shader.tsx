import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";

function FullscreenShader() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const { size, gl } = useThree();

  // Create a small static noise texture for iChannel0
  const noiseTexture = useMemo(() => {
    const w = 256;
    const h = 256;
    const data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h * 4; i++) data[i] = Math.floor(Math.random() * 256);
    const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }, []);

  const uniforms = useMemo(
    () => ({
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio()) },
      iChannel0: { value: noiseTexture },
    }),
    [noiseTexture, size.width, size.height, gl]
  );

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.iTime.value = clock.getElapsedTime();
    materialRef.current.uniforms.iResolution.value.set(
      size.width * gl.getPixelRatio(),
      size.height * gl.getPixelRatio()
    );
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        depthWrite={false}
        depthTest={false}
        transparent={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          precision highp float;

          uniform float iTime;
          uniform vec2 iResolution;

          // Simple hash function for pseudo-random values
          float hash(float n) {
              return fract(sin(n) * 43758.5453123);
          }

          void main() {
              // Normalize coordinate space to [-0.5, 0.5] with correct aspect ratio
              vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / min(iResolution.x, iResolution.y);
              
              // Deep space base color
              vec3 col = vec3(0.0);
              
              // Speed factor
              float t = iTime * 1.5;
              
              // Draw 4 layers of warp stars
              for (float i = 0.0; i < 4.0; i++) {
                  // Stars depth layer (from 0 to 1)
                  float depth = fract(t * 0.12 + i * 0.25);
                  
                  // Avoid division by zero at center
                  if (depth <= 0.01) continue;
                  
                  float size = mix(0.4, 0.0, depth);
                  float fade = smoothstep(0.0, 0.3, depth) * smoothstep(1.0, 0.7, depth);
                  
                  // Draw 30 stars per layer (total 120 stars)
                  for (float j = 0.0; j < 30.0; j++) {
                      float seed = i * 27.4 + j * 79.3;
                      float angle = hash(seed) * 6.28318;
                      float dist = hash(seed + 1.2) * 0.5 + 0.08;
                      
                      // Base star angle direction vectors
                      vec2 starDir = vec2(cos(angle), sin(angle));
                      vec2 starPos = starDir * dist;
                      
                      // Warp projection along radial paths
                      vec2 projectedPos = starPos / depth;
                      
                      // Calculate distance from UV pixel to star center
                      vec2 delta = uv - projectedPos;
                      
                      // Radial trail stretching based on warp depth
                      float trail = clamp(dot(delta, -starDir) * depth * 8.0, 0.0, 0.12);
                      float trailDist = length(delta + starDir * trail);
                      
                      // Star flare colors (Vivid gold, orange, and white)
                      vec3 starColor = vec3(1.0, 0.45 + 0.35 * hash(seed + 3.4), 0.15);
                      
                      // Add light intensity with strict bounds
                      col += starColor * (0.00045 * fade / (trailDist + 0.0015));
                  }
              }
              
              // Corona core glow in center
              float center = 0.008 / (length(uv) + 0.015);
              col += vec3(1.0, 0.4, 0.1) * center;
              
              // Tone mapping to prevent blown-out brightness
              col = 1.0 - exp(-col * 1.8);
              
              gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}

export const Component = () => {
  return (
    <div className={cn("flex flex-col items-center gap-4 p-0 rounded-lg w-full h-full")}>
      <Canvas orthographic camera={{ position: [0, 0, 1], zoom: 1 }} dpr={[1, 2]}>
        <color attach="background" args={["#000000"]} />
        <FullscreenShader />
      </Canvas>
    </div>
  );
};
