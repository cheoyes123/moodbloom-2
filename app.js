/**
 * MoodBloom (무드블룸) - 아기자기한 마음 정원 회고 다이어리 & AI 감정 분석
 * Core Application Logic, Korean NLP Analysis, Cute Bloomy Mascot, Calendar & Healing Studio
 */

class MoodBloomApp {
  constructor() {
    this.currentTab = 'write';
    this.currentTheme = 'light'; // 기본: 따스한 아침 햇살 파스텔 테마
    this.entries = [];
    this.selectedEntry = null;
    this.todayAnalysis = null;
    this.calendarDate = new Date();
    this.streakDays = 12;

    this.breathingState = {
      isActive: false,
      timer: null,
      technique: '4-7-8',
      phase: 'ready',
      secondsLeft: 0,
      cycleCount: 0
    };

    // 음성 인식 (Web Speech API)
    this.recognition = null;
    this.isRecording = false;

    // 한국어 감정 어휘 사전 (8대 아기자기한 감정 꽃 매핑)
    this.emotionLexicon = {
      joy: ['기쁨', '뿌듯', '행복', '즐겁', '해냈', '만족', '성공', '통과', '최고', '보람', '웃음', '칭찬', '축하', '신나', '완벽', '달성', '자랑', '좋았'],
      calm: ['평온', '여유', '편안', '조용', '산책', '커피', '온화', '쉼', '휴식', '차분', '평화', '노을', '낮잠', '힐링', '안정', '느긋', '따사', '따뜻'],
      anxiety: ['걱정', '긴장', '떨려', '불안', '두려', '부담', '시험', '마감', '발표', '초조', '실수', '어쩌지', '무서', '압박', '조급', '혼란'],
      sadness: ['눈물', '울었', '슬프', '외로', '공허', '서운', '속상', '그리워', '상처', '이별', '우울', '아프', '비참', '낙담', '착잡'],
      anger: ['화나', '짜증', '답답', '억울', '부당', '분노', '열받', '폭발', '싸웠', '불합리', '치밀', '왜이래', '원망', '울화', '괘씸'],
      burnout: ['피곤', '지쳐', '탈진', '방전', '번아웃', '무기력', '아무것도', '쓰러질', '기절', '지침', '멍때', '지쳤', '지치', '한계', '소진'],
      gratitude: ['고마', '감사', '다정', '배려', '든든', '도움', '선물', '감동', '덕분', '축복', '사랑', '은혜', '고마움', '따스'],
      hope: ['설레', '기대', '새로운', '시작', '도전', '꿈', '내일', '용기', '파이팅', '극복', '잘될', '희망', '빛', '가능성', '도약']
    };

    this.init();
  }

  init() {
    this.loadEntriesFromStorage();
    this.setupEventListeners();
    this.initSpeechRecognition();
    this.renderCalendar();
    this.updateStats();
    this.renderFlowerDex();

    // 초기 3D 뷰어 인스턴스화
    setTimeout(() => {
      if (window.mood3D) {
        window.mood3D.initSingleViewer('singleFlowerCanvasStage', 'calm');
        window.mood3D.initGardenViewer('garden3dCanvasStage', this.entries);
      }
    }, 250);

    // 실시간 날짜 업데이트
    this.updateLiveDate();
    this.updateStreakBadge();
  }

  // =========================================================================
  // 1. 상태 및 로컬 스토리지 관리 (LocalStorage)
  // =========================================================================
  loadEntriesFromStorage() {
    const saved = localStorage.getItem('moodbloom_cute_entries');
    if (saved) {
      try {
        this.entries = JSON.parse(saved);
      } catch (e) {
        this.generateDefaultEntries();
      }
    } else {
      this.generateDefaultEntries();
    }
  }

  saveEntriesToStorage() {
    localStorage.setItem('moodbloom_cute_entries', JSON.stringify(this.entries));
  }

