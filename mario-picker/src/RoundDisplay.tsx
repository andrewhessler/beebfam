import { useEffect, useRef } from "react";

const vsSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fsSource = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_seed;

  #define NUM_BALLS 100

  vec3 hsb2rgb(in vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    rgb = rgb * rgb * (3.0 - 2.0 * rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
  }

  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                     + i.x + vec3(0.0, i1.x, 1.0 ));
                     vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                             dot(x12.zw,x12.zw)), 0.0);
                     m = m*m ;
                     m = m*m ;
                     vec3 x = 2.0 * fract(p * C.www) - 1.0;
                     vec3 h = abs(x) - 0.5;
                     vec3 ox = floor(x + 0.5);
                     vec3 a0 = x - ox;
                     m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                     vec3 g;
                     g.x  = a0.x  * x0.x  + h.x  * x0.y;
                     g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                     return 130.0 * dot(m, g);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;
    st.x *= aspect;
    
    float field = 0.0;
    for (int i = 0; i < NUM_BALLS; i++) {
      float fi = float(i) + u_seed * 100.0;
      vec2 pos = vec2(
        0.5 + 0.6 * snoise(vec2(u_time * 0.01, fi)),
        0.5 + 0.6 * snoise(vec2(u_time * 0.01 + 50.0, fi))
      );
      pos.x *= aspect;
      float r = (0.09) + 0.03 * sin(fi * 2.0);
      vec2 aspect_dist = st - pos;
      field += (r * r) / dot(aspect_dist, aspect_dist);
    }
    
    float blob = smoothstep(0.97, 1.03, field);
    
    vec3 color = mix(vec3(0.1, 0.1, 0.2), vec3(0.2, 0.8, 0.4), blob);
    color += 0.1 * smoothstep(1.0, 2.0, field);  // brighter in center
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 100;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)!;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Couldn't compile shader", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, shaders: WebGLShader[]): WebGLProgram | null {
  const program = gl.createProgram()!;
  for (const shader of shaders) {
    gl.attachShader(program, shader);
  }

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Couldn't link program", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function RoundDisplay({ seed = 0 }: { seed?: number }) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const div = divRef.current;
    if (baseRef.current) {
      return;
    }
    baseRef.current = document.createElement('canvas');
    baseRef.current.width = CANVAS_WIDTH;
    baseRef.current.height = CANVAS_HEIGHT;

    if (div) {
      div.appendChild(baseRef.current);
    }

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = baseRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mouseRef.current.x = (e.clientX - rect.left) * scaleX;
      mouseRef.current.y = canvas.height - (e.clientY - rect.top) * scaleY;
    };

    baseRef.current.addEventListener('mousemove', handleMouseMove);

    const gl = baseRef.current.getContext("webgl");
    if (!gl) {
      throw new Error("cannot get context");
    }
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const program = createProgram(gl, [vertexShader!, fragmentShader!]);

    if (!program) {
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
      1, -1,
      -1, 1,
      -1, 1,
      1, -1,
      1, 1,
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resLocation = gl.getUniformLocation(program, "u_resolution");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");
    const seedLocation = gl.getUniformLocation(program, "u_seed");

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let animationId: number;
    const startTime = performance.now();

    function render() {
      if (!gl) return;

      const elapsed = (performance.now() - startTime) / 1000;
      gl.uniform1f(timeLocation, elapsed);
      gl.uniform2f(resLocation, CANVAS_WIDTH, CANVAS_HEIGHT);
      gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y);
      gl.uniform1f(seedLocation, seed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationId);
      baseRef.current?.removeEventListener('mousemove', handleMouseMove);
      // strict mode shenanigans clean up
      if (baseRef.current && div) {
        div.removeChild(baseRef.current);
      }
      baseRef.current = null;
    }
  }, [])

  return (
    <div ref={divRef}>
    </div>
  )
}
