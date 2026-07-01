import React, { useState } from "react";
import { createPortal } from "react-dom";
import "./ProposalDocs.css";
import FlowingMenu from "./FlowingMenu";

interface ExpanderProps {
  index: string;
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function Expander({ index, title, children, defaultExpanded = false }: ExpanderProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  return (
    <div className="tech-accordion">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="tech-accordion-header"
      >
        <span className="tech-accordion-index">{index}</span>
        <span className="tech-accordion-title">{title}</span>
        <span className="tech-accordion-arrow">{isOpen ? "[ ACTIVE ]" : "[ INACTIVE ]"}</span>
      </button>
      {isOpen && (
        <div className="tech-accordion-content space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function ProposalDocs() {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const itemDetails: Record<string, { desc: string; params: [string, string][] }> = {
    "Aditya-L1 Orbit": {
      desc: "Aditya-L1 is positioned in a halo orbit around the Lagrange point 1 (L1) of the Sun-Earth system, located approximately 1.5 million km from Earth. This orbit provides an unobstructed view of the Sun without any occultation or eclipses, allowing continuous monitoring of solar activities.",
      params: [
        ["Station Location", "Lagrange Point L1"],
        ["Distance from Earth", "1.5 Million km"],
        ["Halo Orbit Radius (Y)", "120,000 km"],
        ["Halo Orbit Period", "178 Days"]
      ]
    },
    "SoLEXS Instrument": {
      desc: "The Solar Low Energy X-ray Spectrometer (SoLEXS) is designed to monitor the soft X-ray flux (2–22 keV) from the Sun. It measures the flare profiles and calculates the temperature and emission measure of the solar corona, identifying thermal plasma heating precursors.",
      params: [
        ["Energy Range", "2 - 22 keV"],
        ["Detector Type", "Silicon Drift Detector (SDD)"],
        ["Spectral Resolution", "< 250 eV at 5.9 keV"],
        ["Temporal Resolution", "1 Second"]
      ]
    },
    "HEL1OS Instrument": {
      desc: "The High Energy L1 Orbiting X-ray Spectrometer (HEL1OS) monitors hard X-ray flux (8–150 keV). It tracks high-energy non-thermal electron acceleration processes in the solar atmosphere, providing the precursor data needed to forecast flare events before peak thermal emission.",
      params: [
        ["Energy Range", "8 - 150 keV"],
        ["Detectors", "CZT & BiTe Detectors"],
        ["CZT Pixel Pitch", "2.46 mm"],
        ["Temporal Resolution", "0.1 Seconds"]
      ]
    },
    "Neupert Effect Physics": {
      desc: "The Neupert Effect describes the relation where the rise of soft thermal X-ray emission matches the time integral of the hard non-thermal X-ray emission. This indicates that non-thermal electron beam deposits are directly heating the solar chromosphere, driving plasma upwards to produce soft X-rays.",
      params: [
        ["Lead Time", "15 to 45 Minutes"],
        ["Physical Mechanism", "Chromospheric Evaporation"],
        ["Energy Transfer", "Electron Beam Deposition"],
        ["Prediction Horizon", "30, 60, and 120 Mins"]
      ]
    }
  };

  const details = selectedItem ? itemDetails[selectedItem.text] : null;

  return (
    <div className="technical-document">
      {/* Background Orbit Trajectory Curve */}
      <svg className="absolute inset-0 w-full h-full stroke-orange-500/20 fill-none pointer-events-none z-0">
        <path d="M 100 50 Q 500 800 900 50" strokeWidth="2" />
        <circle cx="500" cy="425" r="4" fill="#f97316" className="animate-pulse" />
        <ellipse cx="500" cy="425" rx="30" ry="12" stroke="rgba(249,115,22,0.3)" strokeWidth="0.5" />
      </svg>



      {/* Document Header */}
      <div className="tech-doc-header relative overflow-visible">
        {/* Retro zine sticker overlay */}
        <img 
          src="/sticker_sun.png" 
          alt="Sun Sticker" 
          className="absolute -top-8 right-6 w-16 h-16 pointer-events-none select-none z-20 transform rotate-6 hover:scale-110 transition-transform duration-200"
        />
        <h2 className="text-2xl font-serif-astronomy text-white font-bold tracking-wide uppercase">SOLAR FLARE FORECASTING PIPELINE</h2>
      </div>

      <div className="space-y-2">
        <Expander index="[01]" title="Consolidated Proposal Abstract" defaultExpanded={true}>
          <div className="space-y-3">
            <h1 className="text-base font-semibold text-white uppercase tracking-wider">PROJECT: Solar Flare Forecasting using Aditya-L1 SoLEXS & HEL1OS</h1>
            <p className="text-xs text-orange-400 font-semibold tracking-widest font-mono">BHARATIYA ANTARIKSH HACKATHON 2026</p>
            
            <p className="text-slate-300">
              Our project proposes an integrated physical-machine learning pipeline to forecast solar flare occurrences using real-time observations from ISRO's Aditya-L1 mission. Specifically, we utilize Soft X-ray (SXR) observations from the SoLEXS payload and Hard X-ray (HXR) telemetry from the HEL1OS payload.
            </p>
            <p className="text-slate-300">
              By leveraging the Neupert Effect, where non-thermal HXR emission peaks act as physical precursors to thermal SXR emission peaks, we construct early-warning triggers to warn of incoming flare risks (Classes C, M, and X) with 15 to 45 minutes of lead time.
            </p>


          </div>
        </Expander>

        <Expander index="[02]" title="Scientific Context & Payloads">
          <div className="space-y-3">
            <p className="text-slate-300">
              Solar flares are massive, explosive releases of electromagnetic radiation from active magnetic regions on the Sun. They propagate at the speed of light, reaching Earth in ~8 minutes. Major solar events (X-class flares) can disrupt satellites, degrade GPS signals, cause HF radio blackouts, and pose high radiation risks to space assets.
            </p>

            <h3 className="text-xs font-semibold text-white uppercase tracking-widest mt-4">ISRO Aditya-L1 Instrument Configuration</h3>
            <table className="tech-table">
              <tbody>
                <tr className="tech-table-row">
                  <td className="tech-table-cell-key">SoLEXS Payload</td>
                  <td className="tech-table-cell-val">Solar Low Energy X-ray Spectrometer (SXR, 2-22 keV). Tracks thermal plasma heating.</td>
                </tr>
                <tr className="tech-table-row">
                  <td className="tech-table-cell-key">HEL1OS Payload</td>
                  <td className="tech-table-cell-val">High Energy L1 Orbiting X-ray Spectrometer (HXR, 8-150 keV). Captures non-thermal electron beam precursors.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Expander>

        <Expander index="[03]" title="Methodology & Physics-Based Integration">
          <div className="space-y-3">
            <p className="text-slate-300">
              Our core prediction logic utilizes physical precursors inspired by the Neupert Effect, which states that the thermal soft X-ray emission is proportional to the time integral of the non-thermal hard X-ray emission:
            </p>
            
            <div className="tech-formula-box">
              <div className="tech-formula-text">
                F_SXR(t) ≈ ∫ [ F_HXR(t') ] dt' (from t_0 to t)
              </div>
            </div>

            <p className="text-slate-300 mt-2">
              By calculating the temporal derivative of SXR flux and checking for leading HXR spikes, the ML algorithm receives predictive features prior to the peak thermal output manifest on sensors.
            </p>
          </div>
        </Expander>

        <Expander index="[04]" title="Platform Flow & Architecture">
          <div className="space-y-3">
            <p className="text-slate-300">
              The telemetry data passes through a multi-stage real-time execution pipeline:
            </p>
            <table className="tech-table">
              <tbody>
                <tr className="tech-table-row">
                  <td className="tech-table-cell-key">01. Data Ingestion</td>
                  <td className="tech-table-cell-val">Parses raw telemetry records from sensors at high temporal resolutions.</td>
                </tr>
                <tr className="tech-table-row">
                  <td className="tech-table-cell-key">02. Feature Engineering</td>
                  <td className="tech-table-cell-val">Extracts background-subtracted flux levels and Hard Rate of Rise (HRR) gradients.</td>
                </tr>
                <tr className="tech-table-row">
                  <td className="tech-table-cell-key">03. Nowcasting</td>
                  <td className="tech-table-cell-val">Detects live events instantly based on soft X-ray threshold crossings.</td>
                </tr>
                <tr className="tech-table-row">
                  <td className="tech-table-cell-key">04. Forecasting</td>
                  <td className="tech-table-cell-val">Runs trained Random Forest Classifiers to compute warning probability maps for 30, 60, and 120-minute lookahead windows.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Expander>

        <Expander index="[05]" title="Validation & Forecasting Precision Metrics">
          <div className="space-y-3">
            <p className="text-slate-300">
              Platform validation against historical NOAA flare catalogs registers high precision forecasting lead times:
            </p>
            
            <table className="tech-table">
              <thead>
                <tr className="tech-table-row border-b border-white/20">
                  <th className="tech-table-cell-key font-bold text-white uppercase text-[10px] tracking-widest text-left">Forecast Horizon</th>
                  <th className="tech-table-cell-val font-bold text-white uppercase text-[10px] tracking-widest text-left border-r border-white">True Positive Rate</th>
                  <th className="tech-table-cell-val font-bold text-white uppercase text-[10px] tracking-widest text-left border-r border-white">False Alarm Rate</th>
                  <th className="tech-table-cell-val font-bold text-white uppercase text-[10px] tracking-widest text-left">Heidke Skill Score</th>
                </tr>
              </thead>
              <tbody>
                <tr className="tech-table-row">
                  <td className="tech-table-cell-key">30-Minute Horizon</td>
                  <td className="tech-table-cell-val text-green-400 border-r border-white">70.0%</td>
                  <td className="tech-table-cell-val text-red-400 border-r border-white">41.0%</td>
                  <td className="tech-table-cell-val text-orange-400">0.63</td>
                </tr>
                <tr className="tech-table-row">
                  <td className="tech-table-cell-key">60-Minute Horizon</td>
                  <td className="tech-table-cell-val text-green-400 border-r border-white">50.0%</td>
                  <td className="tech-table-cell-val text-red-400 border-r border-white">42.0%</td>
                  <td className="tech-table-cell-val text-orange-400">0.51</td>
                </tr>
                <tr className="tech-table-row">
                  <td className="tech-table-cell-key">120-Minute Horizon</td>
                  <td className="tech-table-cell-val text-green-400 border-r border-white">32.0%</td>
                  <td className="tech-table-cell-val text-red-400 border-r border-white">82.0%</td>
                  <td className="tech-table-cell-val text-orange-400">0.13</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Expander>
      </div>

      {/* Flowing Menu Navigation */}
      <div className="border-t border-white/10 pt-6 mt-8">
        <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-4 text-center">Interactive Space Mission Index</h3>
        <div style={{ height: '320px', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
          <FlowingMenu 
            items={[
              { link: "#", text: "Aditya-L1 Orbit", image: "/orbital_geometry.png" },
              { link: "#", text: "SoLEXS Instrument", image: "/nowcasting_icon.png" },
              { link: "#", text: "HEL1OS Instrument", image: "/interactive_simulator.png" },
              { link: "#", text: "Neupert Effect Physics", image: "/neupert_effect.png" }
            ]} 
            speed={12} 
            textColor="#ffffff" 
            bgColor="transparent" 
            marqueeBgColor="#ffffff" 
            marqueeTextColor="#000000" 
            borderColor="#ffffff" 
            onItemClick={(item) => setSelectedItem(item)}
          />
        </div>
      </div>

      {/* Details pop-up modal overlay */}
      {selectedItem && details && createPortal(
        <div className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-black border-2 border-white max-w-2xl w-full p-6 relative flex flex-col gap-5 font-mono-telemetry text-white rounded-none max-h-[90vh] overflow-y-auto">
            {/* Parabolic design line in the modal background */}
            <svg className="absolute inset-0 w-full h-full stroke-orange-500/10 fill-none pointer-events-none">
              <path d="M 50 20 Q 300 400 550 20" strokeWidth="2" />
            </svg>



            <button 
              onClick={() => setSelectedItem(null)} 
              className="absolute top-4 right-4 text-xs font-bold border border-white px-2 py-0.5 hover:bg-white hover:text-black rounded-none cursor-pointer"
            >
              [ CLOSE ]
            </button>

            <div className="border-b border-white/20 pb-2">
              <span className="text-[10px] text-orange-500 font-bold tracking-widest uppercase">OBSERVATIONAL PARAMETERS</span>
              <h2 className="text-xl font-bold uppercase tracking-wider text-white mt-1">{selectedItem.text}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Left Column: Sketchy Custom Image */}
              <div className="md:col-span-5 border border-white bg-black p-2 flex items-center justify-center">
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.text} 
                  className="max-h-[140px] w-auto object-contain select-none" 
                />
              </div>

              {/* Right Column: Descriptions */}
              <div className="md:col-span-7 space-y-3">
                <div className="border-l-2 border-orange-500 pl-3">
                  <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                    {details.desc}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-slate-400 font-bold uppercase tracking-widest text-[9px] font-mono-telemetry">Parameter readouts</h4>
              <table className="tech-table w-full">
                <tbody>
                  {details.params.map(([key, val], idx) => (
                    <tr className="tech-table-row border-b border-white/10" key={idx}>
                      <td className="tech-table-cell-key !py-2 text-[10px] font-mono text-slate-400">{key}</td>
                      <td className="tech-table-cell-val !py-2 text-[10px] font-bold text-orange-400 text-right">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
