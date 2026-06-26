// ============================================================
// JalaliDatepicker — یک انتخاب‌گر تاریخ شمسی ساده و سبک
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { toPersianDigits, toEnglishDigits } from './tuts-utils';

interface JalaliDatepickerProps {
    value: string;
    onChange: (date: string) => void;
}

const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد',
    'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر',
    'دی', 'بهمن', 'اسفند',
];

const DAYS_IN_MONTH = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

function isLeapJalaliYear(year: number): boolean {
    const base = year - 474;
    return (((base % 2820) + 474) % 2820) % 33 === 0;
}

function getDaysInMonth(year: number, month: number): number {
    if (month === 11 && isLeapJalaliYear(year)) return 30;
    return DAYS_IN_MONTH[month];
}

export function JalaliDatepicker({ value, onChange }: JalaliDatepickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const engValue = toEnglishDigits(value);
    const parts = engValue.split('/');
    const currentYear = parts[0] ? parseInt(parts[0]) : 1405;
    const currentMonth = parts[1] ? parseInt(parts[1]) : 1;
    const currentDay = parts[2] ? parseInt(parts[2]) : 1;

    // Calendar navigation state
    const [viewYear, setViewYear] = useState(currentYear);
    const [viewMonth, setViewMonth] = useState(currentMonth - 1); // 0-based

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);

    // Calculate first day of month (0 = Saturday in Iran, but we use Monday-based)
    // For a simple grid, we approximate: 1405/01/01 = Saturday
    // Jalali new year (Farvardin 1) starts at the vernal equinox
    // We use a known reference: 1405/01/01 = 2026/03/21 (Saturday)
    const firstDayOfMonth = (() => {
        // Simple approximation based on known reference
        let totalDays = 0;
        for (let y = 1405; y < viewYear; y++) {
            totalDays += isLeapJalaliYear(y) ? 366 : 365;
        }
        for (let m = 0; m < viewMonth; m++) {
            totalDays += getDaysInMonth(viewYear, m);
        }
        // 1405/01/01 = Saturday = 6 in 0=Sun..6=Sat
        return ((totalDays % 7) + 6) % 7;
    })();

    const handleSelect = (day: number) => {
        const dateStr = `${viewYear}/${String(viewMonth + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
        onChange(dateStr);
        setIsOpen(false);
    };

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewYear(viewYear - 1);
            setViewMonth(11);
        } else {
            setViewMonth(viewMonth - 1);
        }
    };

    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewYear(viewYear + 1);
            setViewMonth(0);
        } else {
            setViewMonth(viewMonth + 1);
        }
    };

    const today = () => {
        // We use the current view year/month as reference — actual "today" is always 1405
        // In production, you'd get this from an API or Verta on the backend
        setViewYear(1405);
        setViewMonth(0);
        handleSelect(1);
    };

    // Weekday headers (Iran: Shanbeh to Jomeh)
    const weekdays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

    return (
        <div ref={ref} className="relative" dir="ltr">
            <div
                className="flex items-center gap-1.5 w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 cursor-pointer text-right"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="font-sans text-gray-950 dark:text-white flex-1 text-right">
                    {value ? toPersianDigits(value) : 'انتخاب تاریخ'}
                </span>
            </div>

            {isOpen && (
                <div
                    className="absolute top-full mt-1 right-0 z-50 w-[280px] bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xl p-3"
                    dir="rtl"
                >
                    {/* Month/Year Navigation */}
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={prevMonth}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 cursor-pointer text-sm"
                        >
                            ◀
                        </button>
                        <div className="flex gap-2 text-xs font-bold text-gray-900 dark:text-white">
                            <select
                                value={viewYear}
                                onChange={(e) => setViewYear(parseInt(e.target.value))}
                                className="bg-transparent border-none text-xs font-black cursor-pointer outline-none appearance-none"
                                dir="ltr"
                            >
                                {Array.from({ length: 11 }, (_, i) => 1400 + i).map(y => (
                                    <option key={y} value={y}>{toPersianDigits(y)}</option>
                                ))}
                            </select>
                            <span>{PERSIAN_MONTHS[viewMonth]}</span>
                        </div>
                        <button
                            type="button"
                            onClick={nextMonth}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 cursor-pointer text-sm"
                        >
                            ▶
                        </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {weekdays.map((d, i) => (
                            <div key={i} className="text-[10px] font-bold text-gray-400 text-center py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-0.5">
                        {/* Empty cells before first day */}
                        {Array.from({ length: firstDayOfMonth }, (_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {/* Day cells */}
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const isSelected = viewYear === currentYear && viewMonth === currentMonth - 1 && day === currentDay;
                            const isToday = day === 1 && viewYear === 1405 && viewMonth === 0; // 1405/01/01
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleSelect(day)}
                                    className={`text-xs w-full aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-all
                                        ${isSelected
                                            ? 'bg-teal-600 text-white font-bold shadow-sm'
                                            : isToday
                                                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {toPersianDigits(day)}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={today}
                            className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                        >
                            امروز
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                            بستن
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
