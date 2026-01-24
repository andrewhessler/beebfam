import { useEffect, useRef } from "react";

/*
  * Round as is in Mario Kart Race VS Round, not like the shape
  */
export function RoundDisplay() {
  const divRef = useRef<HTMLDivElement | null>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!baseRef.current) {
      baseRef.current = document.createElement('canvas');
      baseRef.current.width = 800;
      baseRef.current.height = 600;
      const ctx = baseRef.current.getContext("2d");
      if (!ctx) {
        throw new Error("cannot get context");
      }
      ctx.rect(0, 0, 800, 600);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(100, 75, 50, 0, 2 * Math.PI);
      ctx.fillStyle = "green";
      ctx.fill();
    }

    if (divRef.current) {
      divRef.current?.appendChild(baseRef.current);
    }
  }, [])

  return (
    <div ref={divRef}>
    </div>
  )
}
