import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Text, Box, Cylinder, Sphere, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { animate } from "animejs";
import { ProductDNA } from "../types";

// -----------------------------------------------
// PROPS
// -----------------------------------------------
interface CampaignLoaderConsoleProps {
  activeProduct: ProductDNA | null;
  focus: string;
  subCategory: string;
  campaignTheme: string;
  selectedChannels: string[];
  generationStep: number;
  generationTotal: number;
  generationStatus: string;
  warmupStatus?: string;
}

interface AgentDef {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  deskLabel: string;
  nudgeLines: string[];
}

// -----------------------------------------------
// CELL-SHADED ANIME OUTLINE HELPERS
// -----------------------------------------------

const SolidWithOutlineBox = ({ args, position, rotation, color, outlineColor = "#334155", opacity = 1 }: any) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Solid flat body */}
      <Box args={args}>
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </Box>
      {/* Outline wireframe */}
      <Box args={args}>
        <meshBasicMaterial color={outlineColor} wireframe transparent opacity={opacity * 0.9} />
      </Box>
    </group>
  );
};

const SolidWithOutlineCylinder = ({ args, position, rotation, color, outlineColor = "#334155", opacity = 1 }: any) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Solid flat body */}
      <Cylinder args={args}>
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </Cylinder>
      {/* Outline wireframe */}
      <Cylinder args={args}>
        <meshBasicMaterial color={outlineColor} wireframe transparent opacity={opacity * 0.9} />
      </Cylinder>
    </group>
  );
};

// -----------------------------------------------
// THREE.JS COMPONENTS (Detailed Toon Motherboard)
// -----------------------------------------------

const CameraController = ({ activeAgentId }: { activeAgentId: string }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));

  const chipCoords = useMemo(() => ({
    sarah: new THREE.Vector3(-4, 0.5, 2),
    arthur: new THREE.Vector3(-2, 0.5, -2),
    alex: new THREE.Vector3(0, 0.5, 1),
    chloe: new THREE.Vector3(2, 0.5, -2),
    julian: new THREE.Vector3(4, 0.5, 2),
  }), []);

  useEffect(() => {
    const target = chipCoords[activeAgentId as keyof typeof chipCoords] || new THREE.Vector3(0, 0, 0);
    const anim = {
      x: targetPos.current.x,
      y: targetPos.current.y,
      z: targetPos.current.z,
      camX: cameraRef.current?.position.x || 0,
      camZ: cameraRef.current?.position.z || 12
    };

    const animation = animate(anim, {
      x: target.x,
      y: target.y,
      z: target.z,
      camX: target.x,
      camZ: target.z + 8,
      duration: 1200,
      easing: "easeOutQuint",
      update: () => {
        targetPos.current.set(anim.x, anim.y, anim.z);
        if (cameraRef.current) {
          cameraRef.current.position.set(anim.camX, 5, anim.camZ);
        }
      }
    });

    return () => {
      animation.pause();
    };
  }, [activeAgentId, chipCoords]);

  useFrame(() => {
    if (cameraRef.current) {
      cameraRef.current.lookAt(targetPos.current);
    }
  });

  return <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 5, 12]} fov={45} />;
};

const Trace = ({ start, end, color }: { start: [number, number], end: [number, number], color: string }) => {
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];

  return (
    <group position={[0, 0.1, 0]}>
      {/* First Segment along Z axis */}
      <Box 
        args={[0.08, 0.02, Math.abs(dz) + 0.08]} 
        position={[start[0], 0, start[1] + dz / 2]}
      >
        <meshBasicMaterial color={color} wireframe />
      </Box>
      {/* Second Segment along X axis */}
      <Box 
        args={[Math.abs(dx) + 0.08, 0.02, 0.08]} 
        position={[start[0] + dx / 2, 0, end[1]]}
      >
        <meshBasicMaterial color={color} wireframe />
      </Box>
    </group>
  );
};

const JunctionPad = ({ position, active, color }: { position: [number, number], active: boolean, color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!active) return;
    const obj = { scale: 1 };
    const anim = animate(obj, {
      scale: [1, 1.3, 1],
      duration: 1000,
      loop: true,
      easing: "easeInOutSine",
      update: () => {
        if (meshRef.current) meshRef.current.scale.setScalar(obj.scale);
      }
    });
    return () => {
      anim.pause();
    };
  }, [active]);

  return (
    <Cylinder ref={meshRef as any} args={[0.15, 0.15, 0.05, 8]} position={[position[0], 0.12, position[1]]}>
      <meshBasicMaterial color={active ? color : "#cbd5e1"} wireframe />
    </Cylinder>
  );
};

const DataPacket = ({ start, end, active, color }: { start: [number, number], end: [number, number], active: boolean, color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!active) return;
    const path = [
      new THREE.Vector3(start[0], 0.25, start[1]),
      new THREE.Vector3(start[0], 0.25, end[1]),
      new THREE.Vector3(end[0], 0.25, end[1])
    ];
    
    const progress = { val: 0 };
    const anim = animate(progress, {
      val: 1,
      duration: 1500,
      loop: true,
      easing: "linear",
      update: () => {
        if (!meshRef.current) return;
        const p = progress.val;
        if (p < 0.5) {
          const t = p * 2;
          meshRef.current.position.lerpVectors(path[0], path[1], t);
        } else {
          const t = (p - 0.5) * 2;
          meshRef.current.position.lerpVectors(path[1], path[2], t);
        }
      }
    });
    return () => {
      anim.pause();
    };
  }, [active, start, end]);

  if (!active) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.2, 12, 12]} />
      <meshBasicMaterial color={color} wireframe />
    </mesh>
  );
};

