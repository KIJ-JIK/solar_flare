import React, { useEffect, useRef, useState } from "react";
import { Component as StarshipShader } from "./ui/starship-shader";

export function OrbitSimulator() {
  const [mode, setMode] = useState<"halo" | "flare" | "heating" | "lagrange" | "detector" | "starship">("halo");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let angle = 0;
    let haloAngle = 0;
    let flareFrame = 0;
    
    // Flare explosion particles
    let flareParticles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      life: number;
      maxLife: number;
    }> = [];

    // Neupert effect particles
    let HXRParticles: Array<{
      progress: number;
      side: "left" | "right";
      speed: number;
    }> = [];
    let SXRPlumes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }> = [];

    // Detector interaction particles
    let detectorPhotons: Array<{
      x: number;
      y: number;
      speed: number;
      hit: boolean;
      eDrift: Array<{ x: number; y: number; speed: number }>;
      hDrift: Array<{ x: number; y: number; speed: number }>;
    }> = [];

    // Generate stars for space background
    const stars: Array<{ x: number; y: number; r: number; alpha: number; speed: number }> = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * 960,
        y: Math.random() * 540,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.02 + 0.005,
      });
    }

    const drawBackground = () => {
      ctx.fillStyle = "#020408";
      ctx.fillRect(0, 0, 960, 540);
      
      stars.forEach((star) => {
        star.alpha += (Math.random() - 0.5) * star.speed;
        if (star.alpha < 0.1) star.alpha = 0.1;
        if (star.alpha > 1.0) star.alpha = 1.0;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      let nebula = ctx.createRadialGradient(480, 270, 50, 480, 270, 450);
      nebula.addColorStop(0, "rgba(249, 115, 22, 0.05)");
      nebula.addColorStop(0.5, "rgba(59, 130, 246, 0.03)");
      nebula.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, 960, 540);
    };

    let animationFrameId: number;

    const draw = () => {
      const currentMode = modeRef.current;
      const centerX = 960 / 2;
      const centerY = 540 / 2;

      drawBackground();

      if (currentMode === "halo") {
        // --- MODE 1: HALO ORBIT ---
        
        // Sun at center
        ctx.beginPath();
        ctx.arc(centerX, centerY, 75, 0, Math.PI * 2);
        let glow = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 125);
        glow.addColorStop(0, "#fffbeb");
        glow.addColorStop(0.2, "#fef08a");
        glow.addColorStop(0.5, "#f97316");
        glow.addColorStop(0.8, "#ef4444");
        glow.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = glow;
        ctx.fill();

        // Core Sun Disc
        ctx.beginPath();
        ctx.arc(centerX, centerY, 52, 0, Math.PI * 2);
        ctx.fillStyle = "#facc15";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#eab308";
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 15px 'Space Mono', Courier, monospace";
        ctx.textAlign = "center";
        ctx.fillText("SUN", centerX, centerY + 5);

        // Earth Orbit line
        ctx.beginPath();
        ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(147, 197, 253, 0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Earth coordinates
        const earthX = centerX + 200 * Math.cos(angle);
        const earthY = centerY + 200 * Math.sin(angle);

        // Earth atmospheric glow
        ctx.beginPath();
        ctx.arc(earthX, earthY, 24, 0, Math.PI * 2);
        let earthGlow = ctx.createRadialGradient(earthX, earthY, 5, earthX, earthY, 24);
        earthGlow.addColorStop(0, "rgba(96, 165, 250, 0.7)");
        earthGlow.addColorStop(1, "rgba(59, 130, 246, 0)");
        ctx.fillStyle = earthGlow;
        ctx.fill();

        // Earth Core
        ctx.beginPath();
        ctx.arc(earthX, earthY, 15, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Earth Landmass details
        ctx.beginPath();
        ctx.arc(earthX - 3, earthY - 3, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#22c55e";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(earthX + 5, earthY + 3, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#22c55e";
        ctx.fill();

        ctx.fillStyle = "#93c5fd";
        ctx.font = "bold 13px 'Space Mono', Courier, monospace";
        ctx.fillText("EARTH", earthX, earthY - 28);

        // L1 Lagrange point
        const l1R = 200 * 0.75;
        const l1X = centerX + l1R * Math.cos(angle);
        const l1Y = centerY + l1R * Math.sin(angle);

        // Halo Orbit trajectory path
        const hRX = 35;
        const hRY = 15;
        ctx.save();
        ctx.translate(l1X, l1Y);
        ctx.rotate(angle + Math.PI / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, hRX, hRY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(74, 222, 128, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();

        // L1 Point indicator
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#22c55e";
        ctx.fill();
        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 12px 'Space Mono', Courier, monospace";
        ctx.fillText("L1", 0, -hRY - 6);

        // Aditya-L1 spacecraft position
        const aX = hRX * Math.cos(haloAngle);
        const aY = hRY * Math.sin(haloAngle);
        
        ctx.save();
        ctx.translate(aX, aY);
        ctx.rotate(haloAngle + Math.PI / 4);

        // Solar panels
        ctx.fillStyle = "#1e3a8a";
        ctx.fillRect(-14, -2.5, 7, 5);
        ctx.fillRect(7, -2.5, 7, 5);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1;
        ctx.strokeRect(-14, -2.5, 7, 5);
        ctx.strokeRect(7, -2.5, 7, 5);

        // Main spacecraft body
        ctx.fillStyle = "#eab308";
        ctx.fillRect(-4, -4, 8, 8);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(-4, -4, 8, 8);

        // Sensor dish
        ctx.beginPath();
        ctx.arc(0, -6, 2, Math.PI, 0);
        ctx.fillStyle = "#d1d5db";
        ctx.fill();

        ctx.restore();
        ctx.restore();

        // Text tag
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 12px 'Space Mono', Courier, monospace";
        ctx.fillText("ADITYA-L1", l1X + aX * 1.8, l1Y + aY * 1.8 + 20);

        angle += 0.0025;
        haloAngle += 0.035;
      } else if (currentMode === "flare") {
        // --- MODE 2: FLARE & MAGNETIC RECONNECTION ---
        
        // Sun limb at the bottom
        ctx.beginPath();
        ctx.arc(centerX, 850, 600, 0, Math.PI * 2);
        let sunGlow = ctx.createRadialGradient(centerX, 850, 480, centerX, 850, 630);
        sunGlow.addColorStop(0, "#fef08a");
        sunGlow.addColorStop(0.3, "#f97316");
        sunGlow.addColorStop(0.7, "#ef4444");
        sunGlow.addColorStop(1, "rgba(220, 38, 38, 0)");
        ctx.fillStyle = sunGlow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, 850, 580, 0, Math.PI * 2);
        ctx.fillStyle = "#facc15";
        ctx.fill();

        flareFrame += 0.5;
        const progress = (flareFrame % 100) / 100;

        const loop1X = centerX - 80 * (1 - progress);
        const loop2X = centerX + 80 * (1 - progress);
        const loopHeight = 160 * progress + 40;
        const peakY = 270 - loopHeight;

        // Draw magnetic field lines
        ctx.lineWidth = 4;
        
        // Loop 1 (Left)
        ctx.strokeStyle = `rgba(96, 165, 250, ${0.4 + 0.6 * (1 - progress)})`;
        ctx.beginPath();
        ctx.moveTo(centerX - 150, 270);
        ctx.quadraticCurveTo(loop1X, peakY, loop1X, peakY);
        ctx.stroke();

        // Loop 2 (Right)
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + 0.6 * (1 - progress)})`;
        ctx.beginPath();
        ctx.moveTo(centerX + 150, 270);
        ctx.quadraticCurveTo(loop2X, peakY, loop2X, peakY);
        ctx.stroke();

        // Reconnection trigger
        if (progress > 0.85) {
          const explosionX = centerX;
          const explosionY = peakY;

          // Flash glow
          ctx.beginPath();
          ctx.arc(explosionX, explosionY, 80 * (progress - 0.85) * 6, 0, Math.PI * 2);
          let pulse = ctx.createRadialGradient(explosionX, explosionY, 3, explosionX, explosionY, 80 * (progress - 0.85) * 6);
          pulse.addColorStop(0, "#ffffff");
          pulse.addColorStop(0.2, "#fef08a");
          pulse.addColorStop(0.5, "rgba(249, 115, 22, 0.5)");
          pulse.addColorStop(1, "rgba(239, 68, 68, 0)");
          ctx.fillStyle = pulse;
          ctx.fill();

          // Spawning particles
          if (flareParticles.length < 30) {
            for (let i = 0; i < 20; i++) {
              const pAngle = Math.random() * Math.PI * 2;
              const pSpeed = Math.random() * 5 + 3;
              flareParticles.push({
                x: explosionX,
                y: explosionY,
                vx: Math.cos(pAngle) * pSpeed,
                vy: Math.sin(pAngle) * pSpeed,
                color: ["#ffffff", "#fef08a", "#f97316", "#ef4444", "#3b82f6"][Math.floor(Math.random() * 5)],
                size: Math.random() * 6 + 4, // Larger particles
                life: 0,
                maxLife: Math.random() * 25 + 15
              });
            }
          }

          // Draw particles
          flareParticles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.life++;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife), 0, Math.PI * 2);
            ctx.fill();
          });
          
          flareParticles = flareParticles.filter((p) => p.life < p.maxLife);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 15px 'Space Mono', Courier, monospace";
          ctx.textAlign = "center";
          ctx.fillText("MAGNETIC RECONNECTION", centerX, explosionY - 45);
          ctx.fillStyle = "#f87171";
          ctx.font = "bold 11px 'Space Mono', Courier, monospace";
          ctx.fillText("ENERGY RELEASE & FLARE BLAST", centerX, explosionY - 26);
        } else {
          flareParticles = [];

          ctx.fillStyle = "#93c5fd";
          ctx.font = "bold 13px 'Space Mono', Courier, monospace";
          ctx.textAlign = "center";
          ctx.fillText("Opposing Magnetic Field Lines Compressing...", centerX, 80);
        }
      } else if (currentMode === "heating") {
        // --- MODE 3: NEUPERT PLASMA HEATING ---
        
        // Chromosphere baseline
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(80, 460, 800, 25);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.strokeRect(80, 460, 800, 25);

        // Coronal loop line
        ctx.beginPath();
        ctx.arc(centerX, 460, 180, Math.PI, 0);
        ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
        ctx.lineWidth = 14;
        ctx.stroke();

        flareFrame += 1.2;

        // Particle streams (HXR Electron Beam)
        if (Math.random() < 0.4) {
          HXRParticles.push({
            progress: 0,
            side: Math.random() < 0.5 ? "left" : "right",
            speed: 0.015 + Math.random() * 0.01
          });
        }

        HXRParticles.forEach((p) => {
          p.progress += p.speed;
          
          const loopAngle = p.side === "left" 
            ? Math.PI / 2 + (p.progress * Math.PI) / 2
            : Math.PI / 2 - (p.progress * Math.PI) / 2;

          const pX = centerX + 180 * Math.cos(loopAngle);
          const pY = 460 - 180 * Math.sin(loopAngle);

          ctx.fillStyle = "#60a5fa";
          ctx.beginPath();
          ctx.arc(pX, pY, 9, 0, Math.PI * 2); // Larger HXR particle dots
          ctx.fill();

          if (p.progress >= 1.0) {
            const impactX = centerX + 180 * Math.cos(p.side === "left" ? Math.PI : 0);
            for (let i = 0; i < 4; i++) {
              SXRPlumes.push({
                x: impactX,
                y: 450,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 4 - 1.5,
                size: Math.random() * 15 + 10,
                alpha: 1.0
              });
            }
          }
        });

        HXRParticles = HXRParticles.filter((p) => p.progress < 1.0);

        // Draw SXR evaporating thermal plasma clouds
        SXRPlumes.forEach((plume) => {
          plume.x += plume.vx;
          plume.y += plume.vy;
          plume.alpha -= 0.012;
          
          let gradient = ctx.createRadialGradient(plume.x, plume.y, 2, plume.x, plume.y, plume.size);
          gradient.addColorStop(0, `rgba(249, 115, 22, ${plume.alpha})`);
          gradient.addColorStop(0.5, `rgba(239, 68, 68, ${plume.alpha * 0.5})`);
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(plume.x, plume.y, plume.size, 0, Math.PI * 2);
          ctx.fill();
        });

        SXRPlumes = SXRPlumes.filter((p) => p.alpha > 0.05);

        // Draw labels
        ctx.fillStyle = "#60a5fa";
        ctx.font = "bold 13px 'Space Mono', Courier, monospace";
        ctx.textAlign = "right";
        ctx.fillText("HXR: Non-Thermal Beams ⬇️", centerX - 100, 420);

        ctx.fillStyle = "#f97316";
        ctx.textAlign = "left";
        ctx.fillText("SXR: Evaporating Plasma ⬆️", centerX + 100, 420);

        // Simulated Integrated Energy Graph
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 15px 'Space Mono', Courier, monospace";
        ctx.textAlign = "center";
        ctx.fillText("THE NEUPERT EFFECT (ENERGY CONVERSION & CHROMOSPHERIC EVAPORATION)", centerX, 55);

        // draw gauge
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(centerX - 180, 85, 360, 18);
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(centerX - 180, 85, 360, 18);

        const energyLevel = 0.5 + 0.5 * Math.sin(flareFrame * 0.02);
        ctx.fillStyle = "#f97316";
        ctx.fillRect(centerX - 178, 87, 356 * energyLevel, 14);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px 'Space Mono', Courier, monospace";
        ctx.fillText(`THERMAL ACCUMULATION (SXR STRENGTH): ${Math.round(energyLevel * 100)}%`, centerX, 125);

      } else if (currentMode === "lagrange") {
        // --- MODE 4: LAGRANGE POINTS POTENTIAL MAP ---
        
        // Sun potential well
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
        let potentialGlow = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 240);
        potentialGlow.addColorStop(0, "rgba(249, 115, 22, 0.4)");
        potentialGlow.addColorStop(0.3, "rgba(249, 115, 22, 0.1)");
        potentialGlow.addColorStop(0.7, "rgba(96, 165, 250, 0.05)");
        potentialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = potentialGlow;
        ctx.fill();

        // Draw contours
        ctx.lineWidth = 1;
        for (let i = 1; i <= 6; i++) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, 40 + i * 30, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 - i * 0.01})`;
          ctx.stroke();
        }

        // Sun at center
        ctx.beginPath();
        ctx.arc(centerX, centerY, 32, 0, Math.PI * 2);
        ctx.fillStyle = "#f97316";
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px 'Space Mono', Courier, monospace";
        ctx.textAlign = "center";
        ctx.fillText("SUN", centerX, centerY + 4);

        // Earth orbiting
        const orbitRadius = 180;
        const earthX = centerX + orbitRadius * Math.cos(angle);
        const earthY = centerY + orbitRadius * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(earthX, earthY, 11, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillText("EARTH", earthX, earthY - 15);

        // Earth contours
        for (let i = 1; i <= 2; i++) {
          ctx.beginPath();
          ctx.arc(earthX, earthY, i * 11, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.4 - i * 0.15})`;
          ctx.stroke();
        }

        // Lagrange points drawing helper
        const drawPt = (x: number, y: number, name: string) => {
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fillStyle = "#22c55e";
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1;
          ctx.stroke();
          
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 13px 'Space Mono', Courier, monospace";
          ctx.fillText(name, x, y - 9);
        };

        // Lagrange Points coordinates
        const l1X = centerX + orbitRadius * 0.72 * Math.cos(angle);
        const l1Y = centerY + orbitRadius * 0.72 * Math.sin(angle);
        drawPt(l1X, l1Y, "L1");

        const l2X = centerX + orbitRadius * 1.15 * Math.cos(angle);
        const l2Y = centerY + orbitRadius * 1.15 * Math.sin(angle);
        drawPt(l2X, l2Y, "L2");

        const l3X = centerX - orbitRadius * Math.cos(angle);
        const l3Y = centerY - orbitRadius * Math.sin(angle);
        drawPt(l3X, l3Y, "L3");

        const l4X = centerX + orbitRadius * Math.cos(angle + Math.PI / 3);
        const l4Y = centerY + orbitRadius * Math.sin(angle + Math.PI / 3);
        drawPt(l4X, l4Y, "L4");

        const l5X = centerX + orbitRadius * Math.cos(angle - Math.PI / 3);
        const l5Y = centerY + orbitRadius * Math.sin(angle - Math.PI / 3);
        drawPt(l5X, l5Y, "L5");

        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 14px 'Space Mono', Courier, monospace";
        ctx.fillText("GRAVITATIONAL CONTROLS & LAGRANGE POINTS (L1 - L5)", centerX, 35);

        angle += 0.003;
      } else if (currentMode === "detector") {
        // --- MODE 5: CZT PHOTON DETECTOR ---
        
        // CZT Crystal Lattice block
        const blockX = 120;
        const blockY = 200;
        const blockW = 720;
        const blockH = 160;

        let crystalGlow = ctx.createLinearGradient(centerX, blockY, centerX, blockY + blockH);
        crystalGlow.addColorStop(0, "#1e293b"); 
        crystalGlow.addColorStop(1, "#0f172a"); 
        ctx.fillStyle = crystalGlow;
        ctx.fillRect(blockX, blockY, blockW, blockH);
        
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 3;
        ctx.strokeRect(blockX, blockY, blockW, blockH);

        // Cathode plate
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(blockX, blockY - 10, blockW, 10);
        ctx.fillStyle = "#000000";
        ctx.font = "bold 9px 'Space Mono', Courier, monospace";
        ctx.textAlign = "center";
        ctx.fillText("CATHODE (-) BIAS LAYER", centerX, blockY - 2);

        // Anode plate
        ctx.fillStyle = "#ea580c";
        ctx.fillRect(blockX, blockY + blockH, blockW, 10);
        ctx.fillStyle = "#ffffff";
        ctx.fillText("ANODE (+) PIXEL COLLECTION BOARD", centerX, blockY + blockH + 8);

        // Spawning photons
        if (Math.random() < 0.15 && detectorPhotons.length < 10) {
          detectorPhotons.push({
            x: blockX + 40 + Math.random() * (blockW - 80),
            y: 30,
            speed: 4 + Math.random() * 2,
            hit: false,
            eDrift: [],
            hDrift: []
          });
        }

        detectorPhotons.forEach((p) => {
          if (!p.hit) {
            p.y += p.speed;
            
            // Draw sinusoidal X-ray wave packet
            ctx.beginPath();
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 2.5;
            ctx.moveTo(p.x, p.y);
            
            for (let offset = 0; offset < 20; offset += 2) {
              const waveY = p.y + offset;
              const waveX = p.x + 6 * Math.sin((waveY * Math.PI) / 8);
              if (offset === 0) ctx.moveTo(waveX, waveY);
              else ctx.lineTo(waveX, waveY);
            }
            ctx.stroke();

            if (p.y + 20 >= blockY) {
              p.hit = true;
              p.y = blockY;
              
              const pairCount = Math.floor(Math.random() * 3) + 3;
              for (let i = 0; i < pairCount; i++) {
                p.eDrift.push({
                  x: p.x + (Math.random() - 0.5) * 20,
                  y: blockY + 5,
                  speed: 2 + Math.random() * 1.0
                });
                p.hDrift.push({
                  x: p.x + (Math.random() - 0.5) * 20,
                  y: blockY + 5,
                  speed: 1.0 + Math.random() * 0.6
                });
              }
            }
          } else {
            p.eDrift.forEach((e) => {
              e.y += e.speed;
              ctx.beginPath();
              ctx.arc(e.x, e.y, 6, 0, Math.PI * 2); // Larger electron dots
              ctx.fillStyle = "#ef4444";
              ctx.fill();
            });

            p.hDrift.forEach((h) => {
              h.y -= h.speed;
              ctx.beginPath();
              ctx.arc(h.x, h.y, 6, 0, Math.PI * 2); // Larger hole dots
              ctx.fillStyle = "#3b82f6";
              ctx.fill();
            });

            p.eDrift = p.eDrift.filter((e) => e.y < blockY + blockH);
            p.hDrift = p.hDrift.filter((h) => h.y > blockY);
          }
        });

        detectorPhotons = detectorPhotons.filter((p) => !p.hit || p.eDrift.length > 0 || p.hDrift.length > 0);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px 'Space Mono', Courier, monospace";
        ctx.textAlign = "center";
        ctx.fillText("CADMIUM ZINC TELLURIDE (CZT) SEMICONDUCTOR SENSING SYSTEM", centerX, 35);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode]);

  return (
    <div className="w-full bg-black border-2 border-white rounded-none p-4 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <span className="font-mono-telemetry font-bold text-white text-xs tracking-widest uppercase">Mission Observational System Simulation</span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="bg-black border-2 border-white text-white py-1.5 px-3 rounded-none text-xs outline-none cursor-pointer focus:border-white font-mono-telemetry"
        >
          <option value="halo">1. Aditya-L1 Halo Orbit</option>
          <option value="flare">2. Flare & Magnetic Reconnection</option>
          <option value="heating">3. Plasma Heating (Neupert Effect)</option>
          <option value="lagrange">4. Lagrange Points L1-L5 Map</option>
          <option value="detector">5. CZT Detector Interaction</option>
          <option value="starship">6. Starship Warp WebGL Shader</option>
        </select>
      </div>
      
      <div className="w-full aspect-video overflow-hidden rounded-none border-2 border-white bg-black relative flex items-center justify-center">
        {mode === "starship" ? (
          <div className="w-full h-full">
            <StarshipShader />
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            className="w-full h-full bg-black block"
          />
        )}
      </div>
    </div>
  );
}
