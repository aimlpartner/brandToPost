import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ProductDNA } from "../types";

interface DnaModelProps {
  progress: number; // 0 to 100
  dna?: Partial<ProductDNA>;
  isComplete: boolean;
  onHoverChange?: (idx: number | null) => void;
}

export function DnaModel({ progress, dna, isComplete, onHoverChange }: DnaModelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Refs for direct DOM manipulation of HUD labels and SVG paths (bypasses React 60fps re-renders)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(SVGPathElement | null)[]>([]);
  const brandLineRef = useRef<SVGPathElement>(null);
  const brandBadgeRef = useRef<HTMLDivElement>(null);

  // State & Ref for high-performance hover interaction coordination
  const [hoveredCardIdx, setHoveredCardIdx] = useState<number | null>(null);
  const hoveredCardRef = useRef<number | null>(null);

  const handleCardHover = (idx: number | null) => {
    setHoveredCardIdx(idx);
    hoveredCardRef.current = idx;
    if (onHoverChange) {
      onHoverChange(idx);
    }
  };

  // Resolve brand colors at render time for JSX and inside useEffect
  const primaryColorHex = dna?.visualData?.colors?.[0] || "#7C3AED";
  const secondaryColorHex = dna?.visualData?.colors?.[1] || dna?.visualData?.colors?.[0] || "#a78bfa";

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // --- 1. Three.js Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#FAF9F6", 0.05); // Light theme fog matching the warm off-white

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- 2. Geometry & Materials ---
    const N = 32; // Number of rungs / node pairs
    const helixHeight = 6.0;
    const radius = 1.6;
    const turns = 2.2;

    const nodeGeometry = new THREE.IcosahedronGeometry(0.1, 1);
    


    // Aesthetic Material Definitions (Sleek, Outline-based) - Light Theme Optimized
    const activeNodeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(primaryColorHex),
      wireframe: true,
    });

    const inactiveNodeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#94A3B8"), // Slate-400 for light theme contrast
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });

    const activeRungMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(secondaryColorHex),
      transparent: true,
      opacity: 0.65,
    });

    const inactiveRungMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#CBD5E1"), // Slate-300
      transparent: true,
      opacity: 0.25,
    });

    const activeBackboneMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(primaryColorHex),
      transparent: true,
      opacity: 0.75,
    });

    const inactiveBackboneMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#CBD5E1"), // Slate-300
      transparent: true,
      opacity: 0.25,
    });

    // Special Hovered Materials (Solid, Coral Highlight)
    const hoveredNodeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#FF7778"), // Vibrant Coral
      wireframe: false,
    });

    const hoveredRungMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#FF7778"),
      transparent: true,
      opacity: 1.0,
    });

    // --- 2.5 Particle Field Setup ---
    const particleGeom = new THREE.BufferGeometry();
    const particleCount = 60;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 12;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      color: new THREE.Color(primaryColorHex),
      transparent: true,
      opacity: 0.35
    });
    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // --- 3. Construct DNA Elements ---
    const dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    const nodesA: THREE.Mesh[] = [];
    const nodesB: THREE.Mesh[] = [];
    const rungs: THREE.Line[] = [];
    const backboneA: THREE.Line[] = [];
    const backboneB: THREE.Line[] = [];

    // Local coordinates cache
    const pointsA: THREE.Vector3[] = [];
    const pointsB: THREE.Vector3[] = [];

    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const angle = t * turns * Math.PI * 2;
      const y = (t - 0.5) * helixHeight;

      const xA = Math.sin(angle) * radius;
      const zA = Math.cos(angle) * radius;

      const xB = Math.sin(angle + Math.PI) * radius;
      const zB = Math.cos(angle + Math.PI) * radius;

      const pA = new THREE.Vector3(xA, y, zA);
      const pB = new THREE.Vector3(xB, y, zB);

      pointsA.push(pA);
      pointsB.push(pB);

      // Create Nodes
      const meshA = new THREE.Mesh(nodeGeometry, inactiveNodeMat);
      meshA.position.copy(pA);
      dnaGroup.add(meshA);
      nodesA.push(meshA);

      const meshB = new THREE.Mesh(nodeGeometry, inactiveNodeMat);
      meshB.position.copy(pB);
      dnaGroup.add(meshB);
      nodesB.push(meshB);

      // Create Rungs (Base pairs connecting A and B)
      const rungGeom = new THREE.BufferGeometry().setFromPoints([pA, pB]);
      const rungLine = new THREE.Line(rungGeom, inactiveRungMat);
      dnaGroup.add(rungLine);
      rungs.push(rungLine);
    }

    // Create Backbone segments for local coloring
    for (let i = 0; i < N - 1; i++) {
      const segAGeom = new THREE.BufferGeometry().setFromPoints([pointsA[i], pointsA[i + 1]]);
      const segALine = new THREE.Line(segAGeom, inactiveBackboneMat);
      dnaGroup.add(segALine);
      backboneA.push(segALine);

      const segBGeom = new THREE.BufferGeometry().setFromPoints([pointsB[i], pointsB[i + 1]]);
      const segBLine = new THREE.Line(segBGeom, inactiveBackboneMat);
      dnaGroup.add(segBLine);
      backboneB.push(segBLine);
    }

    // Anchor indices mapping to the 4 HUD labels (proportions along N)
    const labelAnchors = [
      { nodeIdx: Math.floor(N * 0.2), cardIdx: 0, side: "left" },
      { nodeIdx: Math.floor(N * 0.45), cardIdx: 1, side: "right" },
      { nodeIdx: Math.floor(N * 0.7), cardIdx: 2, side: "left" },
      { nodeIdx: Math.floor(N * 0.9), cardIdx: 3, side: "right" },
    ];

    // Lerp positions for smooth sliding HTML overlays
    const cardYPositions = [0, 0, 0, 0];

    // --- Interaction States ---
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationVelocity = { x: 0, y: 0 };
    const targetTilt = { x: 0, y: 0 };

    // Pointer Event Handlers - Unified Mouse & Touch inputs
    const handlePointerDown = (e: PointerEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest(".pointer-events-auto")) {
        return;
      }
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      rotationVelocity = { x: 0, y: 0 };
      if (containerRef.current) {
        containerRef.current.setPointerCapture(e.pointerId);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        dnaGroup.rotation.y += deltaX * 0.007;
        dnaGroup.rotation.x += deltaY * 0.007;

        rotationVelocity = { x: deltaX * 0.007, y: deltaY * 0.007 };
        previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        // Tilt parallax based on hover coordinates
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          targetTilt.x = y * 0.25;
          targetTilt.y = x * 0.25;
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isDragging) {
        isDragging = false;
        if (containerRef.current) {
          containerRef.current.releasePointerCapture(e.pointerId);
        }
      }
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (isDragging) {
        isDragging = false;
        if (containerRef.current) {
          containerRef.current.releasePointerCapture(e.pointerId);
        }
      }
      targetTilt.x = 0;
      targetTilt.y = 0;
    };

    // Attach container listeners
    const container = containerRef.current;
    if (container) {
      container.addEventListener("pointerdown", handlePointerDown as any);
      container.addEventListener("pointermove", handlePointerMove as any);
      container.addEventListener("pointerup", handlePointerUp as any);
      container.addEventListener("pointercancel", handlePointerCancel as any);
      container.addEventListener("pointerleave", handlePointerCancel as any);
    }

    // --- 4. Animation Loop ---
    let animId: number;
    const tempV = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate background stardust particles slowly
      if (particles) {
        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0005;
      }

      if (isDragging) {
        // Soft damp rotation z during drag
        dnaGroup.rotation.z *= 0.95;
      } else {
        // Apply inertia velocity
        dnaGroup.rotation.y += rotationVelocity.x;
        dnaGroup.rotation.x += rotationVelocity.y;

        // Decelerate velocity
        rotationVelocity.x *= 0.95;
        rotationVelocity.y *= 0.95;

        // Base auto-rotation
        dnaGroup.rotation.y += 0.006;
        
        // Return X rotation slowly back to tilt parallax target
        dnaGroup.rotation.x += (targetTilt.x - dnaGroup.rotation.x) * 0.05;
        
        // Soft breathing motion
        dnaGroup.rotation.z = Math.sin(Date.now() * 0.001) * 0.05;
      }

      // Calculate how many nodes to light up
      const activeLimit = Math.floor((progress / 100) * N);

      // Find the node index associated with the hovered card via ref
      const hoveredAnchor = labelAnchors.find((a) => a.cardIdx === hoveredCardRef.current);
      const hoveredNodeIdx = hoveredAnchor ? hoveredAnchor.nodeIdx : null;

      // Update Node and Rung Materials dynamically based on progress and hover
      for (let i = 0; i < N; i++) {
        const isActive = i < activeLimit;
        const isHoveredNode = hoveredNodeIdx !== null && i === hoveredNodeIdx;

        // Scale interpolation - Only nodesA[i] is connected to the HUD line, so only nodesA[i] pulses
        const targetScaleA = isHoveredNode ? 2.0 : 1.0;
        const targetScaleB = 1.0;
        nodesA[i].scale.setScalar(THREE.MathUtils.lerp(nodesA[i].scale.x, targetScaleA, 0.15));
        nodesB[i].scale.setScalar(THREE.MathUtils.lerp(nodesB[i].scale.x, targetScaleB, 0.15));

        if (isHoveredNode) {
          nodesA[i].material = hoveredNodeMat;
          nodesB[i].material = isActive ? activeNodeMat : inactiveNodeMat;
          rungs[i].material = hoveredRungMat;
        } else {
          nodesA[i].material = isActive ? activeNodeMat : inactiveNodeMat;
          nodesB[i].material = isActive ? activeNodeMat : inactiveNodeMat;
          rungs[i].material = isActive ? activeRungMat : inactiveRungMat;
        }
      }

      // Update Backbone Materials
      for (let i = 0; i < N - 1; i++) {
        const isActive = i < activeLimit - 1;
        backboneA[i].material = isActive ? activeBackboneMat : inactiveBackboneMat;
        backboneB[i].material = isActive ? activeBackboneMat : inactiveBackboneMat;
      }

      // --- 5. Project 3D Anchors to 2D HUD overlays ---
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const w = rect.width;
        const h = rect.height;

        labelAnchors.forEach(({ nodeIdx, cardIdx, side }) => {
          const cardEl = cardRefs.current[cardIdx];
          const lineEl = lineRefs.current[cardIdx];

          if (!cardEl || !lineEl) return;

          // Target node position in 3D world space
          const targetNode = nodesA[nodeIdx];
          targetNode.getWorldPosition(tempV);
          tempV.project(camera);

          // Projected 2D coordinates on canvas
          const nodeX = (tempV.x * 0.5 + 0.5) * w;
          const nodeY = (-tempV.y * 0.5 + 0.5) * h;

          // Determine target Y for the card to follow smoothly (Y boundary restricted to container)
          const targetY = Math.max(40, Math.min(h - 90, nodeY - 35));
          if (cardYPositions[cardIdx] === 0) {
            cardYPositions[cardIdx] = targetY;
          } else {
            cardYPositions[cardIdx] += (targetY - cardYPositions[cardIdx]) * 0.12; // Lerp smoothing
          }

          const cardY = cardYPositions[cardIdx];

          // Threshold visibility (card fades in as progress reaches its anchor node height)
          const anchorThreshold = (nodeIdx / N) * 100;
          const isNodeActive = progress >= anchorThreshold - 5; // trigger slightly early

          if (isNodeActive && tempV.z <= 1) {
            cardEl.style.opacity = "1";
            cardEl.style.transform = `translate3d(0px, ${cardY}px, 0) scale(1)`;
            
            // Highlight connection line on hover
            if (hoveredCardRef.current === cardIdx) {
              lineEl.style.opacity = "0.95";
            } else {
              lineEl.style.opacity = "0.35";
            }

            // Draw line between Card edge and DNA Node (using dynamic height & width centers)
            const cardWidth = cardEl.offsetWidth || 180;
            const cardMargin = 15;
            let cardX = 0;
            if (side === "left") {
              cardX = cardWidth + cardMargin; // Right edge of left card
            } else {
              cardX = w - (cardWidth + cardMargin); // Left edge of right card
            }

            const cardHeight = cardEl.offsetHeight || 64;
            const cardCenterY = cardY + (cardHeight / 2);

            lineEl.setAttribute(
              "d",
              `M ${cardX} ${cardCenterY} Q ${(cardX + nodeX) / 2} ${cardCenterY}, ${nodeX} ${nodeY}`
            );
          } else {
            cardEl.style.opacity = "0";
            cardEl.style.transform = `translate3d(0px, ${cardY}px, 0) scale(0.92)`;
            lineEl.style.opacity = "0";
          }
        });

        // Draw line for Brand Logo Badge (top-left) to top-most DNA Node
        const brandBadgeEl = brandBadgeRef.current;
        const brandNode = nodesA[1];
        if (brandBadgeEl && brandNode && brandLineRef.current) {
          brandNode.getWorldPosition(tempV);
          tempV.project(camera);
          const nodeX = (tempV.x * 0.5 + 0.5) * w;
          const nodeY = (-tempV.y * 0.5 + 0.5) * h;
          
          const badgeWidth = brandBadgeEl.offsetWidth || 180;
          const badgeHeight = brandBadgeEl.offsetHeight || 40;
          const badgeX = 16 + badgeWidth; // 16px is top-4/left-4
          const badgeCenterY = 16 + (badgeHeight / 2);

          brandLineRef.current.setAttribute(
            "d",
            `M ${badgeX} ${badgeCenterY} Q ${(badgeX + nodeX) / 2} ${badgeCenterY}, ${nodeX} ${nodeY}`
          );
          
          if (progress >= 5 && tempV.z <= 1) {
            brandLineRef.current.style.opacity = "0.35";
          } else {
            brandLineRef.current.style.opacity = "0";
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- 6. Resize Handler ---
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // --- 7. Resource Cleanup ---
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);

      // Clean up pointer listeners
      if (container) {
        container.removeEventListener("pointerdown", handlePointerDown as any);
        container.removeEventListener("pointermove", handlePointerMove as any);
        container.removeEventListener("pointerup", handlePointerUp as any);
        container.removeEventListener("pointercancel", handlePointerCancel as any);
        container.removeEventListener("pointerleave", handlePointerCancel as any);
      }

      // Dispose Three geometries, materials, renderer
      particleGeom.dispose();
      particleMat.dispose();
      nodeGeometry.dispose();
      activeNodeMat.dispose();
      inactiveNodeMat.dispose();
      hoveredNodeMat.dispose();
      hoveredRungMat.dispose();
      activeRungMat.dispose();
      inactiveRungMat.dispose();
      activeBackboneMat.dispose();
      inactiveBackboneMat.dispose();

      rungs.forEach((r) => r.geometry.dispose());
      backboneA.forEach((b) => b.geometry.dispose());
      backboneB.forEach((b) => b.geometry.dispose());

      renderer.dispose();
    };
  }, [progress, primaryColorHex, secondaryColorHex]);

  // Get a clean domain from the website URL
  const getCleanDomain = (url?: string) => {
    if (!url) return "your site";
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return parsed.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  // Fallback and dynamic metadata strings based on actual extraction fields
  const labelsData = [
    {
      category: "YOUR SITE Scanned",
      value: dna?.website 
        ? `We mapped your landing page at ${getCleanDomain(dna.website)}` 
        : "Scanning your website to find out who you are...",
      side: "left",
      style: { left: "20px" },
    },
    {
      category: "YOUR UNIQUE POSITIONING",
      value: dna?.positioning
        ? `What you do: "${dna.positioning.length > 55 ? `${dna.positioning.slice(0, 52)}...` : dna.positioning}"`
        : "Extracting how your product stands out in the market...",
      side: "right",
      style: { right: "20px" },
    },
    {
      category: "YOUR TARGET AUDIENCE",
      value: dna?.audience
        ? `Who you are helping: ${dna.audience.length > 55 ? `${dna.audience.slice(0, 52)}...` : dna.audience}`
        : "Discovering exactly who you are building this for...",
      side: "left",
      style: { left: "20px" },
    },
    {
      category: "YOUR VOICE & VIBE",
      value: dna?.tone || dna?.visualStyle
        ? `You speak in a "${dna.tone || "confident"}" tone, wearing a ${dna.visualStyle || "clean, modern"} design style`
        : "Analyzing the visual language, typography, and personality of your site...",
      side: "right",
      style: { right: "20px" },
    },
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#FAF9F6] select-none text-left cursor-grab active:cursor-grabbing"
    >
      {/* 3D Canvas rendering */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 block w-full h-full" />

      {/* Brand Identity Badge */}
      <div 
        ref={brandBadgeRef}
        className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-xl shadow-sm animate-fade-in pointer-events-auto hover:border-slate-300 hover:scale-[1.02] transition-all duration-300 select-none"
      >
        {dna?.logoDarkUrl || dna?.logoUrl ? (
          <img 
            src={dna.logoDarkUrl || dna?.logoUrl} 
            alt={dna.name || "Brand"} 
            className="w-6.5 h-6.5 object-contain rounded bg-slate-50 border border-slate-200/50 p-0.5" 
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div 
            style={{ backgroundColor: `${primaryColorHex}15`, color: primaryColorHex }}
            className="w-6.5 h-6.5 rounded flex items-center justify-center font-bold text-xs font-mono border border-slate-200/40"
          >
            {(dna?.name || "B").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-bold text-slate-800 leading-tight mb-0.5">{dna?.name || "Brand DNA"}</span>
          <span className="text-[8px] text-slate-400 font-mono leading-none tracking-tight font-light">{dna?.website || "Local Analysis"}</span>
        </div>
      </div>

      {/* Dynamic style block for line animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flow-dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .line-flow-slow {
          stroke-dasharray: 4 2;
          animation: flow-dash 2s linear infinite;
        }
        .line-flow-fast {
          stroke-dasharray: 5 2;
          animation: flow-dash 0.6s linear infinite;
        }
      `}} />

      {/* SVG Canvas for HUD overlay lines */}
      <svg
        ref={svgRef}
        className="absolute inset-0 z-10 w-full h-full pointer-events-none"
      >
        {/* Connection line from Brand Identity Badge in top-left to top-most DNA node */}
        <path
          ref={brandLineRef}
          fill="none"
          stroke={primaryColorHex}
          strokeWidth="0.8"
          className="transition-opacity duration-300 opacity-0 line-flow-slow"
        />

        {labelsData.map((_, idx) => (
          <path
            key={idx}
            ref={(el) => (lineRefs.current[idx] = el)}
            fill="none"
            stroke={hoveredCardIdx === idx ? "#FF7778" : primaryColorHex}
            strokeWidth={hoveredCardIdx === idx ? "1.6" : "0.8"}
            className={`transition-opacity transition-colors duration-300 opacity-0 ${
              hoveredCardIdx === idx ? 'line-flow-fast' : 'line-flow-slow'
            }`}
          />
        ))}
      </svg>

      {/* HTML absolute HUD cards */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {labelsData.map((card, idx) => (
          <div
            key={idx}
            ref={(el) => (cardRefs.current[idx] = el)}
            onMouseEnter={() => handleCardHover(idx)}
            onMouseLeave={() => handleCardHover(null)}
            style={{
              position: "absolute",
              top: "0px",
              width: hoveredCardIdx === idx ? "260px" : "180px",
              minHeight: "50px",
              height: "auto",
              opacity: 0,
              transform: "scale(0.9) translate3d(0, 0, 0)",
              transition: "opacity 400ms ease-out, transform 400ms ease-out, border-color 300ms ease, background-color 300ms ease, box-shadow 300ms ease, scale 300ms ease, width 250ms ease-out",
              boxShadow: hoveredCardIdx === idx 
                ? `0 10px 25px -5px ${primaryColorHex}25, 0 8px 10px -6px ${primaryColorHex}20` 
                : "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
              borderColor: hoveredCardIdx === idx ? "#FF7778" : undefined,
              ...card.style,
            }}
            className="bg-white/85 backdrop-blur-sm border border-slate-900/10 rounded-xl p-2.5 shadow-sm flex flex-col justify-center select-none pointer-events-auto transition-all duration-300 hover:bg-white hover:scale-[1.02] cursor-pointer"
          >
            <span 
              style={{ color: hoveredCardIdx === idx ? "#FF7778" : primaryColorHex }}
              className="text-[8px] font-semibold tracking-wider uppercase font-mono block mb-0.5"
            >
              {card.category}
            </span>
            <div className="flex items-center gap-2 text-left">
              {idx === 0 && (
                dna?.logoDarkUrl || dna?.logoUrl ? (
                  <img 
                    src={dna.logoDarkUrl || dna?.logoUrl} 
                    alt={dna.name || "Brand Logo"} 
                    className="w-5.5 h-5.5 object-contain rounded bg-slate-50 border border-slate-200/50 p-0.5 shrink-0 animate-pulse" 
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div 
                    style={{ backgroundColor: `${primaryColorHex}15`, color: primaryColorHex }}
                    className="w-5.5 h-5.5 rounded flex items-center justify-center font-bold text-[9px] font-mono border border-slate-200/40 shrink-0"
                  >
                    {(dna?.name || "B").charAt(0).toUpperCase()}
                  </div>
                )
              )}
              <span className="text-[10px] text-slate-700 leading-normal font-medium whitespace-pre-wrap break-words flex-1">
                {card.value}
              </span>
            </div>

            {/* Hovered Expanded Details - Revealed then & there! */}
            {hoveredCardIdx === idx && (
              <div className="mt-2 pt-2 border-t border-slate-100 text-left animate-fade-in space-y-2">
                {idx === 0 && (
                  <>
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold block mb-1 font-mono">EXTRACTED COLORS</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {dna?.visualData?.colors?.map((color, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-1 bg-slate-50 border border-slate-200/50 py-0.5 px-1 rounded">
                            <div className="w-2.5 h-2.5 rounded-sm border border-slate-300" style={{ backgroundColor: color }} />
                            <span className="text-[8px] text-slate-500 font-mono font-bold uppercase">{color.slice(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold block mb-0.5 font-mono">BRAND TYPOGRAPHY</span>
                      <div className="text-[9px] text-slate-500 leading-tight">
                        Heading: <strong>{dna?.visualData?.fonts?.primary || "Outfit"}</strong> <br/>
                        Body: <strong>{dna?.visualData?.fonts?.secondary || "Inter"}</strong>
                      </div>
                    </div>
                  </>
                )}

                {idx === 1 && (
                  <div className="space-y-2 text-[9.5px] text-slate-600 leading-relaxed">
                    <div>
                      <span className="text-[8px] font-bold text-red-500 uppercase tracking-wide block mb-0.5 font-mono">THE ENEMY WE FIGHT</span>
                      {dna?.enemy || "Manual campaign loops & generic templates."}
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wide block mb-0.5 font-mono">THE UNIQUE MECHANISM</span>
                      {dna?.uniqueMechanism || "Multi-agent scrapers extracting brand identities."}
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wide block mb-0.5 font-mono">THE EARNED SECRET</span>
                      {dna?.earnedSecret || "Showing specific visual reference details leads to massive CTR spike."}
                    </div>
                  </div>
                )}

                {idx === 2 && (
                  <div className="space-y-2 text-[9.5px] text-slate-600 leading-relaxed">
                    <div>
                      <span className="text-[8px] font-bold text-[#FF7778] uppercase tracking-wide block mb-0.5 font-mono font-bold">CUSTOMER HELL STATE</span>
                      {dna?.hellState || "Spending hours writing generic copy that gets ignored."}
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wide block mb-0.5 font-mono">CUSTOMER HEAVEN STATE</span>
                      {dna?.heavenState || "Launching campaign queues that read hand-crafted in 2 mins."}
                    </div>
                  </div>
                )}

                {idx === 3 && (
                  <div className="space-y-1.5 text-[9.5px] text-slate-600 leading-relaxed">
                    <span className="text-[8px] font-bold text-purple-500 uppercase tracking-wide block mb-0.5 font-mono">STRATEGIC PILLARS</span>
                    <ul className="list-disc pl-3.5 space-y-0.5 font-medium">
                      {(dna?.contentPillars || [
                        "Automating Campaigns without losing your Soul",
                        "Scraping & Visual Branding Secrets",
                        "How to Write Copy like a Human"
                      ]).slice(0, 3).map((pillar, pIdx) => (
                        <li key={pIdx} className="leading-tight">{pillar}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Radial overlay glow in background - Warm light theme gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(250,249,246,0.85)_100%)] pointer-events-none z-0" />
    </div>
  );
}
