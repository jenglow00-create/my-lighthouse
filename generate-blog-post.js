#!/usr/bin/env node

/**
 * 개발 현황을 블로그 포스트로 자동 생성하는 스크립트
 *
 * 기능:
 * - Git 커밋 히스토리 분석
 * - 변경된 파일 통계
 * - 자동 날짜 업데이트
 * - 마크다운 형식으로 출력
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = path.join(__dirname, 'lighthouse-app');
const OUTPUT_FILE = path.join(__dirname, 'BLOG_POST_LATEST.md');

// Git 정보 수집
const getGitCommits = (count = 10) => {
  try {
    const commits = execSync(`git log -${count} --format="%h|%s|%ar|%an"`, {
      cwd: PROJECT_DIR,
      encoding: 'utf-8'
    })
      .trim()
      .split('\n')
      .map(line => {
        const [hash, subject, relativeDate, author] = line.split('|');
        return { hash, subject, relativeDate, author };
      });
    return commits;
  } catch (error) {
    return [];
  }
};

// 파일 통계
const getFileStats = () => {
  try {
    const srcDir = path.join(PROJECT_DIR, 'src');

    const jsFiles = parseInt(
      execSync(`find ${srcDir} -name "*.js" -o -name "*.jsx" | wc -l`, {
        encoding: 'utf-8'
      }).trim()
    );

    const cssFiles = parseInt(
      execSync(`find ${srcDir} -name "*.css" | wc -l`, {
        encoding: 'utf-8'
      }).trim()
    );

    const totalLines = parseInt(
      execSync(`find ${srcDir} -name "*.js" -o -name "*.jsx" -exec cat {} + | wc -l`, {
        encoding: 'utf-8'
      }).trim()
    );

    const components = execSync(`find ${srcDir}/components -name "*.jsx" 2>/dev/null | wc -l`, {
      encoding: 'utf-8'
    }).trim();

    const pages = execSync(`find ${srcDir}/pages -name "*.jsx" 2>/dev/null | wc -l`, {
      encoding: 'utf-8'
    }).trim();

    return { jsFiles, cssFiles, totalLines, components, pages };
  } catch (error) {
    return { jsFiles: 0, cssFiles: 0, totalLines: 0, components: 0, pages: 0 };
  }
};

// 최근 변경사항 분석
const getRecentChanges = () => {
  try {
    const diffStat = execSync('git diff --stat HEAD~5..HEAD', {
      cwd: PROJECT_DIR,
      encoding: 'utf-8'
    }).trim();

    const changedFiles = execSync('git diff --name-only HEAD~5..HEAD', {
      cwd: PROJECT_DIR,
      encoding: 'utf-8'
    })
      .trim()
      .split('\n')
      .filter(f => f);

    return { diffStat, changedFiles };
  } catch (error) {
    return { diffStat: '', changedFiles: [] };
  }
};

// 블로그 포스트 생성
const generateBlogPost = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const commits = getGitCommits(10);
  const stats = getFileStats();
  const changes = getRecentChanges();

  const latestCommit = commits[0];

  const blogPost = `# 🏮 Lighthouse 개발 일지 - ${dateStr}

> **최신 업데이트**: ${latestCommit ? latestCommit.subject : 'N/A'}

---

## 📊 프로젝트 현황

### 코드 통계
- **총 코드 라인**: ${stats.totalLines.toLocaleString()}줄
- **컴포넌트**: ${stats.components}개
- **페이지**: ${stats.pages}개
- **JS/JSX 파일**: ${stats.jsFiles}개
- **CSS 파일**: ${stats.cssFiles}개

### 최근 활동
- **마지막 커밋**: ${latestCommit ? `${latestCommit.relativeDate} (${latestCommit.hash})` : 'N/A'}
- **최근 5개 커밋 변경**: ${changes.changedFiles.length}개 파일

---

## 🔄 최근 커밋 히스토리

${commits
  .slice(0, 5)
  .map(
    (commit, i) =>
      `${i + 1}. **[${commit.hash}]** ${commit.subject} _(${commit.relativeDate})_`
  )
  .join('\n')}

---

## 📝 최근 변경사항

\`\`\`
${changes.diffStat || '변경사항 없음'}
\`\`\`

### 변경된 파일
${changes.changedFiles.length > 0 ? changes.changedFiles.map(f => `- ${f}`).join('\n') : '_변경사항 없음_'}

---

## 🎯 현재 완료된 주요 기능

### ✅ 핵심 기능
- **오션뷰 애니메이션**: 진도에 따라 바다 위를 항해하는 보트
- **6단계 성찰 시스템**: 체계적인 학습 성찰 프로세스
- **31개 시험 유형 지원**: 어학, 자격증, 공기업, 공무원, 대학 등
- **성찰 히스토리**: 검색, 필터링, 정렬 기능
- **과목별 목표 관리**: 시험일, 목표 점수 추적

### ✅ 기술적 특징
- **완전 오프라인 작동**: localStorage 기반
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- **부드러운 애니메이션**: GPU 가속 CSS transform
- **확장 가능한 구조**: 모듈 기반 설계

---

## 🚧 진행 중인 작업

### 이번 주 목표
- [ ] 시험 유형별 통계 대시보드
- [ ] 다크 모드 테마
- [ ] PWA 설정

### 다음 스프린트
- [ ] Firebase 연동 (클라우드 동기화)
- [ ] 학습 패턴 분석 기능
- [ ] 친구 초대 및 공유

---

## 💡 최근 개발 인사이트

### ${latestCommit?.subject || '최근 작업'}

${
  latestCommit?.subject.includes('성찰')
    ? `성찰 시스템을 개선했습니다. 사용자가 입력한 모든 정보를 확인할 수 있도록 히스토리 페이지를 전면 재설계했습니다. 이제 회상 내용, 교재 확인 결과, 학습 계획 등을 한눈에 볼 수 있습니다.`
    : latestCommit?.subject.includes('시험')
    ? `시험 유형 시스템을 계층적 구조로 재설계했습니다. 6개 대주제와 31개 소주제로 분류하여 사용자가 더 쉽게 시험을 선택할 수 있도록 개선했습니다.`
    : `최근 작업을 통해 사용자 경험을 개선하고 코드 품질을 높였습니다.`
}

---

## 🔗 링크

- **GitHub**: [jenglow00-create/my-lighthouse](https://github.com/jenglow00-create/my-lighthouse)
- **개발 서버**: \`http://localhost:5000/\`

---

## 📅 다음 업데이트

다음 개발 일지는 주요 기능 추가 시 업데이트됩니다.

**예상 다음 주제**:
- 시험 유형별 학습 통계
- 다크 모드 구현
- PWA 전환 과정

---

_자동 생성 일시: ${now.toLocaleString('ko-KR')}_
_스크립트: generate-blog-post.js_
`;

  return blogPost;
};

// 메인 실행
const main = () => {
  console.log('🏮 블로그 포스트 생성 중...\n');

  try {
    const blogPost = generateBlogPost();

    fs.writeFileSync(OUTPUT_FILE, blogPost, 'utf-8');

    console.log('✅ 블로그 포스트 생성 완료!');
    console.log(`📄 파일: ${OUTPUT_FILE}\n`);

    // 미리보기 출력
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(blogPost.split('\n').slice(0, 20).join('\n'));
    console.log('...\n(생략)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 Notion에 업로드하려면:');
    console.log('   node update-notion-api.js\n');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
};

main();
