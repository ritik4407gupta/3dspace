import * as THREE from 'three';

// Helper to get points AND colors for different shapes
export const getShapeData = (type: string, count: number, radius: number = 2) => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const vec = new THREE.Vector3();
  const color = new THREE.Color();

  // Default colors for non-specific shapes (gradient)
  const color1 = new THREE.Color('#00ffff'); // Cyan
  const color2 = new THREE.Color('#ff00ff'); // Magenta

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let r, g, b;

    if (type === 'sphere') {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      vec.setFromSphericalCoords(radius, phi, theta);
      
      // Gradient based on Y position
      const t = (vec.y + radius) / (radius * 2);
      color.copy(color1).lerp(color2, t);
    } 
    else if (type === 'heart') {
      const t = Math.random() * Math.PI * 2;
      const rVal = Math.sqrt(Math.random()) * 0.15 * radius;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const z = (Math.random() - 0.5) * 4;
      vec.set(x * rVal, y * rVal, z);
      
      // Deep Red/Pink
      color.setHSL(0.95 + Math.random() * 0.05, 0.9, 0.5);
    } 
    else if (type === 'ring') {
      const angle = Math.random() * Math.PI * 2;
      const isRing = Math.random() > 0.2;
      if (isRing) {
        const rVal = radius * 1.5 + Math.random() * 1;
        vec.set(Math.cos(angle) * rVal, (Math.random() - 0.5) * 0.2, Math.sin(angle) * rVal);
        color.setHSL(0.1, 0.8, 0.6); // Gold/Orange ring
      } else {
        const rVal = Math.random() * radius * 0.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        vec.setFromSphericalCoords(rVal, phi, theta);
        color.setHSL(0.6, 0.8, 0.7); // Blueish center
      }
    }
    else if (type === 'flower') {
      const k = 4;
      const theta = Math.random() * Math.PI * 2;
      const rBase = Math.cos(k * theta);
      const rVal = (Math.abs(rBase) + 0.2) * radius;
      const z = (Math.random() - 0.5) * 1;
      vec.set(rVal * Math.cos(theta), rVal * Math.sin(theta), z);
      
      // Multi-colored petals
      color.setHSL(Math.abs(Math.sin(theta * 2)), 0.8, 0.6);
    }
    else if (type === 'galaxy') {
      const branches = 3;
      const spin = i / count * branches * Math.PI * 2;
      const dist = Math.random() * radius * 2;
      const randomOffset = (Math.random() - 0.5) + (Math.random() - 0.5) + (Math.random() - 0.5);
      vec.x = Math.cos(spin + dist) * dist + randomOffset;
      vec.y = (Math.random() - 0.5) * (radius * 0.5) / (dist + 0.1);
      vec.z = Math.sin(spin + dist) * dist + randomOffset;

      // Galaxy colors: white center -> purple -> blue edges
      const distNorm = dist / (radius * 2);
      if (distNorm < 0.2) color.setHex(0xffffff); // Core
      else if (distNorm < 0.5) color.setHex(0xffaaee); // Inner arms
      else color.setHex(0x5500ff); // Outer arms
    }
    else if (type === 'solar_system') {
      const r = Math.random();
      
      if (r < 0.2) {
        // Sun (Center) - 20% of particles
        const rSun = Math.random() * 1.2; 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        vec.setFromSphericalCoords(rSun, phi, theta);
        
        // Sun Color: Yellow/Orange/Red mix
        if (Math.random() > 0.3) color.setHex(0xFDB813); // Yellow
        else color.setHex(0xFF8C00); // Orange
      } else {
        // Planets
        const orbits = [
          { r: 2.5, size: 0.2, color: 0xA5A5A5 }, // Mercury (Grey)
          { r: 3.5, size: 0.4, color: 0xE3BB76 }, // Venus (Yellowish)
          { r: 4.5, size: 0.45, color: 0x22A6B3 }, // Earth (Blue/Green)
          { r: 5.5, size: 0.3, color: 0xDD4124 }, // Mars (Red)
          { r: 8.0, size: 1.2, color: 0xD9A066 }, // Jupiter (Orange/Brown)
          { r: 10.5, size: 1.0, color: 0xEAD6B8 }, // Saturn (Pale Gold)
          { r: 13.0, size: 0.7, color: 0xD1E7E7 }, // Uranus (Pale Blue)
          { r: 15.0, size: 0.7, color: 0x5B5DDF }  // Neptune (Deep Blue)
        ];
        
        const planetIndex = Math.floor(Math.random() * orbits.length);
        const planet = orbits[planetIndex];
        
        // Fixed angle per planet so they form spheres
        const planetAngle = (planetIndex / orbits.length) * Math.PI * 2 + (Math.PI / 4);
        
        // Local planet sphere
        const pr = Math.random() * planet.size;
        const pTheta = Math.random() * Math.PI * 2;
        const pPhi = Math.acos(2 * Math.random() - 1);
        
        // Planet Center
        const cx = Math.cos(planetAngle) * planet.r;
        const cz = Math.sin(planetAngle) * planet.r;
        
        // Saturn Rings special case
        if (planetIndex === 5 && Math.random() > 0.6) {
             const ringR = planet.size * 1.5 + Math.random() * 0.5;
             const ringAng = Math.random() * Math.PI * 2;
             vec.set(
                 cx + Math.cos(ringAng) * ringR,
                 (Math.random() - 0.5) * 0.1,
                 cz + Math.sin(ringAng) * ringR
             );
             color.setHex(0xC5A16F); // Ring color
        } else {
             vec.setFromSphericalCoords(pr, pPhi, pTheta);
             vec.add(new THREE.Vector3(cx, 0, cz));
             
             // Earth variation (Blue/White/Green)
             if (planetIndex === 2) {
                const rand = Math.random();
                if (rand > 0.7) color.setHex(0xffffff); // Clouds
                else if (rand > 0.3) color.setHex(0x22A6B3); // Ocean
                else color.setHex(0x348C31); // Land
             } else {
                 color.setHex(planet.color);
             }
        }
      }
    }

    positions[i3] = vec.x;
    positions[i3 + 1] = vec.y;
    positions[i3 + 2] = vec.z;

    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  return { positions, colors };
};
