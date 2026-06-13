import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars, Html, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { ArrowRight, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FaLinkedinIn, FaXTwitter, FaYoutube, FaInstagram, FaFacebookF, FaRedditAlien, FaTiktok } from 'react-icons/fa6';

const PipelineVortex = () => {
    const groupRef = useRef<THREE.Group>(null!);
    const pointsRef = useRef<THREE.Points>(null!);
    const count = 4000;
    const length = 50;

    const { positions, colors } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const cols = new Float32Array(count * 3);
        const palette = [
            new THREE.Color('#7C3AED'), // Purple
            new THREE.Color('#FF7778'), // Coral
            new THREE.Color('#18F07A'), // Green
            new THREE.Color('#2583EB')  // Blue
        ];
        
        for (let i = 0; i < count; i++) {
            const z = (Math.random() - 0.5) * length;
            // Funnel shape: larger radius as it goes out to z
            const zProgress = Math.abs(z / (length/2));  // 0 at center, 1 at edges
            const r = 8 + (zProgress * 15) + Math.random() * 4; // Clear 8 unit circle in center
            const theta = Math.random() * Math.PI * 2;
            
            pos[i*3 + 0] = r * Math.cos(theta);
            pos[i*3 + 1] = r * Math.sin(theta);
            pos[i*3 + 2] = z;

            const c = palette[Math.floor(Math.random() * palette.length)];
            cols[i*3 + 0] = c.r;
            cols[i*3 + 1] = c.g;
            cols[i*3 + 2] = c.b;
        }
        return { positions: pos, colors: cols };
    }, []);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.z -= delta * 0.05;
            groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, (state.mouse.y * Math.PI) / 10, 0.05);
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, (state.mouse.x * Math.PI) / 10, 0.05);
        }

        if (pointsRef.current) {
            const posAttr = pointsRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < count; i++) {
                posAttr[i*3 + 2] += delta * 15; // Move super fast towards camera
                if (posAttr[i*3 + 2] > length / 2) {
                    posAttr[i*3 + 2] = -length / 2;
                }
            }
            pointsRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <group ref={groupRef}>
            <Points ref={pointsRef} stride={3} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
                </bufferGeometry>
                <PointMaterial
                    transparent
                    vertexColors
                    size={0.1}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>
            {/* Inner rings to convey the pipeline shape */}
            {Array.from({ length: 6 }).map((_, i) => (
                <VortexRing key={`ring-${i}`} index={i} length={length} />
            ))}
            <SocialNodesOrbit />
        </group>
    );
};

const VortexRing = ({ index, length }: { index: number, length: number }) => {
    const ringRef = useRef<THREE.Mesh>(null!);
    const initialZ = -length/2 + (index * (length / 6));
    
    useFrame((_, delta) => {
        if (ringRef.current) {
            ringRef.current.position.z += delta * 10;
            ringRef.current.rotation.z -= delta * 0.2;
            if (ringRef.current.position.z > length/2) {
                ringRef.current.position.z = -length/2;
            }
        }
    });

    return (
        <mesh ref={ringRef} position={[0, 0, initialZ]}>
            <torusGeometry args={[8 + (index * 2), 0.02, 8, 64]} />
            <meshBasicMaterial 
                color={index % 2 === 0 ? '#7C3AED' : '#18F07A'} 
                transparent opacity={0.15} blending={THREE.AdditiveBlending} wireframe 
            />
        </mesh>
    );
};

const SocialNodesOrbit = () => {
  const groupRef = useRef<THREE.Group>(null!);

  const nodes = useMemo(() => [
    { icon: FaLinkedinIn, color: '#0A66C2', hover: 'rgba(10, 102, 194, 0.4)', pos: new THREE.Vector3(12, 5, -5) },
    { icon: FaXTwitter, color: '#FFFFFF', hover: 'rgba(255, 255, 255, 0.4)', pos: new THREE.Vector3(-14, 4, -8) },
    { icon: FaYoutube, color: '#FF0000', hover: 'rgba(255, 0, 0, 0.4)', pos: new THREE.Vector3(11, -6, -3) },
    { icon: FaInstagram, color: '#E1306C', hover: 'rgba(225, 48, 108, 0.4)', pos: new THREE.Vector3(-10, -7, -6) },
    { icon: FaFacebookF, color: '#1877F2', hover: 'rgba(24, 119, 242, 0.4)', pos: new THREE.Vector3(3, 10, -10) },
    { icon: FaRedditAlien, color: '#FF4500', hover: 'rgba(255, 69, 0, 0.4)', pos: new THREE.Vector3(0, -9, -8) },
    { icon: FaTiktok, color: '#00F2FE', hover: 'rgba(0, 242, 254, 0.4)', pos: new THREE.Vector3(-5, 9, -5) },
  ], []);

  useFrame((_, delta) => {
    if (groupRef.current) {
        groupRef.current.rotation.z -= delta * 0.02; // Rotate extremely slowly opposite to vortex
    }
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => {
        const Icon = node.icon;
        return (
            <Float key={`node-${i}`} speed={1.5} floatIntensity={2} rotationIntensity={0.5}>
              <Html center transform position={node.pos}>
                 <div className="p-4 rounded-2xl border border-white/10 backdrop-blur-xl transition-all duration-300 hover:scale-110 pointer-events-auto" style={{ backgroundColor: 'rgba(10, 10, 15, 0.6)', boxShadow: `0 0 40px ${node.hover}` }}>
                    <Icon className="w-8 h-8 text-white" />
                 </div>
              </Html>
            </Float>
        );
      })}
    </group>
  );
};