const FloatingBits = ({ active, color }: { active: boolean; color: string }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const bits = useMemo(() => [
    { text: "0", speed: 0.5, offset: 0, x: -0.3 },
    { text: "1", speed: 0.7, offset: 1.5, x: 0.3 },
    { text: "0", speed: 0.4, offset: 3, x: -0.1 }
  ], []);

  useFrame((state) => {
    if (!active || !groupRef.current) return;
    const time = state.clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const bit = bits[i];
      const y = 0.8 + ((time * bit.speed + bit.offset) % 1.4);
      child.position.y = y;
      const progress = (y - 0.8) / 1.4;
      // @ts-ignore
      if (child.material) {
        // @ts-ignore
        child.material.opacity = 1 - progress;
      }
    });
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {bits.map((bit, i) => (
        <Text 
          key={i} 
          position={[bit.x, 0.8, 0]} 
          fontSize={0.18} 
        >
          {bit.text}
          <meshBasicMaterial attach="material" color={color} transparent />
        </Text>
      ))}
    </group>
  );
};

const ChipLocalComponents = ({ x, z, color }: { x: number; z: number; color: string }) => {
  return (
    <group position={[x, 0, z]}>
      {/* Decoupling Capacitors */}
      <SolidWithOutlineCylinder args={[0.08, 0.08, 0.25, 8]} position={[-0.7, 0.125, -0.3]} color={color} />
      <SolidWithOutlineCylinder args={[0.08, 0.08, 0.25, 8]} position={[-0.7, 0.125, 0.3]} color={color} />
      
      {/* Micro Resistors */}
      <SolidWithOutlineBox args={[0.12, 0.08, 0.25]} position={[0.7, 0.04, -0.3]} color="#cbd5e1" />
      <SolidWithOutlineBox args={[0.12, 0.08, 0.25]} position={[0.7, 0.04, 0.3]} color="#cbd5e1" />
    </group>
  );
};

const ChipInner = ({ agent, active }: { agent: AgentDef; active: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Load avatar texture
  const avatarTexture = useTexture(agent.avatar);

  useEffect(() => {
    if (!active) return;
    const obj = { scale: 1, rot: 0, ringScale: 1, ringOpacity: 0.8 };
    
    const animBounce = animate(obj, {
      scale: [1, 1.1, 1],
      rot: Math.PI * 2,
      duration: 2000,
      loop: true,
      easing: "easeInOutSine",
      update: () => {
        if (groupRef.current) {
          groupRef.current.scale.setScalar(obj.scale);
          groupRef.current.rotation.y = obj.rot;
        }
      }
    });

    const animRing = animate(obj, {
      ringScale: [1, 2.5],
      ringOpacity: [0.8, 0],
      duration: 1500,
      loop: true,
      easing: "easeOutQuad",
      update: () => {
        if (ringRef.current) {
          ringRef.current.scale.set(obj.ringScale, obj.ringScale, 1);
          // @ts-ignore
          ringRef.current.material.opacity = obj.ringOpacity;
        }
      }
    });

    return () => {
      animBounce.pause();
      animRing.pause();
    };
  }, [active]);

  const chipCoords = useMemo(() => ({
    sarah: [-4, 2],
    arthur: [-2, -2],
    alex: [0, 1],
    chloe: [2, -2],
    julian: [4, 2]
  }), []);

  const [chipX, chipZ] = chipCoords[agent.id as keyof typeof chipCoords] || [0, 0];

  // Floating BIOS metrics
  const statsText = useMemo(() => {
    const core = { sarah: "1.20V", arthur: "1.22V", alex: "1.18V", chloe: "1.25V", julian: "1.30V" }[agent.id] || "1.20V";
    const freq = { sarah: "3.6GHz", arthur: "3.8GHz", alex: "3.2GHz", chloe: "4.2GHz", julian: "4.6GHz" }[agent.id] || "3.6GHz";
    return `V_CORE: ${core} | CLK: ${freq}`;
  }, [agent.id]);

  return (
    <group position={[chipX, 0, chipZ]}>
      {/* Expanding Ring (Wireframe) */}
      {active && (
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[0.7, 0.8, 16]} />
          <meshBasicMaterial color={agent.color} transparent opacity={0.8} depthWrite={false} />
        </mesh>
      )}

      {/* Main Chip Group */}
      <group ref={groupRef}>
        {/* Silicon Base (Solid + Outline) */}
        <SolidWithOutlineBox args={[1.2, 0.2, 1.2]} position={[0, 0.1, 0]} color={active ? agent.color : "#cbd5e1"} />
        {/* Metal Cap (Solid + Outline) */}
        <SolidWithOutlineBox args={[0.8, 0.1, 0.8]} position={[0, 0.25, 0]} color={active ? agent.color : "#94a3b8"} opacity={active ? 1.0 : 0.8} />
        
        {/* Avatar texture mapped flat on top of cap */}
        <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.65, 0.65]} />
          <meshBasicMaterial map={avatarTexture} transparent opacity={active ? 1.0 : 0.6} />
        </mesh>

        {/* Gold Pins */}
        {Array.from({ length: 4 }).map((_, i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <Box args={[0.1, 0.05, 1.3]} position={[0, 0.05, 0]}><meshBasicMaterial color="#d97706" wireframe /></Box>
          </group>
        ))}
      </group>

      {/* Rising Data Particles */}
      <FloatingBits active={active} color={agent.color} />

      {/* Floating Text above chip */}
      <Text position={[0, 1.1, 0]} fontSize={0.3} color="#0f172a" outlineWidth={0.02} outlineColor="#ffffff">
        {agent.name}
      </Text>

      {/* Mini BIOS Statistics Text */}
      <Text position={[0, 0.8, 0]} fontSize={0.14} color="#64748b" outlineWidth={0.01} outlineColor="#ffffff">
        {statsText}
      </Text>
    </group>
  );
};

