/**
 * MoodBloom (무드블룸) - 아기자기한 3D 감정 꽃 & 디오라마 정원 렌더링 엔진
 * Powered by Three.js (WebGL) + Procedural Cute 2D Canvas Fallback
 * 
 * 8대 아기자기한 감정 꽃 요정 캐릭터 (Joy, Calm, Anxiety, Sadness, Anger, Burnout, Gratitude, Hope)
 * 퐁실퐁실한 파스텔 클레이 질감, 깜찍한 표정 및 공전하는 꼬마 별빛·이슬 요정
 * 미니어처 동화섬 부유 정원(Pastel Floating Island Diorama)과 팔랑거리는 나비 씬 구현
 */

class MoodBloom3DEngine {
  constructor() {
    this.singleViewer = {
      scene: null,
      camera: null,
      renderer: null,
      currentMesh: null,
      particleSystem: null,
      coreLight: null,
      animId: null,
      isWireframe: false,
      container: null,
      currentConfig: null
    };

    this.gardenViewer = {
      scene: null,
      camera: null,
      renderer: null,
      gardenObjects: [],
      particles: null,
      butterflies: [],
      animId: null,
      isAutoOrbit: true,
      orbitAngle: 0,
      container: null,
      raycaster: null,
      mouse: null,
      selectedObj: null,
      islandMesh: null,
      ambientLight: null,
      sunLight: null
    };

    this.isNightMode = false;
  }

  get hasThree() {
    return typeof THREE !== 'undefined';
  }

  // 8대 아기자기한 감정 꽃 캐릭터 메타데이터 (Cute Pastel Botanical Companions)
  getEmotionConfig(emotionType) {
    const configs = {
      joy: {
        name: '기쁨 · 해바라기 뽀송이',
        flowerName: '해바라기 뽀송이',
        emoji: '🌻',
        color: 0xFBBF24,
        hex: '#FBBF24',
        accentColor: 0xF59E0B,
        pastelHex: '#FEF08A',
        badge: '행복 가득',
        description: '황금빛 둥근 꽃잎과 사랑스러운 분홍 볼터치를 한 햇살 해바라기 요정'
      },
      calm: {
        name: '평온 · 모찌 클로버',
        flowerName: '모찌 클로버',
        emoji: '🍀',
        color: 0x34D399,
        hex: '#10B981',
        accentColor: 0x059669,
        pastelHex: '#A7F3D0',
        badge: '마음 쉼표',
        description: '퐁실퐁실 옥빛 네잎클로버와 또르륵 굴러가는 아침 이슬방울'
      },
      anxiety: {
        name: '불안 · 구름 라일락',
        flowerName: '구름 라일락',
        emoji: '💜',
        color: 0xA78BFA,
        hex: '#8B5CF6',
        accentColor: 0x7C3AED,
        pastelHex: '#DDD6FE',
        badge: '토닥토닥',
        description: '보랏빛 솜사탕 구름 속에 쏙 안겨 고개를 갸우뚱하는 아기 꽃'
      },
      sadness: {
        name: '슬픔 · 물방울 물망초',
        flowerName: '물방울 물망초',
        emoji: '💧',
        color: 0x60A5FA,
        hex: '#3B82F6',
        accentColor: 0x2563EB,
        pastelHex: '#BFDBFE',
        badge: '촉촉한 위로',
        description: '말랑한 사파이어 물방울 요정과 포근하게 감싸주는 마시멜로 구름'
      },
      anger: {
        name: '분노 · 불꽃 튤립 삐약이',
        flowerName: '불꽃 튤립 삐약이',
        emoji: '🌷',
        color: 0xF87171,
        hex: '#EF4444',
        accentColor: 0xDC2626,
        pastelHex: '#FECACA',
        badge: '볼빵빵 꼬마',
        description: '볼을 빵빵하게 부풀린 귀여운 꼬마 불꽃 요정과 퐁퐁 튀는 팝콘 스파크'
      },
      burnout: {
        name: '번아웃 · 잠자는 민들레',
        flowerName: '잠자는 민들레',
        emoji: '☁️',
        color: 0x94A3B8,
        hex: '#64748B',
        accentColor: 0x475569,
        pastelHex: '#E2E8F0',
        badge: '쿨쿨 휴식',
        description: '폭신한 구름 베개 베고 새근새근 낮잠 자는 민들레 홀씨 요정'
      },
      gratitude: {
        name: '감사 · 하트 로즈베리',
        flowerName: '하트 로즈베리',
        emoji: '💖',
        color: 0xF472B6,
        hex: '#EC4899',
        accentColor: 0xDB2777,
        pastelHex: '#FBCFE8',
        badge: '다정한 온기',
        description: '사랑스러운 하트 꽃잎을 한아름 안고 핑크빛 오라를 뿜는 장미 요정'
      },
      hope: {
        name: '희망 · 별빛 프리지아',
        flowerName: '별빛 프리지아',
        emoji: '✨',
        color: 0x38BDF8,
        hex: '#06B6D4',
        accentColor: 0x0284C7,
        pastelHex: '#BAE6FD',
        badge: '반짝이는 내일',
        description: '파스텔 무지개 링을 두르고 춤추는 레몬빛 별꽃과 꼬마 황금별'
      }
    };

    return configs[emotionType] || configs.calm;
  }

  // =========================================================================
  // 1. 단일 감정 꽃 3D 뷰어 (Single Cute Flower Character Preview)
  // =========================================================================
  initSingleViewer(containerId, emotionType = 'calm') {
    const container = document.getElementById(containerId);
    if (!container) return;
    this.singleViewer.container = container;

    if (!this.hasThree) {
      this.render2DFallback(container, emotionType);
      return;
    }

    if (this.singleViewer.animId) cancelAnimationFrame(this.singleViewer.animId);
    container.innerHTML = '';

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.5, 7.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 따스하고 화사한 스튜디오 조명 (Soft Warm Clay Lighting)
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xfce7f3, 0.9);
    fillLight.position.set(-5, -2, 4);
    scene.add(fillLight);

