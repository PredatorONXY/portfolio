/**
 * Three.js Interactive 3D Background & Spatial Scene System
 * Jaskaran Singh — Portfolio
 */

(function () {
  'use strict';

  // Check if Three.js is loaded
  if (typeof THREE === 'undefined') {
    console.warn('Three.js not loaded. Skipping 3D initialization.');
    return;
  }

  // Configuration & State
  const config = {
    particleCount: window.innerWidth < 768 ? 600 : 1200,
    colors: {
      blue: 0x0f33ff,
      blueSoft: 0x5b78ff,
      cyan: 0x00f0ff,
      purple: 0x8a2be2,
      dark: 0x0c0c0c,
      grid: 0x182035,
      white: 0xffffff
    }
  };

  let scene, camera, renderer;
  let canvasContainer;
  let currentSection = 0;
  let isMouseInteracting = false;

  // Mouse & Parallax tracking
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const windowHalf = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  // Object Groups
  const globalGroup = new THREE.Group();
  const heroGroup = new THREE.Group();
  const projectsGroup = new THREE.Group();
  const aboutGroup = new THREE.Group();
  const skillsGroup = new THREE.Group();
  const contactGroup = new THREE.Group();

  let particleSystem;
  let cyberGrid;
  let pointLight1, pointLight2, pointLight3;
  let heroCore, heroRing1, heroRing2, heroOuterMesh, heroOrbiters = [];
  let skillsNodes = [];
  let projectPrisms = [];
  let aboutHelixNodes = [];
  let contactRings = [];
  let shockwaves = [];
  let warpFactor = { val: 1.0 };

  // Clock
  const clock = new THREE.Clock();

  // Camera Section Coordinates & Targets
  const cameraPresets = [
    // Section 0: Home / Hero
    { pos: { x: 0, y: 0, z: 28 }, target: { x: 3.5, y: 0, z: 0 }, fov: 45 },
    // Section 1: Projects
    { pos: { x: -8, y: -4, z: 24 }, target: { x: -2, y: -2, z: 0 }, fov: 50 },
    // Section 2: About
    { pos: { x: 8, y: 5, z: 26 }, target: { x: 2, y: 1, z: 0 }, fov: 48 },
    // Section 3: Skills
    { pos: { x: 0, y: 8, z: 25 }, target: { x: 0, y: 2, z: 0 }, fov: 45 },
    // Section 4: Contact
    { pos: { x: 0, y: -2, z: 20 }, target: { x: 0, y: 0, z: 0 }, fov: 55 }
  ];

  function init() {
    // Create canvas
    canvasContainer = document.createElement('div');
    canvasContainer.id = 'three-canvas-container';
    canvasContainer.style.position = 'fixed';
    canvasContainer.style.top = '0';
    canvasContainer.style.left = '0';
    canvasContainer.style.width = '100%';
    canvasContainer.style.height = '100%';
    canvasContainer.style.zIndex = '0';
    canvasContainer.style.pointerEvents = 'none';
    canvasContainer.style.overflow = 'hidden';

    document.body.prepend(canvasContainer);

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(config.colors.dark, 0.022);

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(cameraPresets[0].pos.x, cameraPresets[0].pos.y, cameraPresets[0].pos.z);
    camera.lookAt(cameraPresets[0].target.x, cameraPresets[0].target.y, cameraPresets[0].target.z);

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    canvasContainer.appendChild(renderer.domElement);

    // Add groups to scene
    scene.add(globalGroup);
    scene.add(heroGroup);
    scene.add(projectsGroup);
    scene.add(aboutGroup);
    scene.add(skillsGroup);
    scene.add(contactGroup);

    // Setup elements
    setupLights();
    setupGlobalParticles();
    setupCyberGrid();
    setupHeroObjects();
    setupProjectsObjects();
    setupAboutObjects();
    setupSkillsObjects();
    setupContactObjects();

    // Adjust hero objects position for screen size
    updateLayoutForScreen();

    // Event Listeners
    window.addEventListener('resize', onWindowResize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('click', onPointerClick, { passive: true });

    // Hook to section changes
    setupSectionListeners();

    // Interactive Hover on UI
    setupUIHoverInteractions();

    // Start loop
    animate();
  }

  // --- Lighting Setup ---
  function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    pointLight1 = new THREE.PointLight(config.colors.cyan, 3, 50);
    pointLight1.position.set(10, 10, 15);
    scene.add(pointLight1);

    pointLight2 = new THREE.PointLight(config.colors.blue, 4, 60);
    pointLight2.position.set(-15, -10, 10);
    scene.add(pointLight2);

    pointLight3 = new THREE.PointLight(config.colors.purple, 2.5, 45);
    pointLight3.position.set(0, 15, -5);
    scene.add(pointLight3);
  }

  // --- Texture Generator for Soft Particles ---
  function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(91, 120, 255, 0.9)');
    gradient.addColorStop(0.5, 'rgba(15, 51, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // --- Global Cyber Particle Starfield ---
  function setupGlobalParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(config.particleCount * 3);
    const scales = new Float32Array(config.particleCount);
    const speeds = new Float32Array(config.particleCount);

    for (let i = 0; i < config.particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 70;

      scales[i] = Math.random() * 0.8 + 0.4;
      speeds[i] = Math.random() * 0.02 + 0.005;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const particleTexture = createParticleTexture();
    const material = new THREE.PointsMaterial({
      color: config.colors.blueSoft,
      size: 1.2,
      map: particleTexture,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    particleSystem = new THREE.Points(geometry, material);
    particleSystem.userData = { speeds: speeds, originalPositions: positions.slice() };
    globalGroup.add(particleSystem);
  }

  // --- Animated Cyber Grid Floor ---
  function setupCyberGrid() {
    const gridHelper = new THREE.GridHelper(120, 40, config.colors.blueSoft, config.colors.grid);
    gridHelper.position.y = -18;
    gridHelper.position.z = 0;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.28;
    cyberGrid = gridHelper;
    globalGroup.add(cyberGrid);
  }

  // --- Section 0: Hero Holographic Cyber Core ---
  function setupHeroObjects() {
    // 1. Inner Crystalline Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(3.2, 1);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x051340,
      emissive: 0x0f33ff,
      emissiveIntensity: 0.45,
      specular: 0x00f0ff,
      shininess: 90,
      flatShading: true,
      transparent: true,
      opacity: 0.88
    });
    heroCore = new THREE.Mesh(coreGeo, coreMat);

    // Inner wireframe glow
    const coreWireGeo = new THREE.IcosahedronGeometry(3.22, 1);
    const coreWireMat = new THREE.MeshBasicMaterial({
      color: config.colors.cyan,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    const coreWire = new THREE.Mesh(coreWireGeo, coreWireMat);
    heroCore.add(coreWire);

    // 2. Outer Geodesic Lattice Sphere
    const outerGeo = new THREE.IcosahedronGeometry(4.8, 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: config.colors.blueSoft,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    heroOuterMesh = new THREE.Mesh(outerGeo, outerMat);

    // 3. Orbiting Quantum Gimbal Rings
    const ringGeo1 = new THREE.TorusGeometry(5.8, 0.05, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: config.colors.cyan,
      transparent: true,
      opacity: 0.75
    });
    heroRing1 = new THREE.Mesh(ringGeo1, ringMat1);

    const ringGeo2 = new THREE.TorusGeometry(6.6, 0.04, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: config.colors.blueSoft,
      transparent: true,
      opacity: 0.6
    });
    heroRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    heroRing2.rotation.x = Math.PI / 3;

    // 4. Orbiting satellite nodes
    for (let i = 0; i < 6; i++) {
      const orbGeo = new THREE.OctahedronGeometry(0.35);
      const orbMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? config.colors.cyan : config.colors.blueSoft,
        wireframe: false
      });
      const orbiter = new THREE.Mesh(orbGeo, orbMat);
      orbiter.userData = {
        radius: 6.2 + (i % 3) * 0.8,
        angle: (i / 6) * Math.PI * 2,
        speed: 0.015 + (i % 2) * 0.01,
        tilt: (i * Math.PI) / 4
      };
      heroGroup.add(orbiter);
      heroOrbiters.push(orbiter);
    }

    heroGroup.add(heroCore);
    heroGroup.add(heroOuterMesh);
    heroGroup.add(heroRing1);
    heroGroup.add(heroRing2);

    // Initial position on screen (to the right of hero text)
    heroGroup.position.set(7.5, 0.5, 0);
  }

  // --- Section 1: Projects Holographic Prisms ---
  function setupProjectsObjects() {
    projectsGroup.position.set(9, -2, -5);
    projectsGroup.visible = false;

    // Floating data cubes / holographic project cards
    const prismCount = 4;
    for (let i = 0; i < prismCount; i++) {
      const group = new THREE.Group();
      const boxGeo = new THREE.BoxGeometry(3.5, 2.2, 0.4);
      const boxMat = new THREE.MeshPhongMaterial({
        color: 0x090f24,
        emissive: 0x0f33ff,
        emissiveIntensity: 0.3,
        specular: 0x00f0ff,
        transparent: true,
        opacity: 0.6
      });
      const mesh = new THREE.Mesh(boxGeo, boxMat);

      const wireGeo = new THREE.BoxGeometry(3.55, 2.25, 0.45);
      const wireMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? config.colors.cyan : config.colors.blueSoft,
        wireframe: true,
        transparent: true,
        opacity: 0.55
      });
      const wire = new THREE.Mesh(wireGeo, wireMat);
      group.add(mesh);
      group.add(wire);

      group.position.set((i % 2) * 4.5 - 2, Math.floor(i / 2) * -3.8 + 2, (i % 2) * 2);
      group.rotation.y = 0.25 - (i % 2) * 0.5;
      group.rotation.x = 0.1;
      group.userData = {
        baseY: group.position.y,
        floatSpeed: 0.002 + i * 0.001,
        rotSpeed: 0.005
      };

      projectsGroup.add(group);
      projectPrisms.push(group);
    }
  }

  // --- Section 2: About Cyber Helix & Shield Nodes ---
  function setupAboutObjects() {
    aboutGroup.position.set(-8, 1, -4);
    aboutGroup.visible = false;

    // Cyber Double Helix structure (representing modular code & security architecture)
    const nodeCount = 18;
    const curveRadius = 2.8;
    const heightSpread = 14;

    for (let i = 0; i < nodeCount; i++) {
      const progress = i / (nodeCount - 1);
      const y = (progress - 0.5) * heightSpread;
      const angle1 = progress * Math.PI * 4;
      const angle2 = angle1 + Math.PI;

      // Strand A Node
      const x1 = Math.cos(angle1) * curveRadius;
      const z1 = Math.sin(angle1) * curveRadius;
      const geo1 = new THREE.OctahedronGeometry(0.35);
      const mat1 = new THREE.MeshBasicMaterial({ color: config.colors.cyan, wireframe: true });
      const nodeA = new THREE.Mesh(geo1, mat1);
      nodeA.position.set(x1, y, z1);
      aboutGroup.add(nodeA);

      // Strand B Node
      const x2 = Math.cos(angle2) * curveRadius;
      const z2 = Math.sin(angle2) * curveRadius;
      const geo2 = new THREE.DodecahedronGeometry(0.35);
      const mat2 = new THREE.MeshBasicMaterial({ color: config.colors.blueSoft, wireframe: true });
      const nodeB = new THREE.Mesh(geo2, mat2);
      nodeB.position.set(x2, y, z2);
      aboutGroup.add(nodeB);

      // Connecting cyber rungs
      if (i % 2 === 0) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x1, y, z1),
          new THREE.Vector3(x2, y, z2)
        ]);
        const lineMat = new THREE.LineBasicMaterial({
          color: config.colors.blueSoft,
          transparent: true,
          opacity: 0.4
        });
        const line = new THREE.Line(lineGeo, lineMat);
        aboutGroup.add(line);
      }

      aboutHelixNodes.push({ nodeA, nodeB, angle1, angle2, progress });
    }
  }

  // --- Section 3: Skills Interactive Tech Galaxy ---
  function setupSkillsObjects() {
    skillsGroup.position.set(0, 1.5, -6);
    skillsGroup.visible = false;

    // Multiple orbiting tech polyhedra (Octahedrons, Icosahedrons, Tetrahedrons, Toruses)
    const shapes = [
      { geo: new THREE.OctahedronGeometry(1.4), color: config.colors.cyan, name: 'Web' },
      { geo: new THREE.IcosahedronGeometry(1.2), color: config.colors.blueSoft, name: 'Backend' },
      { geo: new THREE.BoxGeometry(1.5, 1.5, 1.5), color: config.colors.blue, name: 'Database' },
      { geo: new THREE.TorusGeometry(1.1, 0.35, 12, 24), color: config.colors.purple, name: 'Security' },
      { geo: new THREE.TetrahedronGeometry(1.3), color: 0x00d2ff, name: 'FullStack' }
    ];

    shapes.forEach((item, index) => {
      const group = new THREE.Group();
      const meshMat = new THREE.MeshPhongMaterial({
        color: item.color,
        emissive: item.color,
        emissiveIntensity: 0.3,
        wireframe: true,
        transparent: true,
        opacity: 0.75
      });
      const mesh = new THREE.Mesh(item.geo, meshMat);
      group.add(mesh);

      const angle = (index / shapes.length) * Math.PI * 2;
      const radius = 6.5;
      group.position.set(Math.cos(angle) * radius, Math.sin(angle * 2) * 1.5, Math.sin(angle) * radius);
      group.userData = {
        angle: angle,
        radius: radius,
        speed: 0.008 + index * 0.003,
        name: item.name
      };

      skillsGroup.add(group);
      skillsNodes.push(group);
    });

    // Central connector sphere
    const centerGeo = new THREE.SphereGeometry(1.8, 16, 16);
    const centerMat = new THREE.MeshBasicMaterial({
      color: config.colors.blue,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    const centerSphere = new THREE.Mesh(centerGeo, centerMat);
    skillsGroup.add(centerSphere);
  }

  // --- Section 4: Contact Cyber Beacon & Warp Rings ---
  function setupContactObjects() {
    contactGroup.position.set(-6, 0, -3);
    contactGroup.visible = false;

    // Concentric glowing energy rings pulsing outwards
    for (let i = 0; i < 6; i++) {
      const ringGeo = new THREE.RingGeometry(2.5 + i * 1.4, 2.6 + i * 1.4, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? config.colors.cyan : config.colors.blueSoft,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6 - i * 0.08
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = -i * 1.5;
      ring.userData = { baseScale: 1 + i * 0.15, index: i };

      contactGroup.add(ring);
      contactRings.push(ring);
    }
  }

  // --- Dynamic Layout & Responsiveness ---
  function updateLayoutForScreen() {
    const width = window.innerWidth;
    if (width < 768) {
      heroGroup.position.set(0, -6, -8);
      heroGroup.scale.set(0.65, 0.65, 0.65);
      aboutGroup.position.set(0, 0, -10);
      skillsGroup.position.set(0, 0, -10);
      projectsGroup.position.set(0, -4, -10);
      contactGroup.position.set(0, 4, -8);
    } else if (width < 1100) {
      heroGroup.position.set(5.5, 0.5, 0);
      heroGroup.scale.set(0.85, 0.85, 0.85);
    } else {
      heroGroup.position.set(7.5, 0.5, 0);
      heroGroup.scale.set(1, 1, 1);
    }
  }

  function onWindowResize() {
    windowHalf.x = window.innerWidth / 2;
    windowHalf.y = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    updateLayoutForScreen();
  }

  // --- Mouse & Pointer Events ---
  function onMouseMove(event) {
    mouse.targetX = (event.clientX - windowHalf.x) / windowHalf.x;
    mouse.targetY = (event.clientY - windowHalf.y) / windowHalf.y;
  }

  function onTouchMove(event) {
    if (event.touches.length > 0) {
      mouse.targetX = (event.touches[0].clientX - windowHalf.x) / windowHalf.x;
      mouse.targetY = (event.touches[0].clientY - windowHalf.y) / windowHalf.y;
    }
  }

  // Spawn 3D Shockwave Ring
  function spawnShockwave(clientX, clientY) {
    const shockGeo = new THREE.RingGeometry(0.2, 0.4, 32);
    const shockMat = new THREE.MeshBasicMaterial({
      color: config.colors.cyan,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const shockMesh = new THREE.Mesh(shockGeo, shockMat);

    // Position ring in front of camera
    const vec = new THREE.Vector3(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1,
      0.5
    );
    vec.unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const distance = 15;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    shockMesh.position.copy(pos);
    shockMesh.lookAt(camera.position);

    shockMesh.userData = {
      scale: 1,
      opacity: 0.9,
      maxLife: 0.8,
      age: 0
    };

    globalGroup.add(shockMesh);
    shockwaves.push(shockMesh);
  }

  // Click / Tap Particle Pulse & Shockwave
  function onPointerClick(event) {
    spawnShockwave(event.clientX || window.innerWidth / 2, event.clientY || window.innerHeight / 2);

    if (typeof gsap !== 'undefined') {
      // Light burst
      gsap.to(pointLight1, { intensity: 7, duration: 0.15, yoyo: true, repeat: 1 });
      gsap.to(pointLight2, { intensity: 8, duration: 0.15, yoyo: true, repeat: 1 });

      // Core spin burst
      if (heroCore) {
        gsap.to(heroCore.rotation, {
          y: heroCore.rotation.y + Math.PI,
          x: heroCore.rotation.x + Math.PI / 2,
          duration: 1.2,
          ease: 'power3.out'
        });
      }
    }
  }

  // --- Section Synchronization & Camera Hyper-Warp Tweening ---
  function updateActiveSection(index) {
    if (index === currentSection && typeof gsap !== 'undefined') return;
    currentSection = index;

    const preset = cameraPresets[index] || cameraPresets[0];

    // Visibility toggling for active section performance
    heroGroup.visible = (index === 0);
    projectsGroup.visible = (index === 1);
    aboutGroup.visible = (index === 2);
    skillsGroup.visible = (index === 3);
    contactGroup.visible = (index === 4);

    if (typeof gsap !== 'undefined') {
      // Warp speed pulse on particles and camera field of view
      gsap.to(warpFactor, {
        val: 3.5,
        duration: 0.35,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });

      gsap.to(camera, {
        fov: preset.fov + 4,
        duration: 0.45,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
        onUpdate: () => camera.updateProjectionMatrix()
      });

      // Smooth Camera Flight
      gsap.to(camera.position, {
        x: preset.pos.x,
        y: preset.pos.y,
        z: preset.pos.z,
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate: function () {
          camera.lookAt(preset.target.x, preset.target.y, preset.target.z);
        }
      });

      // Animate Light colors & intensities based on section mood
      if (index === 0) { // Home: Vibrant Blue & Cyan
        gsap.to(pointLight1.color, { r: 0, g: 0.94, b: 1, duration: 1 });
        gsap.to(pointLight2.color, { r: 0.06, g: 0.2, b: 1, duration: 1 });
      } else if (index === 1) { // Projects: High-tech Cyan Focus
        gsap.to(pointLight1.color, { r: 0, g: 0.94, b: 1, duration: 1 });
        gsap.to(pointLight2.color, { r: 0.35, g: 0.47, b: 1, duration: 1 });
      } else if (index === 2) { // About: Deep Electric Indigo
        gsap.to(pointLight1.color, { r: 0.35, g: 0.47, b: 1, duration: 1 });
        gsap.to(pointLight2.color, { r: 0.54, g: 0.17, b: 0.88, duration: 1 });
      } else if (index === 3) { // Skills: Multi-Spectral Constellation
        gsap.to(pointLight1.color, { r: 0, g: 0.82, b: 1, duration: 1 });
        gsap.to(pointLight2.color, { r: 0.54, g: 0.17, b: 0.88, duration: 1 });
      } else if (index === 4) { // Contact: Energetic Neon Beacon
        gsap.to(pointLight1.color, { r: 0.06, g: 0.2, b: 1, duration: 1 });
        gsap.to(pointLight2.color, { r: 0, g: 0.94, b: 1, duration: 1 });
      }
    } else {
      camera.position.set(preset.pos.x, preset.pos.y, preset.pos.z);
      camera.lookAt(preset.target.x, preset.target.y, preset.target.z);
    }
  }

  // --- Listen to navigation clicks & custom triggers ---
  function setupSectionListeners() {
    // Listen to Side Navigation & Outer Navigation
    const navItems = document.querySelectorAll('.side-nav li, .outer-nav li');
    navItems.forEach((item) => {
      item.addEventListener('click', function () {
        const parent = this.parentElement;
        const index = Array.from(parent.children).indexOf(this);
        if (index !== -1) {
          updateActiveSection(index);
        }
      });
    });

    // Listen to in-page Jump buttons [data-goto]
    const gotoLinks = document.querySelectorAll('[data-goto]');
    gotoLinks.forEach((link) => {
      link.addEventListener('click', function () {
        const targetSection = parseInt(this.getAttribute('data-goto'), 10);
        if (!isNaN(targetSection)) {
          updateActiveSection(targetSection);
        }
      });
    });

    // Listen to CTA Buttons
    const ctaButtons = document.querySelectorAll('.cta');
    ctaButtons.forEach((btn) => {
      btn.addEventListener('click', function () {
        // Last section is Contact (index 4)
        updateActiveSection(4);
      });
    });

    // Mutation observer on .side-nav to capture scroll/swipe/keyboard updates from functions.js
    const sideNav = document.querySelector('.side-nav');
    if (sideNav) {
      const observer = new MutationObserver(function () {
        const activeLi = sideNav.querySelector('.is-active');
        if (activeLi) {
          const index = Array.from(sideNav.children).indexOf(activeLi);
          if (index !== -1 && index !== currentSection) {
            updateActiveSection(index);
          }
        }
      });
      observer.observe(sideNav, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
  }

  // --- Interactive UI Hover Effects hooked into 3D ---
  function setupUIHoverInteractions() {
    // Project cards hover
    const projectCards = document.querySelectorAll('.project');
    projectCards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        if (typeof gsap !== 'undefined') {
          gsap.to(pointLight1, { intensity: 5.5, duration: 0.3 });
          projectsGroup.children.forEach((prism) => {
            gsap.to(prism.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.4 });
          });
        }
      });
      card.addEventListener('mouseleave', () => {
        if (typeof gsap !== 'undefined') {
          gsap.to(pointLight1, { intensity: 3, duration: 0.4 });
          projectsGroup.children.forEach((prism) => {
            gsap.to(prism.scale, { x: 1, y: 1, z: 1, duration: 0.4 });
          });
        }
      });
    });

    // Skill Chips hover
    const skillChips = document.querySelectorAll('.chip');
    skillChips.forEach((chip) => {
      chip.addEventListener('mouseenter', () => {
        if (typeof gsap !== 'undefined') {
          gsap.to(pointLight3, { intensity: 5, duration: 0.2 });
          skillsNodes.forEach((node) => {
            gsap.to(node.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.3 });
          });
        }
      });
      chip.addEventListener('mouseleave', () => {
        if (typeof gsap !== 'undefined') {
          gsap.to(pointLight3, { intensity: 2.5, duration: 0.3 });
          skillsNodes.forEach((node) => {
            gsap.to(node.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
          });
        }
      });
    });
  }

  // --- Animation Loop ---
  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Mouse Lerp for smooth parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Dynamic lights follow cursor
    pointLight1.position.x = 10 + mouse.x * 6;
    pointLight1.position.y = 10 - mouse.y * 6;
    pointLight2.position.x = -15 - mouse.x * 4;
    pointLight2.position.y = -10 + mouse.y * 4;

    // 1. Animate Global Particles & Floating Drifts with Warp Multiplier
    if (particleSystem) {
      particleSystem.rotation.y = (elapsedTime * 0.02 * warpFactor.val) + mouse.x * 0.1;
      particleSystem.rotation.x = mouse.y * 0.08;
    }

    // 2. Animate Cyber Grid Scroll with Warp Factor
    if (cyberGrid) {
      cyberGrid.position.z = (elapsedTime * 2 * warpFactor.val) % 3;
      cyberGrid.rotation.y = mouse.x * 0.03;
    }

    // Process & Animate 3D Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.userData.age += delta;
      const progress = sw.userData.age / sw.userData.maxLife;

      if (progress >= 1) {
        globalGroup.remove(sw);
        sw.geometry.dispose();
        sw.material.dispose();
        shockwaves.splice(i, 1);
      } else {
        const currentScale = 1 + progress * 24;
        sw.scale.set(currentScale, currentScale, 1);
        sw.material.opacity = (1 - progress) * 0.85;
      }
    }

    // 3. Animate Hero Core Objects (Section 0)
    if (heroGroup.visible) {
      if (heroCore) {
        heroCore.rotation.y += 0.012;
        heroCore.rotation.x += 0.008;
      }
      if (heroOuterMesh) {
        heroOuterMesh.rotation.y -= 0.006;
        heroOuterMesh.rotation.z += 0.004;
      }
      if (heroRing1) {
        heroRing1.rotation.z += 0.018;
        heroRing1.rotation.x = Math.sin(elapsedTime * 0.5) * 0.4;
      }
      if (heroRing2) {
        heroRing2.rotation.y -= 0.014;
        heroRing2.rotation.z = Math.cos(elapsedTime * 0.5) * 0.4;
      }

      // Orbiting Satellites
      heroOrbiters.forEach((orb) => {
        orb.userData.angle += orb.userData.speed;
        const rad = orb.userData.radius;
        orb.position.x = Math.cos(orb.userData.angle) * rad;
        orb.position.y = Math.sin(orb.userData.angle) * rad * Math.cos(orb.userData.tilt);
        orb.position.z = Math.sin(orb.userData.angle) * rad * Math.sin(orb.userData.tilt);
        orb.rotation.x += 0.02;
        orb.rotation.y += 0.03;
      });

      // Mouse Parallax on Hero group
      heroGroup.rotation.y = mouse.x * 0.4;
      heroGroup.rotation.x = -mouse.y * 0.4;
    }

    // 4. Animate Projects Prisms (Section 1)
    if (projectsGroup.visible) {
      projectPrisms.forEach((prism, idx) => {
        prism.position.y = prism.userData.baseY + Math.sin(elapsedTime * 1.5 + idx) * 0.35;
        prism.rotation.y += prism.userData.rotSpeed;
      });
      projectsGroup.rotation.y = mouse.x * 0.2;
    }

    // 5. Animate About Helix (Section 2)
    if (aboutGroup.visible) {
      aboutGroup.rotation.y = elapsedTime * 0.4 + mouse.x * 0.3;
      aboutGroup.rotation.z = Math.sin(elapsedTime * 0.5) * 0.1;
    }

    // 6. Animate Skills Galaxy (Section 3)
    if (skillsGroup.visible) {
      skillsGroup.rotation.y = elapsedTime * 0.15 + mouse.x * 0.2;
      skillsNodes.forEach((node) => {
        node.rotation.x += 0.015;
        node.rotation.y += 0.02;
      });
    }

    // 7. Animate Contact Beacon (Section 4)
    if (contactGroup.visible) {
      contactRings.forEach((ring) => {
        const pulse = Math.sin(elapsedTime * 2 + ring.userData.index * 0.6) * 0.08;
        ring.scale.set(ring.userData.baseScale + pulse, ring.userData.baseScale + pulse, 1);
        ring.rotation.z += (ring.userData.index % 2 === 0 ? 0.005 : -0.005);
      });
    }

    // Render Scene
    renderer.render(scene, camera);
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export globally if needed
  window.Portfolio3D = {
    setSection: updateActiveSection,
    getScene: () => scene,
    getCamera: () => camera
  };
})();
