#!/usr/bin/env node

/**
 * Lighthouse 개발 현황을 Notion 페이지에 자동 업데이트하는 스크립트
 *
 * 사용법:
 * 1. npm install @notionhq/client
 * 2. .notion-config 파일 설정
 * 3. node update-notion-api.js
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 설정 파일 로드
const configPath = path.join(__dirname, 'lighthouse-app', '.notion-config');

if (!fs.existsSync(configPath)) {
  console.error('❌ .notion-config 파일이 없습니다.');
  console.error('NOTION-SETUP-GUIDE.md를 참고하여 설정하세요.\n');
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
const NOTION_PAGE_ID = config.NOTION_PAGE_ID;

if (!NOTION_API_KEY || !NOTION_PAGE_ID) {
  console.error('❌ NOTION_API_KEY 또는 NOTION_PAGE_ID가 설정되지 않았습니다.');
  console.error('.notion-config 파일을 확인하세요.\n');
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

    const changedFiles = execSync('git diff --stat', {
      cwd: projectDir,
      encoding: 'utf-8'
    }).trim();

    return { lastCommit, uncommittedFiles, branch, changedFiles };
  } catch (error) {
    return { lastCommit: 'N/A', uncommittedFiles: 0, branch: 'N/A', changedFiles: '' };
  }
};

// 프로젝트 통계 수집
const getProjectStats = () => {
  try {
    const srcDir = path.join(__dirname, 'lighthouse-app', 'src');

    const totalFiles = execSync(
      `find ${srcDir} -type f \\( -name "*.js" -o -name "*.jsx" -o -name "*.css" \\) | wc -l`,
      { encoding: 'utf-8' }
    ).trim();

    const totalLines = execSync(
      `find ${srcDir} -type f \\( -name "*.js" -o -name "*.jsx" \\) -exec cat {} + | wc -l`,
      { encoding: 'utf-8' }
    ).trim();

    return { totalFiles: parseInt(totalFiles), totalLines: parseInt(totalLines) };
  } catch (error) {
    return { totalFiles: 0, totalLines: 0 };
  }
};

// Notion 블록 생성
const createNotionBlocks = (gitInfo, stats) => {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  return [
    {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [{ type: 'text', text: { content: '🏮 Lighthouse 개발 현황 보고서' } }]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { type: 'text', text: { content: '업데이트 일시: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: now } }
        ]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { type: 'text', text: { content: '브랜치: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: gitInfo.branch }, annotations: { code: true } }
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
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: '총 파일 수: ' } },
          { type: 'text', text: { content: `${stats.totalFiles}개` }, annotations: { bold: true } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: '총 코드 라인: ' } },
          { type: 'text', text: { content: `${stats.totalLines}줄` }, annotations: { bold: true } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: '미커밋 변경사항: ' } },
          { type: 'text', text: { content: `${gitInfo.uncommittedFiles}개 파일` }, annotations: { bold: true, color: gitInfo.uncommittedFiles > 0 ? 'orange' : 'green' } }
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
    {
      object: 'block',
      type: 'code',
      code: {
        rich_text: [{ type: 'text', text: { content: gitInfo.lastCommit } }],
        language: 'plain text'
      }
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🎯 오늘 완료된 주요 작업' } }]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: '성찰 시스템 전면 개편 ✨', annotations: { bold: true } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: '시험 유형 시스템 재설계 (31개 지원) 🚀', annotations: { bold: true } }
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
      type: 'callout',
      callout: {
        icon: { emoji: '🚀' },
        rich_text: [
          { type: 'text', text: { content: '개발 서버: ' } },
          { type: 'text', text: { content: 'http://localhost:5000/', link: { url: 'http://localhost:5000/' } } }
        ]
      }
    }
  ];
};

// 메인 실행
async function updateNotion() {
  try {
    console.log('🏮 Lighthouse 개발 현황 보고서 생성 중...\n');

    // 정보 수집
    const gitInfo = getGitInfo();
    const stats = getProjectStats();

    console.log('📊 프로젝트 통계:');
    console.log(`  - 총 파일: ${stats.totalFiles}개`);
    console.log(`  - 총 라인: ${stats.totalLines}줄`);
    console.log(`  - 미커밋: ${gitInfo.uncommittedFiles}개 파일\n`);

    console.log('📤 Notion 페이지 업데이트 중...');

    // 기존 페이지의 자식 블록 가져오기
    const { results: existingBlocks } = await notion.blocks.children.list({
      block_id: NOTION_PAGE_ID,
      page_size: 100
    });

    // 기존 블록 삭제 (최근 보고서만 유지하기 위해)
    for (const block of existingBlocks) {
      await notion.blocks.delete({ block_id: block.id });
    }

    // 새 블록 추가
    const blocks = createNotionBlocks(gitInfo, stats);
    await notion.blocks.children.append({
      block_id: NOTION_PAGE_ID,
      children: blocks
    });

    console.log('✅ Notion 업데이트 완료!\n');
    console.log(`🔗 페이지 확인: https://notion.so/${NOTION_PAGE_ID.replace(/-/g, '')}`);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);

    if (error.code === 'unauthorized') {
      console.error('\n💡 해결 방법:');
      console.error('1. API 키가 올바른지 확인');
      console.error('2. Notion 페이지에 Integration이 연결되었는지 확인');
    } else if (error.code === 'object_not_found') {
      console.error('\n💡 해결 방법:');
      console.error('1. 페이지 ID가 올바른지 확인');
      console.error('2. Integration이 해당 페이지에 접근 권한이 있는지 확인');
    }

    process.exit(1);
  }
}

updateNotion();
