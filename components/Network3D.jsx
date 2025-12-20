"use client";

import { useMemo, useEffect, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { useTheme } from 'next-themes';
import * as THREE from 'three';

// 미니멀 네트워크 노드 (작은 구체만)
function NetworkNode({ position, color = '#4a9eff', isDark = true }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.12, 12, 12]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color}
        emissiveIntensity={isDark ? 0.4 : 0.2}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

// 얇고 정밀한 연결선
function Connection({ start, end, color = '#6b7280', isDark = true }) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      opacity={isDark ? 0.5 : 0.6}
      transparent
    />
  );
}

// 네트워크 씬 컴포넌트
function NetworkScene({ isDark = true }) {
  // 색상 팔레트: 다크모드/라이트모드 확실한 대비
  const colors = useMemo(() => {
    if (isDark) {
      // 다크모드: 밝은 cyan/silver 노드, 어두운 배경
      return {
        nodeCore: '#60a5fa',      // bright cyan
        nodeMid: '#7dd3fc',       // light cyan
        nodeOuter: '#a5d8ff',     // silver/light cyan
        edge: '#64748b',          // slate gray
        edgeCore: '#475569',      // darker slate
      };
    } else {
      // 라이트모드: 어두운 navy/blue 노드, 밝은 배경
      return {
        nodeCore: '#1e3a8a',      // deep navy
        nodeMid: '#2563eb',       // bright blue
        nodeOuter: '#3b82f6',     // medium blue
        edge: '#64748b',          // slate gray (라이트모드에서도 보이게)
        edgeCore: '#475569',      // darker slate
      };
    }
  }, [isDark]);
  
  // 점진적 밀도 변화: 밀집된 코어에서 외곽으로 균등 분산
  const nodes = useMemo(() => {
    const nodes = [];
    const maxRadius = 12;
    const coreRadius = 3;
    
    // 코어 영역: 밀집된 노드
    const coreLayers = 3;
    for (let layer = 0; layer < coreLayers; layer++) {
      const radius = (layer + 1) * 1.2;
      const nodesPerLayer = 8 + layer * 4; // 레이어마다 노드 수 증가
      
      for (let i = 0; i < nodesPerLayer; i++) {
        const theta = (Math.PI * 2 * i) / nodesPerLayer;
        const phi = Math.acos(1 - (2 * (layer + 1)) / (coreLayers + 1));
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        nodes.push({
          pos: [x, y, z],
          dist: radius,
          type: 'core'
        });
      }
    }
    
    // 중간 영역: 점진적으로 분산
    const midLayers = 4;
    for (let layer = 0; layer < midLayers; layer++) {
      const radius = coreRadius + (layer + 1) * 1.5;
      const nodesPerLayer = 12 + layer * 2;
      
      for (let i = 0; i < nodesPerLayer; i++) {
        const theta = (Math.PI * 2 * i) / nodesPerLayer + (layer * 0.3);
        const phi = Math.acos(1 - (2 * (coreLayers + layer + 1)) / (coreLayers + midLayers + 1));
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        nodes.push({
          pos: [x, y, z],
          dist: radius,
          type: 'mid'
        });
      }
    }
    
    // 외곽 영역: 균등 분산
    const outerLayers = 3;
    for (let layer = 0; layer < outerLayers; layer++) {
      const radius = coreRadius + midLayers * 1.5 + (layer + 1) * 2;
      const nodesPerLayer = 16;
      
      for (let i = 0; i < nodesPerLayer; i++) {
        const theta = (Math.PI * 2 * i) / nodesPerLayer + (layer * 0.5);
        const phi = Math.acos(1 - (2 * (coreLayers + midLayers + layer + 1)) / (coreLayers + midLayers + outerLayers + 1));
        
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        nodes.push({
          pos: [x, y, z],
          dist: radius,
          type: 'outer'
        });
      }
    }
    
    return nodes;
  }, []);

  // 구조화된 연결: 가까운 노드들만 연결
  const connections = useMemo(() => {
    const conns = [];
    const connSet = new Set();
    const maxConnectionDistance = 3.5;
    
    nodes.forEach((node, i) => {
      const nearbyNodes = [];
      
      nodes.forEach((otherNode, idx) => {
        if (idx === i) return;
        
        const dx = otherNode.pos[0] - node.pos[0];
        const dy = otherNode.pos[1] - node.pos[1];
        const dz = otherNode.pos[2] - node.pos[2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist <= maxConnectionDistance) {
          nearbyNodes.push({ idx, dist });
        }
      });
      
      // 거리순으로 정렬
      nearbyNodes.sort((a, b) => a.dist - b.dist);
      
      // 각 노드가 2-4개의 가까운 노드와 연결
      const connectionCount = Math.min(2 + Math.floor(Math.random() * 3), nearbyNodes.length);
      
      for (let j = 0; j < connectionCount; j++) {
        const targetIdx = nearbyNodes[j].idx;
        const connKey = `${Math.min(i, targetIdx)}-${Math.max(i, targetIdx)}`;
        
        if (!connSet.has(connKey)) {
          connSet.add(connKey);
          conns.push([i, targetIdx]);
        }
      }
    });
    
    return conns;
  }, [nodes]);

  return (
    <>
      {nodes.map((node, i) => {
        const color = node.type === 'core' 
          ? colors.nodeCore 
          : node.type === 'mid' 
          ? colors.nodeMid 
          : colors.nodeOuter;
        
        return (
          <NetworkNode 
            key={`node-${i}-${isDark}`} 
            position={node.pos} 
            color={color}
            isDark={isDark}
          />
        );
      })}
      
      {connections.map(([from, to]) => {
        const fromNode = nodes[from];
        const toNode = nodes[to];
        const isCoreConnection = fromNode.type === 'core' || toNode.type === 'core';
        
        return (
          <Connection
            key={`conn-${from}-${to}-${isDark}`}
            start={fromNode.pos}
            end={toNode.pos}
            color={isCoreConnection ? colors.edgeCore : colors.edge}
            isDark={isDark}
          />
        );
      })}
    </>
  );
}

