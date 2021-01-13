import { CalendarDateFormatter, DateFormatterParams } from 'angular-calendar';
import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
@Injectable()
export class CustomDateFormatter extends CalendarDateFormatter {
    public monthViewColumnHeader({ date, locale }: DateFormatterParams): string {
        return formatDate(date, 'EEE', 'ar'); // use short week days
    }
}