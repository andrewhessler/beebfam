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

  void main() {
    vec2 st = gl_FragCoord.xy/u_resolution;

    float r = abs(sin(u_mouse.x * 0.01));
    float g = abs(sin(u_mouse.y * 0.01));
    float b = abs(sin((u_mouse.y + u_mouse.x) * 0.01));
    r = (r + st.x + st.y) / 3.0;

    if (abs(st.x - 0.5) < (0.01) + abs(sin(u_time)) * 0.1) {
      r = 0.7;
      g = 0.0;
      b = 0.7;
    }

    float mouse_rel_x = abs(u_mouse.x - gl_FragCoord.x);
    float mouse_rel_y = abs(u_mouse.y - gl_FragCoord.y);

    if (
      mouse_rel_x < 5.0 &&
      mouse_rel_y < 5.0
    ) {
      r = 1.0;
      g = 1.0;
      b = 1.0;
    }

    float offset = abs(sin(u_time * 2.0)) * 5.0;

    if (
      mouse_rel_x < 10.0 + offset && mouse_rel_x > 5.0 + offset
      &&
      mouse_rel_y < 10.0 + offset && mouse_rel_y > 5.0 + offset
    ) {
      r = 1.0;
      g = 1.0;
      b = 1.0;
    }

    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

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

/**
 * Round as is in Mario Kart Race VS Round, not like the shape
 */
export function RoundDisplay() {
  const divRef = useRef<HTMLDivElement | null>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const div = divRef.current;
    if (baseRef.current) {
      return;
    }
    baseRef.current = document.createElement('canvas');
    baseRef.current.width = 800;
    baseRef.current.height = 600;

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

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let animationId: number;
    const startTime = performance.now();

    function render() {
      if (!gl) return;

      const elapsed = (performance.now() - startTime) / 1000;
      gl.uniform1f(timeLocation, elapsed);
      gl.uniform2f(resLocation, 800, 600);
      gl.uniform2f(mouseLocation, mouseRef.current.x, mouseRef.current.y);
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