export const ImmersiveHero = ({ 
  whatsappUrl,
  isDefaultLink,
  onConfigureClick
}: { 
  whatsappUrl?: string;
  isDefaultLink?: boolean;
  onConfigureClick?: () => void;
}) => {
    return (
        <section className="relative w-full h-[100vh] flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Absolute 3D Canvas rendering at the bottom layer of this section */}
            <div className="absolute inset-0 z-0 bg-[#0A0A0F]">
                <Canvas camera={{ position: [0, 0, 10], fov: 60 }} gl={{ antialias: true, alpha: false }}>
                    <fog attach="fog" args={['#0A0A0F', 5, 40]} />
                    
                    {/* The immersive elements */}
                    <PipelineVortex />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={2} />
                    
                    {/* Soft glowing ambient */}
                    <ambientLight intensity={1} />
                </Canvas>
                
                {/* Gradient vignette to blend nicely with the rest of the page */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0A0A0F_90%)] pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A0A0F] to-transparent pointer-events-none" />
            </div>

            {/* Foreground Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 flex flex-col items-center pointer-events-none">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-12 shadow-[0_0_20px_rgba(124,58,237,0.2)] pointer-events-auto"
                >
                    <span className="flex h-2.5 w-2.5 rounded-full bg-[#18F07A] shadow-[0_0_10px_rgba(24,240,122,0.8)] animate-pulse" />
                    <span className="text-sm font-medium text-gray-200 tracking-wide">The Organic Growth Engine</span>
                </motion.div>
                
                <h1 className="text-6xl md:text-8xl lg:text-[110px] font-normal tracking-tighter font-display text-white mb-8 leading-[1]">
                    <motion.span 
                        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: "circOut" }}
                        className="block"
                    >
                        You need <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">distribution.</span>
                    </motion.span>
                    <motion.span 
                        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3, ease: "circOut" }}
                        className="block text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#FF7778] to-[#18F07A]"
                    >
                        You lack 20 hours.
                    </motion.span>
                </h1>
                
                <motion.p 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }} 
                    className="text-xl md:text-2xl text-gray-400 max-w-3xl mb-12 leading-relaxed"
                >
                    Founders don't have time to be full-time creators. Hand off your operations to an intelligent orchestrator that turns your URL into a <span className="text-white font-medium">month of pipeline-generating content.</span>
                </motion.p>
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.8, type: "spring" }}
                    className="pointer-events-auto flex flex-col sm:flex-row gap-6 relative"
                >
                    <Link to="/login" className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-white text-black font-semibold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                        <span className="relative z-10">Deploy Your Agents</span>
                        <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    
                    <a 
                      href={isDefaultLink ? "#" : (whatsappUrl || "/whatsapp-system")}
                      onClick={(e) => {
                        if (isDefaultLink) {
                          e.preventDefault();
                          if (onConfigureClick) onConfigureClick();
                        }
                      }}
                      {...(!isDefaultLink && whatsappUrl && whatsappUrl.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-[#00A884]/15 border border-[#00A884]/45 text-white font-semibold text-base sm:text-lg hover:bg-[#00A884]/25 backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,168,132,0.15)] flex items-center cursor-pointer"
                    >
                        <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping mr-0.5 shrink-0"></span>
                        <span className="relative z-10">💬 Try WhatsApp Onboarding Bot</span>
                    </a>
                </motion.div>
            </div>
            
            {/* Scroll Indicator */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 2 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10"
            >
                <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">Scroll to Dive In</span>
                <div className="w-px h-12 bg-gradient-to-b from-gray-500 to-transparent animate-pulse" />
            </motion.div>
        </section>
    );
};
