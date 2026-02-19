import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

interface SphereCoreProps {
  isHovered: boolean;
}

function SphereCore({ isHovered }: SphereCoreProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wireframeRef = useRef<THREE.LineSegments>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const { mouse } = useThree();

  // Create icosahedron geometry for wireframe
  const wireframeGeometry = useMemo(() => {
    const geometry = new THREE.IcosahedronGeometry(2, 2);
    const wireframe = new THREE.WireframeGeometry(geometry);
    return wireframe;
  }, []);

  // Create particles around the sphere
  const particlePositions = useMemo(() => {
    const count = 150;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2.5 + Math.random() * 1.5;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }
    
    return positions;
  }, []);

  // Animation
  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Base rotation
    groupRef.current.rotation.y = time * 0.15;
    groupRef.current.rotation.x = Math.sin(time * 0.1) * 0.1;
    
    // Mouse interaction
    const targetX = mouse.x * 0.3;
    const targetY = mouse.y * 0.3;
    groupRef.current.rotation.x += (targetY - groupRef.current.rotation.x) * 0.05;
    groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.05;
    
    // Wireframe pulse
    if (wireframeRef.current) {
      const pulseScale = isHovered ? 1.1 + Math.sin(time * 3) * 0.05 : 1;
      wireframeRef.current.scale.setScalar(pulseScale);
    }
    
    // Particles rotation
    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.08;
      particlesRef.current.rotation.z = time * 0.03;
    }
    
    // Glow pulse
    if (glowRef.current) {
      const glowIntensity = isHovered ? 0.8 + Math.sin(time * 4) * 0.2 : 0.5;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glowIntensity * 0.3;
    }
    
    // Inner sphere pulse
    if (innerRef.current) {
      const innerScale = isHovered ? 0.9 + Math.sin(time * 2) * 0.05 : 0.85;
      innerRef.current.scale.setScalar(innerScale);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Inner glowing core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshBasicMaterial
          color="#00F0FF"
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
      
      {/* Main wireframe sphere */}
      <lineSegments ref={wireframeRef} geometry={wireframeGeometry}>
        <lineBasicMaterial
          color="#00F0FF"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      
      {/* Secondary wireframe (purple, slower) */}
      <lineSegments geometry={wireframeGeometry} scale={1.15}>
        <lineBasicMaterial
          color="#B829F7"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial
          color="#00F0FF"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Outer glow (purple) */}
      <mesh scale={1.3}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial
          color="#B829F7"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Orbiting particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
            count={150}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#00F0FF"
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Ring system */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <torusGeometry args={[3.5, 0.02, 16, 100]} />
          <meshBasicMaterial
            color="#00F0FF"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      
      <group rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <mesh>
          <torusGeometry args={[4, 0.015, 16, 100]} />
          <meshBasicMaterial
            color="#B829F7"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      
      {/* Floating data points */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 4.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        return (
          <Float
            key={i}
            speed={2}
            rotationIntensity={0.5}
            floatIntensity={0.5}
          >
            <mesh position={[x, Math.sin(i) * 0.5, z]}>
              <octahedronGeometry args={[0.1, 0]} />
              <meshBasicMaterial
                color={i % 2 === 0 ? '#00F0FF' : '#B829F7'}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

function DataRings() {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z = state.clock.getElapsedTime() * 0.05;
  });
  
  return (
    <group ref={groupRef}>
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]}>
          <ringGeometry args={[5 + i * 0.8, 5.05 + i * 0.8, 64]} />
          <meshBasicMaterial
            color="#00F0FF"
            transparent
            opacity={0.15 - i * 0.03}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function InteractiveSphere() {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full min-h-[500px] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#00F0FF" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#B829F7" />
        
        <SphereCore isHovered={isHovered} />
        <DataRings />
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.5}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Hover indicator */}
      <div 
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs tracking-widest transition-all duration-300 ${
          isHovered ? 'text-cyber-cyan opacity-100' : 'text-ghost-white opacity-50'
        }`}
      >
        {isHovered ? '[ INTERFAZ ACTIVA ]' : '[ NÚCLEO KAN LOGIC ]'}
      </div>
    </div>
  );
}