// Wrap with Suspense for texture loading
const Chip = ({ agent, active }: { agent: AgentDef; active: boolean }) => {
  const fallbackPos = useMemo(() => {
    const coords = { sarah: [-4, 0, 2], arthur: [-2, 0, -2], alex: [0, 0, 1], chloe: [2, 0, -2], julian: [4, 0, 2] };
    return (coords[agent.id as "sarah" | "arthur" | "alex" | "chloe" | "julian"] || [0, 0, 0]) as [number, number, number];
  }, [agent.id]);

  return (
    <React.Suspense fallback={
      <group position={fallbackPos}>
        <Box args={[1.2, 0.2, 1.2]} position={[0, 0.1, 0]}><meshBasicMaterial color="#94a3b8" wireframe /></Box>
      </group>
    }>
      <ChipInner agent={agent} active={active} />
    </React.Suspense>
  );
};

const CoolingFan = () => {
  const fanRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (fanRef.current) {
      fanRef.current.rotation.y += delta * 4;
    }
  });

  return (
    <group position={[-3, 0.35, 0.2]}>
      {/* Fan Base */}
      <SolidWithOutlineBox args={[1.8, 0.15, 1.8]} position={[0, 0, 0]} color="#cbd5e1" />
      {/* Blades */}
      <group ref={fanRef} position={[0, 0.12, 0]}>
        <SolidWithOutlineCylinder args={[0.2, 0.2, 0.08, 12]} position={[0, 0, 0]} color="#475569" />
        {Array.from({ length: 4 }).map((_, i) => (
          <SolidWithOutlineBox 
            key={i} 
            args={[0.7, 0.04, 0.18]} 
            position={[0, 0, 0]} 
            rotation={[0, (i * Math.PI) / 2, 0.2]} 
            color="#334155" 
          />
        ))}
      </group>
    </group>
  );
};

// Solid outlined CPU Heat Pipes
const CPUHeatPipes = () => {
  return (
    <group>
      {/* Pipe A */}
      <group position={[0, 0.8, 0.1]}>
        <Cylinder args={[0.06, 0.06, 3.4, 8]} rotation={[0, 0, Math.PI / 2]} position={[-1.3, 0, 0]}>
          <meshBasicMaterial color="#d97706" />
        </Cylinder>
        <Cylinder args={[0.06, 0.06, 3.4, 8]} rotation={[0, 0, Math.PI / 2]} position={[-1.3, 0, 0]}>
          <meshBasicMaterial color="#334155" wireframe />
        </Cylinder>
        
        <Cylinder args={[0.06, 0.06, 0.4, 8]} position={[0.4, -0.2, -1.6]}>
          <meshBasicMaterial color="#d97706" />
        </Cylinder>
        <Cylinder args={[0.06, 0.06, 0.4, 8]} position={[0.4, -0.2, -1.6]}>
          <meshBasicMaterial color="#334155" wireframe />
        </Cylinder>

        <Cylinder args={[0.06, 0.06, 0.4, 8]} position={[-3, -0.2, 0.1]}>
          <meshBasicMaterial color="#d97706" />
        </Cylinder>
        <Cylinder args={[0.06, 0.06, 0.4, 8]} position={[-3, -0.2, 0.1]}>
          <meshBasicMaterial color="#334155" wireframe />
        </Cylinder>
      </group>

      {/* Pipe B */}
      <group position={[0, 0.8, 0.3]}>
        <Cylinder args={[0.06, 0.06, 3.4, 8]} rotation={[0, 0, Math.PI / 2]} position={[-1.3, 0, 0]}>
          <meshBasicMaterial color="#d97706" />
        </Cylinder>
        <Cylinder args={[0.06, 0.06, 3.4, 8]} rotation={[0, 0, Math.PI / 2]} position={[-1.3, 0, 0]}>
          <meshBasicMaterial color="#334155" wireframe />
        </Cylinder>

        <Cylinder args={[0.06, 0.06, 0.4, 8]} position={[0.4, -0.2, -1.8]}>
          <meshBasicMaterial color="#d97706" />
        </Cylinder>
        <Cylinder args={[0.06, 0.06, 0.4, 8]} position={[0.4, -0.2, -1.8]}>
          <meshBasicMaterial color="#334155" wireframe />
        </Cylinder>

        <Cylinder args={[0.06, 0.06, 0.4, 8]} position={[-3, -0.2, -0.1]}>
          <meshBasicMaterial color="#d97706" />
        </Cylinder>
        <Cylinder args={[0.06, 0.06, 0.4, 8]} position={[-3, -0.2, -0.1]}>
          <meshBasicMaterial color="#334155" wireframe />
        </Cylinder>
      </group>
    </group>
  );
};

