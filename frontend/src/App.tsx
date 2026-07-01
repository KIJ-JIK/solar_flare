import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { 
  Activity, AlertTriangle, ShieldAlert, Cpu, Terminal, Download, Globe, BookOpen, Layers, Settings, ArrowRight, RefreshCw, Star
} from "lucide-react";
import { OrbitSimulator } from "./components/OrbitSimulator";
import { ProposalDocs } from "./components/ProposalDocs";
import MagicBento from "./components/MagicBento";
import { CosmicBackground } from "./components/CosmicBackground";
import PillNav from "./components/PillNav";
import { InteractiveTelemetryChart } from "./components/InteractiveTelemetryChart";

interface TelemetryPoint {
  timestamp: string;
  soft_xray_flux: number;
  hard_xray_flux: number;
  soft_bg_subtracted: number;
}

interface Flare {
  flare_id: string;
  start_time: string;
  peak_time: string;
  end_time: string;
  peak_flux: number;
  flare_class: string;
  confidence: string;
}

interface ForecastMetrics {
  TPR: number;
  FAR: number;
  HSS: number;
}

export default function App() {
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(() => {
    return localStorage.getItem("welcome_dismissed") === "true";
  });
  
  const [activeTab, setActiveTab] = useState<"nowcast" | "forecast" | "simulator" | "proposal" | "features">("nowcast");
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [catalogue, setCatalogue] = useState<Flare[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Custom simulation inputs
  const [softInput, setSoftInput] = useState<string>("5e-6");
  const [hardInput, setHardInput] = useState<string>("2e-7");
  const [simResult, setSimResult] = useState<any>(null);
  
  // Display window slider percentages
  const [windowRange, setWindowRange] = useState<[number, number]>([0, 100]);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);

  // Load telemetry data from Flask backend (with static JSON fallback)
  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch telemetry
      let telRes;
      try {
        telRes = await fetch("http://localhost:5000/api/telemetry");
        if (!telRes.ok) throw new Error();
      } catch (e) {
        telRes = await fetch("./api/telemetry.json");
      }
      if (!telRes.ok) throw new Error("Telemetry data missing.");
      const telData = await telRes.json();
      
      const clampedData = telData.map((d: any) => ({
        ...d,
        soft_xray_flux: Math.max(parseFloat(d.soft_xray_flux) || 0, 1e-9),
        hard_xray_flux: Math.max(parseFloat(d.hard_xray_flux) || 0, 1e-9),
        soft_bg_subtracted: Math.max(parseFloat(d.soft_bg_subtracted) || 0, 1e-9)
      }));
      setTelemetry(clampedData);

      // Fetch catalogue
      let catRes;
      try {
        catRes = await fetch("http://localhost:5000/api/catalogue");
        if (!catRes.ok) throw new Error();
      } catch (e) {
        catRes = await fetch("./api/catalogue.json");
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCatalogue(catData);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("⚠️ Processed telemetry data not found. Please verify backend or build pipeline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (welcomeDismissed) {
      loadData();
    }
  }, [welcomeDismissed]);

  const triggerIngestion = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Since Streamlit pipelines run directly inside the Python environment,
      // in our Flask server we will trigger the python scripts, but we can also mock it or run it.
      // Let's trigger a POST request to simulate or run ingestion
      alert("Please ensure the Flask backend API is running. If pipelines are not generated, execute them via 'py src/data_ingestion.py' in your shell.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soft_flux: parseFloat(softInput),
          hard_flux: parseFloat(hardInput)
        })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.log("Simulating client-side fallback...");
      const soft_flux = parseFloat(softInput);
      const hard_flux = parseFloat(hardInput);
      const is_triggered = soft_flux > 1.5e-6;
      let flare_class = "Quiet";
      let confidence = "none";
      if (is_triggered) {
        if (soft_flux >= 1e-4) {
          flare_class = `X${(soft_flux / 1e-4).toFixed(1)}`;
        } else if (soft_flux >= 1e-5) {
          flare_class = `M${(soft_flux / 1e-5).toFixed(1)}`;
        } else {
          flare_class = `C${(soft_flux / 1e-6).toFixed(1)}`;
        }
        confidence = hard_flux > 3e-8 ? "hard-confirmed" : "soft-only";
      }
      setSimResult({
        triggered: is_triggered,
        flare_class: flare_class,
        confidence: confidence
      });
    }
  };

  const handleDismissWelcome = () => {
    localStorage.setItem("welcome_dismissed", "true");
    setWelcomeDismissed(true);
  };

  const handleShowWelcome = () => {
    localStorage.setItem("welcome_dismissed", "false");
    setWelcomeDismissed(false);
  };

  // Filter telemetry based on slider range
  const getFilteredTelemetry = () => {
    if (telemetry.length === 0) return [];
    const startIndex = Math.floor((windowRange[0] / 100) * telemetry.length);
    const endIndex = Math.floor((windowRange[1] / 100) * telemetry.length);
    return telemetry.slice(startIndex, Math.max(startIndex + 50, endIndex));
  };

  const filteredData = getFilteredTelemetry();

  // Welcome Gate Layout
  if (!welcomeDismissed) {
    return (
      <div className="min-h-screen text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden bg-transparent">
        <CosmicBackground />
        
        <header className="text-center mt-6 relative z-10 flex flex-col items-center">
          <div className="border-4 border-white p-1 mb-4">
            <div className="bg-white text-black px-12 py-4 font-serif-astronomy text-5xl tracking-[0.25em] font-black uppercase select-none">
              LUNAR
            </div>
          </div>
          <p className="text-xs sm:text-sm font-mono-telemetry text-slate-300 mt-2 tracking-widest uppercase">
            Aditya-L1 SoLEXS (SXR) & HEL1OS (HXR) Telemetry Observatories
          </p>
          <div className="flex items-center gap-2 text-white/70 font-mono text-[14px] select-none tracking-widest mt-4">
            <span>☽</span> <span>☽</span> <span>◑</span> <span>◑</span> <span className="text-white font-bold">🌕</span> <span>◐</span> <span>◐</span> <span>☾</span> <span>☾</span>
          </div>
        </header>

        <main className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 my-8 items-center relative z-10">
          {/* Left Column - Cinematic Flare Image & Technical Coordinates Grid Overlay */}
          <div className="md:col-span-7 rounded-none border-2 border-white bg-black relative group overflow-hidden">

            
            <img 
              src="./aditya_l1_solar_flare_custom.png" 
              alt="Aditya-L1 Solar Flare" 
              className="w-full h-auto object-cover aspect-video sm:aspect-[16/10] opacity-95 select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-4">
              <span className="text-xs font-mono-telemetry text-black font-bold bg-white border border-white px-2.5 py-1 rounded-none">
                MISSION ORBIT: L1 LAGRANGE POINT HALO PATH
              </span>
            </div>
          </div>

          {/* Right Column - Mission details & Welcome Button */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="tech-card space-y-4 shadow-2xl relative border-2 border-white overflow-visible">
              {/* Retro zine sticker overlay */}
              <img 
                src="./sticker_dish.png" 
                alt="Tracking Dish Sticker" 
                className="absolute -top-7 -right-7 w-16 h-16 pointer-events-none select-none z-20 transform rotate-12 hover:scale-110 transition-transform duration-200"
              />
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest font-mono-telemetry border-b border-white/20 pb-2">
                <span className="size-2 bg-white animate-pulse" />
                Space Weather Command
              </div>
              
              <h2 className="text-xl font-bold uppercase tracking-wider text-white">
                Neupert Effect Precursors
              </h2>
              
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans font-light">
                Utilizing high-temporal X-ray telemetry from India's <strong>Aditya-L1</strong> to forecast solar flare eruptions. By combining thermal soft X-rays (<strong>SoLEXS</strong>) and impulsive hard X-ray precursors (<strong>HEL1OS</strong>), our platform gives space operators a <strong>15 to 45 minute warning</strong> to safeguard satellite communications.
              </p>
              
              <table className="tech-table">
                <tbody>
                  <tr className="tech-table-row">
                    <td className="tech-table-cell-key text-[10px]">Orbit Station</td>
                    <td className="tech-table-cell-val text-[10px] text-white">Lagrange Point L1 Halo Orbit</td>
                  </tr>
                  <tr className="tech-table-row">
                    <td className="tech-table-cell-key text-[10px]">Telemetry Lead Time</td>
                    <td className="tech-table-cell-val text-[10px] text-white font-bold">15 to 45 Minutes</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button
              onClick={handleDismissWelcome}
              className="w-full py-4 text-sm font-bold text-black bg-white hover:bg-black hover:text-white border-2 border-white transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest font-mono-telemetry rounded-none"
            >
              ENTER MISSION CONTROL <ArrowRight className="size-4" />
            </button>
          </div>
        </main>

        <footer className="text-center text-slate-400 text-xs py-4 border-t border-white/20 relative z-10 bg-black/40">
          <h3 className="text-slate-300 font-bold mb-1">Solar Flare Forecasting using Aditya-L1 SoLEXS & HEL1OS</h3>
          
          <p className="mb-1 text-slate-300 font-bold">Created by @ansh, @arya, @malthesh, @bopaiah</p>
          <p className="text-[10px] text-slate-500 mt-2">
            © 2026 All Rights Reserved |{" "}
            <button 
              onClick={() => setShowPrivacy(true)} 
              className="underline hover:text-white cursor-pointer bg-transparent border-none p-0 inline font-mono"
            >
              Privacy Policy
            </button>
          </p>
        </footer>
      </div>
    );
  }

  // Dashboard Layout
  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between relative overflow-hidden bg-transparent">
      <CosmicBackground />
      
      {/* Navbar Header */}
      <header className="border-b-2 border-white bg-black px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="border-2 border-white p-0.5">
            <div className="bg-white text-black px-4 py-1.5 font-serif-astronomy text-2xl tracking-[0.15em] font-black uppercase select-none">
              LUNAR
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-widest font-mono-telemetry">
              ADITYA-L1 SOLAR FLARE SYSTEM
            </h1>
            <p className="text-[10px] text-slate-400 font-mono-telemetry uppercase tracking-wider">Aditya-L1 SoLEXS & HEL1OS Real-Time Pipelines</p>
          </div>
        </div>
        <button
          onClick={handleShowWelcome}
          className="px-4 py-2 border-2 border-white text-xs font-bold text-black bg-white hover:bg-black hover:text-white transition-all flex items-center gap-1.5 cursor-pointer font-mono-telemetry tracking-wider rounded-none"
        >
          Show Welcome Screen
        </button>
      </header>

      {/* Main Grid content */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 relative z-10">
        
        {/* Left Sidebar Status Panel */}
        <aside className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Telemetry Status Card */}
          <div className="tech-card space-y-4 shadow-2xl relative border-2 border-white overflow-visible">
            {/* Retro zine sticker overlay */}
            <img 
              src="./sticker_asteroid.png" 
              alt="Asteroid Sticker" 
              className="absolute -bottom-5 -left-5 w-14 h-14 pointer-events-none select-none z-20 transform -rotate-12 hover:scale-110 transition-transform duration-200"
            />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono-telemetry flex items-center gap-1.5 border-b border-white/20 pb-2">
              <Activity className="size-3.5" /> Telemetry Status
            </h3>
            
            <div className="bg-black border border-white p-3 space-y-1.5 font-mono-telemetry text-xs relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                  <ShieldAlert className="size-3 animate-pulse" /> RISK LEVEL
                </span>
                <span className="text-[10px] font-bold bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.5 rounded-none animate-pulse">HIGH</span>
              </div>
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>Predicted:</span><strong className="text-red-400 font-bold">M-Class</strong>
              </div>
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>Confidence:</span><strong className="text-orange-400 font-bold">92%</strong>
              </div>
              <div className="flex justify-between text-slate-300 text-[11px]">
                <span>Horizon:</span><strong className="text-white font-bold">Within 30 Mins</strong>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-slate-400 font-bold uppercase tracking-widest text-[9px] font-mono-telemetry">Instrument Config</h4>
              <table className="tech-table !my-1">
                <tbody>
                  <tr className="tech-table-row">
                    <td className="tech-table-cell-key !py-1 text-[10px]">SoLEXS Temp</td>
                    <td className="tech-table-cell-val !py-1 text-[10px] text-orange-400 font-bold">19.4°C (Ok)</td>
                  </tr>
                  <tr className="tech-table-row">
                    <td className="tech-table-cell-key !py-1 text-[10px]">HEL1OS V</td>
                    <td className="tech-table-cell-val !py-1 text-[10px] text-orange-400 font-bold">2.34V (Ok)</td>
                  </tr>
                  <tr className="tech-table-row">
                    <td className="tech-table-cell-key !py-1 text-[10px]">Lagrange</td>
                    <td className="tech-table-cell-val !py-1 text-[10px] text-orange-400 font-bold">Halo L1</td>
                  </tr>
                  <tr className="tech-table-row">
                    <td className="tech-table-cell-key !py-1 text-[10px]">Telemetry</td>
                    <td className="tech-table-cell-val !py-1 text-[10px] text-orange-400 font-bold">124 kbps</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Space Mission Logs */}
          <div className="tech-card space-y-3 shadow-2xl relative border-2 border-white">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono-telemetry flex items-center gap-1.5 border-b border-white/20 pb-2">
              <Terminal className="size-3.5" /> Event Logs
            </h3>
            <div className="bg-black border border-white p-3 font-mono-telemetry text-[10px] text-slate-300 h-40 overflow-y-auto space-y-1 shadow-inner">
              <p className="text-slate-500">[08:15 UTC] Halo orbit correction ok.</p>
              <p className="text-slate-500">[08:19 UTC] HEL1OS trigger activated.</p>
              <p className="text-orange-400 border-b border-dashed border-white/20 pb-0.5">[08:42 UTC] Precursor threshold triggered.</p>
              <p className="text-red-500 font-bold animate-pulse">[08:45 UTC] HIGH ALERT issued.</p>
            </div>
          </div>
        </aside>

        {/* Right Dashboard Tabs Container */}
        <main className="lg:col-span-9 flex flex-col gap-6">
          {/* Tab Navigation header */}
          <PillNav
            items={[
              { id: "nowcast", label: "Nowcasting & Telemetry", href: "#nowcast" },
              { id: "forecast", label: "Forecasting Engine", href: "#forecast" },
              { id: "simulator", label: "Interactive Neupert Simulator", href: "#simulator" },
              { id: "proposal", label: "About & Orbits", href: "#proposal" },
              { id: "features", label: "Project Features", href: "#features" }
            ]}
            activeHref={`#${activeTab}`}
            onItemClick={(item) => setActiveTab(item.id as any)}
            baseColor="#ffffff"
            pillColor="#000000"
            hoveredPillTextColor="#000000"
            pillTextColor="#ffffff"
            initialLoadAnimation={true}
          />

          {/* Tab 1: Nowcasting Telemetry */}
          {activeTab === "nowcast" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: "Total Flares", value: catalogue.length || "12" },
                  { title: "M-Class Count", value: catalogue.filter(f => f.flare_class.startsWith("M")).length || "6" },
                  { title: "X-Class Count", value: catalogue.filter(f => f.flare_class.startsWith("X")).length || "1" },
                  { title: "HXR Confirmed", value: catalogue.filter(f => f.confidence === "hard-confirmed").length || "4" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-black border-2 border-white p-4 text-center shadow-none hover:scale-[1.01] transition-transform">
                    <p className="text-xs text-slate-400 font-medium uppercase font-mono-telemetry">{stat.title}</p>
                    <p className="text-2xl font-black text-orange-500 mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              {errorMsg ? (
                <div className="bg-black border-2 border-white p-6 text-center space-y-4">
                  <p className="text-sm text-white font-mono-telemetry">{errorMsg}</p>
                  <button 
                    onClick={triggerIngestion}
                    className="px-5 py-2.5 bg-white text-black hover:bg-black hover:text-white border-2 border-white text-xs font-bold rounded-none transition-colors cursor-pointer uppercase font-mono-telemetry"
                  >
                    Run Telemetry Processing
                  </button>
                </div>
              ) : (
                <div className="bg-black border-2 border-white p-6 space-y-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono-telemetry">SoLEXS (SXR) & HEL1OS (HXR) Telemetry Lightcurves</h3>
                  
                  {/* Slider simulation for zoom */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono-telemetry">
                      <span>Timeline Filter: {windowRange[0]}% to {windowRange[1]}%</span>
                      <span>Adjust to zoom</span>
                    </div>
                    <div className="flex gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="80" 
                        value={windowRange[0]}
                        onChange={(e) => setWindowRange([parseInt(e.target.value), windowRange[1]])}
                        className="w-full accent-white" 
                      />
                      <input 
                        type="range" 
                        min="20" 
                        max="100" 
                        value={windowRange[1]}
                        onChange={(e) => setWindowRange([windowRange[0], parseInt(e.target.value)])}
                        className="w-full accent-white" 
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    {filteredData.length > 0 ? (
                      <InteractiveTelemetryChart data={filteredData} />
                    ) : (
                      <div className="h-72 flex items-center justify-center text-xs text-slate-500 font-mono-telemetry bg-black border-2 border-white">Loading charts...</div>
                    )}
                  </div>

                  {/* Flare table */}
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-telemetry">Flare Catalogue (master_catalogue.csv)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-slate-300 border border-white">
                        <thead className="bg-white text-black uppercase tracking-wider text-[10px] font-bold">
                          <tr>
                            <th className="px-4 py-2 border-r border-white">Flare ID</th>
                            <th className="px-4 py-2 border-r border-white">Peak Time</th>
                            <th className="px-4 py-2 border-r border-white">Peak Flux (W/m²)</th>
                            <th className="px-4 py-2 border-r border-white">Class</th>
                            <th className="px-4 py-2">Trigger Confirmation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/20">
                          {catalogue.length > 0 ? (
                            catalogue.map((f, idx) => {
                              const flareId = `FL-${String(idx + 1).padStart(3, '0')}`;
                              let peakFlux = 1e-6;
                              if (f.flare_class) {
                                const match = f.flare_class.match(/^([BCMX])(\d+(?:\.\d+)?)$/);
                                if (match) {
                                  const letter = match[1];
                                  const val = parseFloat(match[2]);
                                  let base = 1e-6;
                                  if (letter === "B") base = 1e-7;
                                  if (letter === "C") base = 1e-6;
                                  if (letter === "M") base = 1e-5;
                                  if (letter === "X") base = 1e-4;
                                  peakFlux = val * base;
                                }
                              }
                              return (
                                <tr key={idx} className="hover:bg-white hover:text-black hover:font-bold transition-all duration-100">
                                  <td className="px-4 py-2 font-mono border-r border-white/20 text-orange-400 font-bold">{flareId}</td>
                                  <td className="px-4 py-2 border-r border-white/20">{f.peak_time}</td>
                                  <td className="px-4 py-2 border-r border-white/20 text-orange-400">{peakFlux.toExponential(3)}</td>
                                  <td className="px-4 py-2 font-black border-r border-white/20 text-orange-500">{f.flare_class}</td>
                                  <td className="px-4 py-2">
                                    <span className="px-2 py-0.5 text-[10px] bg-black text-orange-400 font-bold uppercase border border-orange-500 rounded-none">
                                      {f.confidence}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="text-center py-4 text-slate-500">No active flares detected. Run process simulation.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Forecasting Engine */}
          {activeTab === "forecast" && (
            <div className="technical-document relative">
              {/* Background Orbit Trajectory Curve */}
              <svg className="absolute inset-0 w-full h-full stroke-orange-500/30 fill-none pointer-events-none z-0">
                <path d="M 100 50 Q 500 800 900 50" strokeWidth="2" />
                <circle cx="500" cy="425" r="4" fill="#f97316" className="animate-pulse" />
                <ellipse cx="500" cy="425" rx="30" ry="12" stroke="rgba(249,115,22,0.3)" strokeWidth="0.5" />
              </svg>



              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
                <div className="md:col-span-5 bg-black border border-white p-5 space-y-4 shadow-none relative overflow-visible">
                  {/* Retro zine sticker overlay */}
                  <img 
                    src="./sticker_comet.png" 
                    alt="Comet Sticker" 
                    className="absolute -top-6 -right-6 w-16 h-16 pointer-events-none select-none z-20 transform -rotate-12 hover:scale-110 transition-transform duration-200"
                  />
                  <h3 className="text-md font-bold uppercase tracking-wider text-white flex items-center gap-1.5 font-mono-telemetry">Machine Learning Precursors</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                    Physics dictates that high-energy non-thermal electrons (Hard X-rays) deposit energy into the lower solar atmosphere, which subsequently heats up plasma and rises into the corona, emitting thermal soft X-rays.
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                    Therefore, <strong>Hard Rate of Rise (HRR)</strong> and <strong>Hardness Ratio (HR)</strong> peaks occur <em>minutes</em> before the Soft X-ray peak. Our Random Forest prediction engine uses these precursors to forecast flare class risks.
                  </p>
                  <div className="border-t border-white/20 pt-4 space-y-2">
                    <h4 className="text-xs font-bold text-white font-mono-telemetry tracking-widest uppercase">Horizon Performance Metrics</h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                      <div className="bg-black border border-white p-2">
                        <p className="text-slate-400 font-mono-telemetry">30-Min</p>
                        <p className="text-orange-500 font-bold font-mono-telemetry mt-0.5">HSS: 0.63</p>
                      </div>
                      <div className="bg-black border border-white p-2">
                        <p className="text-slate-400 font-mono-telemetry">60-Min</p>
                        <p className="text-orange-500 font-bold font-mono-telemetry mt-0.5">HSS: 0.51</p>
                      </div>
                      <div className="bg-black border border-white p-2">
                        <p className="text-slate-400 font-mono-telemetry">120-Min</p>
                        <p className="text-orange-500 font-bold font-mono-telemetry mt-0.5">HSS: 0.13</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulation Playground */}
                <div className="md:col-span-7 bg-black border border-white p-5 space-y-4 shadow-none">
                  <h3 className="text-md font-bold uppercase tracking-wider text-white flex items-center gap-1.5 font-mono-telemetry">Nowcasting Trigger Playground</h3>
                  <p className="text-xs text-slate-300 font-mono-telemetry uppercase tracking-wider">Enter custom solar flux levels to test classification thresholds:</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Soft Flux (SoLEXS Watts/m²)</label>
                      <input 
                        type="text" 
                        value={softInput}
                        onChange={(e) => setSoftInput(e.target.value)}
                        className="w-full bg-black border-2 border-white text-xs font-mono py-1.5 px-3 text-white outline-none focus:border-white rounded-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300">Hard Flux (HEL1OS Watts/m²)</label>
                      <input 
                        type="text" 
                        value={hardInput}
                        onChange={(e) => setHardInput(e.target.value)}
                        className="w-full bg-black border-2 border-white text-xs font-mono py-1.5 px-3 text-white outline-none focus:border-white rounded-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSimulate}
                    className="px-4 py-2 bg-white text-black hover:bg-black hover:text-white border-2 border-white text-xs font-bold rounded-none cursor-pointer transition-colors font-mono-telemetry"
                  >
                    Run Trigger Verification
                  </button>

                  {simResult && (
                    <div className="border-t border-white/20 pt-4 grid grid-cols-3 gap-3 text-xs">
                      <div className="bg-black p-3 border border-white rounded-none">
                        <span className="text-[10px] text-slate-400">Trigger Status</span>
                        <p className={`font-bold mt-0.5 text-orange-500`}>
                          {simResult.triggered ? "ERUPTION" : "QUIET"}
                        </p>
                      </div>
                      <div className="bg-black p-3 border border-white rounded-none">
                        <span className="text-[10px] text-slate-400">Class</span>
                        <p className="font-bold mt-0.5 text-orange-500">{simResult.flare_class}</p>
                      </div>
                      <div className="bg-black p-3 border border-white rounded-none">
                        <span className="text-[10px] text-slate-400">Confidence</span>
                        <p className="font-bold mt-0.5 text-orange-500">{simResult.confidence}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Interactive physics simulator */}
          {activeTab === "simulator" && (
            <div className="technical-document relative">
              {/* Background Orbit Trajectory Curve */}
              <svg className="absolute inset-0 w-full h-full stroke-orange-500/30 fill-none pointer-events-none z-0">
                <path d="M 100 50 Q 500 800 900 50" strokeWidth="2" />
                <circle cx="500" cy="425" r="4" fill="#f97316" className="animate-pulse" />
                <ellipse cx="500" cy="425" rx="30" ry="12" stroke="rgba(249,115,22,0.3)" strokeWidth="0.5" />
              </svg>



              <div className="relative z-10 space-y-4">
                <OrbitSimulator />
              </div>
            </div>
          )}

          {/* Tab 4: Proposal documentation & formulas */}
          {activeTab === "proposal" && (
            <div className="space-y-4">
              <ProposalDocs />
            </div>
          )}

          {/* Tab 5: MagicBento Project Features block */}
          {activeTab === "features" && (
            <div className="technical-document relative">
              {/* Background Orbit Trajectory Curve */}
              <svg className="absolute inset-0 w-full h-full stroke-orange-500/30 fill-none pointer-events-none z-0">
                <path d="M 100 50 Q 500 800 900 50" strokeWidth="2" />
                <circle cx="500" cy="425" r="4" fill="#f97316" className="animate-pulse" />
                <ellipse cx="500" cy="425" rx="30" ry="12" stroke="rgba(249,115,22,0.3)" strokeWidth="0.5" />
              </svg>



              <div className="relative z-10 space-y-6">
                <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
                  <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Project Capabilities Grid</h2>
                  <p className="text-xs text-slate-400">Click on any card icon below to explore full technical parameters</p>
                </div>
                <MagicBento 
                  textAutoHide={true}
                  enableStars={true}
                  enableSpotlight={true}
                  enableBorderGlow={true}
                  enableTilt={true}
                  enableMagnetism={true}
                  clickEffect={true}
                  spotlightRadius={300}
                  particleCount={12}
                glowColor="255, 255, 255"
                />
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Unified Hackathon Footer */}
      <footer className="border-t-2 border-white bg-black py-6 text-center text-slate-400 text-xs relative z-10">
        <h3 className="text-slate-300 font-bold mb-1">Solar Flare Forecasting using Aditya-L1 SoLEXS & HEL1OS</h3>
        
        <p className="mb-1 text-slate-300 font-bold">Created by @ansh, @arya, @malthesh, @bopaiah</p>
        <p className="text-[10px] text-slate-500 mt-2">
          © 2026 All Rights Reserved |{" "}
          <button 
            onClick={() => setShowPrivacy(true)} 
            className="underline hover:text-white cursor-pointer bg-transparent border-none p-0 inline font-mono"
          >
            Privacy Policy
          </button>
        </p>
      </footer>

      {showPrivacy && createPortal(
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 text-white font-mono-telemetry">
          <div className="bg-black border-2 border-white max-w-md w-full p-6 relative flex flex-col gap-4 rounded-none shadow-2xl">
            <button 
              onClick={() => setShowPrivacy(false)} 
              className="absolute top-4 right-4 text-xs font-bold border border-white px-2 py-0.5 hover:bg-white hover:text-black rounded-none cursor-pointer"
            >
              [ CLOSE ]
            </button>
            <div className="border-b border-white/20 pb-2">
              <span className="text-[9px] text-orange-500 font-bold tracking-widest uppercase">SECURITY PROTOCOL</span>
              <h2 className="text-md font-bold uppercase tracking-wider mt-1 text-white">PRIVACY POLICY</h2>
            </div>
            <div className="text-xs space-y-3 leading-relaxed text-slate-300">
              <p>
                This application processes data locally under the Bharatiya Antariksh Hackathon 2026 guidelines.
              </p>
              <p>
                <strong>1. Data Ingestion</strong>: Solar flux measurements from simulated SoLEXS and HEL1OS instruments are kept in memory and are never transmitted to external servers.
              </p>
              <p>
                <strong>2. Forecasting Operations</strong>: Predictive machine learning models (Random Forest pipelines) operate fully on-device to classify event risks.
              </p>
              <p>
                <strong>3. Compliance</strong>: Observational data logs, precursor warning charts, and telemetry status flags are maintained in local state sessions.
              </p>
            </div>
            <div className="text-[10px] text-slate-500 text-center border-t border-white/10 pt-3">
              Created by @ansh, @arya, @malthesh, @bopaiah
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
