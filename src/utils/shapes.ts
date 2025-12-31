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

    if (type === 'sphere') {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      vec.setFromSphericalCoords(radius, phi, theta);
      
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
      
      color.setHSL(0.95 + Math.random() * 0.05, 0.9, 0.5);
    } 
    else if (type === 'ring') {
      const angle = Math.random() * Math.PI * 2;
      const isRing = Math.random() > 0.2;
      if (isRing) {
        const rVal = radius * 1.5 + Math.random() * 1;
        vec.set(Math.cos(angle) * rVal, (Math.random() - 0.5) * 0.2, Math.sin(angle) * rVal);
        color.setHSL(0.1, 0.8, 0.6);
      } else {
        const rVal = Math.random() * radius * 0.5;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        vec.setFromSphericalCoords(rVal, phi, theta);
        color.setHSL(0.6, 0.8, 0.7);
      }
    }
    else if (type === 'flower') {
      const k = 4;
      const theta = Math.random() * Math.PI * 2;
      const rBase = Math.cos(k * theta);
      const rVal = (Math.abs(rBase) + 0.2) * radius;
      const z = (Math.random() - 0.5) * 1;
      vec.set(rVal * Math.cos(theta), rVal * Math.sin(theta), z);
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

      const distNorm = dist / (radius * 2);
      if (distNorm < 0.2) color.setHex(0xffffff);
      else if (distNorm < 0.5) color.setHex(0xffaaee);
      else color.setHex(0x5500ff);
    }
    else if (type === 'solar_system') {
      const r = Math.random();
      
      // 15% of particles form the Sun
      if (r < 0.15) {
        const rSun = Math.random() * 1.8; 
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        vec.setFromSphericalCoords(rSun, phi, theta);
        
        // Sun Color: Gradient from core (white/yellow) to edge (red/orange)
        const distFromCenter = rSun / 1.8;
        if (distFromCenter < 0.2) color.setHex(0xFFFFFF); // Core hot
        else if (distFromCenter < 0.5) color.setHex(0xFFD700); // Gold
        else if (distFromCenter < 0.8) color.setHex(0xFF8C00); // Orange
        else color.setHex(0xFF4500); // Red edge
      } else {
        // Planets
        const orbits = [
          { r: 3.5, size: 0.2, type: 'mercury' },
          { r: 4.5, size: 0.4, type: 'venus' },
          { r: 6.0, size: 0.45, type: 'earth' },
          { r: 7.5, size: 0.3, type: 'mars' },
          { r: 10.5, size: 1.2, type: 'jupiter' },
          { r: 13.5, size: 1.0, type: 'saturn' },
          { r: 16.5, size: 0.7, type: 'uranus' },
          { r: 18.5, size: 0.7, type: 'neptune' }
        ];
        
        const planetIndex = Math.floor(Math.random() * orbits.length);
        const planet = orbits[planetIndex];
        
        // Fixed angle per planet so they are spread out
        const planetAngle = (planetIndex / orbits.length) * Math.PI * 2 + (Math.PI / 4);
        
        // Planet Center
        const cx = Math.cos(planetAngle) * planet.r;
        const cz = Math.sin(planetAngle) * planet.r;
        
        // Saturn Rings Logic
        if (planet.type === 'saturn' && Math.random() > 0.4) {
             const ringR = planet.size * 1.2 + Math.random() * 1.0;
             const ringAng = Math.random() * Math.PI * 2;
             vec.set(
                 cx + Math.cos(ringAng) * ringR,
                 (Math.random() - 0.5) * 0.15, // Flat rings
                 cz + Math.sin(ringAng) * ringR
             );
             // Ring colors (tan/gold/grey)
             if (Math.random() > 0.5) color.setHex(0xC2B280);
             else color.setHex(0xA09070);
        } else {
             // Planet Body Sphere
             const pr = Math.random() * planet.size;
             const pTheta = Math.random() * Math.PI * 2;
             const pPhi = Math.acos(2 * Math.random() - 1);
             
             vec.setFromSphericalCoords(pr, pPhi, pTheta);
             vec.add(new THREE.Vector3(cx, 0, cz));
             
             const rand = Math.random();

             switch (planet.type) {
                case 'mercury':
                    color.setHex(0xA5A5A5); // Grey
                    break;
                case 'venus':
                    color.setHex(0xE3BB76); // Yellowish
                    break;
                case 'earth':
                    // Earth: Blue oceans, Green land, White clouds
                    if (rand > 0.7) color.setHex(0xFFFFFF); // Clouds
                    else if (rand > 0.35) color.setHex(0x1E90FF); // Ocean
                    else color.setHex(0x228B22); // Land
                    break;
                case 'mars':
                    if (rand > 0.8) color.setHex(0x8B4513); // Dark spots
                    else color.setHex(0xE27B58); // Rusty Red
                    break;
                case 'jupiter':
                    // Jupiter Bands: Based on local Y height relative to planet center
                    // We need to know the Y relative to the planet center (0)
                    const localY = vec.y; 
                    const band = Math.abs(localY / planet.size);
                    if (band < 0.2) color.setHex(0xD9A066); // Main band
                    else if (band < 0.4) color.setHex(0xF4E4C1); // Light band
                    else if (band < 0.6) color.setHex(0xCD853F); // Darker band
                    else color.setHex(0x8B4513); // Poles
                    break;
                case 'saturn':
                    color.setHex(0xEAD6B8); // Pale Gold
                    break;
                case 'uranus':
                    color.setHex(0xAFEEEE); // Pale Turquoise
                    break;
                case 'neptune':
                    color.setHex(0x4169E1); // Royal Blue
                    break;
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