const VRMPowerPhases = () => {
  return (
    <group position={[-4.5, 0.2, 0.2]}>
      {/* Vertical grid line of 4 Inductors (Chokes) */}
      {[-1.2, -0.4, 0.4, 1.2].map((zPos, i) => (
        <SolidWithOutlineBox key={`choke-${i}`} args={[0.25, 0.25, 0.25]} position={[0, 0, zPos]} color="#334155" />
      ))}
      
      {/* Parallel vertical grid line of 4 VRM Capacitors */}
      {[-1.2, -0.4, 0.4, 1.2].map((zPos, i) => (
        <SolidWithOutlineCylinder key={`cap-${i}`} args={[0.15, 0.15, 0.4, 10]} position={[0.4, 0.1, zPos]} color="#10b981" />
      ))}
    </group>
  );
};

const VRMHeatsink = () => {
  return (
    <group position={[-5.1, 0.25, 0.2]}>
      {/* Heatsink base block */}
      <SolidWithOutlineBox args={[0.25, 0.35, 2.8]} position={[0, 0, 0]} color="#cbd5e1" />
      {/* Fins */}
      {[-1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2].map((zOffset, i) => (
        <SolidWithOutlineBox key={`vrm-fin-${i}`} args={[0.4, 0.05, 0.08]} position={[0, 0.2, zOffset]} color="#94a3b8" />
      ))}
    </group>
  );
};

const ChipsetHeatsink = () => {
  return (
    <group position={[0.4, 0.25, -1.5]}>
      {/* Heatsink Base */}
      <SolidWithOutlineBox args={[1.5, 0.15, 1.5]} position={[0, 0, 0]} color="#cbd5e1" />
      {/* Vertical Cooling Fins */}
      {[-0.6, -0.3, 0, 0.3, 0.6].map((xOffset, i) => (
        <SolidWithOutlineBox key={`fin-${i}`} args={[0.06, 0.3, 1.4]} position={[xOffset, 0.2, 0]} color="#94a3b8" />
      ))}
    </group>
  );
};

const Southbridge = () => {
  return (
    <group position={[3.2, 0.22, 1.5]}>
      {/* Controller Base */}
      <SolidWithOutlineBox args={[1.3, 0.2, 1.3]} position={[0, 0, 0]} color="#475569" />
      {/* Cooling ridges */}
      {[-0.4, -0.2, 0, 0.2, 0.4].map((zOffset, i) => (
        <SolidWithOutlineBox key={`sb-ridge-${i}`} args={[1.1, 0.08, 0.08]} position={[0, 0.12, zOffset]} color="#64748b" />
      ))}
    </group>
  );
};

const CMOSBattery = () => {
  return (
    <group position={[-1.2, 0.12, 3]}>
      {/* Battery Holder */}
      <SolidWithOutlineCylinder args={[0.6, 0.6, 0.15, 12]} position={[0, 0, 0]} color="#475569" />
      {/* Silver Coin Battery */}
      <SolidWithOutlineCylinder args={[0.5, 0.5, 0.1, 12]} position={[0, 0.08, 0]} color="#cbd5e1" />
    </group>
  );
};

const AudioVisualizer = () => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const bounce = Math.sin(time * 8 + i * 2) * 0.4 + 0.6; // 0.2 to 1.0
        child.scale.set(1, bounce, 1);
        child.position.y = (bounce * 0.5) * 0.5;
      });
    }
  });

  return (
    <group ref={groupRef} position={[-2.8, 0.1, -1]}>
      {[-0.4, -0.2, 0, 0.2, 0.4].map((xOffset, i) => (
        <SolidWithOutlineBox key={`equalizer-${i}`} args={[0.1, 0.5, 0.1]} position={[xOffset, 0.125, 0]} color="#7C3AED" />
      ))}
    </group>
  );
};

const PCIeSlot = () => {
  return (
    <group position={[0, 0.25, 3.2]}>
      {/* PCIe Base slot */}
      <SolidWithOutlineBox args={[8, 0.2, 0.25]} position={[0, 0, 0]} color="#334155" />
      {/* Solder tabs */}
      {[-3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6].map((xVal, i) => (
        <SolidWithOutlineBox key={`pcie-tab-${i}`} args={[0.08, 0.3, 0.28]} position={[xVal, 0.05, 0]} color="#cbd5e1" />
      ))}
    </group>
  );
};

