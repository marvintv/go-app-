import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import colors from '../src/theme/colors';

interface FloatingIslandHeaderProps {
  title: string;
}

const FloatingIslandHeader = ({ title }: FloatingIslandHeaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const islandRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create island group
    const island = new THREE.Group();
    islandRef.current = island;
    
    // Create island base (land)
    const islandGeometry = new THREE.CylinderGeometry(1.5, 2, 0.5, 32);
    const islandMaterial = new THREE.MeshLambertMaterial({ color: colors.sand });
    const islandMesh = new THREE.Mesh(islandGeometry, islandMaterial);
    islandMesh.position.y = -0.25;
    island.add(islandMesh);
    
    // Add palm trees
    addPalmTree(island, -0.8, 0, 0.5);
    addPalmTree(island, 0.8, 0.2, 0.3);
    
    // Add water around the island
    const waterGeometry = new THREE.RingGeometry(2, 3, 32);
    const waterMaterial = new THREE.MeshBasicMaterial({ 
      color: colors.primary,
      transparent: true,
      opacity: 0.8
    });
    const waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = -0.3;
    island.add(waterMesh);
    
    // Add island to scene
    scene.add(island);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Animation
    gsap.to(island.rotation, {
      y: Math.PI * 2,
      duration: 20,
      repeat: -1,
      ease: "none"
    });
    
    // Floating animation
    gsap.to(island.position, {
      y: 0.2,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
    
    // Render loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate();
    
    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);
  
  // Helper function to create palm trees
  const addPalmTree = (parent: THREE.Group, x: number, z: number, scale: number) => {
    const trunkGeometry = new THREE.CylinderGeometry(0.05, 0.1, 1, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 0.2, z);
    trunk.scale.set(scale, scale, scale);
    
    // Add leaves
    const leavesGroup = new THREE.Group();
    leavesGroup.position.y = 0.5;
    
    for (let i = 0; i < 5; i++) {
      const leafGeometry = new THREE.PlaneGeometry(0.5, 0.8);
      const leafMaterial = new THREE.MeshLambertMaterial({ 
        color: colors.palmGreen,
        side: THREE.DoubleSide
      });
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      leaf.rotation.x = Math.PI / 4;
      leaf.rotation.y = (i / 5) * Math.PI * 2;
      leaf.position.y = 0.2;
      
      leavesGroup.add(leaf);
    }
    
    trunk.add(leavesGroup);
    parent.add(trunk);
  };

  return (
    <div className="relative">
      <div 
        ref={containerRef} 
        className="w-full h-200 sm:h-200"
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg px-6 py-2 rounded-lg border-2 border-gray-400 bg-black/20 backdrop-blur-sm">
          {title}
        </h1>
      </div>
    </div>
  );
};

export default FloatingIslandHeader; 