  generateDefaultEntries() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const sampleTemplates = [
      { day: 1, emotion: 'hope', text: '새로운 달이 시작되었다! 이번 달에는 운동도 꾸준히 하고 나만의 루틴을 지켜봐야지.', keywords: ['새로운 시작', '운동 루틴', '설렘'] },
      { day: 2, emotion: 'joy', text: '기다리던 공모전 1차 합격 소식을 들었다! 친구들이 축하해줘서 하루 종일 입꼬리가 내려가지 않았다.', keywords: ['공모전 합격', '축하', '성취감'] },
      { day: 4, emotion: 'calm', text: '퇴근길에 따뜻한 라떼를 사서 한강변을 30분 동안 천천히 걸었다. 바람이 참 상쾌하고 평온했다.', keywords: ['한강 산책', '카페 라떼', '여유'] },
      { day: 5, emotion: 'anxiety', text: '내일 중요한 발표가 있어서 대본을 계속 연습하는데도 가슴이 쿵쾅거리고 손에 땀이 난다.', keywords: ['발표 긴장', '대본 연습', '초조함'] },
      { day: 6, emotion: 'joy', text: '우려했던 발표를 무사히 마쳤다! 팀장님께서 칭찬해주셔서 안도했고 정말 뿌듯했다.', keywords: ['발표 성공', '칭찬', '뿌듯함'] },
      { day: 8, emotion: 'burnout', text: '아침부터 밤까지 쉼 없이 회의가 이어졌다. 집에 오자마자 침대에 털썩 쓰러져 아무 생각도 못 하겠다.', keywords: ['연속 회의', '에너지 방전', '휴식 필요'] },
      { day: 9, emotion: 'calm', text: '주말 늦잠을 푹 자고 방 청소를 했다. 햇살이 창가로 가득 들어오니 마음이 한결 가볍고 산뜻하다.', keywords: ['주말 늦잠', '방 청소', '햇살'] },
      { day: 11, emotion: 'gratitude', text: '내가 힘들어할 때 아무 말 없이 따뜻한 유자차와 쪽지를 책상에 두고 간 동료에게 깊은 고마움을 느꼈다.', keywords: ['동료의 배려', '유자차', '따스한 온기'] },
      { day: 12, emotion: 'sadness', text: '오래된 소중한 물건을 잃어버려서 하루 종일 마음이 헛헛하고 쓸쓸했다. 추억이 가득 스며있던 것인데...', keywords: ['물건 분실', '쓸쓸함', '추억'] },
      { day: 14, emotion: 'anger', text: '약속을 일방적으로 취소당해서 일정이 완전히 꼬였다. 상대방의 무성의한 태도에 화가 치밀었다.', keywords: ['약속 파기', '불합리', '화남'] },
      { day: 15, emotion: 'calm', text: '감정을 가라앉히기 위해 힐링 사운드를 들으며 10분간 깊은 호흡을 했다. 마음의 파도가 잦아들었다.', keywords: ['명상 호흡', '이완', '평정심'] },
      { day: 17, emotion: 'hope', text: '새로 시작한 사이드 프로젝트 아이디어가 잘 풀리기 시작했다. 앞으로 어떻게 구체화할지 기대된다.', keywords: ['사이드 프로젝트', '기획', '새로운 도전'] },
      { day: 18, emotion: 'joy', text: '직접 요리해서 가족들과 함께 저녁을 먹었다. 다들 맛있다고 그릇을 싹 비워줘서 정말 행복했다.', keywords: ['홈쿠킹', '가족 저녁', '행복'] },
      { day: 20, emotion: 'anxiety', text: '갑작스러운 일정 변경으로 업무 마감 기한이 당겨졌다. 어떻게 처리해야 할지 막막하다.', keywords: ['마감 단축', '업무 부담', '초조'] },
      { day: 21, emotion: 'burnout', text: '야근 후 귀가하는 지하철에서 눈이 저절로 감겼다. 이번 주말에는 정말 디지털 기기를 끄고 쉬어야겠다.', keywords: ['야근 귀가', '극심한 피로', '디지털 디톡스'] },
      { day: 23, emotion: 'gratitude', text: '부모님께서 보내주신 밑반찬 택배를 열어보며 코끝이 찡했다. 늘 나를 믿고 응원해주시는 마음에 감사하다.', keywords: ['부모님 사랑', '밑반찬 택배', '뭉클함'] }
    ];

    this.entries = sampleTemplates.map((s, idx) => {
      const dayStr = String(s.day).padStart(2, '0');
      const monthStr = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const analysis = this.generateAIResponse(s.emotion, s.text, s.keywords);

      return {
        id: 'entry_' + dateStr + '_' + idx,
        date: dateStr,
        text: s.text,
        voiceRecorded: idx % 3 === 0,
        emotion: s.emotion,
        emotionName: analysis.emotionName,
        flowerName: analysis.flowerName,
        keywords: s.keywords,
        empathyLetter: analysis.empathyLetter,
        recommendedRoutine: analysis.recommendedRoutine,
        emoji: analysis.emoji,
        energyScore: analysis.energyScore
      };
    });

