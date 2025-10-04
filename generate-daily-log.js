#!/usr/bin/env node

/**
 * 일자별 상세 개발 로그 생성 스크립트
 *
 * 기능:
 * - Git 커밋을 날짜별로 그룹화
 * - 각 날짜별 작업 내역 상세 분석
 * - 변경된 파일 목록과 통계
 * - 블로그 포스트 형식으로 출력
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = path.join(__dirname, 'lighthouse-app');
const OUTPUT_FILE = path.join(__dirname, 'DAILY_DEV_LOG.md');

// 날짜별 커밋 가져오기
const getCommitsByDate = (days = 30) => {
  try {
    // Use --format with custom delimiter to avoid multi-line body issues
    const commits = execSync(
      `git log --since="${days} days ago" --format="%cd|%h|%s|%an" --date=short`,
      { cwd: PROJECT_DIR, encoding: 'utf-8' }
    )
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const parts = line.split('|');
        const date = parts[0];
        const hash = parts[1];
        const subject = parts[2];
        const author = parts[3];
        return { date, hash, subject, author };
      });

    // 날짜별로 그룹화
    const groupedByDate = {};
    commits.forEach(commit => {
      if (!groupedByDate[commit.date]) {
        groupedByDate[commit.date] = [];
      }
      groupedByDate[commit.date].push(commit);
    });

    return groupedByDate;
  } catch (error) {
    return {};
  }
};

// 특정 커밋의 변경 파일 가져오기
const getChangedFiles = (hash) => {
  try {
    const files = execSync(`git show --stat --format="" ${hash}`, {
      cwd: PROJECT_DIR,
      encoding: 'utf-8'
    })
      .trim()
      .split('\n')
      .filter(line => line && !line.includes('file changed'))
      .map(line => {
        const match = line.match(/^\s*(.+?)\s+\|\s+(\d+)\s+([+\-]+)?/);
        if (match) {
          const [, file, changes, symbols] = match;
          const additions = (symbols?.match(/\+/g) || []).length;
          const deletions = (symbols?.match(/\-/g) || []).length;
          return { file, changes: parseInt(changes), additions, deletions };
        }
        return null;
      })
      .filter(Boolean);

    return files;
  } catch (error) {
    return [];
  }
};

// 커밋 diff 요약
const getCommitSummary = (hash) => {
  try {
    const stat = execSync(`git show --stat --format="" ${hash}`, {
      cwd: PROJECT_DIR,
      encoding: 'utf-8'
    }).trim();

    const lastLine = stat.split('\n').pop();
    const match = lastLine.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(\-\))?/);

    if (match) {
      return {
        filesChanged: parseInt(match[1]),
        insertions: parseInt(match[2] || 0),
        deletions: parseInt(match[3] || 0)
      };
    }
    return { filesChanged: 0, insertions: 0, deletions: 0 };
  } catch (error) {
    return { filesChanged: 0, insertions: 0, deletions: 0 };
  }
};

// 파일 타입별 분류
const categorizeFiles = (files) => {
  const categories = {
    components: [],
    pages: [],
    styles: [],
    utils: [],
    config: [],
    other: []
  };

  files.forEach(({ file }) => {
    if (file.includes('/components/')) categories.components.push(file);
    else if (file.includes('/pages/')) categories.pages.push(file);
    else if (file.includes('.css')) categories.styles.push(file);
    else if (file.includes('/utils/') || file.includes('/constants/')) categories.utils.push(file);
    else if (file.includes('package.json') || file.includes('vite.config') || file.includes('.config')) categories.config.push(file);
    else categories.other.push(file);
  });

  return categories;
};

// 날짜를 한글 형식으로 변환
const formatDateKorean = (dateStr) => {
  const date = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = days[date.getDay()];

  return `${dateStr} (${dayOfWeek})`;
};

// 블로그 포스트 생성
const generateDailyLog = (days = 30) => {
  const commitsByDate = getCommitsByDate(days);
  const dates = Object.keys(commitsByDate).sort().reverse(); // 최신순

  let markdown = `# 📅 Lighthouse 일자별 개발 로그

> **기간**: 최근 ${days}일
> **생성일**: ${new Date().toLocaleString('ko-KR')}

---

`;

  // 목차
  markdown += `## 📑 목차\n\n`;
  dates.forEach((date, index) => {
    const commits = commitsByDate[date];
    markdown += `${index + 1}. [${formatDateKorean(date)}](#${date}) - ${commits.length}개 커밋\n`;
  });
  markdown += `\n---\n\n`;

  // 각 날짜별 상세 로그
  dates.forEach((date, dateIndex) => {
    const commits = commitsByDate[date];
    const isToday = date === new Date().toISOString().split('T')[0];

    markdown += `## ${formatDateKorean(date)}\n\n`;
    if (isToday) markdown += `> 🎯 **오늘의 작업**\n\n`;

    // 날짜별 요약 통계
    let totalFiles = 0;
    let totalInsertions = 0;
    let totalDeletions = 0;

    commits.forEach(commit => {
      const summary = getCommitSummary(commit.hash);
      totalFiles += summary.filesChanged;
      totalInsertions += summary.insertions;
      totalDeletions += summary.deletions;
    });

    markdown += `### 📊 일일 통계\n\n`;
    markdown += `- **커밋 수**: ${commits.length}개\n`;
    markdown += `- **변경 파일**: ${totalFiles}개\n`;
    markdown += `- **추가**: +${totalInsertions}줄\n`;
    markdown += `- **삭제**: -${totalDeletions}줄\n\n`;

    // 각 커밋 상세
    markdown += `### 🔨 작업 내역\n\n`;

    commits.forEach((commit, commitIndex) => {
      const changedFiles = getChangedFiles(commit.hash);
      const summary = getCommitSummary(commit.hash);
      const categories = categorizeFiles(changedFiles);

      markdown += `#### ${commitIndex + 1}. ${commit.subject}\n\n`;
      markdown += `- **커밋**: \`${commit.hash}\`\n`;
      markdown += `- **변경**: ${summary.filesChanged}개 파일 `;
      if (summary.insertions > 0) markdown += `(+${summary.insertions} `;
      if (summary.deletions > 0) markdown += `-${summary.deletions})`;
      markdown += `\n\n`;

      // 변경 파일을 카테고리별로 표시
      if (changedFiles.length > 0) {
        markdown += `**변경된 파일**:\n\n`;

        if (categories.components.length > 0) {
          markdown += `- 🧩 **컴포넌트**\n`;
          categories.components.forEach(file => {
            markdown += `  - \`${file}\`\n`;
          });
        }

        if (categories.pages.length > 0) {
          markdown += `- 📄 **페이지**\n`;
          categories.pages.forEach(file => {
            markdown += `  - \`${file}\`\n`;
          });
        }

        if (categories.styles.length > 0) {
          markdown += `- 🎨 **스타일**\n`;
          categories.styles.forEach(file => {
            markdown += `  - \`${file}\`\n`;
          });
        }

        if (categories.utils.length > 0) {
          markdown += `- 🔧 **유틸/상수**\n`;
          categories.utils.forEach(file => {
            markdown += `  - \`${file}\`\n`;
          });
        }

        if (categories.config.length > 0) {
          markdown += `- ⚙️ **설정**\n`;
          categories.config.forEach(file => {
            markdown += `  - \`${file}\`\n`;
          });
        }

        if (categories.other.length > 0) {
          markdown += `- 📦 **기타**\n`;
          categories.other.forEach(file => {
            markdown += `  - \`${file}\`\n`;
          });
        }

        markdown += `\n`;
      }

      markdown += `---\n\n`;
    });

    // 날짜 구분선
    if (dateIndex < dates.length - 1) {
      markdown += `\n---\n\n`;
    }
  });

  // 전체 요약
  markdown += `\n## 📈 전체 요약\n\n`;
  markdown += `- **총 작업 일수**: ${dates.length}일\n`;
  markdown += `- **총 커밋 수**: ${dates.reduce((sum, date) => sum + commitsByDate[date].length, 0)}개\n`;

  let grandTotalFiles = 0;
  let grandTotalInsertions = 0;
  let grandTotalDeletions = 0;

  dates.forEach(date => {
    commitsByDate[date].forEach(commit => {
      const summary = getCommitSummary(commit.hash);
      grandTotalFiles += summary.filesChanged;
      grandTotalInsertions += summary.insertions;
      grandTotalDeletions += summary.deletions;
    });
  });

  markdown += `- **총 변경 파일**: ${grandTotalFiles}개\n`;
  markdown += `- **총 코드 변경**: +${grandTotalInsertions}줄 / -${grandTotalDeletions}줄\n\n`;

  markdown += `---\n\n`;
  markdown += `_자동 생성: ${new Date().toLocaleString('ko-KR')}_\n`;
  markdown += `_스크립트: generate-daily-log.js_\n`;

  return markdown;
};

// 메인 실행
const main = () => {
  console.log('📅 일자별 개발 로그 생성 중...\n');

  try {
    const days = process.argv[2] ? parseInt(process.argv[2]) : 30;
    const dailyLog = generateDailyLog(days);

    fs.writeFileSync(OUTPUT_FILE, dailyLog, 'utf-8');

    console.log('✅ 일자별 개발 로그 생성 완료!');
    console.log(`📄 파일: ${OUTPUT_FILE}\n`);

    // 미리보기
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(dailyLog.split('\n').slice(0, 30).join('\n'));
    console.log('...\n(생략)\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 사용법:');
    console.log('   node generate-daily-log.js [일수]');
    console.log('   예: node generate-daily-log.js 7  # 최근 7일\n');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
};

main();
