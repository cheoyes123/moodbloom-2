/**
 * MoodBloom (무드블룸) - 아기자기한 힐링 사운드 & Web Audio 엔진
 * 100% Procedural Audio - 브라우저 내장 Web Audio API로 실시간 합성
 * 외부 오디오 에셋 다운로드 없이 동작하는 무의존성 사운드 & 뽀송뽀송 귀여운 효과음 시스템
 */

class MoodBloomAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.currentTrack = null;
    this.activeNodes = [];
    this.isPlaying = false;
    this.volume = 0.5;
    this.sfxEnabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.05);
    }
  }

  stopCurrent() {
    this.activeNodes.forEach(item => {
      try {
        if (item.stop) item.stop();
        if (item.disconnect) item.disconnect();
        if (item.interval) clearInterval(item.interval);
      } catch (e) {}
    });
    this.activeNodes = [];
    this.currentTrack = null;
    this.isPlaying = false;
  }

  // 핑크 노이즈 버퍼 생성 (포근한 자연음의 기본 재료)
  createPinkNoiseBuffer(duration = 5) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // =========================================================================
  // 🍓 귀여운 아기자기 인터랙션 효과음 (Cute Interaction SFX)
  // =========================================================================

  // 1. 톡! 퐁! 귀여운 버블 팝 효과음 (버튼 클릭 / 탭 전환)
  playBubblePop(pitch = 1.0) {
    if (!this.sfxEnabled) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startFreq = 420 * pitch;
      const endFreq = 880 * pitch;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.11);
    } catch (e) {}
  }

  // 2. 쪼르르~ 샤라랑 물주기 효과음 (Watering Can)
  playWateringSound() {
    if (!this.sfxEnabled) return;
    try {
      this.init();
      // 작은 물방울 여러 개가 연속으로 또르륵 떨어지는 소리
      for (let i = 0; i < 7; i++) {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const freq = 900 + Math.random() * 800;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.4, this.ctx.currentTime + 0.06);

          gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.08);
        }, i * 70);
      }
    } catch (e) {}
  }

  // 3. 따란~ 🌸 꽃 피어남 & 레벨업 팡파레 (Blooming Fanfare)
  playBloomFanfare() {
    if (!this.sfxEnabled) return;
    try {
      this.init();
      // 도-미-솔-도-레-미 맑고 통통 튀는 벨 아르페지오
      const notes = [523.25, 659.25, 783.99, 1046.50, 1174.66, 1318.51];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start();
          osc.stop(this.ctx.currentTime + 1.3);
        }, idx * 110);
      });
    } catch (e) {}
  }

  // 4. 퐁! 도장 쾅 스탬프 사운드 (캘린더 기록 / 퀘스트 완료)
  playStampThud() {
    if (!this.sfxEnabled) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  // =========================================================================
  // 🌿 6대 포근한 힐링 사운드 (Procedural Cozy Ambient Tracks)
  // =========================================================================

  // 1. 숲속 포근한 단비 (Forest Rain)
  playForestRain() {
    this.init();
    this.stopCurrent();
    this.currentTrack = 'rain';
    this.isPlaying = true;

    const noiseBuffer = this.createPinkNoiseBuffer(6);
    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1050, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.65, this.ctx.currentTime);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    src.start();
    this.activeNodes.push(src, filter, gain);
  }

  // 2. 432Hz 힐링 싱잉볼 (432Hz Singing Bowl)
  playSingingBowl() {
    this.init();
    this.stopCurrent();
    this.currentTrack = 'bowl';
    this.isPlaying = true;

    const baseFreq = 432;
    const freqs = [baseFreq, baseFreq * 1.5, baseFreq * 2.01, baseFreq * 0.5];

    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 6, this.ctx.currentTime);

      lfo.frequency.setValueAtTime(0.15 + idx * 0.05, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      gain.gain.setValueAtTime(0.18 / (idx + 1), this.ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      lfo.start();
      this.activeNodes.push(osc, gain, lfo, lfoGain);
    });
  }

  // 3. 파스텔 핑크빛 파도소리 (Gentle Ocean Waves)
  playOceanWaves() {
    this.init();
    this.stopCurrent();
    this.currentTrack = 'ocean';
    this.isPlaying = true;

    const noiseBuffer = this.createPinkNoiseBuffer(8);
    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(420, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

    src.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(this.masterGain);

    src.start();
    lfo.start();
    this.activeNodes.push(src, filter, lfo, lfoGain, waveGain);
  }

  // 4. 타닥타닥 따스한 모닥불 (Warm Campfire)
  playCampfire() {
    this.init();
    this.stopCurrent();
    this.currentTrack = 'fire';
    this.isPlaying = true;

    const noiseBuffer = this.createPinkNoiseBuffer(5);
    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(240, this.ctx.currentTime);

    const baseGain = this.ctx.createGain();
    baseGain.gain.setValueAtTime(0.45, this.ctx.currentTime);

    src.connect(lowpass);
    lowpass.connect(baseGain);
    baseGain.connect(this.masterGain);
    src.start();
    this.activeNodes.push(src, lowpass, baseGain);

    const crackleInterval = setInterval(() => {
      if (!this.isPlaying || this.currentTrack !== 'fire') return;
      if (Math.random() > 0.35) {
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(650 + Math.random() * 1200, this.ctx.currentTime);

        popGain.gain.setValueAtTime(0.07 + Math.random() * 0.08, this.ctx.currentTime);
        popGain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

        popOsc.connect(popGain);
        popGain.connect(this.masterGain);
        popOsc.start();
        popOsc.stop(this.ctx.currentTime + 0.05);
      }
    }, 120);

    this.activeNodes.push({ interval: crackleInterval });
  }

  // 5. 산들바람 & 유리 풍경 (Zen Windchimes)
  playWindchimes() {
    this.init();
    this.stopCurrent();
    this.currentTrack = 'windchimes';
    this.isPlaying = true;

    const noiseBuffer = this.createPinkNoiseBuffer(6);
    const src = this.ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(380, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(1.4, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    src.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.masterGain);
    src.start();
    this.activeNodes.push(src, windFilter, windGain);

    const notes = [528, 594, 660, 792, 880, 1056];
    const chimeInterval = setInterval(() => {
      if (!this.isPlaying || this.currentTrack !== 'windchimes') return;
      if (Math.random() > 0.45) {
        const freq = notes[Math.floor(Math.random() * notes.length)];
        this.playSingleChime(freq, 2.5, 0.09);
      }
    }, 1400);

    this.activeNodes.push({ interval: chimeInterval });
  }

  // 6. 🎵 동화나라 오르골 자장가 (Fairytale Music Box Lullaby)
  playMusicBox() {
    this.init();
    this.stopCurrent();
    this.currentTrack = 'musicbox';
    this.isPlaying = true;

    // 따스하고 은은한 오르골 배경 패드
    const padOsc = this.ctx.createOscillator();
    const padGain = this.ctx.createGain();
    padOsc.type = 'sine';
    padOsc.frequency.setValueAtTime(261.63, this.ctx.currentTime); // C4
    padGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    padOsc.connect(padGain);
    padGain.connect(this.masterGain);
    padOsc.start();
    this.activeNodes.push(padOsc, padGain);

    // 반짝이는 오르골 펜타토닉 멜로디 시퀀스
    // (C-D-E-G-A 펜타토닉 음계: 지브리 애니메이션 감성의 몽환적 선율)
    const scale = [
      523.25, 587.33, 659.25, 783.99, 880.00,
      1046.50, 1174.66, 1318.51, 1567.98
    ];

    let step = 0;
    const melodyInterval = setInterval(() => {
      if (!this.isPlaying || this.currentTrack !== 'musicbox') return;

      const pickFreq = scale[Math.floor(Math.random() * scale.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // 오르골 특유의 맑고 반짝이는 벨 음색 (Sine + 약간의 배음)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pickFreq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.9);

      step++;
    }, 450);

    this.activeNodes.push({ interval: melodyInterval });
  }

  // 단일 차임벨 소리 생성 (호흡 및 알림용)
  playSingleChime(freq = 528, decay = 2.5, maxVolume = 0.15) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(maxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + decay);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + decay);
  }

  // 호흡 가이드 사운드 (들숨 / 참기 / 날숨)
  playBreathingPhase(phase) {
    this.init();
    if (phase === 'inhale') {
      [432, 540].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.9, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.1, this.ctx.currentTime + 3.8);

        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 2.0);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 4.0);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 4.0);
      });
    } else if (phase === 'hold') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(432, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 6.8);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 7.0);
    } else if (phase === 'exhale') {
      [528, 396].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.85, this.ctx.currentTime + 7.5);

        gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 7.8);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 8.0);
      });
    }
  }
}

// 싱글톤 인스턴스 전역 노출
window.moodAudio = new MoodBloomAudioEngine();
