// ============================================================
// JalaliDatepicker — استفاده از react-multi-date-picker با تقویم شمسی
// ============================================================

import DatePicker, { DateObject } from "react-multi-date-picker";
import "react-multi-date-picker/styles/colors/teal.css";
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import { Calendar } from 'lucide-react';
import { toPersianDigits, toEnglishDigits } from './tuts-utils';

interface JalaliDatepickerProps {
    value: string;
    onChange: (date: string) => void;
}

export function JalaliDatepicker({ value, onChange }: JalaliDatepickerProps) {
    // تبدیل مقدار ورودی (با ارقام فارسی) به DateObject شمسی
    const engValue = value ? toEnglishDigits(value) : '';
    const dateValue = engValue
        ? new DateObject({
            calendar: persian,
            date: engValue,
            format: "YYYY/MM/DD",
          })
        : undefined;

    return (
        <DatePicker
            calendar={persian}
            locale={persian_fa}
            value={dateValue}
            onChange={(date: DateObject | null) => {
                if (date) {
                    // برگرداندن تاریخ با ارقام فارسی (مشابه قبل)
                    onChange(toPersianDigits(date.format("YYYY/MM/DD")));
                }
            }}
            format="YYYY/MM/DD"
            placeholder="انتخاب تاریخ"
            inputClass="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none cursor-pointer"
            containerClassName="w-full"
            calendarPosition="bottom-right"
            animations={[]}
            render={<CustomInput />}
            mapDays={({ date }) => {
                const isFriday = date.weekDay.index === 6;
                if (isFriday) {
                    return {
                        className: "text-red-500 font-bold",
                        disabled: false,
                    };
                }
                return {};
            }}
        />
    );
}

/**
 * رندر دکمه سفارشی به جای input پیش‌فرض
 */
function CustomInput({ openCalendar, value }: any) {
    return (
        <div
            className="flex items-center gap-1.5 w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 cursor-pointer text-right"
            onClick={openCalendar}
        >
            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="font-sans text-gray-950 dark:text-white flex-1 text-right">
                {value ? toPersianDigits(value) : 'انتخاب تاریخ'}
            </span>
        </div>
    );
}