    const coreLight = new THREE.PointLight(0xffffff, 1.8, 8);
    coreLight.position.set(0, 0, 1.5);
    scene.add(coreLight);

    this.singleViewer.scene = scene;
    this.singleViewer.camera = camera;
    this.singleViewer.renderer = renderer;
    this.singleViewer.coreLight = coreLight;

    // 꽃 캐릭터 생성
    this.loadEmotionSculpture(emotionType);

    // 마우스 드래그로 꽃 요정 둘러보기 인터랙션
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const dom = renderer.domElement;

    const onPointerDown = (e) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e) => {
      if (!isDragging || !this.singleViewer.currentMesh) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      this.singleViewer.currentMesh.rotation.y += dx * 0.012;
      this.singleViewer.currentMesh.rotation.x += dy * 0.008;
      prevMouse = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = () => { isDragging = false; };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 귀여운 통통 튀는 젤리 모션 애니메이션 루프
    let clock = 0;
    const animate = () => {
      this.singleViewer.animId = requestAnimationFrame(animate);
      clock += 0.025;

      const mesh = this.singleViewer.currentMesh;
      if (mesh) {
        if (!isDragging) {
          mesh.rotation.y += 0.008;
          // 귀여운 갸우뚱 모션 (Cute Gentle Wobble)
          mesh.rotation.z = Math.sin(clock * 1.8) * 0.08;
        }
        // 통통 튀는 아기자기한 바운스 (Cute Bouncy Float)
        const bounce = Math.sin(clock * 2.5) * 0.16;
        mesh.position.y = bounce;

        // 숨쉬듯 몽글몽글 펄스 (Breathing Squeeze & Stretch)
        const scalePulseY = 1 + Math.sin(clock * 2.5) * 0.04;
        const scalePulseXZ = 1 - Math.sin(clock * 2.5) * 0.02;
        mesh.scale.set(scalePulseXZ, scalePulseY, scalePulseXZ);

        // 공전하는 별빛 위성 & 궤도 링 회전
        if (mesh.userData && mesh.userData.orbitGroup) {
          mesh.userData.orbitGroup.rotation.y += 0.03;
        }
        if (mesh.userData && mesh.userData.cloudGroup) {
          mesh.userData.cloudGroup.rotation.y -= 0.01;
        }
      }

      if (this.singleViewer.particleSystem) {
        this.singleViewer.particleSystem.rotation.y += 0.003;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 반응형 리사이즈 대응
    window.addEventListener('resize', () => {
      if (!container || !this.singleViewer.renderer) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    });
  }

  // 부드럽고 매끈한 파스텔 클레이 재질 헬퍼 (Pastel Clay & Gummy Material)
  makeCuteClayMat(colorHex, emissiveHex = 0x000000, roughness = 0.35, clearcoat = 0.6) {
    return new THREE.MeshPhysicalMaterial({
      color: colorHex,
      emissive: emissiveHex,
      emissiveIntensity: 0.2,
      roughness: roughness,
      metalness: 0.05,
      clearcoat: clearcoat,
      clearcoatRoughness: 0.2,
      wireframe: this.singleViewer.isWireframe
    });
  }

  // 8대 아기자기한 감정 꽃 요정 조형 빌더 (Cute Character Mesh Builder)
  buildCuteObject(emotionType, scale = 1.0, isGarden = false) {
    const group = new THREE.Group();
    const cfg = this.getEmotionConfig(emotionType);

    // 귀여운 눈과 분홍 볼터치를 만들어주는 헬퍼
    const addCuteFace = (targetGroup, yOffset = 0, zOffset = 0.95 * scale, eyeSpread = 0.32 * scale) => {
      const faceGroup = new THREE.Group();

      // 깜찍한 까만 눈망울 2개 (반짝이는 하이라이트 포함)
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1F2937 });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

      [-eyeSpread, eyeSpread].forEach(x => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08 * scale, 16, 16), eyeMat);
        eye.position.set(x, yOffset + 0.05 * scale, zOffset);
        eye.scale.set(1, 1.25, 0.4);

        // 초롱초롱한 눈 하이라이트
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.03 * scale, 8, 8), pupilMat);
        pupil.position.set(x + 0.02 * scale, yOffset + 0.09 * scale, zOffset + 0.04 * scale);

        faceGroup.add(eye, pupil);
      });

      // 발그레한 분홍 볼터치 2개
      const blushMat = new THREE.MeshBasicMaterial({ color: 0xF472B6, transparent: true, opacity: 0.75 });
      [-eyeSpread * 1.35, eyeSpread * 1.35].forEach(x => {
        const blush = new THREE.Mesh(new THREE.SphereGeometry(0.09 * scale, 12, 12), blushMat);
        blush.scale.set(1.4, 0.6, 0.2);
        blush.position.set(x, yOffset - 0.08 * scale, zOffset + 0.02 * scale);
        faceGroup.add(blush);
      });

      // 앙증맞은 스마일 입 (귀여운 반원형 링)
      const mouthMat = new THREE.MeshBasicMaterial({ color: 0x374151 });
      const mouthGeom = new THREE.TorusGeometry(0.07 * scale, 0.02 * scale, 8, 16, Math.PI);
      const mouth = new THREE.Mesh(mouthGeom, mouthMat);
      mouth.position.set(0, yOffset - 0.06 * scale, zOffset + 0.02 * scale);
      mouth.rotation.x = Math.PI;
      faceGroup.add(mouth);

      targetGroup.add(faceGroup);
    };

    switch (emotionType) {
      case 'joy': {
        // [기쁨]: 해바라기 뽀송이 🌻 - 방긋 웃는 해님 꽃잎과 반짝이 별
        const headGroup = new THREE.Group();
        const coreMat = this.makeCuteClayMat(0xFBBF24, 0xF59E0B, 0.25, 0.8);
        const core = new THREE.Mesh(new THREE.SphereGeometry(1.05 * scale, 32, 32), coreMat);
        headGroup.add(core);

        // 8장의 통통하고 동글동글한 해바라기 꽃잎
        const petalMat = this.makeCuteClayMat(0xFEF08A, 0xFBBF24, 0.35, 0.5);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.42 * scale, 16, 16), petalMat);
          petal.scale.set(1.2, 0.5, 0.7);
          petal.position.set(Math.cos(angle) * 1.35 * scale, Math.sin(angle) * 1.35 * scale, -0.05 * scale);
          petal.rotation.z = angle;
          headGroup.add(petal);
        }

        addCuteFace(headGroup, 0, 1.02 * scale, 0.32 * scale);
        group.add(headGroup);

        // 주변을 신나게 도는 궤도 링 & 꼬마 반짝이 별
        const orbitGroup = new THREE.Group();
        const ringMat = this.makeCuteClayMat(0xFDE68A, 0xF59E0B, 0.2, 0.4);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.85 * scale, 0.035 * scale, 16, 64), ringMat);
        ring.rotation.x = Math.PI * 0.38;
        orbitGroup.add(ring);

        const starMat = this.makeCuteClayMat(0xFFFBEB, 0xFBBF24, 0.1, 0.9);
        const starGeom = new THREE.OctahedronGeometry(0.24 * scale);
        const star1 = new THREE.Mesh(starGeom, starMat);
        star1.position.set(1.85 * scale, 0, 0);
        const star2 = new THREE.Mesh(starGeom, starMat);
        star2.position.set(-1.85 * scale, 0, 0);
        orbitGroup.add(star1, star2);

        group.add(orbitGroup);
        group.userData.orbitGroup = orbitGroup;
        break;
      }

      case 'calm': {
        // [평온]: 모찌 클로버 🍀 - 포근한 옥빛 새싹 모찌 & 이슬방울
        const mochiGroup = new THREE.Group();
        const mochiMat = this.makeCuteClayMat(0x34D399, 0x059669, 0.3, 0.7);
        const mochiGeom = new THREE.SphereGeometry(1.2 * scale, 32, 32);
        mochiGeom.scale(1.15, 0.88, 1.15);
        const mochi = new THREE.Mesh(mochiGeom, mochiMat);
        mochiGroup.add(mochi);

        // 머리 위에 돋아난 아기 네잎클로버 새싹
        const sproutGroup = new THREE.Group();
        const stemMat = this.makeCuteClayMat(0x10B981, 0x047857, 0.4, 0.5);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * scale, 0.05 * scale, 0.45 * scale, 8), stemMat);
        stem.position.set(0, 1.15 * scale, 0);
        sproutGroup.add(stem);

        const leafMat = this.makeCuteClayMat(0x6EE7B7, 0x10B981, 0.3, 0.6);
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.25 * scale, 16, 16), leafMat);
          leaf.scale.set(1.2, 0.35, 0.75);
          leaf.position.set(Math.cos(angle) * 0.22 * scale, 1.35 * scale, Math.sin(angle) * 0.22 * scale);
          leaf.rotation.y = angle;
          leaf.rotation.x = 0.25;
          sproutGroup.add(leaf);
        }
        mochiGroup.add(sproutGroup);

        addCuteFace(mochiGroup, 0, 1.15 * scale, 0.3 * scale);
        group.add(mochiGroup);

        // 주변을 평화롭게 공전하는 맑은 이슬방울 3개
        const orbitGroup = new THREE.Group();
        const dewMat = new THREE.MeshPhysicalMaterial({
          color: 0xE6FFFA,
          roughness: 0.1,
          metalness: 0.1,
          transmission: 0.7,
          transparent: true,
          opacity: 0.9
        });
        for (let i = 0; i < 3; i++) {
          const dew = new THREE.Mesh(new THREE.SphereGeometry(0.18 * scale, 16, 16), dewMat);
          const angle = (i / 3) * Math.PI * 2;
          dew.position.set(Math.cos(angle) * 1.7 * scale, Math.sin(i * 1.4) * 0.35 * scale, Math.sin(angle) * 1.7 * scale);
          orbitGroup.add(dew);
        }
        group.add(orbitGroup);
        group.userData.orbitGroup = orbitGroup;
        break;
      }

      case 'anxiety': {
        // [불안]: 구름 라일락 💜 - 몽글몽글 솜사탕 구름 속 토닥토닥 꽃
        const cloudGroup = new THREE.Group();
        const cloudMat = this.makeCuteClayMat(0xA78BFA, 0x7C3AED, 0.35, 0.6);
        const cloudPuffs = [
          { r: 0.88, x: 0, y: 0, z: 0 },
          { r: 0.62, x: 0.58 * scale, y: 0.2 * scale, z: 0 },
          { r: 0.64, x: -0.58 * scale, y: 0.15 * scale, z: 0.1 * scale },
          { r: 0.55, x: 0.1 * scale, y: 0.62 * scale, z: -0.1 * scale },
          { r: 0.52, x: -0.1 * scale, y: -0.52 * scale, z: 0.12 * scale }
        ];
        cloudPuffs.forEach(p => {
          const sp = new THREE.Mesh(new THREE.SphereGeometry(p.r * scale, 24, 24), cloudMat);
          sp.position.set(p.x, p.y, p.z);
          cloudGroup.add(sp);
        });

        // 살포시 꽂혀 있는 앙증맞은 라일락 미니 꽃
        const miniFlowerMat = this.makeCuteClayMat(0xDDD6FE, 0x8B5CF6, 0.25, 0.5);
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          const miniPetal = new THREE.Mesh(new THREE.SphereGeometry(0.18 * scale, 12, 12), miniFlowerMat);
          miniPetal.scale.set(1.1, 0.5, 0.8);
          miniPetal.position.set(0.55 * scale + Math.cos(a) * 0.2 * scale, 0.7 * scale + Math.sin(a) * 0.2 * scale, 0.45 * scale);
          cloudGroup.add(miniPetal);
        }

        addCuteFace(cloudGroup, 0, 0.92 * scale, 0.28 * scale);
        group.add(cloudGroup);
        group.userData.cloudGroup = cloudGroup;

        // 기울어진 파스텔 토성 링 & 비즈
        const ringMat = this.makeCuteClayMat(0xC4B5FD, 0x8B5CF6, 0.25, 0.5);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.88 * scale, 0.04 * scale, 16, 64), ringMat);
        ring.rotation.x = Math.PI * 0.42;
        ring.rotation.y = Math.PI * 0.15;
        group.add(ring);

        const beadGroup = new THREE.Group();
        const beadMat = this.makeCuteClayMat(0xFDF4FF, 0x8B5CF6, 0.1, 0.7);
        for (let i = 0; i < 3; i++) {
          const bead = new THREE.Mesh(new THREE.SphereGeometry(0.16 * scale, 16, 16), beadMat);
          const a = (i / 3) * Math.PI * 2;
          bead.position.set(Math.cos(a) * 1.88 * scale, Math.sin(a) * 0.65 * scale, Math.sin(a) * 1.88 * scale);
          beadGroup.add(bead);
        }
        group.add(beadGroup);
        group.userData.orbitGroup = beadGroup;
        break;
      }

      case 'sadness': {
        // [슬픔]: 물방울 물망초 💧 - 포근한 구름 쿠션 위의 투명 사파이어 물방울 요정
        const dropGroup = new THREE.Group();
        const dropMat = new THREE.MeshPhysicalMaterial({
          color: 0x60A5FA,
          roughness: 0.15,
          metalness: 0.1,
          transmission: 0.6,
          transparent: true,
          opacity: 0.92,
          clearcoat: 0.9
        });

        const dropBase = new THREE.Mesh(new THREE.SphereGeometry(1.02 * scale, 32, 32), dropMat);
        dropBase.position.y = -0.15 * scale;
        dropGroup.add(dropBase);

        const dropTip = new THREE.Mesh(new THREE.ConeGeometry(0.85 * scale, 1.25 * scale, 32), dropMat);
        dropTip.position.y = 0.5 * scale;
        dropGroup.add(dropTip);

        addCuteFace(dropGroup, -0.15 * scale, 0.98 * scale, 0.28 * scale);
        group.add(dropGroup);

        // 아래를 부드럽게 받쳐주는 폭신한 하얀 마시멜로 구름 쿠션
        const cushionGroup = new THREE.Group();
        const puffMat = this.makeCuteClayMat(0xF8FAFC, 0x93C5FD, 0.5, 0.3);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const puff = new THREE.Mesh(new THREE.SphereGeometry(0.38 * scale, 16, 16), puffMat);
          puff.position.set(Math.cos(a) * 0.8 * scale, -1.05 * scale, Math.sin(a) * 0.8 * scale);
          cushionGroup.add(puff);
        }
        group.add(cushionGroup);

        // 주변을 감싸주는 촉촉한 이슬 링
        const orbitGroup = new THREE.Group();
        const dewMat = this.makeCuteClayMat(0xBFDBFE, 0x3B82F6, 0.1, 0.8);
        for (let i = 0; i < 3; i++) {
          const dew = new THREE.Mesh(new THREE.SphereGeometry(0.18 * scale, 16, 16), dewMat);
          const a = (i / 3) * Math.PI * 2;
          dew.position.set(Math.cos(a) * 1.65 * scale, (i - 1) * 0.45 * scale, Math.sin(a) * 1.65 * scale);
          orbitGroup.add(dew);
        }
        group.add(orbitGroup);
        group.userData.orbitGroup = orbitGroup;
        break;
      }

      case 'anger': {
        // [분노]: 불꽃 튤립 삐약이 🌷🔥 - 볼빵빵 귀여운 꼬마 불꽃 요정
        const flameCharGroup = new THREE.Group();
        const bodyMat = this.makeCuteClayMat(0xF87171, 0xDC2626, 0.25, 0.8);
        const body = new THREE.Mesh(new THREE.SphereGeometry(1.08 * scale, 32, 32), bodyMat);
        flameCharGroup.add(body);

        // 머리 위의 앙증맞은 3갈래 튤립 불꽃 볏
        const crownMat = this.makeCuteClayMat(0xFB923C, 0xEA580C, 0.25, 0.7);
        const crown1 = new THREE.Mesh(new THREE.ConeGeometry(0.32 * scale, 0.65 * scale, 16), crownMat);
        crown1.position.set(0, 1.25 * scale, 0);
        const crown2 = new THREE.Mesh(new THREE.ConeGeometry(0.26 * scale, 0.5 * scale, 16), crownMat);
        crown2.position.set(0.32 * scale, 1.12 * scale, 0);
        crown2.rotation.z = -0.3;
        const crown3 = new THREE.Mesh(new THREE.ConeGeometry(0.26 * scale, 0.5 * scale, 16), crownMat);
        crown3.position.set(-0.32 * scale, 1.12 * scale, 0);
        crown3.rotation.z = 0.3;
        flameCharGroup.add(crown1, crown2, crown3);

        addCuteFace(flameCharGroup, 0, 1.05 * scale, 0.3 * scale);
        group.add(flameCharGroup);

        // 팝콘처럼 퐁퐁 튀는 4개의 황금 스파크 구슬
        const sparkGroup = new THREE.Group();
        const sparkMat = this.makeCuteClayMat(0xFDE047, 0xF97316, 0.1, 0.8);
        for (let i = 0; i < 4; i++) {
          const sp = new THREE.Mesh(new THREE.SphereGeometry(0.18 * scale, 16, 16), sparkMat);
          const a = (i / 4) * Math.PI * 2;
          sp.position.set(Math.cos(a) * 1.7 * scale, (i % 2 === 0 ? 0.35 : -0.35) * scale, Math.sin(a) * 1.7 * scale);
          sparkGroup.add(sp);
        }
        group.add(sparkGroup);
        group.userData.orbitGroup = sparkGroup;
        break;
      }

      case 'burnout': {
        // [번아웃]: 잠자는 민들레 ☁️ - 구름 베개 위의 새근새근 낮잠 요정
        const sleepyGroup = new THREE.Group();
        const puffBodyMat = this.makeCuteClayMat(0xCBD5E1, 0x64748B, 0.55, 0.3);
        const puffBody = new THREE.Mesh(new THREE.SphereGeometry(1.15 * scale, 32, 32), puffBodyMat);
        puffBody.scale.set(1.2, 0.8, 1.1);
        puffBody.position.y = 0.15 * scale;
        sleepyGroup.add(puffBody);

        // 쿨쿨 감긴 눈 (귀여운 활모양 눈썹 형태)
        const closedEyeMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
        [-0.3 * scale, 0.3 * scale].forEach(x => {
          const cEye = new THREE.Mesh(new THREE.TorusGeometry(0.08 * scale, 0.02 * scale, 8, 16, Math.PI), closedEyeMat);
          cEye.position.set(x, 0.18 * scale, 1.1 * scale);
          sleepyGroup.add(cEye);
        });

        // 뽀송뽀송 연분홍 볼터치
        const blushMat = new THREE.MeshBasicMaterial({ color: 0xF472B6, transparent: true, opacity: 0.6 });
        [-0.45 * scale, 0.45 * scale].forEach(x => {
          const bl = new THREE.Mesh(new THREE.SphereGeometry(0.1 * scale, 12, 12), blushMat);
          bl.scale.set(1.3, 0.6, 0.2);
          bl.position.set(x, 0.08 * scale, 1.12 * scale);
          sleepyGroup.add(bl);
        });

        group.add(sleepyGroup);

        // 몽돌 아래의 보들보들 하얀 구름 베개
        const pillowGroup = new THREE.Group();
        const pillowMat = this.makeCuteClayMat(0xF8FAFC, 0x94A3B8, 0.6, 0.2);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const p = new THREE.Mesh(new THREE.SphereGeometry(0.42 * scale, 16, 16), pillowMat);
          p.position.set(Math.cos(a) * 0.75 * scale, -0.6 * scale, Math.sin(a) * 0.75 * scale);
          pillowGroup.add(p);
        }
        group.add(pillowGroup);

        // 피어오르는 작고 몽환적인 Zzz 수면 방울 2개
        const bubbleGroup = new THREE.Group();
        const bubMat = new THREE.MeshPhysicalMaterial({
          color: 0xE2E8F0,
          roughness: 0.1,
          transmission: 0.8,
          transparent: true,
          opacity: 0.85
        });
        const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.22 * scale, 16, 16), bubMat);
        b1.position.set(0.35 * scale, 1.15 * scale, 0.2 * scale);
        const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.15 * scale, 16, 16), bubMat);
        b2.position.set(0.65 * scale, 1.55 * scale, 0.3 * scale);
        bubbleGroup.add(b1, b2);
        group.add(bubbleGroup);
        group.userData.cloudGroup = bubbleGroup;
        break;
      }

      case 'gratitude': {
        // [감사]: 하트 로즈베리 💖 - 다정하게 피어난 핑크 로즈 하트 튤립
        const heartGroup = new THREE.Group();
        const heartMat = this.makeCuteClayMat(0xF472B6, 0xDB2777, 0.2, 0.8);
        const core = new THREE.Mesh(new THREE.SphereGeometry(0.98 * scale, 32, 32), heartMat);
        heartGroup.add(core);

        // 5장의 둥글둥글 핑크 튤립 꽃잎 날개
        const petalMat = this.makeCuteClayMat(0xFBCFE8, 0xEC4899, 0.3, 0.6);
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2;
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.55 * scale, 16, 16), petalMat);
          petal.scale.set(0.9, 1.35, 0.45);
          petal.position.set(Math.cos(a) * 0.75 * scale, 0.1 * scale, Math.sin(a) * 0.75 * scale);
          petal.rotation.y = -a;
          petal.rotation.x = 0.25;
          heartGroup.add(petal);
        }

        addCuteFace(heartGroup, 0, 0.95 * scale, 0.3 * scale);
        group.add(heartGroup);

        // 핑크빛 오라 링 & 하트 젬 위성
        const orbitGroup = new THREE.Group();
        const ringMat = this.makeCuteClayMat(0xFDE8E8, 0xEC4899, 0.2, 0.5);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.82 * scale, 0.035 * scale, 16, 64), ringMat);
        ring.rotation.x = Math.PI * 0.35;
        orbitGroup.add(ring);

        const gemMat = this.makeCuteClayMat(0xFFE4E6, 0xF43F5E, 0.1, 0.9);
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.24 * scale), gemMat);
        gem.position.set(1.82 * scale, 0, 0);
        orbitGroup.add(gem);
        group.add(orbitGroup);
        group.userData.orbitGroup = orbitGroup;
        break;
      }

      case 'hope': {
        // [희망]: 별빛 프리지아 ✨ - 파스텔 무지개 링과 꼬마별 요정
        const starGroup = new THREE.Group();
        const starMat = this.makeCuteClayMat(0x38BDF8, 0x0284C7, 0.18, 0.9);
        const starBody = new THREE.Mesh(new THREE.OctahedronGeometry(1.15 * scale, 1), starMat);
        starGroup.add(starBody);

        addCuteFace(starGroup, 0, 1.05 * scale, 0.28 * scale);
        group.add(starGroup);

        // 비스듬히 둘러진 파스텔 무지개 행성 링
        const ringMat = this.makeCuteClayMat(0xC084FC, 0x06B6D4, 0.2, 0.6);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.88 * scale, 0.045 * scale, 16, 64), ringMat);
        ring.rotation.x = Math.PI * 0.4;
        ring.rotation.y = Math.PI * 0.18;
        group.add(ring);

        // 링을 따라 공전하는 앙증맞은 꼬마 황금별
        const orbitGroup = new THREE.Group();
        const starTinyMat = this.makeCuteClayMat(0xFDE047, 0xF59E0B, 0.1, 0.9);
        const tinyStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.26 * scale), starTinyMat);
        tinyStar.position.set(1.88 * scale, 0, 0);
        orbitGroup.add(tinyStar);
        group.add(orbitGroup);
        group.userData.orbitGroup = orbitGroup;
        break;
      }

      default: {
        const defMat = this.makeCuteClayMat(0x34D399, 0x059669, 0.3, 0.7);
        group.add(new THREE.Mesh(new THREE.SphereGeometry(1.1 * scale, 24, 24), defMat));
      }
    }

    return group;
  }

  // 3D 감정 꽃 단일 모델 로드
  loadEmotionSculpture(emotionType) {
    if (!this.hasThree || !this.singleViewer.scene) return;

    const cfg = this.getEmotionConfig(emotionType);
    this.singleViewer.currentConfig = cfg;

    if (this.singleViewer.currentMesh) {
      this.singleViewer.scene.remove(this.singleViewer.currentMesh);
    }
    if (this.singleViewer.particleSystem) {
      this.singleViewer.scene.remove(this.singleViewer.particleSystem);
    }

    // 아기자기한 감정 꽃 인스턴스화
    const meshGroup = this.buildCuteObject(emotionType, 1.0, false);
    this.singleViewer.currentMesh = meshGroup;
    this.singleViewer.scene.add(meshGroup);

    // 주변을 맴도는 반짝이는 파스텔 가루 (Sparkle Aura)
    const particleCount = 60;
    const partGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const r = 2.2 + Math.random() * 2.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }
    partGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const partMat = new THREE.PointsMaterial({
      color: cfg.color,
      size: 0.14,
      transparent: true,
      opacity: 0.85
    });

    const particles = new THREE.Points(partGeom, partMat);
    this.singleViewer.particleSystem = particles;
    this.singleViewer.scene.add(particles);

    if (this.singleViewer.coreLight) {
      this.singleViewer.coreLight.color.setHex(cfg.color);
    }
  }

  // =========================================================================
  // 2. 3D 아기자기 미니어처 감정 정원 뷰어 (Cute Floating Diorama Garden)
  // =========================================================================
  initGardenViewer(containerId, diaryEntries = []) {
    const container = document.getElementById(containerId);
    if (!container) return;
    this.gardenViewer.container = container;

    if (!this.hasThree) {
      this.render2DGardenFallback(container, diaryEntries);
      return;
    }

    if (this.gardenViewer.animId) cancelAnimationFrame(this.gardenViewer.animId);
    container.innerHTML = '';

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    // 화사한 파스텔 안개 (Day: 소프트 웜 민트 크림 / Night: 몽환적 라벤더)
    scene.fog = new THREE.FogExp2(this.isNightMode ? 0x1E1B4B : 0xFFFDF7, 0.025);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 1000);
    camera.position.set(0, 9.5, 17.5);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 따스하고 화사한 정원 조명 (Day / Night 모드 반응형)
    const ambientLight = new THREE.AmbientLight(this.isNightMode ? 0xC7D2FE : 0xFFFDF0, this.isNightMode ? 0.9 : 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(this.isNightMode ? 0xA5B4FC : 0xFFFBEB, this.isNightMode ? 1.2 : 2.2);
    sunLight.position.set(12, 18, 12);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xFBCFE8, 0.6);
    rimLight.position.set(-10, -5, -10);
    scene.add(rimLight);

    // 🌸 1) 동화 속 부유하는 초록 언덕 섬 (Floating Grassy Island Diorama)
    const islandGroup = new THREE.Group();

    // 포근한 잔디 언덕 상단 (Soft Green Grass Top)
    const grassMat = new THREE.MeshStandardMaterial({
      color: this.isNightMode ? 0x2DD4BF : 0x86EFAC,
      roughness: 0.8,
      metalness: 0.05
    });
    const grassTopGeom = new THREE.CylinderGeometry(11.5, 12.2, 1.4, 48);
    const grassTop = new THREE.Mesh(grassTopGeom, grassMat);
    grassTop.position.y = -0.7;
    grassTop.receiveShadow = true;
    islandGroup.add(grassTop);

    // 따스한 비스킷/흙 지층 베이스 (Biscuit Soil Base)
    const soilMat = new THREE.MeshStandardMaterial({
      color: this.isNightMode ? 0x312E81 : 0xFDBA74,
      roughness: 0.85,
      metalness: 0.05
    });
    const soilBaseGeom = new THREE.ConeGeometry(12.2, 4.5, 32);
    const soilBase = new THREE.Mesh(soilBaseGeom, soilMat);
    soilBase.rotation.x = Math.PI;
    soilBase.position.y = -3.65;
    islandGroup.add(soilBase);

    // 앙증맞은 흰색 울타리 기둥들 (Cute White Picket Fence)
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.6 });
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.12), fenceMat);
      post.position.set(Math.cos(a) * 11.2, 0.32, Math.sin(a) * 11.2);
      post.rotation.y = -a;
      islandGroup.add(post);
    }

    // 아기자기한 조약돌 징검다리 (Cobblestone Path)
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xF1F5F9, roughness: 0.7 });
    for (let s = 0; s < 6; s++) {
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.55 + Math.random() * 0.2, 0.6, 0.1, 16), stoneMat);
      stone.position.set(Math.sin(s * 0.8) * 1.5, 0.05, 7.5 - s * 1.8);
      islandGroup.add(stone);
    }

    scene.add(islandGroup);

    // 🦋 2) 정원을 살랑살랑 날아다니는 파스텔 나비 요정들 (Fluttering Butterflies)
    const butterflies = [];
    const bColors = [0xF472B6, 0x60A5FA, 0xFBBF24, 0xC084FC];

    for (let b = 0; b < 4; b++) {
      const bGroup = new THREE.Group();
      const bMat = new THREE.MeshBasicMaterial({ color: bColors[b % bColors.length], side: THREE.DoubleSide });

      // 좌우 날개
      const wingGeom = new THREE.PlaneGeometry(0.35, 0.25);
      const leftWing = new THREE.Mesh(wingGeom, bMat);
      leftWing.position.x = -0.18;
      const rightWing = new THREE.Mesh(wingGeom, bMat);
      rightWing.position.x = 0.18;

      bGroup.add(leftWing, rightWing);
      bGroup.userData = {
        leftWing,
        rightWing,
        angle: (b / 4) * Math.PI * 2,
        radius: 4.5 + b * 1.5,
        baseY: 2.5 + Math.random() * 1.5,
        speed: 0.015 + Math.random() * 0.01
      };

      scene.add(bGroup);
      butterflies.push(bGroup);
    }

    // 🌸 3) 반짝이는 봄바람 꽃가루/반딧불이 파티클
    const particleCount = 140;
    const partGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 24;
      positions[i + 1] = Math.random() * 8 + 0.5;
      positions[i + 2] = (Math.random() - 0.5) * 24;
    }
    partGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({
      color: this.isNightMode ? 0xFDE047 : 0xF472B6,
      size: 0.18,
      transparent: true,
      opacity: 0.8
    });
    const fireflies = new THREE.Points(partGeom, partMat);
    scene.add(fireflies);

    this.gardenViewer.scene = scene;
    this.gardenViewer.camera = camera;
    this.gardenViewer.renderer = renderer;
    this.gardenViewer.particles = fireflies;
    this.gardenViewer.butterflies = butterflies;
    this.gardenViewer.islandMesh = islandGroup;
    this.gardenViewer.ambientLight = ambientLight;
    this.gardenViewer.sunLight = sunLight;
    this.gardenViewer.raycaster = new THREE.Raycaster();
    this.gardenViewer.mouse = new THREE.Vector2();

    // 정원에 일기 꽃들 배치하기
    this.populateGarden(diaryEntries);

    // 마우스 드래그 & 클릭 인터랙션
    const dom = renderer.domElement;
    let isUserPanning = false;
    let startPan = { x: 0, y: 0 };

    dom.addEventListener('pointerdown', (e) => {
      isUserPanning = true;
      startPan = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('pointermove', (e) => {
      const rect = dom.getBoundingClientRect();
      this.gardenViewer.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.gardenViewer.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isUserPanning) {
        const dx = e.clientX - startPan.x;
        const dy = e.clientY - startPan.y;
        this.gardenViewer.orbitAngle -= dx * 0.005;
        camera.position.y = Math.max(4, Math.min(18, camera.position.y + dy * 0.03));
        startPan = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('pointerup', () => { isUserPanning = false; });

    // 정원의 꽃 클릭 시 일기 모달 열기
    dom.addEventListener('click', (e) => {
      const rect = dom.getBoundingClientRect();
      const clickMouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      this.gardenViewer.raycaster.setFromCamera(clickMouse, camera);
      const meshes = this.gardenViewer.gardenObjects.map(item => item.mesh);
      const intersects = this.gardenViewer.raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let topGroup = intersects[0].object;
        while (topGroup.parent && topGroup.parent !== scene) {
          topGroup = topGroup.parent;
        }
        const matched = this.gardenViewer.gardenObjects.find(item => item.mesh === topGroup);
        if (matched && matched.entry) {
          if (window.moodAudio) window.moodAudio.playBubblePop(1.2);
          if (window.app && window.app.showEntryDetailModal) {
            window.app.showEntryDetailModal(matched.entry);
          }
        }
      }
    });

    // 정원 렌더 루프
    let gardenClock = 0;
    const animateGarden = () => {
      this.gardenViewer.animId = requestAnimationFrame(animateGarden);
      gardenClock += 0.015;

      // 부드러운 자동 오르빗 회전 (Auto Orbit)
      if (this.gardenViewer.isAutoOrbit && !isUserPanning) {
        this.gardenViewer.orbitAngle += 0.0025;
      }

      const radius = 18.5;
      camera.position.x = Math.sin(this.gardenViewer.orbitAngle) * radius;
      camera.position.z = Math.cos(this.gardenViewer.orbitAngle) * radius;
      camera.lookAt(0, 1.2, 0);

      // 나비들의 팔랑거리는 비행
      butterflies.forEach(b => {
        b.userData.angle += b.userData.speed;
        b.position.x = Math.cos(b.userData.angle) * b.userData.radius;
        b.position.z = Math.sin(b.userData.angle) * b.userData.radius;
        b.position.y = b.userData.baseY + Math.sin(gardenClock * 4 + b.userData.angle) * 0.45;
        b.rotation.y = -b.userData.angle + Math.PI / 2;

        const wingFlap = Math.sin(gardenClock * 22) * 0.75;
        b.userData.leftWing.rotation.y = wingFlap;
        b.userData.rightWing.rotation.y = -wingFlap;
      });

      // 정원에 심긴 각각의 귀여운 화분 꽃 바운스 & 살랑거림
      this.gardenViewer.gardenObjects.forEach((item, idx) => {
        item.mesh.rotation.y += 0.01;
        item.mesh.position.y = item.baseY + Math.sin(gardenClock * 2.2 + idx * 0.6) * 0.16;
      });

      renderer.render(scene, camera);
    };
    animateGarden();

    window.addEventListener('resize', () => {
      if (!container || !this.gardenViewer.renderer) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    });
  }

  // 정원에 일기 꽃들 예쁜 화분과 함께 심기 (Populate Garden Pots)
  populateGarden(entries = []) {
    if (!this.hasThree || !this.gardenViewer.scene) return;

    // 기존 꽃 오브제 제거
    this.gardenViewer.gardenObjects.forEach(item => {
      this.gardenViewer.scene.remove(item.mesh);
    });
    this.gardenViewer.gardenObjects = [];

    const potColors = [0xFED7AA, 0xFEF08A, 0xFBCFE8, 0xDDD6FE, 0xBAE6FD, 0xBBF7D0];

    entries.forEach((entry, idx) => {
      const potGroup = new THREE.Group();
      const potColor = potColors[idx % potColors.length];

      // 1) 앙증맞은 파스텔 테라코타 미니 화분 (Mini Pastel Ceramic Pot)
      const potMat = new THREE.MeshStandardMaterial({ color: potColor, roughness: 0.55 });
      const potBody = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.7, 18), potMat);
      potBody.position.y = 0.35;
      potGroup.add(potBody);

      const potRim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.14, 18), potMat);
      potRim.position.y = 0.7;
      potGroup.add(potRim);

      // 화분 속 흑갈색 흙
      const soilMat = new THREE.MeshBasicMaterial({ color: 0x451A03 });
      const potSoil = new THREE.Mesh(new THREE.CircleGeometry(0.52, 16), soilMat);
      potSoil.rotation.x = -Math.PI / 2;
      potSoil.position.y = 0.71;
      potGroup.add(potSoil);

      // 2) 줄기와 아기 잎사귀
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x22C55E, roughness: 0.5 });
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.8, 8), stemMat);
      stem.position.y = 1.1;
      potGroup.add(stem);

      const leafMat = new THREE.MeshStandardMaterial({ color: 0x4ADE80, roughness: 0.4 });
      const leaf1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), leafMat);
      leaf1.scale.set(1.4, 0.3, 0.7);
      leaf1.position.set(0.16, 0.95, 0);
      leaf1.rotation.z = -0.4;
      const leaf2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), leafMat);
      leaf2.scale.set(1.4, 0.3, 0.7);
      leaf2.position.set(-0.16, 1.05, 0);
      leaf2.rotation.z = 0.4;
      potGroup.add(leaf1, leaf2);

      // 3) 만개한 감정 꽃 캐릭터 머리
      const flowerHead = this.buildCuteObject(entry.emotion, 0.52, true);
      flowerHead.position.y = 1.65;
      potGroup.add(flowerHead);

      // 피보나치 나선형 잔디 언덕 배치
      const phi = idx * 137.5 * (Math.PI / 180);
      const rad = 2.0 + Math.sqrt(idx) * 1.55;
      const x = Math.cos(phi) * rad;
      const z = Math.sin(phi) * rad;

      potGroup.position.set(x, 0, z);

      this.gardenViewer.scene.add(potGroup);
      this.gardenViewer.gardenObjects.push({
        mesh: potGroup,
        entry: entry,
        baseY: 0
      });
    });
  }

  // 테마 동기화 (Day / Night 모드에 맞춰 정원 조명과 안개 전환)
  setThemeMode(isNight) {
    this.isNightMode = isNight;
    if (this.gardenViewer.scene) {
      this.gardenViewer.scene.fog.color.setHex(isNight ? 0x1E1B4B : 0xFFFDF7);
      if (this.gardenViewer.ambientLight) {
        this.gardenViewer.ambientLight.color.setHex(isNight ? 0xC7D2FE : 0xFFFDF0);
        this.gardenViewer.ambientLight.intensity = isNight ? 0.9 : 1.4;
      }
      if (this.gardenViewer.sunLight) {
        this.gardenViewer.sunLight.color.setHex(isNight ? 0xA5B4FC : 0xFFFBEB);
        this.gardenViewer.sunLight.intensity = isNight ? 1.2 : 2.2;
      }
    }
  }

  toggleGardenAutoOrbit() {
    this.gardenViewer.isAutoOrbit = !this.gardenViewer.isAutoOrbit;
    return this.gardenViewer.isAutoOrbit;
  }

  toggleWireframe() {
    this.singleViewer.isWireframe = !this.singleViewer.isWireframe;
    if (this.singleViewer.currentMesh) {
      this.singleViewer.currentMesh.traverse(child => {
        if (child.material && child.material.wireframe !== undefined) {
          child.material.wireframe = this.singleViewer.isWireframe;
        }
      });
    }
    return this.singleViewer.isWireframe;
  }

  // =========================================================================
  // 3. 2D 고해상도 아기자기 캔버스 폴백 (Canvas2D Fallback)
  // =========================================================================
  render2DFallback(container, emotionType) {
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const cfg = this.getEmotionConfig(emotionType);

    let t = 0;
    const draw = () => {
      requestAnimationFrame(draw);
      t += 0.03;
      ctx.clearRect(0, 0, 400, 400);

      const cx = 200;
      const cy = 200 + Math.sin(t * 2) * 12;

      // 부드러운 오라
      const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 120);
      grad.addColorStop(0, cfg.pastelHex);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 120, 0, Math.PI * 2);
      ctx.fill();

      // 꽃잎들
      ctx.fillStyle = cfg.pastelHex;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.2;
        const px = cx + Math.cos(a) * 65;
        const py = cy + Math.sin(a) * 65;
        ctx.beginPath();
        ctx.arc(px, py, 32, 0, Math.PI * 2);
        ctx.fill();
      }

      // 얼굴 몸체
      ctx.fillStyle = cfg.hex;
      ctx.beginPath();
      ctx.arc(cx, cy, 55, 0, Math.PI * 2);
      ctx.fill();

      // 깜찍한 눈
      ctx.fillStyle = '#1F2937';
      ctx.beginPath();
      ctx.arc(cx - 18, cy - 6, 6, 0, Math.PI * 2);
      ctx.arc(cx + 18, cy - 6, 6, 0, Math.PI * 2);
      ctx.fill();

      // 반짝이 눈동자
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx - 16, cy - 8, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 20, cy - 8, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 분홍 볼터치
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.ellipse(cx - 26, cy + 8, 9, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 26, cy + 8, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 스마일 입
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy + 6, 8, 0, Math.PI);
      ctx.stroke();
    };
    draw();
  }

  render2DGardenFallback(container, entries = []) {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:20px; text-align:center;">
        <div style="font-size:3rem; margin-bottom:12px;">🌸🌿🌻</div>
        <h3 style="font-family:'Jua',sans-serif; color:var(--text-primary); margin-bottom:8px;">당신의 포근한 감정 정원</h3>
        <p style="color:var(--text-secondary); font-size:0.95rem;">총 ${entries.length}송이의 아기자기한 마음 꽃이 활짝 피어났습니다!</p>
      </div>
    `;
  }
}

// 싱글톤 인스턴스 전역 노출
window.mood3D = new MoodBloom3DEngine();
