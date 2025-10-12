# 🍏 AI 음성 면접 프로그램

Apple의 Liquid Glass 디자인을 적용한 인터랙티브 면접 시뮬레이터

---

## 📖 프로젝트 소개

AI 면접관과 실제 면접처럼 대화하며 연습할 수 있는 **음성 기반 면접 시뮬레이터**입니다.  
음성 인식 → 텍스트 변환 → AI 응답 → 면접 요약 전송까지의 흐름을 자동화하고,  
Apple의 Liquid Glass 스타일을 반영한 고급스럽고 유려한 UI를 제공합니다.

### ✨ 주요 특징

- 🎤 **음성 인식 면접**: GPT Whisper를 활용한 정확한 음성-텍스트 변환
- 🤖 **AI 면접관**: GPT-4o-mini 기반 지능형 질문 생성 및 피드백
- 🎨 **Liquid Glass UI**: Apple 스타일의 투명도, 흐림, 반사광 효과
- 📊 **실시간 파형**: Web Audio API 기반 음성 시각화
- 🔗 **자동 전송**: make.com Webhook을 통한 면접 결과 자동 연계
- 📱 **반응형 디자인**: 모바일/태블릿/데스크톱 모두 지원

---

## 🎯 사용 대상

- 취업 준비생
- 면접 교육 기관
- 인사 담당자 / HR 솔루션 사용자

---

## 🚀 시작하기

### 1. 개발 환경 설정

```bash
# 패키지 설치
npm install

# 환경 변수 설정
# .env.local 파일 생성 후 아래 내용 추가
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 열어 확인하세요.

### 3. 프로덕션 빌드

```bash
npm run build
npm start
```

---

## 📱 주요 화면 구성

| 화면 | 설명 |
|------|------|
| **메인 화면** | 시작 버튼 및 유리 질감 배경 |
| **연락처 입력** | 갤럭시 스타일 키패드 UI |
| **음성 테스트** | 마이크 테스트 및 음성 인식 확인 |
| **면접 준비** | 체크리스트 안내 화면 |
| **면접 진행** | AI 질문, 음성 녹음, 실시간 파형 표시 |
| **결과 요약** | 면접 피드백 및 평가 |

---

## 🛠 기술 스택

### Frontend
- **Next.js 15** - React 기반 풀스택 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 유틸리티 우선 CSS
- **Framer Motion** - 부드러운 애니메이션

### AI & 음성 처리
- **GPT-4o-mini** - AI 면접관 질문 생성
- **GPT Whisper** - 음성-텍스트 변환
- **Web Audio API** - 실시간 오디오 처리 및 시각화

### 데이터 & 통합
- **make.com Webhook** - 외부 시스템 연동
- **localStorage / IndexedDB** - 로컬 데이터 저장

---

## 🎨 Liquid Glass 디자인 핵심 요소

| 속성 | 설명 |
|------|------|
| **투명도 + 흐림** | `backdrop-filter: blur()` 효과 |
| **반사광 & 하이라이트** | 경계 및 표면 광택 효과 |
| **레이어 & 깊이감** | 겹침을 통한 공간감 표현 |
| **부드러운 애니메이션** | Spring/Curve easing |
| **다크/라이트 모드** | 자동 테마 전환 |

---

## 📂 프로젝트 구조

```
ai-interview-program/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── simple-interview/     # 면접 API
│   │   ├── tts/                  # Text-to-Speech
│   │   └── voice-to-text-stream/ # 음성 인식
│   ├── phone-input/              # 연락처 입력
│   ├── voice-test-simple/        # 음성 테스트
│   └── voice-interview/          # 면접 화면
├── components/                   # React 컴포넌트
│   ├── phone-input/              # 전화번호 입력 컴포넌트
│   └── voice-test/               # 음성 테스트 컴포넌트
├── utils/                        # 유틸리티 함수
│   ├── audioCapture.ts           # 오디오 캡처
│   ├── audioRecorder.ts          # 오디오 녹음
│   ├── realtimeTranscription.ts  # 실시간 전사
│   └── simpleInterviewAPI.ts     # 면접 API
├── styles/                       # 스타일시트
│   └── liquid-glass/             # Liquid Glass 효과
└── PRD.MD                        # 제품 요구사항 문서
```

---

## 🔐 환경 변수

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```env
# OpenAI API Key (필수)
OPENAI_API_KEY=your_openai_api_key_here

# make.com Webhook URL (선택)
WEBHOOK_URL=your_webhook_url_here
```

---

## 🌐 배포

### Vercel (권장)

1. [Vercel](https://vercel.com)에 로그인
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포 완료

### 기타 플랫폼

Next.js를 지원하는 모든 플랫폼에서 배포 가능합니다:
- Netlify
- AWS Amplify
- Google Cloud Run
- Docker

자세한 내용은 [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)를 참조하세요.

---

## 📋 사용자 플로우

1. **접속** → 메인 화면
2. **연락처 입력** → 갤럭시 키패드 스타일
3. **음성 테스트** → 마이크 인식 확인
4. **면접 준비** → 안내 및 체크리스트
5. **면접 진행** → AI 질문 → 음성 답변 → 녹음
6. **결과 확인** → 요약 및 피드백
7. **데이터 전송** → Webhook 자동 전송

---

## 🔧 주요 기능

### 음성 인식
- GPT Whisper 모델을 사용한 고정밀 음성-텍스트 변환
- 실시간 스트리밍 전사 지원
- 다양한 억양 및 발음 인식

### AI 면접관
- 맥락 기반 질문 생성
- 사용자 답변에 따른 후속 질문
- 면접 종료 후 상세 피드백

### 음성 파형 시각화
- 실시간 오디오 레벨 표시
- 부드러운 애니메이션 효과
- 녹음 상태 시각적 피드백

### 데이터 전송
- make.com Webhook 통합
- JSON 형식 면접 데이터
- Google Sheet, Notion 등 외부 저장소 연동 가능

---

## 🎓 학습 자료

- [Next.js 문서](https://nextjs.org/docs)
- [OpenAI API 문서](https://platform.openai.com/docs)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Framer Motion 문서](https://www.framer.com/motion/)

---

## 🤝 기여하기

프로젝트 개선을 위한 기여를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

This project is licensed under the MIT License.

---

## 📞 문의

프로젝트 관련 문의사항이 있으시면 GitHub Issues를 통해 연락주세요.

---

## 🔮 향후 계획

- [ ] 면접 평가 점수화 (발음, 논리, 어휘 등)
- [ ] 사용자 면접 기록 관리 / 히스토리
- [ ] 관리자 대시보드 (면접 데이터 분석)
- [ ] 다국어 면접 기능
- [ ] 사용자 피드백 리포트 자동 생성

---

**작성자:** Product Manager  
**버전:** v1.0.0  
**업데이트:** 2025-10-12  
**기술 지원:** Next.js 15 + OpenAI API
