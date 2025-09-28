# Assets 폴더

이 폴더는 등대 학습 앱에서 사용되는 정적 자원들을 저장합니다.

## 폴더 구조

```
assets/
├── images/
│   ├── backgrounds/    # 배경 이미지들
│   ├── icons/         # 아이콘 이미지들
│   ├── logos/         # 로고 및 브랜딩 이미지들
│   └── screenshots/   # 스크린샷 및 예시 이미지들
└── README.md
```

## 사용 방법

### 이미지 가져오기
```javascript
// 상대 경로로 이미지 가져오기
import backgroundImage from '../assets/images/backgrounds/ocean-background.jpg'
import logoImage from '../assets/images/logos/lighthouse-logo.png'

// 컴포넌트에서 사용
function MyComponent() {
  return (
    <div style={{ backgroundImage: `url(${backgroundImage})` }}>
      <img src={logoImage} alt="등대 로고" />
    </div>
  )
}
```

### public 폴더와의 차이점
- `src/assets`: 빌드 시 웹팩으로 처리되는 이미지들 (최적화됨)
- `public`: 빌드 없이 직접 제공되는 이미지들

## 지원되는 이미지 형식
- JPG/JPEG
- PNG
- SVG
- WebP
- GIF

## 명명 규칙
- 파일명은 kebab-case로 작성 (예: `ocean-background.jpg`)
- 의미있는 이름 사용
- 크기나 용도를 포함할 수 있음 (예: `logo-small.png`, `hero-image-large.jpg`)

## 이미지 최적화 권장사항
- 배경 이미지: 1920x1080 이하 권장
- 아이콘: SVG 형식 권장, PNG의 경우 24x24, 48x48, 96x96 크기
- 로고: SVG 또는 고해상도 PNG
- 웹 최적화된 포맷 사용 (WebP 권장)

## 사용 예시
이 폴더에 첫 번째 화면용 이미지들을 추가하고 다음과 같이 사용할 수 있습니다:

```javascript
// OceanView.jsx에서 배경 이미지 사용
import oceanBg from '../assets/images/backgrounds/ocean-waves.jpg'

function OceanView() {
  return (
    <div
      className="ocean-view"
      style={{ backgroundImage: `url(${oceanBg})` }}
    >
      {/* 컨텐츠 */}
    </div>
  )
}
```