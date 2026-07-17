/**
 * Aether OS - Spatial Scene Engine
 * Three.js based 3D spatial workspace with physics simulation
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface Node3D {
  id: string;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  data: any;
  connections: string[];
}

export interface SpatialConfig {
  backgroundColor: number;
  fogColor: number;
  gridSize: number;
  gridDivisions: number;
  nodeCount: number;
  connectionDistance: number;
  physics: {
    gravity: number;
    friction: number;
    repulsion: number;
    attraction: number;
  };
}

const DEFAULT_CONFIG: SpatialConfig = {
  backgroundColor: 0x0a0a0f,
  fogColor: 0x0a0a0f,
  gridSize: 100,
  gridDivisions: 50,
  nodeCount: 50,
  connectionDistance: 8,
  physics: {
    gravity: 0,
    friction: 0.98,
    repulsion: 0.5,
    attraction: 0.01
  }
};

export class SpatialScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private clock: THREE.Clock;
  
  private nodes: Map<string, Node3D> = new Map();
  private connections!: THREE.LineSegments;
  private particles!: THREE.Points;
  
  private config: SpatialConfig;
  private isRunning: boolean = false;
  private animationId: number = 0;
  
  private eventCallbacks: Map<string, Function[]> = new Map();

  constructor(container: HTMLElement, config: Partial<SpatialConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.clock = new THREE.Clock();
    
    // Initialize Three.js components
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.backgroundColor);
    this.scene.fog = new THREE.Fog(this.config.fogColor, 20, 100);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 15, 30);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 100;
    this.controls.minDistance = 5;

    // Initialize scene elements
    this.initLights();
    this.initGrid();
    this.initConnections();
    this.initParticles();
    this.initNodes();
    
    // Event listeners
    window.addEventListener('resize', this.onResize.bind(this));
  }

  private initLights(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0x00f5ff, 0.8);
    mainLight.position.set(10, 20, 10);
    this.scene.add(mainLight);

    // Accent lights
    const purpleLight = new THREE.PointLight(0x8b5cf6, 1, 50);
    purpleLight.position.set(-15, 10, -15);
    this.scene.add(purpleLight);

    const magentaLight = new THREE.PointLight(0xff00ff, 0.8, 50);
    magentaLight.position.set(15, 10, 15);
    this.scene.add(magentaLight);
  }

  private initGrid(): void {
    // Grid helper
    const grid = new THREE.GridHelper(
      this.config.gridSize,
      this.config.gridDivisions,
      0x00f5ff,
      0x1a1a25
    );
    grid.position.y = -5;
    (grid.material as THREE.Material).opacity = 0.15;
    (grid.material as THREE.Material).transparent = true;
    this.scene.add(grid);

    // Subtle floor plane
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      transparent: true,
      opacity: 0.8,
      roughness: 0.9
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -5.1;
    this.scene.add(floor);
  }

  private initConnections(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(6000); // 1000 connections * 3 vertices * 2
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending
    });
    
    this.connections = new THREE.LineSegments(geometry, material);
    this.scene.add(this.connections);
  }

  private initParticles(): void {
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const color1 = new THREE.Color(0x00f5ff);
    const color2 = new THREE.Color(0x8b5cf6);
    const color3 = new THREE.Color(0xff00ff);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      
      const mixColor = Math.random();
      if (mixColor < 0.33) {
        colors[i * 3] = color1.r;
        colors[i * 3 + 1] = color1.g;
        colors[i * 3 + 2] = color1.b;
      } else if (mixColor < 0.66) {
        colors[i * 3] = color2.r;
        colors[i * 3 + 1] = color2.g;
        colors[i * 3 + 2] = color2.b;
      } else {
        colors[i * 3] = color3.r;
        colors[i * 3 + 1] = color3.g;
        colors[i * 3 + 2] = color3.b;
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  private initNodes(): void {
    for (let i = 0; i < this.config.nodeCount; i++) {
      this.createNode({
        id: `node-${i}`,
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 40
        ),
        data: { label: `Node ${i}`, type: 'default' }
      });
    }
  }

  public createNode(config: {
    id: string;
    position: THREE.Vector3;
    data?: any;
    size?: number;
    color?: number;
  }): Node3D {
    const size = config.size || (0.5 + Math.random() * 0.5);
    const color = config.color || this.getRandomNodeColor();
    
    const geometry = new THREE.IcosahedronGeometry(size, 2);
    const material = new THREE.MeshPhysicalMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
      emissive: color,
      emissiveIntensity: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(config.position);
    mesh.userData = { id: config.id, data: config.data };
    
    // Glow effect
    const glowGeometry = new THREE.SphereGeometry(size * 1.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);
    
    this.scene.add(mesh);
    
    const node: Node3D = {
      id: config.id,
      mesh,
      position: config.position.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      ),
      data: config.data || {},
      connections: []
    };
    
    this.nodes.set(config.id, node);
    this.emit('nodeCreated', node);
    
    return node;
  }

  private getRandomNodeColor(): number {
    const colors = [0x00f5ff, 0x8b5cf6, 0xff00ff, 0x00ff88];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private updateConnections(): void {
    const positions = this.connections.geometry.attributes.position.array as Float32Array;
    let idx = 0;
    
    this.nodes.forEach((nodeA, idA) => {
      this.nodes.forEach((nodeB, idB) => {
        if (idA >= idB) return;
        
        const dist = nodeA.position.distanceTo(nodeB.position);
        
        if (dist < this.config.connectionDistance) {
          positions[idx++] = nodeA.position.x;
          positions[idx++] = nodeA.position.y;
          positions[idx++] = nodeA.position.z;
          
          positions[idx++] = nodeB.position.x;
          positions[idx++] = nodeB.position.y;
          positions[idx++] = nodeB.position.z;
          
          // Update connections
          if (!nodeA.connections.includes(idB)) {
            nodeA.connections.push(idB);
          }
          if (!nodeB.connections.includes(idA)) {
            nodeB.connections.push(idA);
          }
        }
      });
    });
    
    // Clear remaining positions
    for (let i = idx; i < positions.length; i++) {
      positions[i] = 0;
    }
    
    this.connections.geometry.attributes.position.needsUpdate = true;
    this.connections.geometry.setDrawRange(0, idx / 3);
  }

  private updatePhysics(delta: number): void {
    const nodes = Array.from(this.nodes.values());
    
    // Apply forces
    nodes.forEach(nodeA => {
      const force = new THREE.Vector3();
      
      // Repulsion from other nodes
      nodes.forEach(nodeB => {
        if (nodeA.id === nodeB.id) return;
        
        const diff = new THREE.Vector3().subVectors(nodeA.position, nodeB.position);
        const dist = diff.length();
        
        if (dist < this.config.connectionDistance && dist > 0.1) {
          const repulsionForce = diff.normalize().multiplyScalar(
            this.config.physics.repulsion / (dist * dist)
          );
          force.add(repulsionForce);
        }
      });
      
      // Center attraction (keeps nodes from drifting too far)
      const centerPull = nodeA.position.clone().multiplyScalar(-0.001);
      force.add(centerPull);
      
      // Update velocity
      nodeA.velocity.add(force.multiplyScalar(delta));
      nodeA.velocity.multiplyScalar(this.config.physics.friction);
      
      // Update position
      nodeA.position.add(nodeA.velocity.clone().multiplyScalar(delta * 60));
      
      // Update mesh
      nodeA.mesh.position.copy(nodeA.position);
      
      // Gentle rotation
      nodeA.mesh.rotation.x += delta * 0.2;
      nodeA.mesh.rotation.y += delta * 0.3;
    });
  }

  private updateParticles(delta: number): void {
    this.particles.rotation.y += delta * 0.02;
    this.particles.rotation.x += delta * 0.01;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return;
    
    const delta = Math.min(this.clock.getDelta(), 0.1);
    
    this.controls.update();
    this.updatePhysics(delta);
    this.updateConnections();
    this.updateParticles(delta);
    
    this.renderer.render(this.scene, this.camera);
    
    this.animationId = requestAnimationFrame(this.animate);
  };

  private onResize(): void {
    const container = this.renderer.domElement.parentElement;
    if (!container) return;
    
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  // Event System
  public on(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx > -1) callbacks.splice(idx, 1);
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  // Node Operations
  public getNode(id: string): Node3D | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): Node3D[] {
    return Array.from(this.nodes.values());
  }

  public removeNode(id: string): void {
    const node = this.nodes.get(id);
    if (node) {
      this.scene.remove(node.mesh);
      node.mesh.geometry.dispose();
      (node.mesh.material as THREE.Material).dispose();
      this.nodes.delete(id);
      this.emit('nodeRemoved', node);
    }
  }

  public focusNode(id: string): void {
    const node = this.nodes.get(id);
    if (node) {
      const target = node.position.clone();
      this.controls.target.copy(target);
      
      // Animate camera to zoom in
      const cameraTarget = target.clone().add(new THREE.Vector3(0, 5, 15));
      this.animateCamera(this.camera.position, cameraTarget, 1000);
    }
  }

  private animateCamera(from: THREE.Vector3, to: THREE.Vector3, duration: number): void {
    const start = performance.now();
    
    const animate = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      
      this.camera.position.lerpVectors(from, to, eased);
      
      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  // Utility
  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.Camera {
    return this.camera;
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    
    this.nodes.forEach(node => {
      this.scene.remove(node.mesh);
      node.mesh.geometry.dispose();
      (node.mesh.material as THREE.Material).dispose();
    });
    this.nodes.clear();
    
    this.connections.geometry.dispose();
    (this.connections.material as THREE.Material).dispose();
    this.particles.geometry.dispose();
    (this.particles.material as THREE.Material).dispose();
    
    this.renderer.dispose();
    this.controls.dispose();
  }
}
