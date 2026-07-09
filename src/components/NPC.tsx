
import React, { useEffect, useRef, useState } from 'react';
import { NPCEmotion, NPCData } from '../types';

interface NPCProps {
  npc: NPCData;
  emotion: NPCEmotion;
  className?: string;
  width?: number;
  height?: number;
}

const EMOTION_MAP: Record<NPCEmotion, number> = {
  'neutral': 0,
  'curious': 1,
  'skeptical': 2,
  'happy': 3,
  'greedy': 4,
  'angry': 5,
  'sad': 6,
  'surprised': 7,
  'proud': 8,
};

const NPC: React.FC<NPCProps> = ({ npc, emotion, className = '', width = 384, height = 256 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = npc.matrixUrl;
    img.onload = () => {
      setImage(img);
      setIsLoaded(true);
    };
  }, [npc.matrixUrl]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const emotionIndex = EMOTION_MAP[emotion];
    const cellW = image.width / 3;
    const cellH = image.height / 3;
    const row = Math.floor(emotionIndex / 3);
    const col = emotionIndex % 3;

    // Calculate aspect ratios to prevent stretching
    const cellAspect = cellW / cellH;
    const canvasAspect = canvas.width / canvas.height;

    let drawW = canvas.width;
    let drawH = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    if (cellAspect > canvasAspect) {
      // Source is wider than canvas - fit to width (contain)
      drawW = canvas.width * 0.95;
      drawH = drawW / cellAspect;
      offsetX = (canvas.width - drawW) / 2;
      offsetY = canvas.height - drawH; // Bottom align
    } else {
      // Source is taller than canvas - fit to height (contain)
      drawH = canvas.height * 0.95;
      drawW = drawH * cellAspect;
      offsetX = (canvas.width - drawW) / 2;
      offsetY = canvas.height - drawH; // Bottom align
    }

    // Clear and draw the specific cell
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      image,
      col * cellW, row * cellH, cellW, cellH,
      offsetX, offsetY, drawW, drawH
    );

    // Chroma key: Remove green background
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Standard chroma key logic (Green Screen)
      // We check if Green is significantly higher than Red and Blue
      // and if the overall color is "greenish"

      const maxRB = Math.max(r, b);

      // If green is the dominant color and significantly higher than others
      // We use a more aggressive threshold for "pure" green (#00FF00)
      // but also handle other shades.

      // Distance from pure green (0, 255, 0)
      // Or just check if G > R and G > B

      if (g > r * 1.1 && g > b * 1.1 && g > 50) {
          // It's likely green. Let's calculate alpha based on how "green" it is.
          const diff = g - maxRB;

          if (diff > 20) {
              data[i + 3] = 0; // Fully transparent
          } else if (diff > 5) {
              // Soft edge
              const alpha = 1 - (diff - 5) / 15;
              data[i + 3] = Math.min(data[i + 3], alpha * 255);
              // Spill suppression
              data[i + 1] = maxRB;
          }
      }

      // Additional check for the specific #00FF00 chroma key green
      // which might have some compression artifacts
      if (g > 180 && r < 120 && b < 120) {
          data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
}, [image, emotion, width, height]);

return (
  <div className={`relative overflow-hidden rounded-lg border-2 border-stone-800 bg-stone-900 shadow-2xl ${className}`} style={!className.includes('w-') ? { width, height } : {}}>
    {/* Background Image - Slightly wider viewport effect */}
    {npc.backgroundUrl && (
      <div
        className="absolute inset-0 bg-cover bg-center opacity-100 scale-110"
        style={{ backgroundImage: `url(${npc.backgroundUrl})` }}
      />
    )}

      {/* Character Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`relative z-10 w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Name Tag */}
      <div className="absolute bottom-2 left-2 z-20 bg-stone-900/80 backdrop-blur-sm px-2 py-0.5 rounded border border-amber-500/30">
        <span className="text-[10px] font-mono text-amber-500 uppercase tracking-tighter">{npc.name}</span>
      </div>
    </div>
  );
};

export default NPC;
