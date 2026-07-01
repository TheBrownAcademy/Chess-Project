import React, { useRef, useEffect, useState } from "react";

// =========================================================================
// 1. CONFIGURATION (Your Tweaks)
// =========================================================================

const MOVE_DURATION = 350; 
const TRAIL_FADE_MS = 350; 
const TRAIL_LENGTH_RATIO = 1.95; 

const PIECE_THICKNESS = {
  Pawn: 0.4, 
  Knight: 0.4, 
  Bishop: 0.4, 
  Rook: 0.4, 
  Queen: 0.65, 
  King: 0.65,
};

const PIECE_ASSETS = {
  wK: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",
  wQ: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
  wR: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
  wB: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
  wN: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
  wP: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
  bK: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
  bQ: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
  bN: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
  bP: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg"
};

// =========================================================================
// 2. MATH HELPERS
// =========================================================================

const getPieceName = (code) => {
  const map = { P: 'Pawn', N: 'Knight', B: 'Bishop', R: 'Rook', Q: 'Queen', K: 'King' };
  // Fallback if code is just "P" or "wP"
  const char = code.length === 2 ? code.charAt(1) : code.charAt(0);
  return map[char] || 'Pawn';
};

const getSweptStyle = (startX, startY, endX, endY, squareSize, pieceType) => {
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx);
  
  const name = getPieceName(pieceType);
  const ratio = PIECE_THICKNESS[name] || 0.4;
  const baseThickness = squareSize * ratio;

  // Diagonal Widening Math
  const projection = Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle));
  const length = Math.sqrt(dx*dx + dy*dy);
  
  return { 
    thickness: baseThickness * projection,
    dirX: length ? dx/length : 0, 
    dirY: length ? dy/length : 0 
  };
};

// =========================================================================
// 3. ANIMATION COMPONENT
// =========================================================================

/**
 * Overlay component that sits ON TOP of the board.
 * Props:
 *  - activeMove: null | { startX, startY, targetX, targetY, pieceType }
 *  - squareSize: number (e.g., 50)
 *  - onComplete: function (called when animation finishes)
 */
export default function ChessAnimationLayer({ activeMove, squareSize = 50, onComplete }) {
  const canvasRef = useRef(null);
  
  // Local state to track the "Ghost Piece" position
  const [ghost, setGhost] = useState(null);
  
  // Animation Engine State
  const anim = useRef({ start: null, isPlaying: false });

  useEffect(() => {
    // If no move is active, clear canvas and stop
    if (!activeMove) {
      const ctx = canvasRef.current?.getContext("2d");
      if(ctx) ctx.clearRect(0, 0, 1000, 1000);
      return;
    }

    // Initialize Animation
    anim.current = { start: null, isPlaying: true };
    const { startX, startY, targetX, targetY, pieceType } = activeMove;
    const TRAIL_LEN = squareSize * TRAIL_LENGTH_RATIO;

    let reqId;
    const ctx = canvasRef.current?.getContext("2d");

    const render = (now) => {
      if (!anim.current.start) anim.current.start = now;
      const elapsed = now - anim.current.start;
      
      // 1. Calculate Phases
      const moveProgress = Math.min(elapsed / MOVE_DURATION, 1);
      const isFading = moveProgress >= 1;
      
      // 2. Interpolate Position (Ease-In-Out)
      const ease = moveProgress < 0.5 
        ? 2 * moveProgress * moveProgress 
        : 1 - Math.pow(-2 * moveProgress + 2, 2) / 2;

      let cx = startX + (targetX - startX) * ease;
      let cy = startY + (targetY - startY) * ease;
      
      // Lock position if move finished
      if (isFading) { cx = targetX; cy = targetY; }

      // Update Ghost Piece (React State)
      setGhost({ x: cx, y: cy, type: pieceType });

      // 3. Calculate Opacity (Fade Out)
      let opacity = 1.0;
      if (isFading) {
        const fadeProgress = Math.min((elapsed - MOVE_DURATION) / TRAIL_FADE_MS, 1);
        opacity = 1.0 - fadeProgress;
      }

      // 4. Draw Canvas Trail
      const dpr = window.devicePixelRatio || 1;
      // Note: We use canvas width/height from DOM ref for clearing
      if (canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width/dpr, canvasRef.current.height/dpr);
      }

      if (opacity > 0) {
        const { thickness, dirX, dirY } = getSweptStyle(startX, startY, targetX, targetY, squareSize, pieceType);
        
        const hx = cx + squareSize/2; 
        const hy = cy + squareSize/2;
        let tx = hx - dirX * TRAIL_LEN;
        let ty = hy - dirY * TRAIL_LEN;

        // "Emerge" Effect: Pin tail to start until piece moves far enough
        const dist = Math.sqrt((cx - startX)**2 + (cy - startY)**2);
        if (dist < TRAIL_LEN && !isFading) {
          tx = startX + squareSize/2; 
          ty = startY + squareSize/2;
        }

        if (dist > 1) {
          const gradient = ctx.createLinearGradient(hx, hy, tx, ty);
          const isWhite = pieceType.startsWith('w') || pieceType === 'P'; // Adjust based on your naming convention
          const colorStr = isWhite ? "255, 255, 255" : "40, 40, 40";
          
          gradient.addColorStop(0, `rgba(${colorStr}, ${0.5 * opacity})`);
          gradient.addColorStop(1, `rgba(${colorStr}, 0)`);

          ctx.beginPath();
          ctx.lineCap = "butt";
          ctx.lineWidth = thickness;
          ctx.strokeStyle = gradient;
          ctx.moveTo(hx, hy);
          ctx.lineTo(tx, ty);
          ctx.stroke();
        }
      }

      // 5. Loop Control
      if (elapsed < (MOVE_DURATION + TRAIL_FADE_MS)) {
        reqId = requestAnimationFrame(render);
      } else {
        anim.current.isPlaying = false;
        if (onComplete) onComplete();
      }
    };

    reqId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(reqId);
  }, [activeMove, squareSize, onComplete]);

  // Setup Canvas Resolution
  useEffect(() => {
    const cvs = canvasRef.current;
    if (cvs) {
      const dpr = window.devicePixelRatio || 1;
      const rect = cvs.getBoundingClientRect();
      cvs.width = rect.width * dpr;
      cvs.height = rect.height * dpr;
      cvs.getContext('2d').scale(dpr, dpr);
    }
  }, [squareSize]); // Resize if square size changes

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 99 }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      {ghost && (
        <img 
          src={PIECE_ASSETS[ghost.type]} 
          alt="" 
          style={{
            position: 'absolute',
            left: ghost.x,
            top: ghost.y,
            width: squareSize,
            height: squareSize,
            willChange: 'left, top',
            opacity: anim.current.isPlaying ? 1 : 0 // Hide ghost when done
          }} 
        />
      )}
    </div>
  );
}
