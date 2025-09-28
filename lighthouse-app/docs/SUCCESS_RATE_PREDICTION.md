# 합격률 예측 시스템 설계

## 개요
이 문서는 등대 학습 앱의 합격률 예측 기능 구현을 위한 설계 문서입니다. 현재는 데이터 수집 단계이며, 추후 머신러닝 모델을 통해 개인화된 합격률 예측을 제공할 예정입니다.

## 현재 상태
- ✅ 데이터 수집 시스템 구축 완료
- ✅ 자동 데이터 수집 로직 구현
- ✅ 데이터 내보내기 기능 구현
- ❌ 합격률 예측 기능 (임시 비활성화)
- ❌ 머신러닝 모델 (미구현)

## 데이터 수집 체계

### 1. 학습 패턴 데이터 (`learning-pattern-data`)
```javascript
{
  userId: string,
  timestamp: string,
  totalStudyHours: number,
  studyTypeDistribution: {
    concept: number,    // 개념 이해 시간
    practice: number,   // 문제 풀이 시간
    memorize: number,   // 암기 시간
    review: number      // 복습 시간
  },
  learningConsistency: {
    uniqueStudyDays: number,        // 총 학습 일수
    maxConsecutiveDays: number,     // 최대 연속 학습 일수
    averageSessionsPerDay: number   // 일평균 세션 수
  },
  averageMetrics: {
    concentration: number,  // 평균 집중도 (1-5)
    understanding: number,  // 평균 이해도 (1-5)
    fatigue: number        // 평균 피로도 (1-5)
  },
  weeklyPattern: {
    dayOfWeekHours: number[],      // 요일별 학습 시간
    weekendVsWeekday: {
      weekend: number,
      weekday: number
    }
  },
  totalSessions: number,
  studyPeriodDays: number
}
```

### 2. 점수 진행 데이터 (`score-progress-data`)
```javascript
{
  userId: string,
  timestamp: string,
  subjects: {
    [subjectId]: {
      subjectName: string,
      examType: string,
      targetScore: number,
      currentScore: number,
      scoreHistory: Array<{
        score: number,
        date: string
      }>,
      scoreImprovement: {
        absolute: number,      // 절대 점수 향상
        percentage: number,    // 백분율 향상
        averagePerTest: number // 시험당 평균 향상
      },
      scoreStability: number,  // 점수 안정성 (표준편차)
      daysToExam: number,
      progressVelocity: {
        dailyVelocity: number,        // 일일 점수 향상률
        estimatedDaysToTarget: number // 목표 달성 예상 일수
      }
    }
  }
}
```

### 3. 개인 특성 데이터 (`personal-characteristics-data`)
```javascript
{
  userId: string,
  timestamp: string,
  occupation: string,           // 'student' | 'worker' | 'fulltime'
  dailyStudyHours: number,     // 하루 가능 학습 시간
  reflectionParticipation: number, // 성찰 참여 횟수
  reflectionFrequency: number,     // 성찰 빈도
  accountAge: number,              // 계정 생성 후 경과 일수
  subjects: Array<{
    examType: string,
    targetScore: number,
    targetHours: number
  }>
}
```

### 4. 예측용 특성 데이터 (`prediction-data`)
```javascript
{
  userId: string,
  timestamp: string,
  features: {
    // 학습 패턴 특성
    totalHours: number,
    avgConcentration: number,
    avgUnderstanding: number,
    avgFatigue: number,
    studyConsistency: number,
    sessionFrequency: number,

    // 개인 특성
    dailyStudyCapacity: number,
    accountAge: number,
    reflectionEngagement: number,

    // 점수 관련 특성
    scoreImprovement: number,
    scoreStability: number,
    progressVelocity: number,
    daysToExam: number
  }
}
```

## 데이터 수집 시점

1. **자동 수집**
   - 5회 학습 세션마다
   - 점수 기록 시
   - 중요한 학습 마일스톤 달성 시

2. **수동 수집**
   - 설정 페이지에서 수동 내보내기

## 합격률 예측 모델 구현 계획

