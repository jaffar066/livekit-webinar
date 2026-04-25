'use client';
import React, { useEffect, useRef, useState } from 'react';
import { FiDownload, FiX, FiRotateCcw, FiRotateCw } from 'react-icons/fi';

type Tool = 'pen' | 'eraser' | 'rect' | 'circle' | 'line';

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
}

const COLORS = [
  '#000000', '#1e40af', '#7c3aed', '#9ca3af',
  '#dc2626', '#16a34a', '#ea580c', '#ffffff'
];

const SIZES = [1, 3, 6];
const OPACITIES = [25, 50, 100];

export function WhiteboardPanel({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [opacity, setOpacity] = useState(100);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  const drawingStateRef = useRef<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
  });
  const snapshotDataRef = useRef<ImageData | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    contextRef.current = context;

    // Save initial state
    setHistory([canvas.toDataURL()]);
    setHistoryStep(0);

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = width;
      canvas.height = height;
      context.putImageData(imageData, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveSnapshot = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (canvas && ctx) {
      snapshotDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const restoreSnapshot = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx || !snapshotDataRef.current) return;

    ctx.putImageData(snapshotDataRef.current, 0, 0);
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    drawingStateRef.current = {
      isDrawing: true,
      startX: offsetX,
      startY: offsetY,
    };

    saveSnapshot();

    if (tool === 'pen') {
      ctx.globalAlpha = opacity / 100;
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
    } else if (tool === 'eraser') {
      ctx.globalAlpha = 1;
      ctx.clearRect(offsetX - (brushSize * 3), offsetY - (brushSize * 3), brushSize * 6, brushSize * 6);
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx || !drawingStateRef.current.isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    if (tool === 'pen') {
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.clearRect(offsetX - (brushSize * 3), offsetY - (brushSize * 3), brushSize * 6, brushSize * 6);
    } else {
      // For shapes, restore snapshot and draw preview
      restoreSnapshot();

      ctx.globalAlpha = opacity / 100;
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const { startX, startY } = drawingStateRef.current;
      const width = offsetX - startX;
      const height = offsetY - startY;

      if (tool === 'rect') {
        ctx.strokeRect(startX, startY, width, height);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(width * width + height * height) / 2;
        const centerX = startX + width / 2;
        const centerY = startY + height / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }
  };

  const stopDrawing = (e:React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    if (!drawingStateRef.current.isDrawing) return;

    drawingStateRef.current.isDrawing = false;
    canvas.releasePointerCapture(e.pointerId);
    ctx.globalAlpha = 1;

    // Save to history
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx || historyStep <= 0) return;

    const newStep = historyStep - 1;
    setHistoryStep(newStep);

    const img = new Image();
    img.src = history[newStep];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const redo = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx || historyStep >= history.length - 1) return;

    const newStep = historyStep + 1;
    setHistoryStep(newStep);

    const img = new Image();
    img.src = history[newStep];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'whiteboard.png';
    link.click();
  };

  const toolBtn = (active: boolean): React.CSSProperties => ({
    width: 42,
    height: 42,
    borderRadius: 8,
    border: 'none',
    background: active ? '#6366f1' : 'transparent',
    color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    fontSize: 18,
  });

  const divider = (
    <div
      style={{
        width: 28,
        height: 1,
        background: 'rgba(255,255,255,0.15)',
        margin: '6px auto',
      }}
    />
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        padding: '20px',
      }}
    >
      {/* Modal Container */}
      <div
        style={{
          display: 'flex',
          width: '90%',
          maxWidth: '1200px',
          height: '80vh',
          maxHeight: '720px',
          background: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Left Sidebar */}
        <div
          style={{
            width: 72,
            flexShrink: 0,
            background: '#1a1f3a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '12px 8px',
            gap: 2,
            overflowY: 'auto',
            borderRight: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Tools */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'pen' as Tool, icon: '✏️', title: 'Pen' },
              { id: 'eraser' as Tool, icon: '🧹', title: 'Eraser' },
              { id: 'rect' as Tool, icon: '▭', title: 'Rectangle' },
              { id: 'circle' as Tool, icon: '◯', title: 'Circle' },
              { id: 'line' as Tool, icon: '╱', title: 'Line' },
            ].map(({ id, icon, title }) => (
              <button
                key={id}
                onClick={() => setTool(id)}
                title={title}
                style={toolBtn(tool === id)}
              >
                {icon}
              </button>
            ))}
          </div>

          {divider}

          {/* Colors */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 4,
            }}
          >
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  if (tool === 'eraser') setTool('pen');
                }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: color === c ? '2px solid #6366f1' : '2px solid transparent',
                  background: c,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title={`Color ${c}`}
              />
            ))}
          </div>

          {divider}

          {/* Sizes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => setBrushSize(s)}
                style={{
                  ...toolBtn(brushSize === s),
                  width: 42,
                  height: 32,
                }}
              >
                <div
                  style={{
                    width: Math.max(3, s * 2.5),
                    height: Math.max(3, s * 2.5),
                    borderRadius: '50%',
                    background: brushSize === s ? '#fff' : 'rgba(255,255,255,0.45)',
                  }}
                />
              </button>
            ))}
          </div>

          {divider}

          {/* Opacity */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {OPACITIES.map((o) => (
              <button
                key={o}
                onClick={() => setOpacity(o)}
                style={{
                  ...toolBtn(opacity === o),
                  width: 42,
                  height: 26,
                  fontSize: 9,
                  fontWeight: 600,
                }}
              >
                {o}%
              </button>
            ))}
          </div>

          {divider}

          {/* Undo/Redo */}
          <button
            onClick={undo}
            title="Undo"
            style={{
              ...toolBtn(false),
              opacity: historyStep > 0 ? 1 : 0.3,
            }}
          >
            <FiRotateCcw size={16} />
          </button>
          <button
            onClick={redo}
            title="Redo"
            style={{
              ...toolBtn(false),
              opacity: historyStep < history.length - 1 ? 1 : 0.3,
            }}
          >
            <FiRotateCw size={16} />
          </button>

          {/* Active Color Swatch */}
          <div style={{ marginTop: 'auto', paddingBottom: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                background: color,
                border: '2px solid rgba(255,255,255,0.2)',
              }}
            />
          </div>
        </div>

        {/* Canvas Area */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top Action Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              background: '#fafafa',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
              Whiteboard
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <button
                onClick={clear}
                title="Clear"
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  background: '#ffffff',
                  color: '#555',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
              >
                Clear
              </button>
              <button
                onClick={download}
                title="Download"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  background: '#ffffff',
                  color: '#555',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <FiDownload size={16} />
              </button>
              <button
                onClick={onClose}
                title="Close"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <FiX size={16} />
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              background: '#ffffff',
            }}
            ref={containerRef}
          >
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                cursor: 'crosshair',
                touchAction: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhiteboardPanel;