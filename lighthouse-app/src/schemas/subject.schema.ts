import { z } from 'zod';
import { getAllExamTypes } from '@/constants/examTypes';

// 유효한 시험 타입 추출
const validExamTypes = getAllExamTypes().map(type => type.id);

/**
 * 과목 스키마
 */
export const subjectSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().min(1, '사용자 ID가 필요합니다'),
  name: z.string()
    .min(1, '과목명을 입력해주세요')
    .max(100, '과목명은 최대 100자까지 가능합니다')
    .refine(
      (name) => !name.includes('<') && !name.includes('>'),
      '특수문자 < > 는 사용할 수 없습니다'
    ),
  examType: z.enum(validExamTypes as [string, ...string[]], {
    errorMap: () => ({ message: '올바른 시험 유형을 선택해주세요' })
  }),
  targetHours: z.number()
    .min(1, '목표 시간은 최소 1시간이어야 합니다')
    .max(10000, '목표 시간은 최대 10,000시간입니다'),
  targetScore: z.number()
    .int()
    .min(0, '목표 점수는 0 이상이어야 합니다')
    .max(1000, '목표 점수는 1000 이하여야 합니다')
    .optional(),
  currentScore: z.number()
    .int()
    .min(0)
    .max(1000)
    .optional(),
  examDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다')
    .refine(
      (date) => new Date(date) > new Date(),
      '시험일은 미래 날짜여야 합니다'
    )
    .optional(),
  totalHours: z.number().min(0).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export type SubjectInput = z.infer<typeof subjectSchema>;

export const createSubjectSchema = subjectSchema.partial({
  id: true,
  totalHours: true,
  createdAt: true,
  updatedAt: true
});

export const updateSubjectSchema = subjectSchema.partial().required({
  id: true
});
