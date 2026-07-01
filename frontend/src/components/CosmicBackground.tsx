import React from "react";
import Galaxy from "./Galaxy";

export function CosmicBackground() {
  return (
    <div className="fixed inset-0 w-screen h-screen -z-50 overflow-hidden bg-black select-none pointer-events-none">
      <div className="absolute inset-0 w-full h-full opacity-55">
        <Galaxy 
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.2}
          glowIntensity={0.3}
          saturation={0.0}
          hueShift={0}
          rotationSpeed={0.02}
          repulsionStrength={0.6}
          autoCenterRepulsion={15}
          speed={0.4}
        />
      </div>
      {/* Translucent overlay to enhance readability of foreground text */}
      <div className="absolute inset-0 bg-black/40" />
    </div>
  );
}
