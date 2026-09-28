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
    /** رنگ آیکون تقویم — پیش‌فرض تیل، برای فیلد تاریخ فرم‌ساز قابل‌شخصی‌سازی است */
    iconColor?: string;
    /** کوچک‌ترین/بزرگ‌ترین تاریخ قابل‌انتخاب، همان فرمت value ("YYYY/MM/DD" با رقم فارسی یا انگلیسی) */
    minDate?: string;
    maxDate?: string;
    placeholder?: string;
    disabled?: boolean;
}

const toDateObject = (v: string): DateObject | undefined => {
    const eng = v ? toEnglishDigits(v) : '';
    return eng
        ? new DateObject({ calendar: persian, date: eng, format: "YYYY/MM/DD" })
        : undefined;
};

export function JalaliDatepicker({ value, onChange, iconColor, minDate, maxDate, placeholder, disabled }: JalaliDatepickerProps) {
    const dateValue = toDateObject(value);

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
            minDate={toDateObject(minDate || '')}
            maxDate={toDateObject(maxDate || '')}
            disabled={disabled}
            format="YYYY/MM/DD"
            placeholder="انتخاب تاریخ"
            inputClass="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none cursor-pointer"
            containerClassName="w-full"
            calendarPosition="bottom-right"
            animations={[]}
            render={<CustomInput onClear={handleClear} iconColor={iconColor} placeholder={placeholder} />}
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
function CustomInput({ openCalendar, value, onClear, iconColor, placeholder }: any) {
    return (
        <div
            className="flex items-center gap-1.5 w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 cursor-pointer text-right"
            onClick={openCalendar}
        >
            <Calendar className="w-4 h-4 shrink-0" style={{ color: iconColor || '#0d9488' }} />
            <span className="font-sans text-gray-950 dark:text-white flex-1 text-right">
                {value ? toPersianDigits(value) : (placeholder || 'انتخاب تاریخ')}
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
