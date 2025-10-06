import { describe, it, expect } from 'vitest'
import {
  formatDate,
  parseDate,
  getDaysBetween,
  getWeekNumber,
  getTodayString,
  getTimestamp,
  addDays,
  getWeekStart,
  getWeekEnd,
  isSameDay,
  isToday,
  isPast,
  isFuture,
  getRelativeDate
} from './dateUtils'

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('should format date to YYYY-MM-DD', () => {
      // Arrange
      const date = new Date('2025-10-05')

      // Act
      const result = formatDate(date)

      // Assert
      expect(result).toBe('2025-10-05')
    })

    it('should handle single digit month and day', () => {
      const date = new Date('2025-01-05')
      expect(formatDate(date)).toBe('2025-01-05')
    })

    it('should handle different dates', () => {
      const date = new Date('2024-12-31')
      expect(formatDate(date)).toBe('2024-12-31')
    })
  })

  describe('parseDate', () => {
    it('should parse ISO 8601 string', () => {
      const dateStr = '2025-10-05'
      const result = parseDate(dateStr)

      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(9) // 0-indexed
      expect(result.getDate()).toBe(5)
    })

    it('should throw error for empty string', () => {
      expect(() => parseDate('')).toThrow('Invalid date string')
    })

    it('should throw error for invalid format', () => {
      expect(() => parseDate('not-a-date')).toThrow('Invalid date string')
    })
  })

  describe('getDaysBetween', () => {
    it('should return 0 for same date', () => {
      const date = new Date('2025-10-05')
      expect(getDaysBetween(date, date)).toBe(0)
    })

    it('should return positive number for future date', () => {
      const start = new Date('2025-10-05')
      const end = new Date('2025-10-10')
      expect(getDaysBetween(start, end)).toBe(5)
    })

    it('should return negative number when start > end', () => {
      const start = new Date('2025-10-10')
      const end = new Date('2025-10-05')
      expect(getDaysBetween(start, end)).toBe(-5)
    })

    it('should handle month boundaries', () => {
      const start = new Date('2025-01-30')
      const end = new Date('2025-02-02')
      expect(getDaysBetween(start, end)).toBe(3)
    })

    it('should handle year boundaries', () => {
      const start = new Date('2024-12-30')
      const end = new Date('2025-01-02')
      expect(getDaysBetween(start, end)).toBe(3)
    })
  })

  describe('getWeekNumber', () => {
    it('should return week number for middle of year', () => {
      const date = new Date('2025-06-15')
      const week = getWeekNumber(date)
      expect(week).toBeGreaterThanOrEqual(1)
      expect(week).toBeLessThanOrEqual(53)
    })

    it('should return 1 for first week of year', () => {
      const date = new Date('2025-01-06') // First Monday of 2025
      const week = getWeekNumber(date)
      expect(week).toBeGreaterThanOrEqual(1)
      expect(week).toBeLessThanOrEqual(2)
    })

    it('should be consistent within same week', () => {
      const monday = new Date('2025-10-06')
      const friday = new Date('2025-10-10')
      expect(getWeekNumber(monday)).toBe(getWeekNumber(friday))
    })
  })

  describe('getTodayString', () => {
    it('should return today in YYYY-MM-DD format', () => {
      const result = getTodayString()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('getTimestamp', () => {
    it('should return ISO 8601 timestamp', () => {
      const result = getTimestamp()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('addDays', () => {
    it('should add positive days', () => {
      const date = new Date('2025-10-05')
      const result = addDays(date, 5)
      expect(formatDate(result)).toBe('2025-10-10')
    })

    it('should subtract days with negative number', () => {
      const date = new Date('2025-10-10')
      const result = addDays(date, -5)
      expect(formatDate(result)).toBe('2025-10-05')
    })

    it('should handle month rollover', () => {
      const date = new Date('2025-01-30')
      const result = addDays(date, 5)
      expect(formatDate(result)).toBe('2025-02-04')
    })
  })

  describe('getWeekStart', () => {
    it('should return Monday for mid-week date', () => {
      const wednesday = new Date('2025-10-08') // Wednesday
      const result = getWeekStart(wednesday)
      expect(result.getDay()).toBe(1) // Monday
      expect(formatDate(result)).toBe('2025-10-06')
    })

    it('should return same date if already Monday', () => {
      const monday = new Date('2025-10-06')
      const result = getWeekStart(monday)
      expect(formatDate(result)).toBe('2025-10-06')
    })

    it('should handle Sunday correctly', () => {
      const sunday = new Date('2025-10-12')
      const result = getWeekStart(sunday)
      expect(result.getDay()).toBe(1) // Monday
      expect(formatDate(result)).toBe('2025-10-06')
    })
  })

  describe('getWeekEnd', () => {
    it('should return Sunday for mid-week date', () => {
      const wednesday = new Date('2025-10-08')
      const result = getWeekEnd(wednesday)
      expect(result.getDay()).toBe(0) // Sunday
      expect(formatDate(result)).toBe('2025-10-12')
    })

    it('should return same date if already Sunday', () => {
      const sunday = new Date('2025-10-12')
      const result = getWeekEnd(sunday)
      expect(formatDate(result)).toBe('2025-10-12')
    })
  })

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2025-10-05T10:00:00')
      const date2 = new Date('2025-10-05T15:00:00')
      expect(isSameDay(date1, date2)).toBe(true)
    })

    it('should return false for different days', () => {
      const date1 = new Date('2025-10-05')
      const date2 = new Date('2025-10-06')
      expect(isSameDay(date1, date2)).toBe(false)
    })
  })

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date()
      expect(isToday(today)).toBe(true)
    })

    it('should return false for yesterday', () => {
      const yesterday = addDays(new Date(), -1)
      expect(isToday(yesterday)).toBe(false)
    })
  })

  describe('isPast', () => {
    it('should return true for past date', () => {
      const pastDate = new Date('2020-01-01')
      expect(isPast(pastDate)).toBe(true)
    })

    it('should return false for future date', () => {
      const futureDate = new Date('2030-01-01')
      expect(isPast(futureDate)).toBe(false)
    })
  })

  describe('isFuture', () => {
    it('should return true for future date', () => {
      const futureDate = new Date('2030-01-01')
      expect(isFuture(futureDate)).toBe(true)
    })

    it('should return false for past date', () => {
      const pastDate = new Date('2020-01-01')
      expect(isFuture(pastDate)).toBe(false)
    })
  })

  describe('getRelativeDate', () => {
    it('should return "오늘" for today', () => {
      const today = new Date()
      expect(getRelativeDate(today)).toBe('오늘')
    })

    it('should return "내일" for tomorrow', () => {
      const tomorrow = addDays(new Date(), 1)
      expect(getRelativeDate(tomorrow)).toBe('내일')
    })

    it('should return "어제" for yesterday', () => {
      const yesterday = addDays(new Date(), -1)
      expect(getRelativeDate(yesterday)).toBe('어제')
    })

    it('should return "N일 후" for near future', () => {
      const future = addDays(new Date(), 5)
      expect(getRelativeDate(future)).toBe('5일 후')
    })

    it('should return "N일 전" for near past', () => {
      const past = addDays(new Date(), -5)
      expect(getRelativeDate(past)).toBe('5일 전')
    })

    it('should return "N주 후" for weeks', () => {
      const future = addDays(new Date(), 14)
      expect(getRelativeDate(future)).toBe('2주 후')
    })

    it('should return "N개월 후" for months', () => {
      const future = addDays(new Date(), 60)
      expect(getRelativeDate(future)).toBe('2개월 후')
    })
  })
})
