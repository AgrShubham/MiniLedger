import { env } from '../config/env';

export interface Clock {
  now(): Date;
  todayString(tz?: string): string;
  todayDate(tz?: string): Date;
}

class SystemClock implements Clock {
  private overriddenTime: Date | null = null;

  public setTime(date: Date | null): void {
    this.overriddenTime = date;
  }

  public now(): Date {
    return this.overriddenTime ? new Date(this.overriddenTime) : new Date();
  }

  public todayString(tz: string = env.APP_TZ): string {
    const d = this.now();
    // 'en-CA' gives standard ISO YYYY-MM-DD format
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d);
  }

  public todayDate(tz: string = env.APP_TZ): Date {
    const str = this.todayString(tz);
    // Parse as UTC midnight date for database @db.Date matching
    return new Date(`${str}T00:00:00.000Z`);
  }
}

export const clock = new SystemClock();
