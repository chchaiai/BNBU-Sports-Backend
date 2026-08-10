import { Injectable } from '@nestjs/common';

export const DEFAULT_DAILY_CHECK_IN_START_TIME = '06:00:00';
export const DEFAULT_DAILY_CHECK_IN_END_TIME = '22:00:00';

@Injectable()
export class OrganizationTimeService {
  businessDate(at: Date, timezone: string): string {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(at);
    const values = new Map(parts.map((part) => [part.type, part.value]));
    const year = values.get('year');
    const month = values.get('month');
    const day = values.get('day');
    if (year === undefined || month === undefined || day === undefined) {
      throw new RangeError(`Unable to calculate a business date for timezone ${timezone}`);
    }
    return `${year}-${month}-${day}`;
  }

  localTime(at: Date, timezone: string): string {
    const values = new Map(
      new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(at)
        .map((part) => [part.type, part.value]),
    );
    const hour = values.get('hour');
    const minute = values.get('minute');
    const second = values.get('second');
    if (hour === undefined || minute === undefined || second === undefined) {
      throw new RangeError(`Unable to calculate a local time for timezone ${timezone}`);
    }
    return `${hour}:${minute}:${second}`;
  }

  isWithinDailyCheckInWindow(
    at: Date,
    timezone: string,
    startTime = DEFAULT_DAILY_CHECK_IN_START_TIME,
    endTime = DEFAULT_DAILY_CHECK_IN_END_TIME,
  ): boolean {
    const localTime = this.localTime(at, timezone);
    const effectiveStart =
      startTime > DEFAULT_DAILY_CHECK_IN_START_TIME ? startTime : DEFAULT_DAILY_CHECK_IN_START_TIME;
    const effectiveEnd =
      endTime < DEFAULT_DAILY_CHECK_IN_END_TIME ? endTime : DEFAULT_DAILY_CHECK_IN_END_TIME;
    return localTime >= effectiveStart && localTime <= effectiveEnd;
  }
}
