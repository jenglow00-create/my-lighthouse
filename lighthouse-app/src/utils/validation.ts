import { z } from 'zod';
import { logger } from './logger';

/**
 * 검증 결과
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Zod 스키마 검증
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    }

    // 에러 포맷팅
    const errors: Record<string, string[]> = {};
    result.error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message);
    });

    logger.warn('Validation failed', { errors });

    return {
      success: false,
      errors
    };
  } catch (error) {
    logger.error('Validation error', error as Error);
    return {
      success: false,
      errors: {
        _general: ['검증 중 오류가 발생했습니다']
      }
    };
  }
}

/**
 * 필드별 에러 메시지 가져오기
 */
export function getFieldError(
  errors: Record<string, string[]> | undefined,
  fieldName: string
): string | undefined {
  return errors?.[fieldName]?.[0];
}

/**
 * HTML 태그 제거 (추가 보안)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * URL 검증
 */
export const urlSchema = z.string().url('올바른 URL 형식이 아닙니다');

/**
 * 이메일 검증
 */
export const emailSchema = z.string().email('올바른 이메일 형식이 아닙니다');

/**
 * 비밀번호 검증 (강력한 비밀번호)
 */
export const strongPasswordSchema = z.string()
  .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
  .regex(/[A-Z]/, '대문자를 최소 1개 포함해야 합니다')
  .regex(/[a-z]/, '소문자를 최소 1개 포함해야 합니다')
  .regex(/[0-9]/, '숫자를 최소 1개 포함해야 합니다')
  .regex(/[^A-Za-z0-9]/, '특수문자를 최소 1개 포함해야 합니다');

/**
 * 날짜 범위 검증
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
}

/**
 * 파일 크기 검증
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number
): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * 파일 타입 검증
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(file.type);
}