const SATAPorts = () => {
  return (
    <group position={[5.5, 0.25, -0.6]}>
      {/* Stacked SATA connectors on right edge */}
      <SolidWithOutlineBox args={[0.4, 0.35, 0.5]} position={[0, 0, -0.3]} color="#475569" />
      <SolidWithOutlineBox args={[0.4, 0.35, 0.5]} position={[0, 0, 0.3]} color="#475569" />
      <SolidWithOutlineBox args={[0.4, 0.35, 0.5]} position={[0, 0.35, -0.3]} color="#cbd5e1" />
      <SolidWithOutlineBox args={[0.4, 0.35, 0.5]} position={[0, 0.35, 0.3]} color="#cbd5e1" />
    </group>
  );
};

const MountingHoles = () => {
  return (
    <group>
      {/* Four corner mount ring hollow look */}
      {[-5.7, 5.7].map((x, i) => 
        [-3.7, 3.7].map((z, j) => (
          <SolidWithOutlineCylinder key={`mount-${i}-${j}`} args={[0.15, 0.15, 0.2, 8]} position={[x, 0.05, z]} color="#64748b" />
        ))
      )}
    </group>
  );
};

const PinHeaders = () => {
  return (
    <group position={[0, 0.15, 3.7]}>
      {/* Pin headers row along bottom edge */}
      {[-2.0, -1.6, -1.2, -0.8, -0.4, 0, 0.4, 0.8, 1.2, 1.6, 2.0].map((xOffset, i) => (
        <SolidWithOutlineCylinder key={`pin-${i}`} args={[0.02, 0.02, 0.3, 6]} position={[xOffset, 0.15, 0]} color="#d97706" />
      ))}
    </group>
  );
};

// Clusters of capacitors to populate blank spots on the board
const CapacitorClusters = () => {
  return (
    <group>
      {/* 3x2 Grid cluster at top-center */}
      <group position={[0, 0.3, -3]}>
        {[-0.4, 0, 0.4].map((xOffset, i) => 
          [-0.2, 0.2].map((zOffset, j) => (
            <SolidWithOutlineCylinder key={`cap-tc-${i}-${j}`} args={[0.12, 0.12, 0.45, 8]} position={[xOffset, 0, zOffset]} color="#10b981" />
          ))
        )}
      </group>

      {/* 2x2 Grid cluster at lower-left */}
      <group position={[-5, 0.3, 2.3]}>
        {[-0.2, 0.2].map((xOffset, i) => 
          [-0.2, 0.2].map((zOffset, j) => (
            <SolidWithOutlineCylinder key={`cap-ll-${i}-${j}`} args={[0.12, 0.12, 0.45, 8]} position={[xOffset, 0, zOffset]} color="#3b82f6" />
          ))
        )}
      </group>

      {/* 2x2 Grid cluster at top-right */}
      <group position={[4.8, 0.3, -2.5]}>
        {[-0.2, 0.2].map((xOffset, i) => 
          [-0.2, 0.2].map((zOffset, j) => (
            <SolidWithOutlineCylinder key={`cap-tr-${i}-${j}`} args={[0.12, 0.12, 0.45, 8]} position={[xOffset, 0, zOffset]} color="#a855f7" />
          ))
        )}
      </group>
    </group>
  );
};

const SecondaryTraces = () => {
  return (
    <group position={[0, 0.05, 0]}>
      {/* Horizontal bus line bundles */}
      <Box args={[11, 0.005, 0.02]} position={[0, 0, -2.2]}><meshBasicMaterial color="#94a3b8" transparent opacity={0.12} /></Box>
      <Box args={[11, 0.005, 0.02]} position={[0, 0, -2.1]}><meshBasicMaterial color="#94a3b8" transparent opacity={0.12} /></Box>
      <Box args={[11, 0.005, 0.02]} position={[0, 0, -2.0]}><meshBasicMaterial color="#94a3b8" transparent opacity={0.12} /></Box>

      {/* Vertical bus traces */}
      <Box args={[0.02, 0.005, 7]} position={[1.5, 0, 0]}><meshBasicMaterial color="#94a3b8" transparent opacity={0.12} /></Box>
      <Box args={[0.02, 0.005, 7]} position={[1.6, 0, 0]}><meshBasicMaterial color="#94a3b8" transparent opacity={0.12} /></Box>
      <Box args={[0.02, 0.005, 7]} position={[1.7, 0, 0]}><meshBasicMaterial color="#94a3b8" transparent opacity={0.12} /></Box>

      {/* Diagonal circuit decoration lines */}
      <Box args={[2, 0.005, 0.02]} position={[-3, 0, -3]} rotation={[0, Math.PI / 4, 0]}><meshBasicMaterial color="#cbd5e1" transparent opacity={0.1} /></Box>
      <Box args={[2, 0.005, 0.02]} position={[3, 0, 3]} rotation={[0, Math.PI / 4, 0]}><meshBasicMaterial color="#cbd5e1" transparent opacity={0.1} /></Box>
    </group>
  );
};

