import { z } from 'zod';

/**
 * 성찰 스키마
 */
export const reflectionSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  allTopics: z.array(z.string())
    .min(1, '최소 1개의 주제가 필요합니다')
    .max(50, '주제는 최대 50개까지 가능합니다'),
  selectedTopic: z.string()
    .min(1, '선택된 주제가 필요합니다')
    .max(200, '주제는 최대 200자까지 가능합니다'),
  recallContent: z.string()
    .min(10, '회상 내용은 최소 10자 이상이어야 합니다')
    .max(10000, '회상 내용은 최대 10,000자까지 가능합니다'),
  verificationResult: z.string()
    .min(10, '검증 결과는 최소 10자 이상이어야 합니다')
    .max(10000, '검증 결과는 최대 10,000자까지 가능합니다'),
  learningRating: z.number()
    .int()
    .min(1, '학습도는 1-5 사이여야 합니다')
    .max(5, '학습도는 1-5 사이여야 합니다'),
  needsMoreStudy: z.string()
    .max(5000, '보완 계획은 최대 5,000자까지 가능합니다')
    .optional(),
  tomorrowPlan: z.string()
    .max(5000, '내일 계획은 최대 5,000자까지 가능합니다')
    .optional(),
  createdAt: z.string().datetime().optional()
});

export type ReflectionInput = z.infer<typeof reflectionSchema>;

export const createReflectionSchema = reflectionSchema.partial({
  id: true,
  createdAt: true
});
