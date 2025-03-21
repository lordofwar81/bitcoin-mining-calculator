import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const MiningRigVisualizer = ({ numMachines }) => {
  const mountRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Ensure the ref is attached to a DOM element before proceeding
    if (!mountRef.current) return;

    // Cap the number of rigs to prevent performance issues
    const maxRigs = Math.min(numMachines, 100); // Cap at 100 rigs for performance

    // Check if WebGL is supported
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setError('WebGL is not supported in your browser. Please try a different browser or enable WebGL.');
      return;
    }

    // Scene setup
    let scene, camera, renderer;
    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      mountRef.current.appendChild(renderer.domElement);
    } catch (err) {
      setError('Failed to initialize 3D visualization: ' + err.message);
      return;
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Create mining rigs (simple boxes)
    const rigs = [];
    const gridSize = Math.ceil(Math.sqrt(maxRigs)); // Arrange in a square grid
    const spacing = 2;
    for (let i = 0; i < maxRigs; i++) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.5 });
      const rig = new THREE.Mesh(geometry, material);
      const x = (i % gridSize) * spacing - (gridSize * spacing) / 2;
      const z = Math.floor(i / gridSize) * spacing - (gridSize * spacing) / 2;
      rig.position.set(x, 0, z);
      scene.add(rig);
      rigs.push(rig);
    }

    // Camera position
    camera.position.set(0, 5, gridSize * spacing);
    camera.lookAt(0, 0, 0);

    // Animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      rigs.forEach(rig => {
        rig.rotation.y += 0.01; // Rotate each rig
        rig.material.emissiveIntensity = 0.5 + 0.5 * Math.sin(Date.now() * 0.005); // Glowing effect
      });
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      // Cancel the animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      // Remove the resize event listener
      window.removeEventListener('resize', handleResize);

      // Clean up Three.js resources
      if (mountRef.current && renderer.domElement) {
        try {
          mountRef.current.removeChild(renderer.domElement);
        } catch (error) {
          console.warn('Failed to remove renderer DOM element:', error);
        }
      }

      // Dispose of Three.js objects
      scene.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
        scene.remove(child);
      });
      renderer.dispose();
    };
  }, [numMachines]);

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>;
  }

  return <div ref={mountRef} style={{ width: '100%', height: '400px' }} />;
};

export default MiningRigVisualizer;