const IOPanel = () => {
  return (
    <group position={[-4, 0.25, -3.7]}>
      {/* Align I/O connectors on motherboard top-left edge */}
      <SolidWithOutlineBox args={[0.5, 0.4, 0.4]} position={[-1, 0, 0]} color="#64748b" />
      <SolidWithOutlineBox args={[0.8, 0.4, 0.4]} position={[0, 0, 0]} color="#64748b" />
      <SolidWithOutlineBox args={[0.4, 0.3, 0.4]} position={[0.8, 0, 0]} color="#64748b" />
    </group>
  );
};

const MemoryBus = () => {
  return (
    <group position={[2.6, 0.3, -2.5]}>
      {/* Parallel RAM Sockets */}
      <SolidWithOutlineBox args={[0.08, 0.2, 2.2]} position={[-0.15, 0, 0]} color="#475569" />
      <SolidWithOutlineBox args={[0.08, 0.2, 2.2]} position={[0.15, 0, 0]} color="#475569" />
      
      {/* Lined-up RAM Sticks */}
      <SolidWithOutlineBox args={[0.02, 0.45, 2.0]} position={[-0.15, 0.12, 0]} color="#3b82f6" />
      <SolidWithOutlineBox args={[0.02, 0.45, 2.0]} position={[0.15, 0.12, 0]} color="#a855f7" />

      {/* Resistors leading to RAM slots */}
      {[-0.8, -0.4, 0, 0.4, 0.8].map((zOffset, i) => (
        <SolidWithOutlineBox key={`ram-res-${i}`} args={[0.12, 0.05, 0.08]} position={[-0.5, -0.2, zOffset]} color="#cbd5e1" />
      ))}
    </group>
  );
};

const Motherboard = () => {
  return (
    <group>
      {/* Board Base (Solid Mint Green Anime Block with Outlines) */}
      <SolidWithOutlineBox args={[12, 0.2, 8]} position={[0, -0.1, 0]} color="#a7f3d0" outlineColor="#334155" />

      {/* Motherboard Details */}
      <CoolingFan />
      <CPUHeatPipes />
      <VRMPowerPhases />
      <VRMHeatsink />
      <ChipsetHeatsink />
      <Southbridge />
      <CMOSBattery />
      <AudioVisualizer />
      <PCIeSlot />
      <SATAPorts />
      <MountingHoles />
      <PinHeaders />
      <CapacitorClusters />
      <SecondaryTraces />
      <IOPanel />
      <MemoryBus />

      {/* Local Microchip decoupling caps */}
      <ChipLocalComponents x={-4} z={2} color="#2583EB" />
      <ChipLocalComponents x={-2} z={-2} color="#7C3AED" />
      <ChipLocalComponents x={0} z={1} color="#EC4899" />
      <ChipLocalComponents x={2} z={-2} color="#E1306C" />
      <ChipLocalComponents x={4} z={2} color="#10B981" />

      {/* Main Signal Traces */}
      <Trace start={[-4, 2]} end={[-2, -2]} color="#cbd5e1" />
      <Trace start={[-2, -2]} end={[0, 1]} color="#cbd5e1" />
      <Trace start={[0, 1]} end={[2, -2]} color="#cbd5e1" />
      <Trace start={[2, -2]} end={[4, 2]} color="#cbd5e1" />

      {/* Trace Junction Corner Pads */}
      <JunctionPad position={[-4, -2]} active={true} color="#7c3aed" />
      <JunctionPad position={[-2, 1]} active={true} color="#ec4899" />
      <JunctionPad position={[0, -2]} active={true} color="#e1306c" />
      <JunctionPad position={[2, 2]} active={true} color="#10b981" />
    </group>
  );
};

