import React, { useRef, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import './MagicBento.css';

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '249, 115, 22'; // Orange RGB color values
const MOBILE_BREAKPOINT = 768;

const cardData = [
  {
    color: 'rgba(3, 7, 18, 0.25)',
    title: 'Nowcasting Engine',
    description: 'Real-time solar flare detection and automated peak flux classification into GOES A, B, C, M, and X classes.',
    label: 'Detection',
    image: './nowcasting_icon.png',
    parameters: [
      { key: 'Instrument', value: 'SoLEXS (SXR)' },
      { key: 'Cadence', value: '1-second telemetry' },
      { key: 'Classification', value: 'GOES A, B, C, M, X' },
      { key: 'Status', value: 'Operational' }
    ]
  },
  {
    color: 'rgba(3, 7, 18, 0.25)',
    title: 'Forecasting Engine',
    description: 'Trained Random Forest classifiers computing warning probabilities for lookahead windows of 30, 60, and 120 minutes.',
    label: 'Prediction',
    image: './forecasting_icon.png',
    parameters: [
      { key: 'Algorithm', value: 'Random Forest' },
      { key: 'Lookahead', value: '30, 60, 120 mins' },
      { key: 'Metrics', value: 'HSS: 0.63, FAR: 0.24' },
      { key: 'Status', value: 'Active Pipeline' }
    ]
  },
  {
    color: 'rgba(3, 7, 18, 0.25)',
    title: 'Neupert Effect Precursors',
    description: 'Leveraging the time-integrated relationship of hard X-ray impulses as precursors to thermal soft X-ray peaks, boosting warning lead times by 15-45 minutes.',
    label: 'Physics',
    image: './neupert_effect.png',
    parameters: [
      { key: 'Payloads', value: 'HEL1OS & SoLEXS' },
      { key: 'Lead Time', value: '15 to 45 minutes' },
      { key: 'Precursor Band', value: 'Hard X-ray (>20 keV)' },
      { key: 'Correlation', value: 'Time-Integrated HXR' }
    ]
  },
  {
    color: 'rgba(3, 7, 18, 0.25)',
    title: 'Interactive Simulator',
    description: 'A custom, real-time trigger verification playground allowing users to manually test sensor threshold crossings.',
    label: 'Verification',
    image: './interactive_simulator.png',
    parameters: [
      { key: 'Mode', value: 'Manual Override' },
      { key: 'Variables', value: 'SXR Flux, HXR Flux' },
      { key: 'Response', value: 'Warning lead times' },
      { key: 'Verification', value: 'Pipeline logic check' }
    ]
  },
  {
    color: 'rgba(3, 7, 18, 0.25)',
    title: 'Orbital Geometry',
    description: 'Interactive visualization of the Aditya-L1 spacecraft trajectory at the Sun-Earth L1 Lagrange Point halo orbit path.',
    label: 'Orbits',
    image: './orbital_geometry.png',
    parameters: [
      { key: 'Orbit Class', value: 'Halo Orbit' },
      { key: 'Lagrange Point', value: 'L1 Lagrange Point' },
      { key: 'Distance', value: '1.5M Kilometers' },
      { key: 'Spacecraft', value: 'Aditya-L1' }
    ]
  },
  {
    color: 'rgba(3, 7, 18, 0.25)',
    title: 'Downloadable Catalogs',
    description: 'Generates structured, research-ready flare database logs (master_catalogue.csv) complying with strict data contracts.',
    label: 'Data',
    image: './downloadable_catalogs.png',
    parameters: [
      { key: 'File Name', value: 'master_catalogue.csv' },
      { key: 'Compliance', value: 'Antariksh Data Contract' },
      { key: 'Fields', value: 'class, peak flux, timing' },
      { key: 'Update Cadence', value: 'Event-driven database' }
    ]
  }
];

const createParticleElement = (x: number, y: number, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card: HTMLElement, mouseX: number, mouseY: number, glow: number, radius: number) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

interface ParticleCardProps {
  children?: React.ReactNode;
  className?: string;
  disableAnimations?: boolean;
  style?: React.CSSProperties;
  particleCount?: number;
  glowColor?: string;
  enableTilt?: boolean;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  onClick?: () => void;
}

const ParticleCard = ({
  children,
  className = '',
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false,
  onClick
}: ParticleCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<any[]>([]);
  const isHoveredRef = useRef(false);
  const memoizedParticles = useRef<HTMLDivElement[]>([]);
  const particlesInitialized = useRef(false);
  const magnetismAnimationRef = useRef<gsap.core.Tween | null>(null);

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return;

    const { width, height } = cardRef.current.getBoundingClientRect();
    memoizedParticles.current = Array.from({ length: particleCount }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, glowColor) as HTMLDivElement
    );
    particlesInitialized.current = true;
  }, [particleCount, glowColor]);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();

    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;

    if (!particlesInitialized.current) {
      initializeParticles();
    }

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;

        const clone = particle.cloneNode(true) as HTMLDivElement;
        cardRef.current.appendChild(clone);
        particlesRef.current.push(clone);

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        });
      }, index * 100);

      timeoutsRef.current.push(timeoutId);
    });
  }, [initializeParticles]);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) onClick();
    if (!clickEffect || disableAnimations) return;

    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const maxDistance = Math.max(
      Math.hypot(x, y),
      Math.hypot(x - rect.width, y),
      Math.hypot(x, y - rect.height),
      Math.hypot(x - rect.width, y - rect.height)
    );

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: ${maxDistance * 2}px;
      height: ${maxDistance * 2}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
      left: ${x - maxDistance}px;
      top: ${y - maxDistance}px;
      pointer-events: none;
      z-index: 1000;
    `;

    element.appendChild(ripple);

    gsap.fromTo(
      ripple,
      {
        scale: 0,
        opacity: 1
      },
      {
        scale: 1,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => ripple.remove()
      }
    );
  };

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;

    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 5,
          rotateY: 5,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();

      if (enableTilt) {
        gsap.to(element, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }

      if (enableMagnetism) {
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableTilt && !enableMagnetism) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        gsap.to(element, {
          rotateX,
          rotateY,
          duration: 0.1,
          ease: 'power2.out',
          transformPerspective: 1000
        });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;

        magnetismAnimationRef.current = gsap.to(element, {
          x: magnetX,
          y: magnetY,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism]);

  return (
    <div
      ref={cardRef}
      className={`${className} particle-container cursor-pointer`}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
      onClick={handleCardClick}
    >
      {children}
    </div>
  );
};

interface GlobalSpotlightProps {
  gridRef: React.RefObject<HTMLDivElement | null>;
  disableAnimations?: boolean;
  enabled?: boolean;
  spotlightRadius?: number;
  glowColor?: string;
}

const GlobalSpotlight = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  glowColor = DEFAULT_GLOW_COLOR
}: GlobalSpotlightProps) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const isInsideSection = useRef(false);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !gridRef.current) return;

      const section = gridRef.current.closest('.bento-section');
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      isInsideSection.current = mouseInside || false;
      const cards = gridRef.current.querySelectorAll('.magic-bento-card');

      if (!mouseInside) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
        cards.forEach(card => {
          (card as HTMLElement).style.setProperty('--glow-intensity', '0');
        });
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach(card => {
        const cardElement = card as HTMLElement;
        const cardRect = cardElement.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      isInsideSection.current = false;
      gridRef.current?.querySelectorAll('.magic-bento-card').forEach(card => {
        (card as HTMLElement).style.setProperty('--glow-intensity', '0');
      });
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

interface BentoCardGridProps {
  children?: React.ReactNode;
  gridRef: React.RefObject<HTMLDivElement | null>;
}

const BentoCardGrid = ({ children, gridRef }: BentoCardGridProps) => (
  <div className="card-grid bento-section" ref={gridRef}>
    {children}
  </div>
);

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

interface MagicBentoProps {
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
}

const NowcastingSVG = () => (
  <svg className="w-16 h-16 text-white/60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="animate-spin" style={{ animationDuration: '20s' }} />
    <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M50 10V90M10 50H90" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
    <path d="M50 50L78 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
    <circle cx="50" cy="50" r="4" fill="currentColor" />
  </svg>
);

const ForecastingSVG = () => (
  <svg className="w-16 h-16 text-white/60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 85H85" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M15 85V15" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
    <path d="M20 70L40 50L60 60L85 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="85" cy="25" r="5" fill="currentColor" className="animate-ping" />
    <circle cx="85" cy="25" r="4" fill="currentColor" />
    <circle cx="40" cy="50" r="3" fill="currentColor" />
    <circle cx="60" cy="60" r="3" fill="currentColor" />
  </svg>
);

const SimulatorSVG = () => (
  <svg className="w-16 h-16 text-white/60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="20" width="70" height="60" rx="6" stroke="currentColor" strokeWidth="2" />
    <path d="M15 35H85" stroke="currentColor" strokeWidth="1" />
    <circle cx="25" cy="27" r="2" fill="currentColor" />
    <circle cx="32" cy="27" r="2" fill="currentColor" />
    <circle cx="39" cy="27" r="2" fill="currentColor" />
    <path d="M25 50L35 55L25 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="40" y1="60" x2="60" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
  </svg>
);

const OrbitsSVG = () => (
  <svg className="w-16 h-16 text-white/60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="12" fill="currentColor" className="opacity-80" />
    <ellipse cx="50" cy="50" rx="38" ry="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 3" className="animate-spin" style={{ animationDuration: '15s' }} />
    <circle cx="88" cy="50" r="4" fill="currentColor" />
    <path d="M10 50C10 50 30 20 50 20C70 20 90 50 90 50" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
  </svg>
);

const DataSVG = () => (
  <svg className="w-16 h-16 text-white/60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M25 25C25 20 75 20 75 25C75 30 25 30 25 25Z" stroke="currentColor" strokeWidth="2" />
    <path d="M25 25V45C25 50 75 50 75 45V25" stroke="currentColor" strokeWidth="2" />
    <path d="M25 45V65C25 70 75 70 75 65V45" stroke="currentColor" strokeWidth="2" />
    <path d="M50 45V80M40 70L50 80L60 70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MagicBento = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = false,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true
}: MagicBentoProps) => {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useMobileDetection();
  const shouldDisableAnimations = disableAnimations || isMobile;
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const handleImageError = (imagePath: string) => {
    setBrokenImages(prev => ({ ...prev, [imagePath]: true }));
  };

  const renderFallbackSVG = (label: string) => {
    switch (label.toLowerCase()) {
      case 'detection':
        return <NowcastingSVG />;
      case 'prediction':
        return <ForecastingSVG />;
      case 'verification':
        return <SimulatorSVG />;
      case 'orbits':
        return <OrbitsSVG />;
      case 'data':
        return <DataSVG />;
      default:
        return (
          <svg className="w-16 h-16 text-orange-500/60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M50 20V80M20 50H80" stroke="currentColor" strokeWidth="1" />
          </svg>
        );
    }
  };

  const handleSimpleCardClick = (e: React.MouseEvent<HTMLDivElement>, card: any) => {
    setSelectedCard(card);
    if (!clickEffect || shouldDisableAnimations) return;

    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const maxDistance = Math.max(
      Math.hypot(x, y),
      Math.hypot(x - rect.width, y),
      Math.hypot(x, y - rect.height),
      Math.hypot(x - rect.width, y - rect.height)
    );

    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: ${maxDistance * 2}px;
      height: ${maxDistance * 2}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(${glowColor}, 0.4) 0%, rgba(${glowColor}, 0.2) 30%, transparent 70%);
      left: ${x - maxDistance}px;
      top: ${y - maxDistance}px;
      pointer-events: none;
      z-index: 1000;
    `;

    element.appendChild(ripple);

    gsap.fromTo(
      ripple,
      {
        scale: 0,
        opacity: 1
      },
      {
        scale: 1,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => ripple.remove()
      }
    );
  };

  return (
    <>
      {enableSpotlight && (
        <GlobalSpotlight
          gridRef={gridRef}
          disableAnimations={shouldDisableAnimations}
          enabled={enableSpotlight}
          spotlightRadius={spotlightRadius}
          glowColor={glowColor}
        />
      )}

      <BentoCardGrid gridRef={gridRef}>
        {cardData.map((card, index) => {
          const baseClassName = `magic-bento-card ${textAutoHide ? 'magic-bento-card--text-autohide' : ''} ${enableBorderGlow ? 'magic-bento-card--border-glow' : ''}`;
          
          // CSS custom properties cast
          const cardStyle = {
            backgroundColor: card.color,
            '--glow-color': glowColor
          } as React.CSSProperties;

          if (enableStars) {
            return (
              <ParticleCard
                key={index}
                className={baseClassName}
                style={cardStyle}
                disableAnimations={shouldDisableAnimations}
                particleCount={particleCount}
                glowColor={glowColor}
                enableTilt={enableTilt}
                clickEffect={clickEffect}
                enableMagnetism={enableMagnetism}
                onClick={() => setSelectedCard(card)}
              >
                <div className="magic-bento-card__header">
                  <div className="magic-bento-card__label">{card.label}</div>
                </div>
                 {card.image && !brokenImages[card.image] ? (
                  <div className="magic-bento-card__media">
                    <img 
                      src={card.image} 
                      alt={card.title} 
                      className="magic-bento-card__image" 
                      onError={() => handleImageError(card.image!)}
                    />
                  </div>
                ) : (
                  <div className="magic-bento-card__media flex items-center justify-center bg-black/40 border border-white/5 rounded-xl h-36 relative overflow-hidden">
                    <div className="absolute top-2 left-2 text-[8px] font-mono text-white/35">+</div>
                    <div className="absolute bottom-2 right-2 text-[8px] font-mono text-white/35">[ss]³</div>
                    {renderFallbackSVG(card.label)}
                  </div>
                )}
                <div className="magic-bento-card__content">
                  <h2 className="magic-bento-card__title">{card.title}</h2>
                  <p className="magic-bento-card__description">{card.description}</p>
                </div>
              </ParticleCard>
            );
          }

          return (
            <div
              key={index}
              className={`${baseClassName} cursor-pointer`}
              style={cardStyle}
              onClick={(e) => handleSimpleCardClick(e, card)}
              ref={el => {
                if (!el) return;

                const handleMouseMove = (e: MouseEvent) => {
                  if (shouldDisableAnimations) return;

                  const rect = el.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;

                  if (enableTilt) {
                    const rotateX = ((y - centerY) / centerY) * -10;
                    const rotateY = ((x - centerX) / centerX) * 10;
                    gsap.to(el, {
                      rotateX,
                      rotateY,
                      duration: 0.1,
                      ease: 'power2.out',
                      transformPerspective: 1000
                    });
                  }

                  if (enableMagnetism) {
                    const magnetX = (x - centerX) * 0.05;
                    const magnetY = (y - centerY) * 0.05;
                    gsap.to(el, {
                      x: magnetX,
                      y: magnetY,
                      duration: 0.3,
                      ease: 'power2.out'
                    });
                  }
                };

                const handleMouseLeave = () => {
                  if (shouldDisableAnimations) return;

                  if (enableTilt) {
                    gsap.to(el, {
                      rotateX: 0,
                      rotateY: 0,
                      duration: 0.3,
                      ease: 'power2.out'
                    });
                  }

                  if (enableMagnetism) {
                    gsap.to(el, {
                      x: 0,
                      y: 0,
                      duration: 0.3,
                      ease: 'power2.out'
                    });
                  }
                };

                el.addEventListener('mousemove', handleMouseMove);
                el.addEventListener('mouseleave', handleMouseLeave);
              }}
            >
              <div className="magic-bento-card__header">
                <div className="magic-bento-card__label">{card.label}</div>
              </div>
              {card.image && !brokenImages[card.image] ? (
                <div className="magic-bento-card__media">
                  <img 
                    src={card.image} 
                    alt={card.title} 
                    className="magic-bento-card__image" 
                    onError={() => handleImageError(card.image!)}
                  />
                </div>
              ) : (
                <div className="magic-bento-card__media flex items-center justify-center bg-black/40 border border-white/5 rounded-xl h-36 relative overflow-hidden">
                  <div className="absolute top-2 left-2 text-[8px] font-mono text-white/35">+</div>
                  <div className="absolute bottom-2 right-2 text-[8px] font-mono text-white/35">[ss]³</div>
                  {renderFallbackSVG(card.label)}
                </div>
              )}
              <div className="magic-bento-card__content">
                <h2 className="magic-bento-card__title">{card.title}</h2>
                <p className="magic-bento-card__description">{card.description}</p>
              </div>
            </div>
          );
        })}
      </BentoCardGrid>

      {/* Glassmorphic Technical Details Modal */}
      {selectedCard && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300">
          <div className="bg-black border-2 border-white rounded-none p-10 max-w-xl w-full mx-4 shadow-2xl relative overflow-hidden">
            {/* Background Orbit Trajectory Curve */}
            <svg className="absolute inset-0 w-full h-full stroke-white/20 fill-none pointer-events-none z-0">
              <path d="M 50 10 Q 280 400 500 10" strokeWidth="1.5" />
              <circle cx="280" cy="205" r="3" fill="#ffffff" className="animate-pulse" />
              <ellipse cx="280" cy="205" rx="20" ry="8" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
            </svg>

            {/* Vertical side text */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 origin-right text-[8px] font-mono text-white/50 tracking-[0.2em] uppercase whitespace-nowrap pointer-events-none">
              Solar System Series / Aditya-L1
            </div>

            {/* Corner tags positioned carefully to avoid content overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 font-mono text-[9px] text-white/50">[ss]³</div>
              <div className="absolute top-4 right-20 font-mono text-[9px] text-white/50">[ss]³</div>
              <div className="absolute bottom-4 left-4 font-mono text-[9px] text-white/50">ADITYA-L1 FIELD CODES</div>
              <div className="absolute bottom-4 right-4 font-mono text-[9px] text-white/50">[ss]³</div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 text-black hover:text-white font-mono text-xs cursor-pointer border-2 border-white rounded-none px-2 py-0.5 bg-white transition-colors z-20"
            >
              ESC [X]
            </button>

            {/* Content box relative to z-index */}
            <div className="relative z-10 space-y-4">
              {/* Label */}
              <div className="text-[10px] font-mono text-white tracking-[0.2em] uppercase">
                {selectedCard.label}
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider border-b-2 border-white pb-2">
                {selectedCard.title}
              </h2>

              {/* Image (if exists) */}
              {selectedCard.image && !brokenImages[selectedCard.image] ? (
                <div className="w-full h-44 rounded-lg overflow-hidden border border-white/5 bg-black/40 flex items-center justify-center">
                  <img 
                    src={selectedCard.image} 
                    alt={selectedCard.title} 
                    className="max-h-full max-w-full object-contain" 
                    onError={() => handleImageError(selectedCard.image)}
                  />
                </div>
              ) : (
                <div className="w-full h-44 rounded-lg border border-white/5 bg-black/45 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-2 left-2 text-[8px] font-mono text-white/35">+</div>
                  <div className="absolute bottom-2 right-2 text-[8px] font-mono text-white/35">[ss]³</div>
                  {renderFallbackSVG(selectedCard.label)}
                </div>
              )}

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                {selectedCard.description}
              </p>

              {/* Technical Parameters Table matching Mercurio style */}
              {selectedCard.parameters && (
                <div className="border-t border-white/10 pt-3">
                  <table className="tech-table !my-1">
                    <tbody>
                      {selectedCard.parameters.map((p: any, idx: number) => (
                        <tr key={idx} className="tech-table-row">
                          <td className="tech-table-cell-key !py-1.5 text-[10px] uppercase tracking-wider text-slate-400">{p.key}</td>
                          <td className="tech-table-cell-val !py-1.5 text-[11px] text-white">{p.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default MagicBento;
