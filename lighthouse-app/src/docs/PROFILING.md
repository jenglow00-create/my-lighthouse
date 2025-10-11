# 성능 프로파일링 가이드

## React DevTools Profiler 사용법

### 설치
1. Chrome 확장 프로그램: React Developer Tools
2. 개발자 도구 > Profiler 탭

### 프로파일링 절차

#### 1. 녹화 시작
- Profiler 탭 열기
- 🔴 Record 버튼 클릭
- 앱에서 작업 수행 (클릭, 입력 등)
- ⏹ Stop 버튼 클릭

#### 2. 결과 분석
**Flame Chart (불꽃 그래프)**
- Y축: 컴포넌트 계층
- X축: 렌더링 시간
- 색상:
  - 🟢 녹색: 빠름 (0-5ms)
  - 🟡 노란색: 보통 (5-16ms)
  - 🔴 빨간색: 느림 (16ms+)

**Ranked Chart (순위 차트)**
- 렌더링 시간 순 정렬
- 가장 느린 컴포넌트 우선 최적화

#### 3. 주요 지표
- **Render duration**: 렌더링 소요 시간
- **Render count**: 렌더링 횟수
- **Why did this render?**: 리렌더링 원인

### 병목 지점 체크리스트

#### Critical (즉시 수정)
- [ ] 렌더링 시간 >50ms
- [ ] 입력 지연 (FID >100ms)
- [ ] 애니메이션 끊김 (FPS <30)

#### High (우선 수정)
- [ ] 렌더링 시간 16-50ms
- [ ] 불필요한 리렌더링 >5회
- [ ] 무거운 계산 (동기)

#### Medium (여유 있을 때)
- [ ] 렌더링 시간 10-16ms
- [ ] 컴포넌트 분리 가능
- [ ] 메모이제이션 가능

### 최적화 체크리스트

#### React.memo
```jsx
// ❌ Before
function SessionCard({ session, onUpdate }) {
  // 부모가 리렌더링되면 항상 리렌더링
}

// ✅ After
const SessionCard = React.memo(function SessionCard({ session, onUpdate }) {
  // session이 변경될 때만 리렌더링
}, (prevProps, nextProps) => {
  return prevProps.session.id === nextProps.session.id &&
         prevProps.session.duration === nextProps.session.duration;
});
```

#### useMemo
```jsx
// ❌ Before
function Dashboard() {
  const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0);
  // 매 렌더링마다 계산
}

// ✅ After
function Dashboard() {
  const totalHours = useMemo(
    () => sessions.reduce((sum, s) => sum + s.duration, 0),
    [sessions]
  );
}
```

#### useCallback
```jsx
// ❌ Before
function StudyLog() {
  const handleSave = () => { /* ... */ };
  // 매 렌더링마다 새 함수 생성

  return <Form onSave={handleSave} />;
}

// ✅ After
function StudyLog() {
  const handleSave = useCallback(() => {
    /* ... */
  }, [dependencies]);

  return <Form onSave={handleSave} />;
}
```

### 측정 결과 템플릿

| 페이지 | 렌더링 시간 (Before) | 리렌더링 횟수 | 렌더링 시간 (After) | 개선율 | 평가 |
|--------|---------------------|--------------|-------------------|--------|------|
| Dashboard | - | - | - | - | - |
| StudyLog | - | - | - | - | - |
| Goals | - | - | - | - | - |
| OceanView | - | - | - | - | - |
| Metacognition | - | - | - | - | - |

### 주의사항

⚠️ **React.memo 남용 주의**
- Props 자주 변경: 오히려 느림
- 작은 컴포넌트: 불필요
- 측정 후 적용 필수

⚠️ **커스텀 비교 함수**
- 얕은 비교만으로 충분한지 확인
- 깊은 비교는 비용 높음
- lodash.isEqual 사용 고려

⚠️ **함수 Props**
- 부모에서 useCallback 필수
- 안 그러면 매번 새 함수 = memo 무용지물

⚠️ **객체/배열 Props**
- useMemo로 감싸기
- 또는 primitive 값만 전달

### 성능 측정 도구

#### 1. React DevTools Profiler
- 컴포넌트별 렌더링 시간
- 리렌더링 원인 파악

#### 2. Chrome DevTools Performance
- JavaScript 실행 시간
- 레이아웃/페인팅
- 메모리 사용량

#### 3. Lighthouse
- 전체 페이지 성능 점수
- Core Web Vitals
- 최적화 제안

#### 4. Web Vitals Extension
- 실시간 LCP/FID/CLS 모니터링
- 페이지 이동 시 자동 측정

### 최적화 우선순위

1. **Critical Path**
   - 초기 로딩에 영향
   - 사용자 인터랙션 차단
   - Core Web Vitals 저하

2. **User Experience**
   - 주요 사용자 플로우
   - 자주 사용하는 페이지
   - 입력/애니메이션 응답성

3. **Code Quality**
   - 메모리 누수
   - 불필요한 계산
   - 과도한 리렌더링

4. **Nice to Have**
   - 드물게 사용하는 기능
   - 작은 성능 개선
   - 코드 가독성 trade-off