// 메인 컴포넌트
export default function Network3D() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const sceneRef = useRef(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // resolvedTheme 변경 시 즉시 업데이트
  const isDark = mounted && (resolvedTheme === 'dark' || (!resolvedTheme && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  
  // 테마 변경 시 scene 업데이트
  useEffect(() => {
    if (sceneRef.current && mounted) {
      const fogColor = isDark ? '#0a0f1a' : '#ffffff';
      const bgColor = isDark ? '#0a0f1a' : '#ffffff';
      
      if (sceneRef.current.fog) {
        sceneRef.current.fog.color.set(fogColor);
      }
      if (sceneRef.current.background) {
        sceneRef.current.background.set(bgColor);
      }
    }
  }, [isDark, mounted]);
  
  if (!mounted) return null;

  const fogColor = isDark ? '#0a0f1a' : '#ffffff';
  const bgColor = isDark ? '#0a0f1a' : '#ffffff';
  
  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 40 }}
          gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          onCreated={({ scene }) => {
            scene.fog = new THREE.Fog(fogColor, 6, 20);
            scene.background = new THREE.Color(bgColor);
            sceneRef.current = scene;
          }}
        >
          {/* 부드러운 전역 조명 */}
          <ambientLight intensity={isDark ? 0.5 : 0.7} />
          <directionalLight position={[5, 5, 5]} intensity={isDark ? 0.7 : 0.5} />
          <directionalLight position={[-5, -5, -5]} intensity={isDark ? 0.4 : 0.3} />
          {!isDark && <directionalLight position={[0, 10, 0]} intensity={0.4} />}
          
          <NetworkScene key={isDark ? 'dark' : 'light'} isDark={isDark} />
        </Canvas>
      </div>
      {/* 블러/반투명 레이어 - 텍스트와 겹침 방지 */}
      <div className="fixed inset-0 z-[1] pointer-events-none bg-white/40 dark:bg-[#0a0f1a]/40 backdrop-blur-[1px]"></div>
    </>
  );
}