### 1단계: 기초 통계 모델
- 간단한 선형 회귀 모델
- 주요 특성: 총 학습시간, 평균 점수 향상률, 남은 시간
- 시험 유형별 기본 합격률 데이터베이스 구축

### 2단계: 고급 머신러닝 모델
- Random Forest 또는 Gradient Boosting
- 더 많은 특성 활용
- 교차 검증을 통한 모델 성능 평가

### 3단계: 딥러닝 모델 (선택사항)
- 충분한 데이터가 확보되면 신경망 모델 고려
- 시계열 데이터 활용한 LSTM 모델

## 예상 특성 중요도

1. **높은 중요도**
   - 점수 향상 속도 (progressVelocity)
   - 학습 일관성 (studyConsistency)
   - 남은 시간 (daysToExam)
   - 현재 점수와 목표 점수 차이

2. **중간 중요도**
   - 총 학습 시간 (totalHours)
   - 평균 이해도 (avgUnderstanding)
   - 학습 유형별 분포
   - 개인 직업 특성

3. **낮은 중요도**
   - 성찰 참여도
   - 요일별 학습 패턴
   - 계정 생성 후 경과 시간

## 구현 우선순위

### 우선순위 1: 기본 예측 시스템
```javascript
// 간단한 합격률 계산 공식
const calculateBasicSuccessRate = (features) => {
  const {
    progressVelocity,
    daysToExam,
    scoreImprovement,
    studyConsistency
  } = features

  // 기본 합격률 (시험 유형별)
  let baseRate = getBaseSuccessRate(examType)

  // 점수 향상률에 따른 조정
  if (progressVelocity > 0 && daysToExam > 0) {
    const projectedScore = currentScore + (progressVelocity * daysToExam)
    if (projectedScore >= targetScore) {
      baseRate += 20
    }
  }

  // 학습 일관성에 따른 조정
  baseRate += Math.min(studyConsistency * 2, 15)

  // 점수 향상 추세에 따른 조정
  baseRate += Math.min(scoreImprovement, 10)

  return Math.min(Math.max(baseRate, 10), 95)
}
```

### 우선순위 2: 데이터 기반 모델
- 수집된 데이터를 이용한 회귀 모델
- 교차 검증을 통한 모델 검증
- A/B 테스트를 통한 예측 정확도 개선

### 우선순위 3: 고도화
- 외부 벤치마크 데이터 통합
- 실시간 모델 업데이트
- 설명 가능한 AI (XAI) 적용

## 데이터 활용 방안

### 1. 개인화된 학습 추천
- 부족한 학습 유형 식별
- 최적 학습 시간 추천
- 점수 향상을 위한 액션 아이템 제안

### 2. 목표 설정 지원
- 현실적인 목표 점수 제안
- 목표 달성을 위한 필요 학습 시간 계산
- 일정 조정 제안

### 3. 동기부여 강화
- 유사한 패턴의 성공 사례 제시
- 개인별 강점 분석
- 성취 가능한 단기 목표 제시

## 주의사항

1. **데이터 프라이버시**
   - 개인 식별 정보 제거
   - 로컬 저장 우선 (서버 전송 시 암호화)
   - 사용자 동의 하에만 데이터 수집

2. **예측 정확도**
   - 예측은 참고용이며 절대적이지 않음을 명시
   - 불확실성 구간과 함께 제시
   - 정기적인 모델 성능 평가

3. **사용자 경험**
   - 예측 결과가 스트레스를 주지 않도록 주의
   - 긍정적인 메시지와 함께 제시
   - 사용자가 예측 기능을 끄고 켤 수 있도록 설정

## 다음 단계

1. **데이터 수집 모니터링**
   - 현재 수집되는 데이터 품질 확인
   - 필요한 추가 데이터 포인트 식별

2. **외부 데이터 조사**
   - 시험 유형별 공식 통계 데이터 수집
   - 유사 서비스의 벤치마크 데이터 조사

3. **프로토타입 개발**
   - 간단한 예측 모델 프로토타입 구현
   - 소규모 사용자 그룹에서 테스트

4. **성능 평가 체계 구축**
   - 예측 정확도 측정 방법 정의
   - 실제 시험 결과와의 비교 시스템 구축