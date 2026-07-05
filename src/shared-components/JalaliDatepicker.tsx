// ============================================================
// JalaliDatepicker — Global Jalali (Persian) date picker
// Uses react-multi-date-picker with Persian calendar.
// ============================================================

import DatePicker, { DateObject } from "react-multi-date-picker";
import "react-multi-date-picker/styles/colors/teal.css";
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import { Calendar, X } from 'lucide-react';
import { toPersianDigits, toEnglishDigits } from '@/src/shared-utils';

interface JalaliDatepickerProps {
    value: string;
    onChange: (date: string) => void;
}

export function JalaliDatepicker({ value, onChange }: JalaliDatepickerProps) {
    // Convert input value (with Persian digits) to a Persian DateObject
    const engValue = value ? toEnglishDigits(value) : '';
    const dateValue = engValue
        ? new DateObject({
            calendar: persian,
            date: engValue,
            format: "YYYY/MM/DD",
          })
        : undefined;

    const handleClear = () => {
        onChange('');
    };

    return (
        <DatePicker
            calendar={persian}
            locale={persian_fa}
            value={dateValue}
            onChange={(date: DateObject | null) => {
                if (date) {
                    onChange(toPersianDigits(date.format("YYYY/MM/DD")));
                } else {
                    onChange('');
                }
            }}
            format="YYYY/MM/DD"
            placeholder="انتخاب تاریخ"
            inputClass="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none cursor-pointer"
            containerClassName="w-full"
            calendarPosition="bottom-right"
            animations={[]}
            render={<CustomInput onClear={handleClear} />}
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
 * Custom button renderer instead of default input
 */
function CustomInput({ openCalendar, value, onClear }: any) {
    return (
        <div
            className="flex items-center gap-1.5 w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 cursor-pointer text-right"
            onClick={openCalendar}
        >
            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="font-sans text-gray-950 dark:text-white flex-1 text-right">
                {value ? toPersianDigits(value) : 'انتخاب تاریخ'}
            </span>
            {value && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClear?.();
                    }}
                    className="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="پاک کردن تاریخ"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