    this.saveEntriesToStorage();
  }

  // =========================================================================
  // 2. 한국어 감정 분석 및 다정한 공감 편지 생성기
  // =========================================================================
  analyzeText(text) {
    if (!text || text.trim().length === 0) {
      return this.generateAIResponse('calm', '오늘 하루를 조용히 돌아보았습니다.', ['마음 관조', '쉼']);
    }

    const clean = text.toLowerCase();
    const scores = { joy: 0, calm: 0, anxiety: 0, sadness: 0, anger: 0, burnout: 0, gratitude: 0, hope: 0 };

    for (const [emotion, words] of Object.entries(this.emotionLexicon)) {
      words.forEach(word => {
        if (clean.includes(word)) scores[emotion] += 2;
      });
    }

    let highestEmotion = 'calm';
    let maxScore = -1;
    for (const [em, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        highestEmotion = em;
      }
    }

    if (maxScore <= 0) {
      if (clean.includes('일') || clean.includes('과제') || clean.includes('공부') || clean.includes('숙제')) {
        highestEmotion = 'burnout';
      } else if (clean.includes('친구') || clean.includes('밥') || clean.includes('맛') || clean.includes('선물')) {
        highestEmotion = 'joy';
      } else {
        highestEmotion = 'calm';
      }
    }

    const rawTokens = text.replace(/[^가-힣a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !['오늘', '내가', '너무', '정말', '진짜', '하루', '있다', '했다', '하고'].includes(w));

    let keywords = rawTokens.slice(0, 3);
    if (keywords.length === 0) {
      const defaultKws = {
        joy: ['작은 성취', '미소', '빛나는 순간'],
        calm: ['포근한 쉼', '호흡', '마음 평정'],
        anxiety: ['긴장 완화', '생각 멈춤', '안도감'],
        sadness: ['눈물 정화', '위로', '마음 수용'],
        anger: ['감정 배출', '쿨다운', '호흡 조율'],
        burnout: ['완전한 방전', '이완', '충전 리추얼'],
        gratitude: ['고마운 온기', '인연', '따뜻한 마음'],
        hope: ['새로운 발걸음', '가능성', '내일의 빛']
      };
      keywords = defaultKws[highestEmotion] || ['일상 회고', '마음 쉼표'];
    }

    return this.generateAIResponse(highestEmotion, text, keywords);
  }

  generateAIResponse(emotion, userText, keywords) {
    const meta = {
      joy: {
        name: '기쁨 · 성취',
        flowerName: '해바라기 뽀송이',
        emoji: '🌻',
        energyScore: 94,
        letters: [
          '오늘 마음속에서 피어난 황금빛 해바라기가 온 세상을 환하게 비추고 있어요! 당신이 일궈낸 소중한 성취와 웃음은 내일을 살아갈 보물 같은 씨앗입니다.',
          '스스로를 아낌없이 쓰다듬어 주세요! 오늘 당신이 만든 작은 기적은 당신의 다정한 진심이 활짝 피워낸 찬란한 꽃이랍니다.'
        ],
        routine: {
          breathing: '생기 충전 3-3 활력 호흡',
          sound: '젠 가든 풍경 & 산들바람',
          soundTrack: 'windchimes',
          microQuest: '오늘 나에게 가장 기쁨을 준 나 자신에게 "참 잘했어!" 칭찬 한마디 건네기'
        }
      },
      calm: {
        name: '평온 · 이완',
        flowerName: '모찌 클로버',
        emoji: '🍀',
        energyScore: 86,
        letters: [
          '거친 파도가 잦아들고 맑은 호수 같은 평온이 깃든 하루였군요. 아무것도 강요하지 않는 이 보들보들한 쉼을 온전히 누려보세요.',
          '마음의 걸음을 늦추면 비로소 피어나는 행복들이 있습니다. 오늘의 차분한 숨결이 당신의 정원에 맑은 이슬방울로 맺혔어요.'
        ],
        routine: {
          breathing: '박스 호흡 (4-4-4-4 마음 안정)',
          sound: '숲속 포근한 단비',
          soundTrack: 'rain',
          microQuest: '창문을 열고 시원한 밤바람을 들이마시며 어깨와 턱의 긴장을 스르륵 풀어보기'
        }
      },
      anxiety: {
        name: '불안 · 긴장',
        flowerName: '구름 라일락',
        emoji: '💜',
        energyScore: 50,
        letters: [
          '마음속에서 수많은 생각들이 소용돌이치고 있군요. 하지만 기억해 주세요. 생각은 그저 흘러가는 구름일 뿐이랍니다. 당신은 지금 이대로 안전해요.',
          '잘해내고 싶은 마음이 크기에 불안도 찾아오는 법이에요. 가슴에 손을 얹고 "괜찮아, 천천히 가면 돼"라고 다정하게 속삭여주세요.'
        ],
        routine: {
          breathing: '4-7-8 자율신경계 이완 호흡',
          sound: '432Hz 힐링 싱잉볼',
          soundTrack: 'bowl',
          microQuest: '눈을 감고 발바닥이 땅에 닿는 감각에만 60초간 집중해 마음 접지하기'
        }
      },
      sadness: {
        name: '슬픔 · 눈물',
        flowerName: '물방울 물망초',
        emoji: '💧',
        energyScore: 45,
        letters: [
          '흘려보내지 못한 슬픔이 가슴 한구석을 적시고 있군요. 억지로 힘내지 않아도 괜찮아요. 눈물은 지친 마음을 씻어내는 가장 순수한 이슬이랍니다.',
          '오늘의 아픔을 숨기지 않고 솔직하게 적어주셔서 고마워요. 이 푸른 물망초 요정이 당신의 슬픔을 폭신한 구름으로 감싸 안아줄 거예요.'
        ],
        routine: {
          breathing: '4-7-8 부교감신경 이완 호흡',
          sound: '파스텔 핑크빛 파도소리',
          soundTrack: 'ocean',
          microQuest: '따뜻한 보리차 한 잔을 천천히 마시고 포근한 담요로 몸을 꼬옥 감싸주기'
        }
      },
      anger: {
        name: '분노 · 답답함',
        flowerName: '불꽃 튤립 삐약이',
        emoji: '🌷',
        energyScore: 52,
        letters: [
          '답답하고 화가 치밀어 올랐던 힘겨운 시간이었군요. 당신의 분노는 당신의 소중한 마음과 경계가 침해되었음을 알리는 소중한 신호랍니다.',
          '타오르는 불꽃을 억누르지 말고, 깊은 날숨과 함께 밖으로 부드럽게 비워내 주세요. 꼬마 불꽃 요정이 열기를 예쁜 팝콘 스파크로 바꿔줄 거예요.'
        ],
        routine: {
          breathing: '박스 호흡 (4-4-4-4 쿨다운)',
          sound: '숲속 포근한 단비',
          soundTrack: 'rain',
          microQuest: '주먹을 5초간 꽉 쥐었다가 깊은 한숨을 쉬며 손가락을 쫙 펴는 근이완 3회 반복'
        }
      },
      burnout: {
        name: '번아웃 · 탈진',
        flowerName: '잠자는 민들레',
        emoji: '☁️',
        energyScore: 38,
        letters: [
          '오늘도 온 힘을 다해 하루를 버텨내셨군요. 방전된 배터리처럼 텅 빈 느낌이 들더라도 자책하지 마세요. 당신은 쉼을 누릴 자격이 아주 충분하답니다.',
          '아무것도 생산하지 않아도 괜찮은 밤이에요. 모든 생각을 끄고, 잠자는 민들레 요정처럼 쿨쿨 달콤한 꿈속으로 여행을 떠나보세요.'
        ],
        routine: {
          breathing: '4-7-8 수면 유도 호흡',
          sound: '동화나라 오르골 자장가',
          soundTrack: 'musicbox',
          microQuest: '스마트폰을 손 닿지 않는 곳에 두고 조명을 가장 따뜻하게 낮추기'
        }
      },
      gratitude: {
        name: '감사 · 다정',
        flowerName: '하트 로즈베리',
        emoji: '💖',
        energyScore: 92,
        letters: [
          '주변의 작은 배려와 온기를 발견해 낸 당신의 시선이 참 보석 같아요. 감사는 세상에서 가장 달콤한 향기를 지닌 꽃이랍니다.',
          '당신이 나눈 고마움은 몇 배의 행복이 되어 다시 당신의 품으로 돌아올 거예요. 핑크빛 하트 장미가 정원에 활짝 피어났습니다.'
        ],
        routine: {
          breathing: '하트 이완 마인드풀 호흡',
          sound: '동화나라 오르골 자장가',
          soundTrack: 'musicbox',
          microQuest: '고마웠던 그 사람의 미소를 떠올리며 마음속으로 다정한 응원 보내기'
        }
      },
      hope: {
        name: '희망 · 설렘',
        flowerName: '별빛 프리지아',
        emoji: '✨',
        energyScore: 95,
        letters: [
          '가슴속에서 작은 싹이 트듯 설레는 용기가 피어오르고 있군요! 알 수 없는 내일도 당신에게는 두근거리는 모험의 무대랍니다.',
          '별빛 너머의 가능성을 바라보는 당신의 눈동자가 눈부셔요. 찬란한 오로라 별빛 꽃이 당신의 앞길을 환하게 비춰줄 거예요.'
        ],
        routine: {
          breathing: '생기 충전 호흡',
          sound: '432Hz 힐링 싱잉볼',
          soundTrack: 'bowl',
          microQuest: '내일 꼭 해보고 싶은 작지만 기분 좋은 일 1가지 메모장에 적어두기'
        }
      }
    };

    const target = meta[emotion] || meta.calm;
    const letter = target.letters[Math.floor(Math.random() * target.letters.length)];

    return {
      emotion: emotion,
      emotionName: target.name,
      flowerName: target.flowerName,
      emoji: target.emoji,
      energyScore: target.energyScore,
      empathyLetter: letter,
      recommendedRoutine: target.routine,
      keywords: keywords
    };
  }

  // =========================================================================
  // 3. UI 인터랙션 및 탭 전환
  // =========================================================================
  setupEventListeners() {
    // 탭 내비게이션
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.moodAudio) window.moodAudio.playBubblePop(1.0);
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });

    // 텍스트 글자수 카운터
    const diaryInput = document.getElementById('dailyReflectionInput');
    const charCounter = document.getElementById('charCountDisplay');
    if (diaryInput && charCounter) {
      diaryInput.addEventListener('input', () => {
        charCounter.textContent = `${diaryInput.value.length} / 250자`;
      });
    }

    // 빠른 감정 꽃 요정 칩 클릭
    const moodChips = document.querySelectorAll('.mood-chip-btn');
    moodChips.forEach(chip => {
      chip.addEventListener('click', () => {
        if (window.moodAudio) window.moodAudio.playBubblePop(1.15);
        moodChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        const emotion = chip.getAttribute('data-emotion');
        if (window.mood3D) {
          window.mood3D.loadEmotionSculpture(emotion);
        }
        this.updateBloomySpeech(`${chip.textContent.trim()} 요정을 골라주셨네요! 🌸`);
      });
    });

    // 메인 분석 및 꽃피우기 버튼
    const runBtn = document.getElementById('runBloomBtn');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        this.handleBloomProcess();
      });
    }

    // 정원에 심기 버튼
    const plantBtn = document.getElementById('plantToGardenBtn');
    if (plantBtn) {
      plantBtn.addEventListener('click', () => {
        this.plantFlowerToGarden();
      });
    }

    // 테마 토글 (Day / Night)
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // 와이어프레임 토글
    const wireframeBtn = document.getElementById('toggleWireframeBtn');
    if (wireframeBtn) {
      wireframeBtn.addEventListener('click', () => {
        if (window.mood3D) {
          const isWire = window.mood3D.toggleWireframe();
          wireframeBtn.textContent = isWire ? '🕸️ 와이어 ON' : '🌸 3D 클레이';
        }
      });
    }

    // 정원 오토 산책 토글
    const gardenOrbitBtn = document.getElementById('toggleGardenOrbitBtn');
    if (gardenOrbitBtn) {
      gardenOrbitBtn.addEventListener('click', () => {
        if (window.mood3D) {
          const isOrbit = window.mood3D.toggleGardenAutoOrbit();
          gardenOrbitBtn.textContent = isOrbit ? '🌀 산책 ON' : '⏸️ 고정';
        }
      });
    }

    // 음성 녹음 버튼
    const voiceBtn = document.getElementById('voiceInputBtn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        this.toggleVoiceRecording();
      });
    }

    // 호흡 가이드 시작 버튼
    const breatheBtn = document.getElementById('startBreatheBtn');
    if (breatheBtn) {
      breatheBtn.addEventListener('click', () => {
        this.toggleBreathingSession();
      });
    }

    // 캘린더 월 이동
    const prevMonthBtn = document.getElementById('calPrevMonthBtn');
    const nextMonthBtn = document.getElementById('calNextMonthBtn');
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        if (window.moodAudio) window.moodAudio.playBubblePop(0.9);
        this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
        this.renderCalendar();
      });
    }
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        if (window.moodAudio) window.moodAudio.playBubblePop(1.1);
        this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
        this.renderCalendar();
      });
    }

    // 정원 필터 버튼들
    const gardenFilters = document.querySelectorAll('.garden-filter-btn');
    gardenFilters.forEach(fBtn => {
      fBtn.addEventListener('click', () => {
        if (window.moodAudio) window.moodAudio.playBubblePop(1.05);
        gardenFilters.forEach(b => b.classList.remove('active'));
        fBtn.classList.add('active');
        const filter = fBtn.getAttribute('data-filter');
        this.filterGarden(filter);
      });
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));

    const targetPane = document.getElementById(`tab-${tabId}`);
    const targetNav = document.querySelector(`.nav-tab-btn[data-tab="${tabId}"]`);
    if (targetPane) targetPane.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    if (tabId === 'garden' && window.mood3D) {
      setTimeout(() => {
        window.mood3D.initGardenViewer('garden3dCanvasStage', this.entries);
      }, 80);
    } else if (tabId === 'calendar') {
      this.renderCalendar();
    } else if (tabId === 'stats') {
      this.updateStats();
      this.renderFlowerDex();
    }
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = `theme-${this.currentTheme}`;

    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
    }

    if (window.mood3D) {
      window.mood3D.setThemeMode(this.currentTheme === 'dark');
    }
  }

  updateLiveDate() {
    const el = document.getElementById('currentLiveDate');
    if (!el) return;
    const now = new Date();
    const opts = { month: 'long', day: 'numeric', weekday: 'short' };
    el.textContent = now.toLocaleDateString('ko-KR', opts);
  }

  updateStreakBadge() {
    const el = document.getElementById('streakDaysCount');
    if (el) el.textContent = `${this.streakDays}일`;
  }

  updateBloomySpeech(text) {
    const el = document.getElementById('bloomySpeech');
    if (el) {
      el.textContent = text;
      el.style.animation = 'none';
      setTimeout(() => { el.style.animation = 'cardPopUp 0.3s ease'; }, 10);
    }
  }

  // =========================================================================
  // 4. 물뿌리개로 물주기 & 꽃피우기 의식 (Blooming Ceremony)
  // =========================================================================
  handleBloomProcess() {
    const input = document.getElementById('dailyReflectionInput');
    const text = input ? input.value.trim() : '';

    if (!text) {
      alert('오늘 하루 겪은 일이나 마음에 맴도는 생각을 2~3줄로 편하게 적어주세요. 🌸');
      return;
    }

    const runBtn = document.getElementById('runBloomBtn');
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.innerHTML = `<span>🚿</span> 시원한 물을 솔솔 뿌리는 중...`;
    }

    // 1) 쪼르르 물주기 효과음 재생
    if (window.moodAudio) {
      window.moodAudio.playWateringSound();
    }
    this.updateBloomySpeech('마음에 시원한 봄비를 촉촉하게 뿌려주고 있어요! 💧');

    // 2) 800ms 후 감정 분석 완료 & 꽃피우기 팡파레!
    setTimeout(() => {
      const analysis = this.analyzeText(text);
      this.todayAnalysis = analysis;
      this.displayBloomResult(analysis);

      // 3D 꽃 캐릭터 렌더링
      if (window.mood3D) {
        window.mood3D.loadEmotionSculpture(analysis.emotion);
      }

      // 축하 팡파레 멜로디 재생
      if (window.moodAudio) {
        window.moodAudio.playBloomFanfare();
      }

      this.updateBloomySpeech(`따란~! 당신의 마음에 '${analysis.flowerName}'이 활짝 피어났어요! 🌻`);

      if (runBtn) {
        runBtn.disabled = false;
        runBtn.innerHTML = `<span>🚿</span> 물뿌리개로 다시 물주기`;
      }
    }, 850);
  }

  displayBloomResult(analysis) {
    const resultCard = document.getElementById('flowerBloomResultCard');
    if (!resultCard) return;

    resultCard.classList.add('active');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const nameEl = document.getElementById('detectedFlowerName');
    const badgeEl = document.getElementById('detectedEnergyBadge');
    const letterEl = document.getElementById('aiEmpathyLetterText');
    const kwsEl = document.getElementById('extractedKeywordsList');
    const bBreathingEl = document.getElementById('routineBreathingText');
    const bSoundEl = document.getElementById('routineSoundText');
    const bQuestEl = document.getElementById('routineQuestText');

    if (nameEl) nameEl.textContent = `${analysis.emoji} ${analysis.flowerName}`;
    if (badgeEl) badgeEl.textContent = `회복탄력성: ${analysis.energyScore}점`;
    if (letterEl) letterEl.textContent = `"${analysis.empathyLetter}"`;

    if (kwsEl) {
      kwsEl.innerHTML = analysis.keywords.map(kw => `<span class="cute-tag-pill">#${kw}</span>`).join('');
    }

    if (bBreathingEl) bBreathingEl.textContent = analysis.recommendedRoutine.breathing;
    if (bSoundEl) bSoundEl.textContent = analysis.recommendedRoutine.sound;
    if (bQuestEl) bQuestEl.textContent = analysis.recommendedRoutine.microQuest;
  }

  plantFlowerToGarden() {
    if (!this.todayAnalysis) {
      alert('먼저 회고를 작성하고 꽃을 피워주세요! 🌸');
      return;
    }

    const input = document.getElementById('dailyReflectionInput');
    const text = input ? input.value.trim() : '';
    const todayStr = new Date().toISOString().split('T')[0];

    const newEntry = {
      id: 'entry_' + todayStr + '_' + Date.now(),
      date: todayStr,
      text: text,
      voiceRecorded: this.isRecording,
      emotion: this.todayAnalysis.emotion,
      emotionName: this.todayAnalysis.emotionName,
      flowerName: this.todayAnalysis.flowerName,
      keywords: this.todayAnalysis.keywords,
      empathyLetter: this.todayAnalysis.empathyLetter,
      recommendedRoutine: this.todayAnalysis.recommendedRoutine,
      emoji: this.todayAnalysis.emoji,
      energyScore: this.todayAnalysis.energyScore
    };

    const existIdx = this.entries.findIndex(e => e.date === todayStr);
    if (existIdx >= 0) {
      this.entries[existIdx] = newEntry;
    } else {
      this.entries.push(newEntry);
      this.streakDays++;
      this.updateStreakBadge();
    }

    this.saveEntriesToStorage();

    // 퐁! 도장 스탬프 소리
    if (window.moodAudio) {
      window.moodAudio.playStampThud();
    }

    this.updateBloomySpeech('야호! 오늘의 꽃 화분이 정원에 예쁘게 심어졌어요! 🪴');
    alert('🌸 오늘의 감정 꽃이 당신만의 감정 정원에 예쁘게 심어졌습니다!');

    // 정원 탭으로 이동
    this.switchTab('garden');
  }

  // =========================================================================
  // 5. 음성 기록 (Web Speech API)
  // =========================================================================
  initSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.lang = 'ko-KR';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      this.recognition.onstart = () => {
        this.isRecording = true;
        this.updateVoiceButtonUI(true);
      };

      this.recognition.onresult = (e) => {
        let transcript = '';
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        const input = document.getElementById('dailyReflectionInput');
        if (input) {
          input.value = transcript;
          const charCounter = document.getElementById('charCountDisplay');
          if (charCounter) charCounter.textContent = `${transcript.length} / 250자`;
        }
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.updateVoiceButtonUI(false);
      };

      this.recognition.onerror = () => {
        this.isRecording = false;
        this.updateVoiceButtonUI(false);
      };
    }
  }

  toggleVoiceRecording() {
    if (this.recognition) {
      if (this.isRecording) {
        this.recognition.stop();
      } else {
        try {
          this.recognition.start();
        } catch (e) {
          this.simulateVoiceRecording();
        }
      }
    } else {
      this.simulateVoiceRecording();
    }
  }

  simulateVoiceRecording() {
    const samples = [
      "오늘 프로젝트 마감이었는데 친구들과 다 같이 협력해서 잘 끝냈다. 마음이 정말 후련하고 스스로가 뿌듯하다.",
      "하루 종일 비가 내려서 집에서 따뜻한 차 한 잔 마시며 책을 읽었다. 오랜만에 느껴보는 잔잔한 평화로움이었다.",
      "내일 있을 발표 때문에 마음이 계속 조마조마하고 불안하다. 실수 없이 잘 해낼 수 있을까 걱정된다.",
      "일이 생각대로 안 풀리고 지쳐서 퇴근길에 멍하니 하늘만 봤다. 오늘은 아무 생각 없이 푹 쉬고 싶다."
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];

    const btn = document.getElementById('voiceInputBtn');
    if (btn) btn.innerHTML = `<span>🎙️</span> 블루미가 듣는 중...`;

    setTimeout(() => {
      const input = document.getElementById('dailyReflectionInput');
      if (input) {
        input.value = picked;
        const charCounter = document.getElementById('charCountDisplay');
        if (charCounter) charCounter.textContent = `${picked.length} / 250자`;
      }
      if (btn) btn.innerHTML = `<span>🎤</span> 음성으로 이야기하기`;
      if (window.moodAudio) window.moodAudio.playBubblePop(1.1);
    }, 800);
  }

  updateVoiceButtonUI(recording) {
    const btn = document.getElementById('voiceInputBtn');
    if (!btn) return;
    if (recording) {
      btn.classList.add('recording');
      btn.innerHTML = `<span>🔴</span> 듣고 있어요 (말씀하세요)...`;
    } else {
      btn.classList.remove('recording');
      btn.innerHTML = `<span>🎤</span> 음성으로 이야기하기`;
    }
  }

  // =========================================================================
  // 6. 감정 정원 필터링
  // =========================================================================
  filterGarden(filter) {
    let filtered = this.entries;
    if (filter === 'positive') {
      filtered = this.entries.filter(e => ['joy', 'calm', 'gratitude', 'hope'].includes(e.emotion));
    } else if (filter === 'healing') {
      filtered = this.entries.filter(e => ['anxiety', 'sadness', 'anger', 'burnout'].includes(e.emotion));
    } else if (filter === 'recent') {
      filtered = this.entries.slice(-7);
    }

    if (window.mood3D) {
      window.mood3D.populateGarden(filtered);
    }
  }

  // =========================================================================
  // 7. 아카이브 다꾸 캘린더 (Sticker Calendar)
  // =========================================================================
  renderCalendar() {
    const calGrid = document.getElementById('calendarDaysGrid');
    const monthYearTitle = document.getElementById('calendarMonthYearTitle');
    if (!calGrid || !monthYearTitle) return;

    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();

    monthYearTitle.textContent = `${year}년 ${month + 1}월`;
    calGrid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    for (let x = firstDayIndex; x > 0; x--) {
      const prevDay = prevLastDate - x + 1;
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell other-month';
      cell.innerHTML = `<span class="day-num">${prevDay}</span>`;
      calGrid.appendChild(cell);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (let d = 1; d <= lastDate; d++) {
      const dayStr = String(d).padStart(2, '0');
      const monthStr = String(month + 1).padStart(2, '0');
      const curDateStr = `${year}-${monthStr}-${dayStr}`;

      const matchedEntry = this.entries.find(e => e.date === curDateStr);

      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';
      if (curDateStr === todayStr) cell.classList.add('today');

      let cellContent = `<span class="day-num">${d}</span>`;

      if (matchedEntry) {
        const cfg = window.mood3D ? window.mood3D.getEmotionConfig(matchedEntry.emotion) : { hex: '#F472B6' };
        cellContent += `
          <div class="cal-sticker-wrap">
            <span class="cal-sticker-emoji">${matchedEntry.emoji || '🌸'}</span>
            <span class="cal-sticker-dot" style="background:${cfg.hex};"></span>
          </div>
        `;
        cell.addEventListener('click', () => {
          if (window.moodAudio) window.moodAudio.playBubblePop(1.1);
          this.showEntryDetailModal(matchedEntry);
        });
      } else {
        cell.addEventListener('click', () => {
          if (confirm(`${curDateStr} 날짜에 새로운 마음 꽃을 피워볼까요?`)) {
            this.switchTab('write');
            const input = document.getElementById('dailyReflectionInput');
            if (input) input.focus();
          }
        });
      }

      cell.innerHTML = cellContent;
      calGrid.appendChild(cell);
    }
  }

  showEntryDetailModal(entry) {
    this.selectedEntry = entry;
    const modal = document.getElementById('entryDetailModal');
    if (!modal) return;

    document.getElementById('modalEntryDate').textContent = `📅 ${entry.date} 회고 다이어리`;
    document.getElementById('modalEntryEmotion').textContent = `${entry.emoji} ${entry.flowerName || entry.emotionName}`;
    document.getElementById('modalEntryText').textContent = entry.text;
    document.getElementById('modalEntryEmpathy').textContent = `"${entry.empathyLetter}"`;

    const kwContainer = document.getElementById('modalEntryKeywords');
    if (kwContainer) {
      kwContainer.innerHTML = entry.keywords.map(k => `<span class="cute-tag-pill">#${k}</span>`).join('');
    }

    const routineContainer = document.getElementById('modalEntryRoutine');
    if (routineContainer && entry.recommendedRoutine) {
      routineContainer.innerHTML = `
        <div style="font-size:0.88rem; color:var(--text-secondary); line-height:1.7;">
          <div>🧘 <b>추천 호흡:</b> ${entry.recommendedRoutine.breathing}</div>
          <div>🎵 <b>치유 사운드:</b> ${entry.recommendedRoutine.sound}</div>
          <div>✨ <b>마음 퀘스트:</b> ${entry.recommendedRoutine.microQuest}</div>
        </div>
      `;
    }

    modal.classList.add('open');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  deleteCurrentEntry() {
    if (!this.selectedEntry) return;
    if (confirm('이 날의 감정 꽃 오브제를 정원에서 정말로 지우시겠습니까?')) {
      this.entries = this.entries.filter(e => e.id !== this.selectedEntry.id);
      this.saveEntriesToStorage();
      this.closeModal('entryDetailModal');
      this.renderCalendar();
      if (window.mood3D) window.mood3D.populateGarden(this.entries);
      this.updateStats();
      this.renderFlowerDex();
      alert('삭제되었습니다.');
    }
  }

  // =========================================================================
  // 8. 포근한 호흡 가이드 세션
  // =========================================================================
  toggleBreathingSession() {
    if (this.breathingState.isActive) {
      this.stopBreathingSession();
    } else {
      this.startBreathingSession();
    }
  }

  startBreathingSession() {
    this.breathingState.isActive = true;
    this.breathingState.cycleCount = 0;

    const btn = document.getElementById('startBreatheBtn');
    if (btn) btn.innerHTML = `<span>⏹️</span> 호흡 멈추기`;

    this.runBreathingLoop();
  }

  stopBreathingSession() {
    this.breathingState.isActive = false;
    clearTimeout(this.breathingState.timer);

    const btn = document.getElementById('startBreatheBtn');
    if (btn) btn.innerHTML = `<span>▶️</span> 호흡 시작하기`;

    const orb = document.getElementById('breathingOrb');
    const label = document.getElementById('breathingPhaseLabel');
    const sec = document.getElementById('breathingSecondsLabel');

    if (orb) orb.className = 'breathing-orb';
    if (label) label.textContent = '편안하게 숨을 고르세요';
    if (sec) sec.textContent = '준비';
  }

  runBreathingLoop() {
    if (!this.breathingState.isActive) return;

    const sequence = [
      { phase: 'inhale', text: '코로 깊게 들이쉬세요 (Inhale)', duration: 4, scaleClass: 'inhale' },
      { phase: 'hold', text: '숨을 부드럽게 멈추세요 (Hold)', duration: 7, scaleClass: 'hold' },
      { phase: 'exhale', text: '입으로 천천히 비워내세요 (Exhale)', duration: 8, scaleClass: 'exhale' }
    ];

    let stepIndex = 0;

    const executeStep = () => {
      if (!this.breathingState.isActive) return;

      const currentStep = sequence[stepIndex];
      const orb = document.getElementById('breathingOrb');
      const label = document.getElementById('breathingPhaseLabel');
      const sec = document.getElementById('breathingSecondsLabel');

      if (orb) orb.className = `breathing-orb ${currentStep.scaleClass}`;
      if (label) label.textContent = currentStep.text;

      if (window.moodAudio) {
        window.moodAudio.playBreathingPhase(currentStep.phase);
      }

      let count = currentStep.duration;
      if (sec) sec.textContent = `${count}초`;

      const countdownInterval = setInterval(() => {
        count--;
        if (count > 0 && this.breathingState.isActive) {
          if (sec) sec.textContent = `${count}초`;
        } else {
          clearInterval(countdownInterval);
        }
      }, 1000);

      this.breathingState.timer = setTimeout(() => {
        clearInterval(countdownInterval);
        stepIndex++;
        if (stepIndex >= sequence.length) {
          stepIndex = 0;
          this.breathingState.cycleCount++;
        }
        executeStep();
      }, currentStep.duration * 1000);
    };

    executeStep();
  }

  // 사운드 카드 재생
  playAmbientSound(trackName) {
    if (!window.moodAudio) return;

    if (window.moodAudio.isPlaying && window.moodAudio.currentTrack === trackName) {
      window.moodAudio.stopCurrent();
      this.updateSoundButtonsUI(null);
    } else {
      switch (trackName) {
        case 'rain': window.moodAudio.playForestRain(); break;
        case 'bowl': window.moodAudio.playSingingBowl(); break;
        case 'ocean': window.moodAudio.playOceanWaves(); break;
        case 'fire': window.moodAudio.playCampfire(); break;
        case 'windchimes': window.moodAudio.playWindchimes(); break;
        case 'musicbox': window.moodAudio.playMusicBox(); break;
      }
      this.updateSoundButtonsUI(trackName);
    }
  }

  updateSoundButtonsUI(activeTrack) {
    const cards = document.querySelectorAll('.cute-sound-card');
    cards.forEach(card => {
      const track = card.getAttribute('data-sound');
      const statusEl = card.querySelector('.sound-card-status');
      if (track === activeTrack) {
        card.classList.add('playing');
        if (statusEl) statusEl.textContent = '재생 중 🎶';
      } else {
        card.classList.remove('playing');
        if (statusEl) statusEl.textContent = '재생 ▶';
      }
    });
  }

  // =========================================================================
  // 9. 감정 꽃 도감 & 월간 통계 (Flower Dex & Stats)
  // =========================================================================
  renderFlowerDex() {
    const dexContainer = document.getElementById('flowerDexGrid');
    if (!dexContainer) return;

    const flowerKeys = ['joy', 'calm', 'anxiety', 'sadness', 'anger', 'burnout', 'gratitude', 'hope'];
    const counts = {};
    this.entries.forEach(e => { counts[e.emotion] = (counts[e.emotion] || 0) + 1; });

    dexContainer.innerHTML = flowerKeys.map(key => {
      const cfg = window.mood3D ? window.mood3D.getEmotionConfig(key) : { emoji: '🌸', flowerName: key, hex: '#F472B6' };
      const cnt = counts[key] || 0;
      return `
        <div class="dex-item-card" onclick="app.previewDexFlower('${key}')">
          <div class="dex-flower-emoji">${cfg.emoji}</div>
          <div class="dex-flower-name">${cfg.flowerName}</div>
          <div class="dex-flower-count">${cnt}송이 피어남</div>
        </div>
      `;
    }).join('');
  }

  previewDexFlower(emotionKey) {
    if (window.moodAudio) window.moodAudio.playBubblePop(1.2);
    this.switchTab('write');
    if (window.mood3D) {
      window.mood3D.loadEmotionSculpture(emotionKey);
    }
    const cfg = window.mood3D ? window.mood3D.getEmotionConfig(emotionKey) : null;
    if (cfg) {
      this.updateBloomySpeech(`'${cfg.flowerName}' 요정을 3D로 미리 보고 계세요! 🌸`);
    }
  }

  updateStats() {
    const totalEntries = this.entries.length;
    const countEl = document.getElementById('statTotalCount');
    if (countEl) countEl.textContent = `${totalEntries}송이`;

    const counts = {};
    this.entries.forEach(e => { counts[e.emotion] = (counts[e.emotion] || 0) + 1; });

    let topEmotion = 'calm';
    let topMax = 0;
    for (const [em, cnt] of Object.entries(counts)) {
      if (cnt > topMax) {
        topMax = cnt;
        topEmotion = em;
      }
    }

    const topEl = document.getElementById('statTopEmotion');
    const topCfg = window.mood3D ? window.mood3D.getEmotionConfig(topEmotion) : { flowerName: '모찌 클로버' };
    if (topEl) topEl.textContent = `${topCfg.flowerName} (${topMax}회)`;

    // 감정 스펙트럼 프로그레스 바
    const distContainer = document.getElementById('emotionDistributionBars');
    if (distContainer) {
      const keys = ['joy', 'calm', 'anxiety', 'sadness', 'anger', 'burnout', 'gratitude', 'hope'];
      distContainer.innerHTML = keys.map(k => {
        const c = counts[k] || 0;
        const pct = totalEntries > 0 ? Math.round((c / totalEntries) * 100) : 0;
        const cfg = window.mood3D ? window.mood3D.getEmotionConfig(k) : { flowerName: k, hex: '#34D399' };
        return `
          <div class="stat-bar-item">
            <div class="stat-bar-header">
              <span>${cfg.emoji} ${cfg.flowerName}</span>
              <span>${c}회 (${pct}%)</span>
            </div>
            <div class="stat-bar-track">
              <div class="stat-bar-fill" style="width: ${pct}%; background-color: ${cfg.hex};"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 워드클라우드
    const wordcloud = document.getElementById('statWordcloud');
    if (wordcloud) {
      const allKws = [];
      this.entries.forEach(e => {
        if (e.keywords) allKws.push(...e.keywords);
      });
      const kwCounts = {};
      allKws.forEach(kw => { kwCounts[kw] = (kwCounts[kw] || 0) + 1; });
      const sortedKws = Object.entries(kwCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);

      wordcloud.innerHTML = sortedKws.map(([kw, cnt]) => `
        <span class="cute-tag-pill" style="font-size: ${0.82 + cnt * 0.12}rem;">
          #${kw} (${cnt})
        </span>
      `).join('');
    }
  }

  exportDataJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.entries, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `moodbloom_cute_backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  }
}

// 싱글톤 전역 인스턴스 초기화
window.addEventListener('DOMContentLoaded', () => {
  window.app = new MoodBloomApp();
});
