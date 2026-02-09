import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Stars, Preload } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';

// ============================================
// CONFIG - UPDATE YOUR INFO HERE!
// ============================================
const CONFIG = {
  name: "Madeeha Momati",
  initials: "MM",
  tagline: "Builder · Writer · Learner",
  
  links: {
    github: "https://github.com/madeeha-01",
    medium: "https://medium.com/@reveriesofs",
    substack: "https://substack.com/@reveriesofs",
    email: "madeehamomati72@gmail.com",
    phone: "+91 7019493601",
  },
  
  showPhone: true
};

// ============================================
// DATA
// ============================================
const SKILLS = [
  {
    icon: 'code',
    title: 'Full-Stack Development',
    description: 'Frontend and backend, from concept to deployment. Building complete applications with clean architecture, with the help of VIBE CODING.',
    tags: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL']
  },
  {
    icon: 'sparkles',
    title: 'Vibe Coding & Prototyping',
    description: 'Rapid iteration with strong UX instincts. Getting to a working prototype that feels right, fast.',
    tags: ['UI/UX', 'Fast iteration', 'Design systems']
  },
  {
    icon: 'globe',
    title: 'Website Creation',
    description: 'Real, deployable websites with performance and accessibility baked in from the start.',
    tags: ['Responsive', 'SEO', 'Performance']
  },
  {
    icon: 'map',
    title: 'QGIS & Geospatial',
    description: 'Maps that tell stories. Making complex geographic data understandable and beautiful.',
    tags: ['QGIS', 'Spatial data', 'Cartography']
  },
  {
    icon: 'academic',
    title: 'Tutoring & Teaching',
    description: 'Finding the explanation that actually works. Preferably mathematics and physics. Patient, clear, and effective instruction.',
    tags: ['1-on-1', 'Technical', 'Patient']
  },
  {
    icon: 'chat',
    title: 'Content & Social',
    description: 'Writing that connects. Presentations that engage. Strategy that makes sense.',
    tags: ['Writing', 'Presentations', 'Strategy']
  }
];

const PROJECTS = [
  {
    title: 'Gentler',
    description: 'An app for people with ADHD who just want a safe space to jot down their thoughts with no pressure.',
    tech: 'React · Node.js',
    year: '2026',
    url: 'https://gentler.lovable.app'
  },
  {
    title: 'TechAddy',
    description: "TechAddy is where tech addicts write, read, and argue about technology with depth, NOT noise. Long-form thinking meets real discussion, built for people who actually care.",
    tech: 'React · Node.js',
    year: '2026',
    url: 'https://techaddy.lovable.app'
  }
];

const WRITING = [
  {
    platform: 'Medium',
    icon: 'medium',
    title: "I don't hate AI.",
    excerpt: 'Is AI the problem?',
    url: 'https://medium.com/@reveriesofs/i-dont-hate-ai-0a1bd8e6b341'
  },
  {
    platform: 'Substack',
    icon: 'substack',
    title: 'It is okay to be alone.',
    excerpt: 'Reading this essay would either make you feel discomfort, comfort or both.',
    url: 'https://reveriesofs.substack.com/p/its-okay-to-be-alone?utm_source=share&utm_medium=android&r=6mu2s3&triedRedirect=true'
  },
  {
    platform: 'Medium',
    icon: 'medium',
    title: 'Coming soon..',
    excerpt: "What's the angle? What makes this worth reading? A new essay in the works.",
    url: '#'
  }
];

// ============================================
// ANIMATION CONFIGS
// ============================================
const springConfig = {
  gentle: { type: "spring", stiffness: 120, damping: 20 },
  snappy: { type: "spring", stiffness: 400, damping: 30 },
  bouncy: { type: "spring", stiffness: 300, damping: 15 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: springConfig.gentle },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8, filter: "blur(10px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)", transition: springConfig.snappy },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60, filter: "blur(8px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: springConfig.gentle },
};

