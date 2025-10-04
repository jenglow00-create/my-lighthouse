#!/usr/bin/env node

/**
 * Notion 2개 페이지 동시 업데이트 스크립트
 * - 페이지 1: 개발 현황 (실시간 통계)
 * - 페이지 2: 개발일지 (블로그 형식)
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 일자별 커밋 데이터 가져오기
const getCommitsByDate = (cwd, days = 7) => {
  try {
    const commits = execSync(
      `git log --since="${days} days ago" --format="%cd|%h|%s|%an" --date=short`,
      { cwd, encoding: 'utf-8' }
    )
      .trim()
      .split('\n')
      .filter(line => line)
      .map(line => {
        const parts = line.split('|');
        return {
          date: parts[0],
          hash: parts[1],
          subject: parts[2],
          author: parts[3]
        };
      });

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

// 날짜 한글 포맷
const formatDateKorean = (dateStr) => {
  const date = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${dateStr} (${days[date.getDay()]})`;
};

// 설정 파일 로드
const configPath = path.join(__dirname, 'lighthouse-app', '.notion-config');

if (!fs.existsSync(configPath)) {
  console.error('❌ .notion-config 파일이 없습니다.');
  console.error('setup-notion.sh를 실행하여 설정하세요.\n');
  process.exit(1);
}

const configContent = fs.readFileSync(configPath, 'utf-8');
const config = {};

configContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...values] = line.split('=');
    config[key.trim()] = values.join('=').trim();
  }
});

const NOTION_API_KEY = config.NOTION_API_KEY;
const NOTION_PAGE_ID_STATUS = config.NOTION_PAGE_ID_STATUS;
const NOTION_PAGE_ID_BLOG = config.NOTION_PAGE_ID_BLOG;

if (!NOTION_API_KEY || !NOTION_PAGE_ID_STATUS || !NOTION_PAGE_ID_BLOG) {
  console.error('❌ 설정이 완전하지 않습니다.');
  console.error('필요한 값: NOTION_API_KEY, NOTION_PAGE_ID_STATUS, NOTION_PAGE_ID_BLOG\n');
  process.exit(1);
}

// Notion 클라이언트 초기화
const notion = new Client({ auth: NOTION_API_KEY });

// Git 정보 수집
const getGitInfo = () => {
  try {
    const projectDir = path.join(__dirname, 'lighthouse-app');

    const lastCommit = execSync('git log -1 --format="%h - %s (%ar)"', {
      cwd: projectDir,
      encoding: 'utf-8'
    }).trim();

    const uncommittedFiles = execSync('git status --short', {
      cwd: projectDir,
      encoding: 'utf-8'
    }).trim().split('\n').filter(l => l).length;

    const branch = execSync('git branch --show-current', {
      cwd: projectDir,
      encoding: 'utf-8'
    }).trim();

    const commits = execSync('git log -5 --format="%h|%s|%ar"', {
      cwd: projectDir,
      encoding: 'utf-8'
    }).trim().split('\n').map(line => {
      const [hash, subject, date] = line.split('|');
      return { hash, subject, date };
    });

    return { lastCommit, uncommittedFiles, branch, commits };
  } catch (error) {
    return { lastCommit: 'N/A', uncommittedFiles: 0, branch: 'N/A', commits: [] };
  }
};

// 프로젝트 통계 수집
const getProjectStats = () => {
  try {
    const srcDir = path.join(__dirname, 'lighthouse-app', 'src');

    const totalFiles = parseInt(execSync(
      `find ${srcDir} -type f \\( -name "*.js" -o -name "*.jsx" -o -name "*.css" \\) | wc -l`,
      { encoding: 'utf-8' }
    ).trim());

    const totalLines = parseInt(execSync(
      `find ${srcDir} -type f \\( -name "*.js" -o -name "*.jsx" \\) -exec cat {} + | wc -l`,
      { encoding: 'utf-8' }
    ).trim());

    const components = parseInt(execSync(
      `find ${srcDir}/components -name "*.jsx" 2>/dev/null | wc -l`,
      { encoding: 'utf-8' }
    ).trim());

    const pages = parseInt(execSync(
      `find ${srcDir}/pages -name "*.jsx" 2>/dev/null | wc -l`,
      { encoding: 'utf-8' }
    ).trim());

    return { totalFiles, totalLines, components, pages };
  } catch (error) {
    return { totalFiles: 0, totalLines: 0, components: 0, pages: 0 };
  }
};

// 페이지 1: 개발 현황 블록 생성
const createStatusBlocks = (gitInfo, stats) => {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  return [
    {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [{ type: 'text', text: { content: '🏮 Lighthouse 개발 현황' } }]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { type: 'text', text: { content: '📅 업데이트: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: now } }
        ]
      }
    },
    {
      object: 'block',
      type: 'divider',
      divider: {}
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '📊 프로젝트 통계' } }]
      }
    },
    {
      object: 'block',
      type: 'table',
      table: {
        table_width: 2,
        has_column_header: true,
        has_row_header: false,
        children: [
          {
            object: 'block',
            type: 'table_row',
            table_row: {
              cells: [
                [{ type: 'text', text: { content: '항목' }, annotations: { bold: true } }],
                [{ type: 'text', text: { content: '값' }, annotations: { bold: true } }]
              ]
            }
          },
          {
            object: 'block',
            type: 'table_row',
            table_row: {
              cells: [
                [{ type: 'text', text: { content: '총 코드 라인' } }],
                [{ type: 'text', text: { content: `${stats.totalLines.toLocaleString()}줄` }, annotations: { bold: true, color: 'blue' } }]
              ]
            }
          },
          {
            object: 'block',
            type: 'table_row',
            table_row: {
              cells: [
                [{ type: 'text', text: { content: '컴포넌트' } }],
                [{ type: 'text', text: { content: `${stats.components}개` } }]
              ]
            }
          },
          {
            object: 'block',
            type: 'table_row',
            table_row: {
              cells: [
                [{ type: 'text', text: { content: '페이지' } }],
                [{ type: 'text', text: { content: `${stats.pages}개` } }]
              ]
            }
          },
          {
            object: 'block',
            type: 'table_row',
            table_row: {
              cells: [
                [{ type: 'text', text: { content: '미커밋 파일' } }],
                [{ type: 'text', text: { content: `${gitInfo.uncommittedFiles}개` }, annotations: { color: gitInfo.uncommittedFiles > 0 ? 'orange' : 'green' } }]
              ]
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'divider',
      divider: {}
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🔄 최근 커밋' } }]
      }
    },
    ...gitInfo.commits.slice(0, 5).map(commit => ({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: `[${commit.hash}] ` }, annotations: { code: true } },
          { type: 'text', text: { content: commit.subject } },
          { type: 'text', text: { content: ` (${commit.date})` }, annotations: { italic: true } }
        ]
      }
    })),
    {
      object: 'block',
      type: 'divider',
      divider: {}
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { emoji: '🚀' },
        rich_text: [
          { type: 'text', text: { content: '개발 서버: ' } },
          { type: 'text', text: { content: 'http://localhost:5000/', link: { url: 'http://localhost:5000/' } } }
        ],
        color: 'blue_background'
      }
    }
  ];
};

// 페이지 2: 개발일지 블록 생성
const createBlogBlocks = (gitInfo, stats) => {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const blocks = [
    {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [{ type: 'text', text: { content: '🏮 Lighthouse 개발일지' } }]
      }
    },
    {
      object: 'block',
      type: 'quote',
      quote: {
        rich_text: [
          { type: 'text', text: { content: '최신 업데이트: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: gitInfo.commits[0]?.subject || 'N/A' } }
        ],
        color: 'gray_background'
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { type: 'text', text: { content: '업데이트 일시: ' }, annotations: { italic: true } },
          { type: 'text', text: { content: now }, annotations: { italic: true } }
        ]
      }
    },
    {
      object: 'block',
      type: 'divider',
      divider: {}
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '📊 현재 상태' } }]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { type: 'text', text: { content: `총 ${stats.totalLines.toLocaleString()}줄의 코드로 구성된 Lighthouse 앱은 현재 ${stats.pages}개의 주요 페이지와 ${stats.components}개의 재사용 가능한 컴포넌트로 이루어져 있습니다.` } }
        ]
      }
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🎯 완료된 주요 기능' } }]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: '오션뷰 애니메이션 ✨' }, annotations: { bold: true } }]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: '6단계 성찰 시스템 🧠' } }]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: '31개 시험 유형 지원 📚' } }]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: '성찰 히스토리 검색/필터 🔍' } }]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: '모바일 완전 지원 📱' } }]
      }
    },
    {
      object: 'block',
      type: 'divider',
      divider: {}
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '💡 최근 개발 하이라이트' } }]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { type: 'text', text: { content: gitInfo.commits[0]?.subject || '최근 작업 내용이 여기에 표시됩니다.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '최근 5개 커밋 보기' } }],
        children: gitInfo.commits.slice(0, 5).map(commit => ({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              { type: 'text', text: { content: `${commit.hash} ` }, annotations: { code: true } },
              { type: 'text', text: { content: commit.subject } },
              { type: 'text', text: { content: ` - ${commit.date}` }, annotations: { italic: true } }
            ]
          }
        }))
      }
    },
    {
      object: 'block',
      type: 'divider',
      divider: {}
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '📅 일자별 개발 로그' } }]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: '최근 7일간의 개발 활동을 날짜별로 정리했습니다.' }, annotations: { italic: true } }]
      }
    }
  ];

  // 일자별 로그 추가
  const projectDir = path.join(__dirname, 'lighthouse-app');
  const commitsByDate = getCommitsByDate(projectDir, 7);
  const dates = Object.keys(commitsByDate).sort().reverse();

  dates.forEach(date => {
    const commits = commitsByDate[date];
    const isToday = date === new Date().toISOString().split('T')[0];

    // 날짜 제목
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [
          { type: 'text', text: { content: isToday ? '🎯 ' : '📆 ' } },
          { type: 'text', text: { content: formatDateKorean(date) }, annotations: { bold: true } }
        ]
      }
    });

    // 커밋 목록
    commits.forEach((commit, index) => {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { type: 'text', text: { content: `[${commit.hash}] ` }, annotations: { code: true } },
            { type: 'text', text: { content: commit.subject } }
          ]
        }
      });
    });
  });

  // 향후 계획 체크리스트
  blocks.push(
    {
      object: 'block',
      type: 'divider',
      divider: {}
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🎯 향후 개발 계획' } }]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: '다음 단계로 진행할 주요 기능들입니다.' }, annotations: { italic: true } }]
      }
    },
    {
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [{ type: 'text', text: { content: 'AI 학습 분석 기능 고도화' }, annotations: { bold: true } }],
        checked: false
      }
    },
    {
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [{ type: 'text', text: { content: '성취도 시각화 차트 개선' } }],
        checked: false
      }
    },
    {
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [{ type: 'text', text: { content: '목표 달성률 예측 알고리즘 구현' } }],
        checked: false
      }
    },
    {
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [{ type: 'text', text: { content: '학습 데이터 백업 및 내보내기 기능' } }],
        checked: false
      }
    },
    {
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [{ type: 'text', text: { content: '다크 모드 지원' } }],
        checked: false
      }
    },
    {
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [{ type: 'text', text: { content: 'PWA 변환 (오프라인 지원)' } }],
        checked: false
      }
    },
    {
      object: 'block',
      type: 'divider',
      divider: {}
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '📝 다음 작업 시 참고사항' } }]
      }
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { emoji: '💡' },
        rich_text: [
          { type: 'text', text: { content: '개발 환경 설정\n' }, annotations: { bold: true } },
          { type: 'text', text: { content: '• 개발 서버: ' } },
          { type: 'text', text: { content: 'npm run dev' }, annotations: { code: true } },
          { type: 'text', text: { content: ' (포트 5000)\n' } },
          { type: 'text', text: { content: '• Notion 업데이트: ' } },
          { type: 'text', text: { content: 'npm run notion' }, annotations: { code: true } },
          { type: 'text', text: { content: '\n• Git 커밋 시 자동으로 Notion 업데이트됨 (post-commit hook)' } }
        ],
        color: 'blue_background'
      }
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { emoji: '⚠️' },
        rich_text: [
          { type: 'text', text: { content: '주의사항\n' }, annotations: { bold: true } },
          { type: 'text', text: { content: '• localStorage 기반이므로 브라우저 데이터 삭제 시 주의\n' } },
          { type: 'text', text: { content: '• 미커밋 파일: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: `${gitInfo.uncommittedFiles}개` }, annotations: { color: gitInfo.uncommittedFiles > 0 ? 'orange' : 'green' } },
          { type: 'text', text: { content: '\n• 모바일 테스트 시 vite.config.js의 host 설정 확인 필요' } }
        ],
        color: 'orange_background'
      }
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { emoji: '🔧' },
        rich_text: [
          { type: 'text', text: { content: '최근 작업 컨텍스트\n' }, annotations: { bold: true } },
          { type: 'text', text: { content: `• 최종 커밋: ${gitInfo.commits[0]?.subject || 'N/A'}\n` } },
          { type: 'text', text: { content: `• 작업 날짜: ${gitInfo.commits[0]?.date || 'N/A'}\n` } },
          { type: 'text', text: { content: '• 핵심 시스템: 오션뷰 애니메이션, 성찰 시스템, 시험 유형 관리\n' } },
          { type: 'text', text: { content: '• 주요 파일: ' } },
          { type: 'text', text: { content: 'src/pages/OceanView.jsx, src/pages/Metacognition.jsx' }, annotations: { code: true } }
        ],
        color: 'gray_background'
      }
    },
    {
      object: 'block',
      type: 'divider',
      divider: {}
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { emoji: '🔗' },
        rich_text: [
          { type: 'text', text: { content: 'GitHub: ' } },
          {
            type: 'text',
            text: { content: 'jenglow00-create/my-lighthouse', link: { url: 'https://github.com/jenglow00-create/my-lighthouse' } },
            annotations: { underline: true }
          }
        ],
        color: 'purple_background'
      }
    }
  );

  return blocks;
};

// Notion 페이지 업데이트
const updateNotionPage = async (pageId, blocks, pageName) => {
  try {
    console.log(`\n📤 "${pageName}" 페이지 업데이트 중... (총 ${blocks.length}개 블록)`);

    // 기존 블록 삭제
    const { results: existingBlocks } = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100
    });

    for (const block of existingBlocks) {
      await notion.blocks.delete({ block_id: block.id });
    }

    // 새 블록 추가 (100개씩 배치 처리)
    const batchSize = 100;
    for (let i = 0; i < blocks.length; i += batchSize) {
      const batch = blocks.slice(i, i + batchSize);
      await notion.blocks.children.append({
        block_id: pageId,
        children: batch
      });
      console.log(`  - ${i + batch.length}/${blocks.length} 블록 추가됨`);
    }

    console.log(`✅ "${pageName}" 업데이트 완료!`);
    return true;
  } catch (error) {
    console.error(`❌ "${pageName}" 업데이트 실패:`, error.message);
    if (error.body) {
      console.error('상세 오류:', JSON.stringify(error.body, null, 2));
    }
    return false;
  }
};

// 메인 실행
async function main() {
  console.log('🏮 Lighthouse Notion 통합 업데이트 시작\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 정보 수집
  const gitInfo = getGitInfo();
  const stats = getProjectStats();

  console.log('📊 수집된 정보:');
  console.log(`  - 총 코드: ${stats.totalLines.toLocaleString()}줄`);
  console.log(`  - 컴포넌트: ${stats.components}개`);
  console.log(`  - 페이지: ${stats.pages}개`);
  console.log(`  - 최근 커밋: ${gitInfo.commits.length}개`);
  console.log(`  - 미커밋: ${gitInfo.uncommittedFiles}개 파일\n`);

  // 페이지 1: 개발 현황
  const statusBlocks = createStatusBlocks(gitInfo, stats);
  const statusSuccess = await updateNotionPage(
    NOTION_PAGE_ID_STATUS,
    statusBlocks,
    '개발 현황'
  );

  // 페이지 2: 개발일지
  const blogBlocks = createBlogBlocks(gitInfo, stats);
  const blogSuccess = await updateNotionPage(
    NOTION_PAGE_ID_BLOG,
    blogBlocks,
    '개발일지'
  );

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (statusSuccess && blogSuccess) {
    console.log('✨ 모든 페이지 업데이트 완료!\n');
    console.log('🔗 페이지 확인:');
    console.log(`   개발 현황: https://notion.so/${NOTION_PAGE_ID_STATUS.replace(/-/g, '')}`);
    console.log(`   개발일지: https://notion.so/${NOTION_PAGE_ID_BLOG.replace(/-/g, '')}`);
  } else {
    console.log('⚠️  일부 페이지 업데이트 실패');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ 오류 발생:', error.message);
  process.exit(1);
});