// -----------------------------------------------
// MAIN DOM COMPONENT
// -----------------------------------------------
export const CampaignLoaderConsole: React.FC<CampaignLoaderConsoleProps> = ({
  activeProduct,
  focus,
  subCategory,
  campaignTheme,
  selectedChannels,
  generationStep,
  generationTotal,
  generationStatus,
  warmupStatus,
}) => {
  const agents: AgentDef[] = useMemo(
    () => [
      {
        id: "sarah",
        name: "Sarah",
        role: "Researcher",
        avatar: "/agents_img/Gemini_Generated_Image_93efim93efim93ef.png",
        color: "#2583EB",
        deskLabel: "Research Lab",
        nudgeLines: [
          "Radar sweeping Objections matrix... scanning complete.",
          "Crawling competitor copy. It's extremely weak. Easy positioning gap here.",
          "Standby, parsing raw psychological data fields.",
        ],
      },
      {
        id: "arthur",
        name: "Arthur",
        role: "Doppelganger",
        avatar: "/agents_img/Gemini_Generated_Image_u72h5uu72h5uu72h.png",
        color: "#7C3AED",
        deskLabel: "DNA Vault",
        nudgeLines: [
          "Tone check: set to maximum authenticity. No generic AI templates allowed here.",
          "I am checking that we don't use forbidden words like 'delve' or 'synergy'. Never!",
          "Founder speech rhythms aligned at 99.2%. Sounds exactly like a real founder.",
        ],
      },
      {
        id: "alex",
        name: "Alex",
        role: "Platform Copywriter",
        avatar: "/agents_img/Gemini_Generated_Image_5ru7d25ru7d25ru7.png",
        color: "#EC4899",
        deskLabel: "Writing Desk",
        nudgeLines: [
          "Why do LinkedIn humans like so much whitespace? I am formatting spacing now.",
          "Reddit humans get angry when they see hashtags. I stripped them all to keep the peace.",
          "Keeping X copy under 280 characters so attention-deficit humans read it.",
        ],
      },
      {
        id: "chloe",
        name: "Chloe",
        role: "Creative Director",
        avatar: "/agents_img/Gemini_Generated_Image_zbywuuzbywuuzbyw.png",
        color: "#E1306C",
        deskLabel: "Art Board",
        nudgeLines: [
          "Spacing locked at 24px margins. Human faces on images are safe from overlap.",
          "Setting brand colors. Layout balance is looking wobbly but cute!",
          "No blue-to-purple SaaS gradients. Pitch black and off-white only.",
        ],
      },
      {
        id: "julian",
        name: "Julian",
        role: "Visual Publisher",
        avatar: "/agents_img/Gemini_Generated_Image_d6k1gd6k1gd6k1gd.png",
        color: "#10B981",
        deskLabel: "Press Room",
        nudgeLines: [
          "Chromium cluster is humming. Running headless stamp engine.",
          "Vector logo stamped. Visual templates compiled and finalized.",
          "Anti-alias shaders applied. Every graphic is clean and print-ready.",
        ],
      },
    ],
    []
  );

  const brandName = activeProduct?.name || "the brand";
  const enemy = activeProduct?.enemy || "manual inefficiency";
  const hellState = activeProduct?.hellState || "wasted hours";
  const heavenState = activeProduct?.heavenState || "streamlined growth";
  const uniqueMechanism = activeProduct?.uniqueMechanism || "AI specialist agents";
  const objections = activeProduct?.objections || "setup complexity";
  const tone = activeProduct?.tone || "professional";
  const colors = activeProduct?.visualData?.colors?.join(", ") || "#7C3AED, #FAF9F6";
  const fonts = activeProduct?.visualData?.fonts
    ? `${activeProduct.visualData.fonts.primary} / ${activeProduct.visualData.fonts.secondary}`
    : "Inter / Outfit";
  const visualStyle = activeProduct?.visualStyle || "modern clean aesthetic";
  const website = activeProduct?.website || "your site";

  const [meetingLog, setMeetingLog] = useState<{ agent: string; text: string }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const dialogueIndexRef = useRef(0);
  const lastPhaseRef = useRef<string | null>(null);

  const activeAgentId = useMemo(() => {
    const s = generationStatus.toLowerCase();
    if (s.includes("research") || s.includes("gathering market") || s.includes("market intelligence") || s.includes("crawl") || s.includes("scraping") || s.includes("extracting")) return "sarah";
    if (s.includes("brand dna") || s.includes("reviewing your brand") || s.includes("voice") || s.includes("doppelganger") || s.includes("calibrat") || s.includes("analyzing your feedback") || s.includes("mapping")) return "arthur";
    if (s.includes("drafting") || s.includes("copy") || s.includes("formatting") || s.includes("structuring") || s.includes("readability")) return "alex";
    if (s.includes("designer") || s.includes("creative") || s.includes("visual") || s.includes("canvas") || s.includes("layout")) return "chloe";
    if (s.includes("rendering") || s.includes("stamping") || s.includes("headless") || s.includes("overlay") || s.includes("sandbox") || s.includes("initializing")) return "julian";
    
    const pct = generationStep / generationTotal;
    if (pct <= 0.25) return "sarah";
    if (pct <= 0.5) return "arthur";
    if (pct <= 0.75) return "alex";
    if (pct <= 0.9) return "chloe";
    return "julian";
  }, [generationStatus, generationStep, generationTotal]);

  const dialogueScript = useMemo(() => [
    { agentId: "sarah", phase: "sarah", text: `Radar active on "${focus || "target niche"}". Wait, do humans actually purchase to satisfy feelings? Intriguing.` },
    { agentId: "sarah", phase: "sarah", text: `I crawled competitor headers and they look like robotic templates! Let's build a gap around: "${hellState}".` },
    { agentId: "sarah", phase: "sarah", text: `Objections mapped: "${objections}". Sending parameters down to Arthur's calibration deck.` },
    { agentId: "arthur", phase: "arthur", text: `Calibrating voice clone for ${brandName}. Let's tune tone rules: "${tone}".` },
    { agentId: "arthur", phase: "arthur", text: `We are targeting the status quo: "${enemy}". Alex, focus copy on our mechanism: "${uniqueMechanism}".` },
    { agentId: "alex", phase: "arthur", text: `Yes, Arthur. Spacing out text. I promise not to write 'delve' or 'synergize' like a robot!` },
    { agentId: "alex", phase: "alex", text: `Drafting weekly posts for channels: ${selectedChannels.join(", ")}. Highlighting the shift into: "${heavenState}".` },
    { agentId: "alex", phase: "alex", text: `LinkedIn copy done. Generous line spacing included. Ready for Chloe's visual check.` },
    { agentId: "chloe", phase: "alex", text: `Creative rules loaded. Using brand colors: [${colors}] and fonts: ${fonts}.` },
    { agentId: "chloe", phase: "chloe", text: `Style is locked to: "${visualStyle}". Setting bounding margins. Julian, trigger press rollers.` },
    { agentId: "julian", phase: "julian", text: `Headless press room active. Stamping brand logo for ${website} at safe borders.` },
    { agentId: "julian", phase: "julian", text: `Visual card template finalized. Anti-alias shaders applied. Dispatching card on conveyor!` },
  ], [focus, hellState, objections, brandName, tone, enemy, uniqueMechanism, selectedChannels, heavenState, colors, fonts, visualStyle, website]);

  const pushLog = useCallback((agentId: string, text: string) => {
    const agentObj = agents.find(a => a.id === agentId);
    setMeetingLog(prev => [...prev, { agent: agentObj?.name || agentId, text }]);
  }, [agents]);

  useEffect(() => {
    const currentPhase = activeAgentId;
    if (currentPhase !== lastPhaseRef.current) {
      lastPhaseRef.current = currentPhase;
      dialogueIndexRef.current = 0;
    }

    const phaseMessages = dialogueScript.filter(m => m.phase === currentPhase);
    const idx = dialogueIndexRef.current;

    if (idx < phaseMessages.length) {
      const msg = phaseMessages[idx];
      const timer = setTimeout(() => {
        pushLog(msg.agentId, msg.text);
        dialogueIndexRef.current = idx + 1;
      }, idx === 0 ? 1000 : 4500);

      return () => clearTimeout(timer);
    }
  }, [activeAgentId, dialogueScript, pushLog]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [meetingLog]);

  return (
    <div className="flex flex-col bg-[#FAF9F6] text-[#08080C] rounded-xl border border-slate-900/10 overflow-hidden relative shadow-sm">
      {/* Progress status banner */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#FAF9F6] border-b border-slate-900/10">
        <div className="flex items-center space-x-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400 animate-pulse border border-black/5" />
          <span className="text-[12px] font-bold text-slate-800 tracking-wide font-display">
            Step {generationStep} of {generationTotal} — {generationStatus}
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-500">
          {Math.round((generationStep / generationTotal) * 100)}%
        </span>
      </div>
      <div className="h-1 w-full bg-slate-200/50">
        <div
          className="h-full bg-slate-900 transition-all duration-700 ease-out"
          style={{ width: `${(generationStep / generationTotal) * 100}%` }}
        />
      </div>

      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* Left Arena: Three.js 3D Motherboard Environment (Light Wireframe Blueprint Theme) */}
        <div className="flex-1 relative bg-[#FAF9F6] overflow-hidden cursor-grab active:cursor-grabbing">
          
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-white/90 backdrop-blur text-xs font-mono px-3 py-1.5 rounded border border-slate-200 text-slate-600 shadow-sm font-bold">
              Autopilot Schematic Board
            </span>
          </div>

          <div className="w-full h-full absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 5, 12], fov: 45 }}>
              <color attach="background" args={["#FAF9F6"]} />
              <fog attach="fog" args={["#FAF9F6", 10, 25]} />
              
              <CameraController activeAgentId={activeAgentId} />
              
              <group position={[0, -0.5, 0]}>
                <Motherboard />
                
                {/* Data packets flowing along trace pathways */}
                {agents.map((agent, i) => {
                  const traceCoords = [
                    { start: [-4, 2], end: [-2, -2], activeId: "arthur", color: "#7c3aed" },
                    { start: [-2, -2], end: [0, 1], activeId: "alex", color: "#ec4899" },
                    { start: [0, 1], end: [2, -2], activeId: "chloe", color: "#e1306c" },
                    { start: [2, -2], end: [4, 2], activeId: "julian", color: "#10b981" }
                  ][i];
                  if (!traceCoords) return null;
                  return (
                    <DataPacket 
                      key={`packet-${i}`}
                      start={traceCoords.start as [number, number]} 
                      end={traceCoords.end as [number, number]} 
                      active={activeAgentId === traceCoords.activeId} 
                      color={traceCoords.color}
                    />
                  );
                })}

                {/* Agent Microchips */}
                {agents.map((agent) => (
                  <Chip key={agent.id} agent={agent} active={activeAgentId === agent.id} />
                ))}
              </group>
            </Canvas>
          </div>
        </div>

        {/* Right Panel: Sleek Timeline Log */}
        <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-900/10 flex flex-col bg-white z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
          <div className="px-4 py-3 border-b border-slate-900/10 bg-[#FAF9F6]">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
              Dialogue logs
            </span>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[550px]">
            {meetingLog.length === 0 && (
              <p className="text-[11px] text-slate-400 italic text-center py-6 select-none font-mono">
                Handshaking with office motherboard...
              </p>
            )}
            {meetingLog.map((log, idx) => {
              const robotObj = agents.find(r => r.name === log.agent);
              return (
                <div key={idx} className="flex items-start space-x-2.5 animate-fadeIn">
                  {robotObj ? (
                    <img
                      src={robotObj.avatar}
                      alt={robotObj.name}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200 mt-0.5 shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-700 font-display block leading-none mb-0.5">
                      {log.agent}
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-sans break-words">
                      {log.text}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
