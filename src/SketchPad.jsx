import { useEffect, useRef, useState } from "react";

export default function SketchPad({
  value = "",
  onChange,
  color = "#68547F",
  width = 720,
  height = 600,
}) {
  const canvasRef = useRef(null);
  const mounted = useRef(false);
  const stroke = useRef(null);
  const restoration = useRef(null);
  const imageGeneration = useRef(0);
  const paintedValue = useRef(null);
  const paintedSize = useRef(null);
  const changeHandler = useRef(onChange);
  const [hasDrawing, setHasDrawing] = useState(Boolean(value));
  changeHandler.current = onChange;

  function releasePointer(pointerId) {
    const canvas = canvasRef.current;
    try {
      if (canvas?.hasPointerCapture(pointerId))
        canvas.releasePointerCapture(pointerId);
    } catch {
      // A browser may already have released a canceled pointer.
    }
  }

  function commit() {
    if (!mounted.current || !canvasRef.current || stroke.current) return;
    const png = canvasRef.current.toDataURL("image/png");
    paintedValue.current = png;
    changeHandler.current?.(png);
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      ++imageGeneration.current;
      stroke.current = null;
      restoration.current = null;
      paintedValue.current = null;
      paintedSize.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!context) return;
    if (
      paintedValue.current === value &&
      paintedSize.current?.width === width &&
      paintedSize.current?.height === height
    )
      return;

    const previousStroke = stroke.current;
    stroke.current = null;
    if (previousStroke) releasePointer(previousStroke.pointerId);
    const generation = ++imageGeneration.current;
    paintedValue.current = value;
    paintedSize.current = { width, height };
    context.clearRect(0, 0, width, height);
    restoration.current = null;
    // Only locally produced PNGs can be restored; no image URL requests are made.
    const isLocalPNG =
      typeof value === "string" && value.startsWith("data:image/png;base64,");
    setHasDrawing(isLocalPNG);
    if (!isLocalPNG) return;

    const image = new Image();
    const pending = { loading: true, newInk: false, commitWhenReady: false };
    restoration.current = pending;
    const isCurrent = () =>
      mounted.current && generation === imageGeneration.current;
    const ready = () => {
      pending.loading = false;
      if (pending.commitWhenReady && !stroke.current) commit();
    };
    image.onload = () => {
      if (!isCurrent()) return;
      // A fast new stroke stays on top if the saved PNG finishes loading later.
      context.save();
      context.globalCompositeOperation = "destination-over";
      context.drawImage(image, 0, 0, width, height);
      context.restore();
      ready();
    };
    image.onerror = () => {
      if (!isCurrent()) return;
      if (!pending.newInk) setHasDrawing(false);
      ready();
    };
    image.src = value;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [value, width, height]);

  function point(event) {
    const bounds = canvasRef.current.getBoundingClientRect();
    return [
      ((event.clientX - bounds.left) * width) / bounds.width,
      ((event.clientY - bounds.top) * height) / bounds.height,
    ];
  }

  function start(event) {
    if (event.button !== 0 || event.isPrimary === false || stroke.current)
      return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const bounds = canvas?.getBoundingClientRect();
    if (!mounted.current || !context || !bounds.width || !bounds.height) return;
    event.preventDefault();
    const [x, y] = point(event);
    const lineWidth = Math.max(4, Math.min(6, (width / 720) * 5));
    stroke.current = { pointerId: event.pointerId, color, lineWidth, x, y };
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      /* Capture may already be unavailable. */
    }
    if (restoration.current?.loading) restoration.current.newInk = true;
    setHasDrawing(true);
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, lineWidth / 2, 0, Math.PI * 2);
    context.fill();
  }

  function move(event) {
    const current = stroke.current;
    if (!current || event.pointerId !== current.pointerId) return;
    event.preventDefault();
    const context = canvasRef.current.getContext("2d");
    const [x, y] = point(event);
    context.strokeStyle = current.color;
    context.lineWidth = current.lineWidth;
    context.lineCap = context.lineJoin = "round";
    context.beginPath();
    context.moveTo(current.x, current.y);
    context.lineTo(x, y);
    context.stroke();
    current.x = x;
    current.y = y;
  }

  function finish(event) {
    const current = stroke.current;
    if (!current || event.pointerId !== current.pointerId) return;
    stroke.current = null;
    releasePointer(current.pointerId);
    // If a saved PNG is still decoding, finish this stroke after it is composited.
    if (restoration.current?.loading)
      restoration.current.commitWhenReady = true;
    else commit();
  }

  function clear() {
    const current = stroke.current;
    stroke.current = null;
    if (current) releasePointer(current.pointerId);
    ++imageGeneration.current;
    restoration.current = null;
    canvasRef.current.getContext("2d").clearRect(0, 0, width, height);
    paintedValue.current = "";
    setHasDrawing(false);
    if (mounted.current) changeHandler.current?.("");
  }

  return (
    <div className="sketch-pad">
      <div className="drawing-surface">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={finish}
          onLostPointerCapture={finish}
          aria-label="Draw an image or symbol using your finger, stylus, or mouse. Or choose This represents... to respond in words."
        />
        {!hasDrawing && (
          <span className="drawing-placeholder" aria-hidden="true">
            Use your finger or stylus to start drawing
          </span>
        )}
      </div>
      <div className="sketch-footer">
        <span>A shape, a squiggle, anything.</span>
        <button type="button" className="text-button" onClick={clear}>
          Clear drawing
        </button>
      </div>
    </div>
  );
}