const slideInRight = {
  hidden: { opacity: 0, x: 60, filter: "blur(8px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: springConfig.gentle },
};

// ============================================
// 3D SPACE BACKGROUND
// ============================================

const atmosphereVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  varying vec3 vNormal;
  uniform vec3 glowColor;
  uniform float intensity;
  void main() {
    float glow = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(glowColor, glow * intensity);
  }
`;

const Planet = ({ 
  position = [0, 0, 0], 
  size = 1, 
  color = "#e63946",
  glowColor = "#e63946",
  rotationSpeed = 0.001,
  distort = 0.3,
  speed = 2,
  floatIntensity = 0.5,
  atmosphereIntensity = 0.6
}) => {
  const meshRef = useRef();
  const atmosphereRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
      meshRef.current.rotation.x += rotationSpeed * 0.3;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += rotationSpeed * 0.5;
    }
  });

  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        glowColor: { value: new THREE.Color(glowColor) },
        intensity: { value: atmosphereIntensity }
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
  }, [glowColor, atmosphereIntensity]);

  return (
    <Float speed={speed} rotationIntensity={0.2} floatIntensity={floatIntensity}>
      <group position={position}>
        <Sphere ref={meshRef} args={[size, 64, 64]}>
          <MeshDistortMaterial
            color={color}
            roughness={0.7}
            metalness={0.3}
            distort={distort}
            speed={speed}
          />
        </Sphere>
        <Sphere ref={atmosphereRef} args={[size * 1.2, 32, 32]}>
          <primitive object={atmosphereMaterial} attach="material" />
        </Sphere>
        <Sphere args={[size * 1.05, 32, 32]}>
          <meshBasicMaterial color={glowColor} transparent opacity={0.1} side={THREE.BackSide} />
        </Sphere>
      </group>
    </Float>
  );
};

const PlanetRings = ({ 
  position = [0, 0, 0], 
  innerRadius = 1.5, 
  outerRadius = 2.5,
  rotationSpeed = 0.0005,
  opacity = 0.4
}) => {
  const ringRef = useRef();

  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.z += rotationSpeed;
    }
  });

  const ringGeometry = useMemo(() => {
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, [innerRadius, outerRadius]);

  const ringMaterial = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0, 'rgba(230, 57, 70, 0)');
    gradient.addColorStop(0.2, 'rgba(230, 57, 70, 0.6)');
    gradient.addColorStop(0.5, 'rgba(230, 57, 70, 0.8)');
    gradient.addColorStop(0.8, 'rgba(230, 57, 70, 0.5)');
    gradient.addColorStop(1, 'rgba(230, 57, 70, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 8);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = 3;
    
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, [opacity]);

  return (
    <Float speed={1} floatIntensity={0.2}>
      <group position={position}>
        <mesh ref={ringRef} geometry={ringGeometry} material={ringMaterial} rotation={[0.3, 0, 0.1]} />
      </group>
    </Float>
  );
};

const Moon = ({ 
  parentPosition = [0, 0, 0],
  orbitRadius = 2,
  size = 0.2,
  color = "#a1a1a6",
  orbitSpeed = 0.5
}) => {
  const orbitRef = useRef();
  const moonRef = useRef();

  useFrame((state) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y = state.clock.elapsedTime * orbitSpeed;
    }
    if (moonRef.current) {
      moonRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={parentPosition} rotation={[0.2, 0, 0]}>
      <group ref={orbitRef}>
        <Sphere ref={moonRef} args={[size, 32, 32]} position={[orbitRadius, 0, 0]}>
          <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
        </Sphere>
      </group>
    </group>
  );
};

const ParticleField = ({ count = 500, color = "#e63946" }) => {
  const points = useRef();
  
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    const colorObj = new THREE.Color(color);
    const colorObj2 = new THREE.Color("#8b5cf6");
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 5 + Math.random() * 20;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      const mixedColor = colorObj.clone().lerp(colorObj2, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    
    return { positions, colors };
  }, [count, color]);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.6} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

const OrbitalRing = ({ radius = 5, color = "#e63946", opacity = 0.2, rotationSpeed = 0.001, tilt = [0, 0, 0] }) => {
  const ringRef = useRef();

  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.z += rotationSpeed;
    }
  });

  const lineGeometry = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  return (
    <group rotation={tilt}>
      <line ref={ringRef} geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} />
      </line>
    </group>
  );
};

const CameraController = () => {
  const { camera } = useThree();
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, { stiffness: 50, damping: 20 });

  useFrame(() => {
    const scrollValue = smoothScroll.get();
    camera.position.z = 8 + scrollValue * 3;
    camera.position.y = scrollValue * 2;
    camera.lookAt(0, 0, 0);
  });

  return null;
};

const MouseParallax = ({ children, intensity = 0.1 }) => {
  const groupRef = useRef();
  const { viewport } = useThree();

  useFrame((state) => {
    if (groupRef.current) {
      const x = (state.mouse.x * viewport.width) / 2;
      const y = (state.mouse.y * viewport.height) / 2;
      
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, x * intensity, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -y * intensity, 0.05);
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

const SpaceScene = ({ theme }) => {
  const isDark = theme === 'dark';
  const primaryColor = isDark ? "#e63946" : "#d62839";
  const secondaryColor = isDark ? "#8b5cf6" : "#7c3aed";
  const tertiaryColor = isDark ? "#06b6d4" : "#0891b2";

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} color={primaryColor} />
      <directionalLight position={[-10, -10, -5]} intensity={0.2} color={secondaryColor} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color={primaryColor} distance={20} />
      <pointLight position={[-5, -5, 5]} intensity={0.3} color={secondaryColor} distance={15} />

      <CameraController />

      <MouseParallax intensity={0.05}>
        <Planet position={[4, 1, -5]} size={2.5} color={primaryColor} glowColor={primaryColor} rotationSpeed={0.002} distort={0.2} speed={1.5} floatIntensity={0.3} atmosphereIntensity={0.5} />
        <PlanetRings position={[4, 1, -5]} innerRadius={3.5} outerRadius={5} opacity={0.3} />
        <Moon parentPosition={[4, 1, -5]} orbitRadius={4} size={0.3} orbitSpeed={0.3} />

        <Planet position={[-6, -2, -8]} size={1.5} color={secondaryColor} glowColor={secondaryColor} rotationSpeed={0.003} distort={0.15} speed={2} floatIntensity={0.4} atmosphereIntensity={0.4} />
        <Planet position={[8, -4, -15]} size={3} color={tertiaryColor} glowColor={tertiaryColor} rotationSpeed={0.001} distort={0.1} speed={1} floatIntensity={0.2} atmosphereIntensity={0.3} />
        <Planet position={[-3, 4, -6]} size={0.8} color="#f97316" glowColor="#f97316" rotationSpeed={0.004} distort={0.25} speed={3} floatIntensity={0.6} atmosphereIntensity={0.6} />

        <OrbitalRing radius={8} color={primaryColor} opacity={0.15} rotationSpeed={0.0005} tilt={[0.5, 0.2, 0]} />
        <OrbitalRing radius={12} color={secondaryColor} opacity={0.1} rotationSpeed={-0.0003} tilt={[-0.3, 0.4, 0.1]} />
        <OrbitalRing radius={15} color={tertiaryColor} opacity={0.08} rotationSpeed={0.0002} tilt={[0.2, -0.3, 0.2]} />
      </MouseParallax>

      <ParticleField count={600} color={primaryColor} />
      <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
    </>
  );
};

const SpaceBackground = ({ theme }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
      background: theme === 'dark' 
        ? 'radial-gradient(ellipse at center, #0a0a0f 0%, #000000 100%)'
        : 'radial-gradient(ellipse at center, #f0f0f5 0%, #e0e0e5 100%)'
    }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: 'transparent', opacity: theme === 'dark' ? 0.8 : 0.4 }}
      >
        <Suspense fallback={null}>
          <SpaceScene theme={theme} />
          <Preload all />
        </Suspense>
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme === 'dark'
          ? 'radial-gradient(ellipse at 30% 20%, transparent 0%, rgba(10, 10, 15, 0.7) 70%)'
          : 'radial-gradient(ellipse at 30% 20%, transparent 0%, rgba(250, 250, 250, 0.8) 70%)',
        pointerEvents: 'none'
      }} />
    </div>
  );
};

// ============================================
// ICONS
// ============================================
const Icons = {
  code: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  ),
  sparkles: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  ),
  globe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.919 17.919 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  map: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  ),
  academic: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
    </svg>
  ),
  chat: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
  mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  ),
  phone: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  ),
  arrow: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  arrowUp: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  ),
  sun: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  moon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  ),
  menu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  ),
  close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  github: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  medium: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
    </svg>
  ),
  substack: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
    </svg>
  ),
  stack: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
    </svg>
  ),
  calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
};

const Icon = ({ name }) => {
  const IconComponent = Icons[name];
  return IconComponent ? <IconComponent /> : null;
};

// ============================================
// CUSTOM HOOKS
// ============================================
const useScrollTo = () => {
  return (id) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };
};

// ============================================
// UI COMPONENTS
// ============================================

const MagneticButton = ({ children, className, onClick }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - left - width / 2) * 0.3;
    const y = (clientY - top - height / 2) * 0.3;
    setPosition({ x, y });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={springConfig.snappy}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
};

const TextReveal = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const words = children.split(" ");

  return (
    <span ref={ref}>
      {words.map((word, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden" }}>
          <motion.span
            style={{ display: "inline-block" }}
            initial={{ y: "100%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: delay + i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </span>
  );
};

const AnimatedHighlight = ({ children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <span ref={ref} className="highlight">
      {children}
      <motion.span
        className="highlight__line"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </span>
  );
};

const AnimatedSection = ({ children, className, id }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section
      ref={ref}
      id={id}
      className={`section ${className || ''}`}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
    >
      {children}
    </motion.section>
  );
};

// ============================================
// MAIN COMPONENTS
// ============================================

const Header = ({ theme, toggleTheme, scrolled }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const scrollTo = useScrollTo();
  const navItems = ['about', 'skills', 'work', 'writing', 'contact'];

  return (
    <>
      <motion.header 
        className={`header ${scrolled ? 'scrolled' : ''}`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="header__inner">
          <motion.a href="#" className="header__logo" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {CONFIG.name}
          </motion.a>
          
          <nav className="nav">
            {navItems.map((section, i) => (
              <motion.button
                key={section}
                className="nav__link"
                onClick={() => scrollTo(section)}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>{section.charAt(0).toUpperCase() + section.slice(1)}</span>
              </motion.button>
            ))}
            
            <motion.button 
              className="theme-toggle" 
              onClick={toggleTheme}
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? <Icon name="sun" /> : <Icon name="moon" />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </nav>

          <motion.button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.9 }}
          >
            {mobileMenuOpen ? <Icon name="close" /> : <Icon name="menu" />}
          </motion.button>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {navItems.map((section, i) => (
              <motion.button
                key={section}
                className="mobile-menu__link"
                onClick={() => { scrollTo(section); setMobileMenuOpen(false); }}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Hero = () => {
  const scrollTo = useScrollTo();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  const smoothOpacity = useSpring(opacity, { stiffness: 100, damping: 30 });

  return (
    <section className="hero">
      <div className="container">
        <motion.div className="hero__content" style={{ y: smoothY, opacity: smoothOpacity }}>
          <motion.span 
            className="hero__eyebrow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {CONFIG.tagline}
          </motion.span>
          
          <motion.h1 
            className="hero__title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            I build things for the web, teach what I know, and{' '}
            <AnimatedHighlight>write about what I'm figuring out.</AnimatedHighlight>
          </motion.h1>
          
          <motion.p 
            className="hero__lede"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            Full-stack developer with a design sensibility. I create websites that work beautifully,
            maps that tell stories, and essays that ask the right questions, all thanks to vibe coding.
          </motion.p>
          
          <motion.div 
            className="hero__actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            <MagneticButton className="btn btn--primary" onClick={() => scrollTo('work')}>
              View my work
              <Icon name="arrow" />
            </MagneticButton>
            <MagneticButton className="btn btn--secondary" onClick={() => scrollTo('contact')}>
              Get in touch
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>
      
      <motion.div 
        className="scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div 
          className="scroll-indicator__mouse"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div 
            className="scroll-indicator__wheel"
            animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <span>Scroll</span>
      </motion.div>
    </section>
  );
};

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <AnimatedSection id="about" className="about">
      <div className="container">
        <div className="about__grid" ref={ref}>
          <motion.div className="about__visual" variants={slideInLeft}>
            <motion.div 
              className="about__card glass"
              whileHover={{ y: -8, boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}
              transition={springConfig.gentle}
            >
              <motion.div 
                className="about__avatar"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={springConfig.bouncy}
              >
                {CONFIG.initials}
              </motion.div>
              
              <motion.div 
                className="about__status"
                animate={{ boxShadow: ["0 0 0 0 rgba(74, 222, 128, 0.4)", "0 0 0 8px rgba(74, 222, 128, 0)"] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Available for projects
              </motion.div>
              
              <h3 className="about__name">{CONFIG.name}</h3>
              <p className="about__role">Full-Stack Developer & Writer</p>
              
              <div className="about__stats">
                {[
                  { emoji: '🌱', label: 'Always learning' },
                  { emoji: '🛠️', label: 'Building things' },
                  { emoji: '✍️', label: 'Writing too' }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    className="about__stat"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="about__stat-value">{stat.emoji}</div>
                    <div className="about__stat-label">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div className="about__content" variants={slideInRight}>
            <div className="about__heading">
              <motion.span className="section-label" variants={fadeInUp}>About</motion.span>
              <motion.h2 className="section-title" variants={fadeInUp}>
                <TextReveal delay={0.2}>A bit of context</TextReveal>
              </motion.h2>
            </div>
            
            <div className="about__text">
              <motion.p variants={fadeInUp}>
                I am a <strong>multidisciplinary tech creator</strong> who enjoys vibe coding, building things intuitively, experimenting fast, and refining until it works and feels right. I study and enjoy teaching younger people about physics, I enjoy writing and I work across web development, mapping, content creation, and presentations, focusing on clarity, usability, and real results.
              </motion.p>
              <motion.p variants={fadeInUp}>
                Alongside the technical work, I've spent years <strong>tutoring</strong> younger students which taught me that the best explanation is often the simplest one.
                I also write essays on Medium and Substack about technology, cities, and how people actually use things. Besides writing essays, I dabble in poetry.
              </motion.p>
              <motion.p variants={fadeInUp}>
                I believe in <strong>vibe coding</strong> — rapid prototyping with strong UX instincts,
                where taste matters as much as function. I believe most software could be 50% simpler. I can manage social media and create maps using QGIS mapping.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  );
};

const SkillCard = ({ skill, index }) => {
  const ref = useRef(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotateX((y - rect.height / 2) / 10);
    setRotateY((rect.width / 2 - x) / 10);
  };

  return (
    <motion.div
      ref={ref}
      className="skill-card glass"
      variants={scaleIn}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { setRotateX(0); setRotateY(0); }}
      animate={{ rotateX, rotateY, transformPerspective: 1000 }}
      transition={springConfig.snappy}
      whileHover={{ scale: 1.02, boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}
    >
      <motion.div 
        className="skill-card__icon"
        whileHover={{ scale: 1.2, rotate: 10, backgroundColor: "var(--color-accent)", color: "white" }}
        transition={springConfig.bouncy}
      >
        <Icon name={skill.icon} />
      </motion.div>
      <h3 className="skill-card__title">{skill.title}</h3>
      <p className="skill-card__description">{skill.description}</p>
      <div className="skill-card__tags">
        {skill.tags.map((tag, i) => (
          <motion.span key={i} className="tag" whileHover={{ scale: 1.1, y: -2 }}>
            {tag}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
};

const Skills = () => (
  <AnimatedSection id="skills" className="skills">
    <div className="container">
      <motion.div className="skills__header" variants={fadeInUp}>
        <span className="section-label">Capabilities</span>
        <h2 className="section-title"><TextReveal>What I actually do</TextReveal></h2>
        <p className="skills__description">An honest inventory of skills, developed through real projects and paid work.</p>
      </motion.div>
      <motion.div className="skills__grid" variants={staggerContainer}>
        {SKILLS.map((skill, index) => (
          <SkillCard key={index} skill={skill} index={index} />
        ))}
      </motion.div>
    </div>
  </AnimatedSection>
);

const ProjectCard = ({ project, index }) => (
  <motion.a
    href={project.url}
    target="_blank"
    rel="noopener noreferrer"
    className="project glass"
    variants={fadeInUp}
    whileHover={{ x: 12, backgroundColor: "var(--color-bg-glass-strong)" }}
    transition={springConfig.gentle}
  >
    <div className="project__info">
      <motion.div className="project__number" whileHover={{ opacity: 0.5, scale: 1.1 }}>
        0{index + 1}
      </motion.div>
      <h3 className="project__title">{project.title}</h3>
      <p className="project__description">{project.description}</p>
      <div className="project__meta">
        <span><Icon name="stack" /> {project.tech}</span>
        <span><Icon name="calendar" /> {project.year}</span>
      </div>
    </div>
    <motion.div 
      className="project__arrow"
      whileHover={{ rotate: -45, backgroundColor: "var(--color-accent)", color: "white" }}
    >
      <Icon name="arrowUp" />
    </motion.div>
  </motion.a>
);

const Work = () => (
  <AnimatedSection id="work" className="work">
    <div className="container">
      <motion.div className="work__header" variants={fadeInUp}>
        <div>
          <span className="section-label">Work</span>
          <h2 className="section-title"><TextReveal>Selected projects</TextReveal></h2>
        </div>
        <p className="work__intro">A few things I've built. Some polished, some experiments — all taught me something.</p>
      </motion.div>
      <motion.div className="project-grid" variants={staggerContainer}>
        {PROJECTS.map((project, index) => (
          <ProjectCard key={index} project={project} index={index} />
        ))}
      </motion.div>
      <motion.div className="platform-links" variants={fadeInUp}>
        <motion.a href={CONFIG.links.github} className="platform-link" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.02 }}>
          <Icon name="github" />
          <span>More on GitHub</span>
        </motion.a>
      </motion.div>
    </div>
  </AnimatedSection>
);

const ArticleCard = ({ article }) => (
  <motion.article
    className="article-card glass"
    variants={scaleIn}
    whileHover={{ y: -8, boxShadow: "0 25px 50px rgba(0,0,0,0.2)" }}
    transition={springConfig.gentle}
  >
    <div className="article-card__platform">
      <Icon name={article.icon} />
      <span>{article.platform}</span>
    </div>
    <h3 className="article-card__title">
      <a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}</a>
    </h3>
    <p className="article-card__excerpt">{article.excerpt}</p>
    <motion.a href={article.url} className="article-card__link" target="_blank" rel="noopener noreferrer" whileHover={{ x: 5 }}>
      Read article <Icon name="arrow" />
    </motion.a>
  </motion.article>
);

const Writing = () => (
  <AnimatedSection id="writing" className="writing">
    <div className="container">
      <motion.div className="writing__header" variants={fadeInUp}>
        <span className="section-label">Writing</span>
        <h2 className="section-title"><TextReveal>Essays & articles</TextReveal></h2>
        <p className="writing__description">I write about technology, cities, design, and whatever I'm trying to understand.</p>
      </motion.div>
      <motion.div className="writing__grid" variants={staggerContainer}>
        {WRITING.map((article, index) => (
          <ArticleCard key={index} article={article} />
        ))}
      </motion.div>
      <motion.div className="platform-links" style={{ justifyContent: 'center' }} variants={fadeInUp}>
        <motion.a href={CONFIG.links.medium} className="platform-link" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.02 }}>
          <Icon name="medium" />
          <span>Read on Medium</span>
        </motion.a>
        <motion.a href={CONFIG.links.substack} className="platform-link" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.02 }}>
          <Icon name="substack" />
          <span>Subscribe on Substack</span>
        </motion.a>
      </motion.div>
    </div>
  </AnimatedSection>
);

const ContactCard = ({ href, icon, label, value }) => (
  <motion.a
    href={href}
    className="contact-card"
    target={href.startsWith('http') ? '_blank' : undefined}
    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
    variants={scaleIn}
    whileHover={{ y: -8, borderColor: "var(--color-accent)", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
    transition={springConfig.gentle}
  >
    <motion.div className="contact-card__icon" whileHover={{ scale: 1.1, backgroundColor: "var(--color-accent)", color: "white" }}>
      <Icon name={icon} />
    </motion.div>
    <div className="contact-card__content">
      <span className="contact-card__label">{label}</span>
      <span className="contact-card__value">{value}</span>
    </div>
  </motion.a>
);

const Contact = () => (
  <AnimatedSection id="contact" className="contact">
    <div className="container">
      <motion.div className="contact__wrapper glass glass--strong" variants={scaleIn}>
        <motion.span className="section-label" variants={fadeInUp}>Contact</motion.span>
        <motion.h2 className="contact__title section-title" variants={fadeInUp}>
          <TextReveal>Let's work together</TextReveal>
        </motion.h2>
        <motion.p className="contact__text" variants={fadeInUp}>
          I'm currently open to freelance projects, interesting collaborations,
          and conversations about work that matters. If you're building something thoughtful,
          I'd love to hear about it.
        </motion.p>
        <motion.div className="contact__methods" variants={staggerContainer}>
          <ContactCard href={`mailto:${CONFIG.links.email}`} icon="mail" label="Email" value={CONFIG.links.email} />
          {CONFIG.showPhone && (
            <ContactCard href={`tel:${CONFIG.links.phone.replace(/\D/g, '')}`} icon="phone" label="Phone" value={CONFIG.links.phone} />
          )}
          <ContactCard href={CONFIG.links.github} icon="github" label="GitHub" value="View my code" />
        </motion.div>
      </motion.div>
    </div>
  </AnimatedSection>
);

const Footer = () => (
  <motion.footer className="footer" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
    <div className="container footer__inner">
      <p className="footer__copy">© {new Date().getFullYear()} {CONFIG.name}. Built with <span>♥</span> and clean code.</p>
      <div className="footer__links">
        {[
          { href: CONFIG.links.github, label: 'GitHub' },
          { href: CONFIG.links.medium, label: 'Medium' },
          { href: CONFIG.links.substack, label: 'Substack' },
        ].map((link, i) => (
          <motion.a key={i} href={link.href} target="_blank" rel="noopener noreferrer" className="footer__link" whileHover={{ y: -2 }}>
            {link.label}
          </motion.a>
        ))}
      </div>
    </div>
  </motion.footer>
);

// ============================================
// MAIN APP
// ============================================
function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [scrolled, setScrolled] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div 
      className="app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <SpaceBackground theme={theme} />
      
      <Header theme={theme} toggleTheme={toggleTheme} scrolled={scrolled} />
      
      <main>
        <Hero />
        <About />
        <Skills />
        <Work />
        <Writing />
        <Contact />
      </main>
      
      <Footer />
    </motion.div>
  );
}

export default App;