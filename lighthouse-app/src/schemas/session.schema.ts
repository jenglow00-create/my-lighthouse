import { z } from 'zod';

/**
 * 학습 세션 스키마
 */
export const sessionSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().min(1, '사용자 ID가 필요합니다'),
  subjectId: z.string().min(1, '과목을 선택해주세요'),
  studyType: z.enum(['lecture', 'practice', 'review', 'concept'], {
    errorMap: () => ({ message: '올바른 학습 유형을 선택해주세요' })
  }),
  duration: z.number()
    .min(0.1, '학습 시간은 최소 0.1시간이어야 합니다')
    .max(24, '학습 시간은 최대 24시간입니다'),
  concentration: z.number()
    .int('정수여야 합니다')
    .min(1, '집중도는 1-5 사이여야 합니다')
    .max(5, '집중도는 1-5 사이여야 합니다'),
  understanding: z.number()
    .int()
    .min(1, '이해도는 1-5 사이여야 합니다')
    .max(5, '이해도는 1-5 사이여야 합니다'),
  fatigue: z.number()
    .int()
    .min(1, '피로도는 1-5 사이여야 합니다')
    .max(5, '피로도는 1-5 사이여야 합니다'),
  topics: z.array(z.string())
    .min(1, '최소 1개의 주제가 필요합니다')
    .max(20, '주제는 최대 20개까지 가능합니다'),
  notes: z.string()
    .max(5000, '메모는 최대 5000자까지 가능합니다')
    .optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export type SessionInput = z.infer<typeof sessionSchema>;

/**
 * 세션 생성용 스키마 (일부 필드 선택적)
 */
export const createSessionSchema = sessionSchema.partial({
  id: true,
  createdAt: true,
  updatedAt: true
});

/**
 * 세션 업데이트용 스키마
 */
export const updateSessionSchema = sessionSchema.partial().required({
  id: true
});
