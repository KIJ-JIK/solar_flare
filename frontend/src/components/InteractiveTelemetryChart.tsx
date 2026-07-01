import React, { useEffect, useRef, useState } from "react";

interface TelemetryPoint {
  timestamp: string;
  soft_xray_flux: number;
  hard_xray_flux: number;
  soft_bg_subtracted: number;
}

interface InteractiveTelemetryChartProps {
  data: TelemetryPoint[];
}

export function InteractiveTelemetryChart({ data }: InteractiveTelemetryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [activeDataIndex, setActiveDataIndex] = useState<number | null>(null);
  
  // Flare injection simulation state
  const [flareIntensity, setFlareIntensity] = useState(0); // 0 to 1
  const [explosionParticles, setExplosionParticles] = useState<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    alpha: number;
    life: number;
    maxLife: number;
  }>>([]);

  // Traveling photon streams along curves
  const photonStreamsRef = useRef<{
    soft: number[];
    hard: number[];
    bg: number[];
  }>({
    soft: [0.1, 0.4, 0.7],
    hard: [0.2, 0.5, 0.8],
    bg: [0.3, 0.6, 0.9]
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    setHoverX(x);
    setHoverY(y);
  };

  const handleMouseLeave = () => {
    setHoverX(null);
    setHoverY(null);
    setActiveDataIndex(null);
  };

  const triggerSolarFlare = () => {
    setFlareIntensity(1.0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let currentFlareOffset = 0;
    let activeExplosionParticles = [...explosionParticles];

    const drawChart = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const paddingLeft = 100;
      const paddingRight = 40;
      const paddingTop = 60;
      const paddingBottom = 60;

      const chartWidth = width - paddingLeft - paddingRight;
      const chartHeight = height - paddingTop - paddingBottom;

      // Draw dark grid backdrop
      ctx.fillStyle = "#010204";
      ctx.fillRect(0, 0, width, height);

      // Decaying flare intensity
      currentFlareOffset += (flareIntensity - currentFlareOffset) * 0.1;
      if (flareIntensity > 0) {
        setFlareIntensity(prev => Math.max(0, prev - 0.015));
      }

      // Modify telemetry data dynamically if flare is injected
      const displayData = data.map((d, idx) => {
        if (currentFlareOffset <= 0) return d;
        const centerIndex = Math.floor(data.length / 2);
        const dist = idx - centerIndex;
        const gaussian = Math.exp(-Math.pow(dist, 2) / 45); // Spread
        const multiplier = 1 + 25 * currentFlareOffset * gaussian;
        
        return {
          ...d,
          soft_xray_flux: d.soft_xray_flux * multiplier,
          hard_xray_flux: d.hard_xray_flux * (multiplier * 0.7),
          soft_bg_subtracted: d.soft_bg_subtracted * (multiplier * 0.4)
        };
      });

      // Find Min / Max values for Auto Scaling
      const softVals = displayData.map(d => d.soft_xray_flux);
      const hardVals = displayData.map(d => d.hard_xray_flux);
      const bgVals = displayData.map(d => d.soft_bg_subtracted);

      const maxVal = Math.max(...softVals, ...hardVals, ...bgVals) * 1.15;
      const minVal = Math.min(...softVals, ...hardVals, ...bgVals) * 0.85;

      // Map values to screen coordinates
      const getX = (index: number) => {
        return paddingLeft + (index / (displayData.length - 1)) * chartWidth;
      };

      const getY = (val: number) => {
        const logMin = Math.log10(Math.max(1e-9, minVal));
        const logMax = Math.log10(Math.max(1e-3, maxVal));
        const logVal = Math.log10(Math.max(1e-9, val));
        const norm = (logVal - logMin) / (logMax - logMin);
        return height - paddingBottom - norm * chartHeight;
      };

      // Draw Gridlines (More visible grid lines)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
      ctx.lineWidth = 1;
      
      // Horizontal grid lines & Y labels
      const horizontalDivs = 5;
      for (let i = 0; i <= horizontalDivs; i++) {
        const y = paddingTop + (i / horizontalDivs) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();

        const logMin = Math.log10(Math.max(1e-9, minVal));
        const logMax = Math.log10(Math.max(1e-3, maxVal));
        const logVal = logMax - (i / horizontalDivs) * (logMax - logMin);
        const realVal = Math.pow(10, logVal);

        // High contrast Y-axis text readings
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px 'Space Mono', Courier, monospace";
        ctx.textAlign = "right";
        ctx.fillText(realVal.toExponential(1) + " W/m²", paddingLeft - 15, y + 4);
      }

      // Vertical grid lines & X labels
      const verticalDivs = 6;
      for (let i = 0; i <= verticalDivs; i++) {
        const x = paddingLeft + (i / verticalDivs) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(x, paddingTop);
        ctx.lineTo(x, height - paddingBottom);
        ctx.stroke();

        const dataIdx = Math.floor((i / verticalDivs) * (displayData.length - 1));
        if (displayData[dataIdx]) {
          // High contrast X-axis text readings
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px 'Space Mono', Courier, monospace";
          ctx.textAlign = "center";
          ctx.fillText(displayData[dataIdx].timestamp, x, height - paddingBottom + 22);
        }
      }

      // Draw solid highlighted axis border lines
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;

      // Y-Axis line
      ctx.beginPath();
      ctx.moveTo(paddingLeft, paddingTop);
      ctx.lineTo(paddingLeft, height - paddingBottom);
      ctx.stroke();

      // X-Axis line
      ctx.beginPath();
      ctx.moveTo(paddingLeft, height - paddingBottom);
      ctx.lineTo(width - paddingRight, height - paddingBottom);
      ctx.stroke();

      // Draw lines and areas
      const drawCurve = (
        dataKey: "soft_xray_flux" | "hard_xray_flux" | "soft_bg_subtracted",
        color: string,
        strokeW: number
      ) => {
        ctx.beginPath();
        displayData.forEach((d, idx) => {
          const x = getX(idx);
          const y = getY(d[dataKey]);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeW;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(getX(0), height - paddingBottom);
        displayData.forEach((d, idx) => {
          ctx.lineTo(getX(idx), getY(d[dataKey]));
        });
        ctx.lineTo(getX(displayData.length - 1), height - paddingBottom);
        ctx.closePath();

        let areaGlow = ctx.createLinearGradient(0, paddingTop, 0, height - paddingBottom);
        areaGlow.addColorStop(0, color + "26");
        areaGlow.addColorStop(1, color + "00");
        ctx.fillStyle = areaGlow;
        ctx.fill();
      };

      // Draw data curves with Orange, Yellow, and Purple colors
      drawCurve("soft_bg_subtracted", "#a855f7", 1.5); // Purple
      drawCurve("hard_xray_flux", "#facc15", 2);     // Yellow
      drawCurve("soft_xray_flux", "#ea580c", 3);     // Orange

      // Animate flowing photon particles along paths
      const animatePhotons = (
        dataKey: "soft_xray_flux" | "hard_xray_flux" | "soft_bg_subtracted",
        color: string,
        streamKey: "soft" | "hard" | "bg"
      ) => {
        photonStreamsRef.current[streamKey] = photonStreamsRef.current[streamKey].map(progress => {
          let nextP = progress + 0.003;
          if (nextP > 1.0) nextP = 0;

          const totalPoints = displayData.length;
          const floatIdx = nextP * (totalPoints - 1);
          const baseIdx = Math.floor(floatIdx);
          const remainder = floatIdx - baseIdx;

          const p1 = displayData[baseIdx];
          const p2 = displayData[Math.min(totalPoints - 1, baseIdx + 1)];

          if (p1 && p2) {
            const x = getX(baseIdx) + remainder * (getX(baseIdx + 1) - getX(baseIdx));
            const y = getY(p1[dataKey]) + remainder * (getY(p2[dataKey]) - getY(p1[dataKey]));

            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            let glow = ctx.createRadialGradient(x, y, 1, x, y, 8);
            glow.addColorStop(0, "#ffffff");
            glow.addColorStop(0.4, color);
            glow.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = glow;
            ctx.fill();
          }
          return nextP;
        });
      };

      animatePhotons("soft_bg_subtracted", "#a855f7", "bg");
      animatePhotons("hard_xray_flux", "#facc15", "hard");
      animatePhotons("soft_xray_flux", "#ea580c", "soft");

      // Handle hover tracker cursor
      if (hoverX !== null && hoverX >= paddingLeft && hoverX <= width - paddingRight) {
        const pct = (hoverX - paddingLeft) / chartWidth;
        const rawIndex = pct * (displayData.length - 1);
        const index = Math.min(displayData.length - 1, Math.max(0, Math.round(rawIndex)));
        setActiveDataIndex(index);

        const point = displayData[index];
        if (point) {
          const snapX = getX(index);

          // Draw vertical tracking guide bar
          ctx.beginPath();
          ctx.moveTo(snapX, paddingTop);
          ctx.lineTo(snapX, height - paddingBottom);
          ctx.strokeStyle = "rgba(234, 88, 12, 0.4)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          const drawSnapCircle = (val: number, color: string) => {
            const snapY = getY(val);
            ctx.beginPath();
            ctx.arc(snapX, snapY, 6, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(snapX, snapY, 11, 0, Math.PI * 2);
            ctx.strokeStyle = color + "40";
            ctx.lineWidth = 2.5;
            ctx.stroke();
          };

          drawSnapCircle(point.soft_bg_subtracted, "#a855f7");
          drawSnapCircle(point.hard_xray_flux, "#facc15");
          drawSnapCircle(point.soft_xray_flux, "#ea580c");

          // Render Floating HD Data Card HUD
          const cardW = 220;
          const cardH = 100;
          
          let cardX = snapX + 15;
          if (cardX + cardW > width) cardX = snapX - cardW - 15;
          let cardY = Math.min(height - paddingBottom - cardH, Math.max(paddingTop, (hoverY || 100) - cardH / 2));

          ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.fillRect(cardX, cardY, cardW, cardH);
          ctx.strokeRect(cardX, cardY, cardW, cardH);

          // Card contents
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px 'Space Mono', Courier, monospace";
          ctx.textAlign = "left";
          ctx.fillText(`TIME: ${point.timestamp}`, cardX + 10, cardY + 20);

          ctx.fillStyle = "#ea580c";
          ctx.fillText(`SoLEXS SXR: ${point.soft_xray_flux.toExponential(2)}`, cardX + 10, cardY + 40);

          ctx.fillStyle = "#facc15";
          ctx.fillText(`HEL1OS HXR: ${point.hard_xray_flux.toExponential(2)}`, cardX + 10, cardY + 60);

          ctx.fillStyle = "#a855f7";
          ctx.fillText(`BG SUBTRACTED: ${point.soft_bg_subtracted.toExponential(2)}`, cardX + 10, cardY + 80);
        }
      }

      // Handle physics simulation particles for real-time flares
      if (currentFlareOffset > 0.05) {
        const peakX = getX(Math.floor(displayData.length / 2));
        const peakY = getY(Math.max(...softVals));

        if (Math.random() < 0.8 && activeExplosionParticles.length < 150) {
          for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 6 + 2;
            activeExplosionParticles.push({
              x: peakX,
              y: peakY,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity - 2,
              color: ["#ea580c", "#f97316", "#ffffff", "#facc15", "#a855f7"][Math.floor(Math.random() * 5)],
              size: Math.random() * 5 + 3,
              alpha: 1.0,
              life: 0,
              maxLife: Math.random() * 40 + 20
            });
          }
        }
      }

      activeExplosionParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();
      });

      activeExplosionParticles = activeExplosionParticles.filter(p => p.life < p.maxLife);

      // Title header
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Space Mono', Courier, monospace";
      ctx.textAlign = "left";
      ctx.fillText("DYNAMIC TELEMETRY LIGHT CURVES (LIVE RENDER)", paddingLeft, 30);

      // Legend key bubbles
      const drawLegendKey = (x: number, label: string, color: string) => {
        ctx.beginPath();
        ctx.arc(x, 26, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = "bold 10px 'Space Mono', Courier, monospace";
        ctx.textAlign = "left";
        ctx.fillText(label, x + 10, 30);
      };

      drawLegendKey(width - 520, "SoLEXS SXR (2-22 keV)", "#ea580c");
      drawLegendKey(width - 340, "HEL1OS HXR (8-150 keV)", "#facc15");
      drawLegendKey(width - 160, "Bg Subtracted", "#a855f7");

      animId = requestAnimationFrame(drawChart);
    };

    drawChart();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [data, hoverX, hoverY, flareIntensity, explosionParticles]);

  return (
    <div className="flex flex-col gap-4 w-full" ref={containerRef}>
      <div className="w-full aspect-[2.8/1] overflow-hidden border-2 border-white bg-black relative">
        <canvas
          ref={canvasRef}
          width={1200}
          height={430}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block cursor-crosshair"
        />
        {flareIntensity > 0.05 && (
          <div className="absolute top-4 right-4 bg-orange-950/80 border border-orange-500 text-orange-400 px-3 py-1.5 text-[10px] font-mono-telemetry uppercase tracking-wider animate-pulse select-none z-10">
            ⚠ Warning: Solar Flare Spike Injected
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button
          onClick={triggerSolarFlare}
          disabled={flareIntensity > 0.1}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:border-neutral-700 border border-white text-black font-bold py-1.5 px-4 text-xs font-mono-telemetry uppercase tracking-wider transition-colors duration-150"
        >
          {flareIntensity > 0.1 ? "Spike Simulating..." : "Simulate Flare Spike"}
        </button>
      </div>
    </div>
  );
}
