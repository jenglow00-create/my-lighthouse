// 시험 유형 대주제-소주제 구조
export const EXAM_CATEGORIES = [
  {
    id: 'language',
    name: '어학',
    icon: '🌍',
    description: '외국어 능력 시험',
    subcategories: [
      { id: 'TOEIC', name: 'TOEIC', description: '토익', defaultTarget: 800, maxScore: 990 },
      { id: 'TOEFL', name: 'TOEFL', description: '토플', defaultTarget: 90, maxScore: 120 },
      { id: 'IELTS', name: 'IELTS', description: '아이엘츠', defaultTarget: 6.5, maxScore: 9 },
      { id: 'TEPS', name: 'TEPS', description: '텝스', defaultTarget: 340, maxScore: 600 },
      { id: 'OPIc', name: 'OPIc', description: '오픽', defaultTarget: 'IH', maxScore: 'AL' },
      { id: 'JLPT', name: 'JLPT', description: '일본어능력시험', defaultTarget: 'N2', maxScore: 'N1' },
      { id: 'HSK', name: 'HSK', description: '한어수평고시', defaultTarget: 5, maxScore: 6 }
    ]
  },
  {
    id: 'certification',
    name: '자격증',
    icon: '📜',
    description: '각종 자격증 시험',
    subcategories: [
      { id: 'Korean History 1', name: '한국사능력검정 1급', description: '한국사 1급', defaultTarget: 80, maxScore: 100 },
      { id: 'Korean History 2', name: '한국사능력검정 2급', description: '한국사 2급', defaultTarget: 70, maxScore: 100 },
      { id: 'Computer 1', name: '컴퓨터활용능력 1급', description: '컴활 1급', defaultTarget: 70, maxScore: 100 },
      { id: 'Computer 2', name: '컴퓨터활용능력 2급', description: '컴활 2급', defaultTarget: 70, maxScore: 100 },
      { id: 'ITQ', name: 'ITQ', description: 'IT 활용능력', defaultTarget: 500, maxScore: 500 },
      { id: 'MOS', name: 'MOS', description: 'Microsoft Office Specialist', defaultTarget: 700, maxScore: 1000 },
      { id: 'Accounting', name: '회계관리', description: '회계관리 자격증', defaultTarget: 70, maxScore: 100 },
      { id: 'CPA', name: 'CPA', description: '공인회계사', defaultTarget: 60, maxScore: 100 }
    ]
  },
  {
    id: 'public',
    name: '공기업',
    icon: '🏢',
    description: '공기업 채용 시험',
    subcategories: [
      { id: 'NCS', name: 'NCS (직업기초능력)', description: 'NCS 직업기초능력평가', defaultTarget: 70, maxScore: 100 },
      { id: 'Major', name: '전공', description: '전공 필기시험', defaultTarget: 70, maxScore: 100 },
      { id: 'Essay', name: '논술', description: '논술형 시험', defaultTarget: 70, maxScore: 100 },
      { id: 'PSAT', name: 'PSAT', description: '공직적격성평가', defaultTarget: 70, maxScore: 100 }
    ]
  },
  {
    id: 'civil',
    name: '공무원',
    icon: '👔',
    description: '공무원 시험',
    subcategories: [
      { id: 'Civil 9', name: '9급 공무원', description: '9급 공무원 시험', defaultTarget: 60, maxScore: 100 },
      { id: 'Civil 7', name: '7급 공무원', description: '7급 공무원 시험', defaultTarget: 60, maxScore: 100 },
      { id: 'Local Civil', name: '지방직 공무원', description: '지방직 공무원 시험', defaultTarget: 60, maxScore: 100 },
      { id: 'Police', name: '경찰공무원', description: '경찰공무원 시험', defaultTarget: 60, maxScore: 100 },
      { id: 'Fire', name: '소방공무원', description: '소방공무원 시험', defaultTarget: 60, maxScore: 100 }
    ]
  },
  {
    id: 'university',
    name: '대학/대학원',
    icon: '🎓',
    description: '입학 시험',
    subcategories: [
      { id: 'SAT', name: 'SAT', description: '미국 대학 입학 시험', defaultTarget: 1400, maxScore: 1600 },
      { id: 'ACT', name: 'ACT', description: '미국 대학 입학 시험', defaultTarget: 28, maxScore: 36 },
      { id: 'GRE', name: 'GRE', description: '대학원 입학 시험', defaultTarget: 320, maxScore: 340 },
      { id: 'GMAT', name: 'GMAT', description: '경영대학원 입학 시험', defaultTarget: 650, maxScore: 800 },
      { id: 'LEET', name: 'LEET', description: '법학적성시험', defaultTarget: 130, maxScore: 180 },
      { id: 'MEET', name: 'MEET/DEET', description: '의치학전문대학원 입학 시험', defaultTarget: 40, maxScore: 50 }
    ]
  },
  {
    id: 'other',
    name: '기타',
    icon: '📝',
    description: '사용자 지정 시험',
    subcategories: [
      { id: 'Custom', name: '직접 입력', description: '사용자 정의 시험', defaultTarget: 100, maxScore: 100 }
    ]
  }
]

// 카테고리 ID로 카테고리 찾기
export const getCategoryById = (categoryId) => {
  return EXAM_CATEGORIES.find(cat => cat.id === categoryId)
}

// 시험 유형 ID로 시험 유형 찾기 (모든 카테고리 검색)
export const getExamTypeById = (examTypeId) => {
  for (const category of EXAM_CATEGORIES) {
    const examType = category.subcategories.find(sub => sub.id === examTypeId)
    if (examType) {
      return { ...examType, categoryId: category.id, categoryName: category.name }
    }
  }
  return null
}

// 구버전 호환성을 위한 매핑
export const LEGACY_EXAM_TYPE_MAP = {
  'TOEIC': 'TOEIC',
  'TOEFL': 'TOEFL',
  'IELTS': 'IELTS',
  'Korean History': 'Korean History 1',
  'Civil Service': 'Civil 9',
  'SAT': 'SAT',
  'GRE': 'GRE',
  'Other': 'Custom'
}

// 구버전 시험 유형을 새 시험 유형으로 변환
export const migrateLegacyExamType = (oldExamType) => {
  return LEGACY_EXAM_TYPE_MAP[oldExamType] || oldExamType
}

// 모든 시험 유형을 플랫 리스트로 가져오기 (검색/필터용)
export const getAllExamTypes = () => {
  const allTypes = []
  EXAM_CATEGORIES.forEach(category => {
    category.subcategories.forEach(sub => {
      allTypes.push({
        ...sub,
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon
      })
    })
  })
  return allTypes
}
