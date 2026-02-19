import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface NodeData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  connections: number[];
}

function NeuralNetwork() {
  const meshRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  useThree(); // Initialize Three.js context

  // Configuration
  const NODE_COUNT = 80;
  const CONNECTION_DISTANCE = 3.5;
  const MAX_CONNECTIONS = 3;

  // Initialize nodes
  const { nodes, positions, colors } = useMemo(() => {
    const nodes: NodeData[] = [];
    const positions = new Float32Array(NODE_COUNT * 3);
    const colors = new Float32Array(NODE_COUNT * 3);

    for (let i = 0; i < NODE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 15;
      const z = (Math.random() - 0.5) * 10;
      
      nodes.push({
        position: new THREE.Vector3(x, y, z),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.005
        ),
        connections: []
      });

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Cyan color with variation
      colors[i * 3] = 0;
      colors[i * 3 + 1] = 0.94 + Math.random() * 0.06;
      colors[i * 3 + 2] = 1;
    }

    return { nodes, positions, colors };
  }, []);

  // Mouse tracking
  useMemo(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation frame
  useFrame((state) => {
    if (!meshRef.current || !linesRef.current) return;

    const time = state.clock.getElapsedTime();
    const positionAttr = meshRef.current.geometry.attributes.position;
    const linePositions: number[] = [];
    const lineColors: number[] = [];

    // Update nodes
    nodes.forEach((node, i) => {
      // Add wave motion
      const waveX = Math.sin(time * 0.5 + i * 0.1) * 0.002;
      const waveY = Math.cos(time * 0.3 + i * 0.15) * 0.002;
      
      // Mouse influence
      const mouseInfluenceX = mouseRef.current.x * 0.001;
      const mouseInfluenceY = mouseRef.current.y * 0.001;

      // Update position
      node.position.x += node.velocity.x + waveX + mouseInfluenceX;
      node.position.y += node.velocity.y + waveY + mouseInfluenceY;
      node.position.z += node.velocity.z;

      // Boundary check
      if (Math.abs(node.position.x) > 10) node.velocity.x *= -1;
      if (Math.abs(node.position.y) > 7.5) node.velocity.y *= -1;
      if (Math.abs(node.position.z) > 5) node.velocity.z *= -1;

      // Update buffer
      positionAttr.setXYZ(i, node.position.x, node.position.y, node.position.z);

      // Find connections
      node.connections = [];
      for (let j = i + 1; j < nodes.length && node.connections.length < MAX_CONNECTIONS; j++) {
        const distance = node.position.distanceTo(nodes[j].position);
        if (distance < CONNECTION_DISTANCE) {
          node.connections.push(j);
          
          // Add line
          linePositions.push(
            node.position.x, node.position.y, node.position.z,
            nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
          );

          // Line color with distance-based opacity
          const opacity = 1 - (distance / CONNECTION_DISTANCE);
          lineColors.push(0, 0.94 * opacity, 1 * opacity);
          lineColors.push(0, 0.94 * opacity, 1 * opacity);
        }
      }
    });

    positionAttr.needsUpdate = true;

    // Update lines
    const lineGeometry = linesRef.current.geometry;
    lineGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3)
    );
    lineGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(lineColors, 3)
    );
  });

  return (
    <>
      {/* Nodes */}
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={NODE_COUNT}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
            count={NODE_COUNT}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Connections */}
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </>
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const count = 200;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    
    return positions;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.01) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles, 3]}
          count={200}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#B829F7"
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function NeuralNetworkBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <ambientLight intensity={0.5} />
        <NeuralNetwork />
        <ParticleField />
      </Canvas>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-void-black/50 via-transparent to-void-black/80 pointer-events-none" />
    </div>
  );
}
