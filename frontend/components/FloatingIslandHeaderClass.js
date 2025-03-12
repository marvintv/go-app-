import * as THREE from 'three';
import { gsap } from 'gsap';

class FloatingIslandHeaderClass {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75, 
      this.container.clientWidth / this.container.clientHeight, 
      0.1, 
      1000
    );
    
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);
    
    this.camera.position.z = 5;
    
    this.createIsland();
    this.animate();
    this.setupResizeListener();
  }
  
  createIsland() {
    // Simple island geometry
    const islandGeometry = new THREE.CylinderGeometry(1, 1.5, 0.3, 32);
    const islandMaterial = new THREE.MeshPhongMaterial({ color: '#F4D03F' });
    this.island = new THREE.Mesh(islandGeometry, islandMaterial);
    this.scene.add(this.island);
    
    // Add palm tree (simplified)
    const trunkGeometry = new THREE.CylinderGeometry(0.05, 0.1, 1, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: '#8B4513' });
    this.trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    this.trunk.position.y = 0.5;
    this.island.add(this.trunk);
    
    // Palm leaves
    const leavesGeometry = new THREE.ConeGeometry(0.5, 0.5, 4);
    const leavesMaterial = new THREE.MeshPhongMaterial({ color: '#27AE60' });
    this.leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    this.leaves.position.y = 1.0;
    this.trunk.add(this.leaves);
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Rotate island slightly
    if (this.island) {
      this.island.rotation.y += 0.005;
      
      // Use gsap for floating animation
      if (!this._animationStarted) {
        this._animationStarted = true;
        gsap.to(this.island.position, {
          y: 0.2,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  setupResizeListener() {
    window.addEventListener('resize', () => {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    });
  }
}

export default FloatingIslandHeaderClass; 