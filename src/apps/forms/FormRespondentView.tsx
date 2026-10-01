import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Star,
  Heart,
  Printer,
  QrCode,
  Sparkles,
  Award,
  ShieldCheck,
  RotateCcw,
  Send,
  HelpCircle,
  RefreshCw,
  LocateFixed,
  ChevronDown
} from 'lucide-react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DateObject } from 'react-multi-date-picker';
import persianCalendar from 'react-date-object/calendars/persian';
import gregorianCalendar from 'react-date-object/calendars/gregorian';
import { JalaliDatepicker } from '../../shared-components';
import { toPersianDigits, toEnglishDigits } from '../../shared-utils';
import { FormDefinition, FormField, FormStep, LogicRule } from './types';

/** «امروز» به تقویم شمسی، به‌صورت رشتهٔ YYYY/MM/DD با رقم فارسی */
const todayJalaliString = (): string => toPersianDigits(new DateObject({ calendar: persianCalendar }).format('YYYY/MM/DD'));

/** «امروز» به فرمت ISO میلادی (YYYY-MM-DD) — برای ورودی‌های native تقویم میلادی */
const todayIsoString = (): string => new Date().toISOString().slice(0, 10);

/** تبدیل تاریخ ثابت میلادی (ISO، از ورودی native تاریخ در فرم‌ساز) به رشتهٔ شمسی YYYY/MM/DD */
const gregorianIsoToJalaliString = (iso: string): string => {
  try {
    const g = new DateObject({ date: iso, format: 'YYYY-MM-DD', calendar: gregorianCalendar });
    return toPersianDigits(g.convert(persianCalendar).format('YYYY/MM/DD'));
  } catch {
    return '';
  }
};

interface FormRespondentViewProps {
  form: FormDefinition;
  onSubmitted?: (
    answers: Record<string, any>,
    trackingCode: string,
    totalScore?: number
  ) => Promise<{ trackingCode?: string; scoreTotal?: number; gradeLabel?: string } | void> | void;
  isEmbedPreview?: boolean;
}

const IRAN_PROVINCES = [
  'آذربایجان شرقی', 'آذربایجان غربی', 'اردبیل', 'اصفهان', 'البرز', 'ایلام', 'بوشهر',
  'تهران', 'چهارمحال و بختیاری', 'خراسان جنوبی', 'خراسان رضوی', 'خراسان شمالی',
  'خوزستان', 'زنجان', 'سمنان', 'سیستان و بلوچستان', 'فارس', 'قزوین', 'قم', 'کردستان',
  'کرمان', 'کرمانشاه', 'کهگیلویه و بویراحمد', 'گلستان', 'گیلان', 'لرستان', 'مازندران',
  'مرکزی', 'هرمزگان', 'همدان', 'یزد',
];

/** ارقام فارسی/عربی را به ارقام لاتین تبدیل می‌کند — چون خیلی از کیبوردهای فارسی رقم می‌فرستند */
const toLatinDigits = (str: string): string =>
  str
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - '۰'.charCodeAt(0)))
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - '٠'.charCodeAt(0)));

/** کاراکترهای غیرمجاز را همان لحظهٔ تایپ حذف می‌کند — بر اساس charTypeAllowed تنظیم‌شده روی فیلد */
const CHAR_TYPE_FILTERS: Record<string, RegExp> = {
  persian_letters: /[^؀-ۿ\s]/g,
  english_letters: /[^A-Za-z\s]/g,
  numeric: /[^0-9۰-۹]/g,
  alphanumeric: /[^A-Za-z0-9؀-ۿ۰-۹\s]/g,
};
const filterByCharType = (value: string, charType?: string): string => {
  if (!charType || charType === 'any') return value;
  const pattern = CHAR_TYPE_FILTERS[charType];
  return pattern ? value.replace(pattern, '') : value;
};

/** پیکربندی مَسک و اعتبارسنجی برای هر «قالب و فرمت شماره» تعریف‌شده روی فیلد phone در فرم‌ساز */
const FREE_EMAIL_PROVIDERS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'aol.com', 'mail.com', 'protonmail.com', 'yandex.com'];

const PHONE_FORMAT_CONFIG: Record<'iran_mobile' | 'iran_landline' | 'international', {
  maxDigits: number;
  pattern: RegExp;
  placeholder: string;
  mask: (digits: string) => string;
  errorMessage: string;
}> = {
  iran_mobile: {
    maxDigits: 11,
    pattern: /^09\d{9}$/,
    placeholder: '0912 345 6789',
    mask: d => [d.slice(0, 4), d.slice(4, 7), d.slice(7, 11)].filter(Boolean).join(' '),
    errorMessage: 'شمارهٔ موبایل معتبر نیست — باید با ۰۹ شروع شود و ۱۱ رقم باشد.',
  },
  iran_landline: {
    maxDigits: 11,
    pattern: /^0\d{9,10}$/,
    placeholder: '021 1234 5678',
    mask: d => {
      const areaLen = d.length > 10 ? 4 : 3;
      return [d.slice(0, areaLen), d.slice(areaLen, areaLen + 4), d.slice(areaLen + 4)].filter(Boolean).join(' ');
    },
    errorMessage: 'شمارهٔ تلفن ثابت معتبر نیست — باید با پیش‌شمارهٔ شهر (۰) شروع شود.',
  },
  international: {
    maxDigits: 15,
    pattern: /^\+\d{6,15}$/,
    placeholder: '+98 912 345 6789',
    mask: d => `+${[d.slice(0, 2), d.slice(2, 5), d.slice(5, 8), d.slice(8, 12)].filter(Boolean).join(' ')}`,
    errorMessage: 'شمارهٔ بین‌المللی معتبر نیست — باید با + و کد کشور شروع شود.',
  },
};

/**
 * انتخاب مختصات از روی نقشهٔ ماهواره‌ای (Esri World Imagery — رایگان، بدون کلید API).
 * دقیقاً همان کامپوننت استفاده‌شده در فرم عمومی (public/FormPage.tsx)، اینجا هم تکرار شده
 * چون دو پروژهٔ frontend/public جدا از هم بیلد می‌شوند و کدشان مشترک نیست.
 */
const GeoMapPicker: React.FC<{
  lat?: number;
  lng?: number;
  accent: string;
  onChange: (lat: number, lng: number) => void;
}> = ({ lat, lng, accent, onChange }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const defaultCenter: [number, number] = [32.4279, 53.688];
      const startCenter: [number, number] = lat !== undefined && lng !== undefined ? [lat, lng] : defaultCenter;

      const map = L.map(containerRef.current, {
        center: startCenter,
        zoom: lat !== undefined ? 15 : 5,
      });
      mapRef.current = map;

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = L.divIcon({
        html: `<i class="fa-solid fa-location-dot" style="font-size:28px;color:${accent};filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))"></i>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      if (lat !== undefined && lng !== undefined) {
        markerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          onChangeRef.current(pos.lat, pos.lng);
        });
      }

      map.on('click', (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng]);
        } else {
          markerRef.current = L.marker([clickLat, clickLng], { icon: pinIcon, draggable: true }).addTo(map);
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current!.getLatLng();
            onChangeRef.current(pos.lat, pos.lng);
          });
        }
        onChangeRef.current(clickLat, clickLng);
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || lat === undefined || lng === undefined) return;
    import('leaflet').then((L) => {
      if (!mapRef.current) return;
      mapRef.current.setView([lat, lng], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const pinIcon = L.divIcon({
          html: `<i class="fa-solid fa-location-dot" style="font-size:28px;color:${accent};filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))"></i>`,
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });
        markerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(mapRef.current);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          onChangeRef.current(pos.lat, pos.lng);
        });
      }
    });
  }, [lat, lng]);

  return <div ref={containerRef} className="w-full h-56 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700" />;
};

const CUSTOM_OPTION_VALUE = '__custom_other__';
const selectInputClass = 'w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent';

/**
 * فیلد منوی کشویی — دو تنظیم فرم‌ساز که در این پیش‌نمایش اصلاً اعمال نمی‌شدند را پیاده می‌کند:
 * allowSearchOptions (کمبوباکس با جستجو) و allowCreateCustomOption (گزینهٔ «سایر»).
 */
/** ترکیب کلاس چیدمان گزینه‌های فیلدهای چندگزینه‌ای (رادیو/چک‌باکس گروهی) بر اساس تنظیم choiceLayout */
const choiceLayoutClass = (layout?: 'vertical' | 'horizontal' | 'grid_2_col'): string =>
  layout === 'horizontal' ? 'flex flex-wrap gap-4'
    : layout === 'grid_2_col' ? 'grid grid-cols-2 gap-2'
    : 'space-y-2';

/** کلید دو‌حالته (سوییچ) — برای فیلدهای yesno و switch به‌جای دکمه‌های رادیویی */
const ToggleSwitch: React.FC<{
  id?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onLabel?: string;
  offLabel?: string;
}> = ({ id, checked, onChange, onLabel, offLabel }) => (
  <div className="flex items-center gap-3">
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
        style={{ right: checked ? '2px' : '26px' }}
      />
    </button>
    {(onLabel || offLabel) && (
      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{checked ? onLabel : offLabel}</span>
    )}
  </div>
);

/** کادر امضای دیجیتال با ترسیم — هم ماوس هم لمسی (موبایل/تبلت) */
const SignatureCanvasField: React.FC<{
  value: string;
  onChange: (dataUrl: string) => void;
  height: number;
  color?: string;
}> = ({ value, onChange, height, color }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const width = container.clientWidth || 400;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color || '#0f172a';
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, width, height);
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const point = 'touches' in e ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawingRef.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getPos(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    if ('touches' in e) e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    const { x, y } = getPos(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
    hasDrawnRef.current = true;
  };
  const end = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (hasDrawnRef.current && canvasRef.current) {
      onChange(canvasRef.current.toDataURL('image/png'));
    }
  };
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden" style={{ height }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      <button type="button" onClick={clear} className="text-xs text-red-500 hover:underline">
        پاک‌سازی امضا
      </button>
    </div>
  );
};

const SelectField: React.FC<{
  field: FormField;
  value: any;
  onChange: (v: any) => void;
}> = ({ field, value, onChange }) => {
  const options = field.options || [];
  const allowCustom = !!field.allowCreateCustomOption;
  const isSearchable = !!field.allowSearchOptions;

  const matchedOption = options.find(o => o.value === value);
  const [customMode, setCustomMode] = useState(allowCustom && !!value && !matchedOption);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isSearchable) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isSearchable]);

  const selectCustom = () => {
    setCustomMode(true);
    setOpen(false);
    onChange('');
  };
  const selectOption = (v: string) => {
    setCustomMode(false);
    setOpen(false);
    setSearch('');
    onChange(v);
  };

  if (isSearchable) {
    const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
    const displayText = customMode ? 'سایر (مقدار دلخواه)' : matchedOption?.label || '';
    return (
      <div className="space-y-2">
        <div ref={containerRef} className="relative">
          <button
            id={field.id}
            type="button"
            onClick={() => setOpen(o => !o)}
            className={`${selectInputClass} text-right flex items-center justify-between gap-2`}
          >
            <span className={displayText ? '' : 'text-slate-400'}>{displayText || field.placeholder || 'انتخاب کنید...'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
          {open && (
            <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-64 flex flex-col overflow-hidden">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="جستجو در گزینه‌ها..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div className="overflow-y-auto">
                {filtered.length === 0 && <p className="p-3 text-xs text-slate-400 text-center">موردی یافت نشد</p>}
                {filtered.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectOption(opt.value)}
                    className={`w-full text-right px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 block ${opt.value === value ? 'font-bold text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-slate-200'}`}
                  >
                    {opt.label}
                  </button>
                ))}
                {allowCustom && (
                  <button
                    type="button"
                    onClick={selectCustom}
                    className="w-full text-right px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 border-t border-slate-100 dark:border-slate-800 text-slate-500"
                  >
                    سایر (تایپ کنید)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        {customMode && (
          <input
            type="text"
            autoFocus
            value={value || ''}
            placeholder="مقدار دلخواه خود را بنویسید..."
            onChange={e => onChange(e.target.value)}
            className={selectInputClass}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <select
        id={field.id}
        value={customMode ? CUSTOM_OPTION_VALUE : value || ''}
        onChange={e => (e.target.value === CUSTOM_OPTION_VALUE ? selectCustom() : selectOption(e.target.value))}
        className={selectInputClass}
      >
        <option value="">{field.placeholder || 'انتخاب کنید...'}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.value}>{opt.label}</option>
        ))}
        {allowCustom && <option value={CUSTOM_OPTION_VALUE}>سایر (تایپ کنید)</option>}
      </select>
      {customMode && (
        <input
          type="text"
          autoFocus
          value={value || ''}
          placeholder="مقدار دلخواه خود را بنویسید..."
          onChange={e => onChange(e.target.value)}
          className={selectInputClass}
        />
      )}
    </div>
  );
};

export const FormRespondentView: React.FC<FormRespondentViewProps> = ({
  form,
  onSubmitted,
  isEmbedPreview = false
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {};
    form.fields.forEach(f => {
      if (f.defaultValue !== undefined && f.defaultValue !== null) defaults[f.id] = f.defaultValue;
      if ((f.type === 'date' || f.type === 'datetime') && f.defaultDateOption && f.defaultDateOption !== 'none') {
        const isJalali = (f.calendarType || 'jalali') === 'jalali';
        if (f.defaultDateOption === 'today') {
          defaults[f.id] = isJalali ? todayJalaliString() : todayIsoString();
        } else if (f.defaultDateOption === 'custom' && f.defaultValue) {
          defaults[f.id] = isJalali ? gregorianIsoToJalaliString(f.defaultValue) : f.defaultValue;
        }
      } else if (f.type === 'time' && f.defaultDateOption === 'today') {
        defaults[f.id] = new Date().toTimeString().slice(0, 5);
      }
    });
    return defaults;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [finalScore, setFinalScore] = useState<number | undefined>(undefined);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [geoLocating, setGeoLocating] = useState<Record<string, boolean>>({});

  const steps = form.steps.length > 0 ? form.steps : [{ id: 's_default', title: 'تکمیل فرم', order: 1 }];
  const currentStep = steps[currentStepIndex];

  // Evaluate visible fields based on logic rules
  const getVisibleFields = (stepFields: FormField[]) => {
    return stepFields.filter(field => {
      // Find rules targeting this field
      const hiddenByRule = form.logicRules.some(rule => {
        if (rule.targetId !== field.id) return false;
        const sourceVal = answers[rule.fieldId];

        if (rule.operator === 'equals' && sourceVal === rule.value && rule.action === 'hide_field') return true;
        if (rule.operator === 'not_equals' && sourceVal !== rule.value && rule.action === 'hide_field') return true;
        return false;
      });

      const shownByRule = form.logicRules.some(rule => {
        if (rule.targetId !== field.id) return false;
        const sourceVal = answers[rule.fieldId];

        if (rule.operator === 'equals' && sourceVal === rule.value && rule.action === 'show_field') return true;
        return false;
      });

      // If there are explicit show rules, only show if matched
      const hasShowRule = form.logicRules.some(r => r.targetId === field.id && r.action === 'show_field');
      if (hasShowRule) {
        return shownByRule;
      }

      return !hiddenByRule;
    });
  };

  const allCurrentStepFields = getVisibleFields(
    form.fields.filter(f => f.stepId === currentStep.id || (!f.stepId && currentStepIndex === 0))
  );
  const fieldsPerPage = currentStep.presentation?.mode === 'pagination'
    ? Math.max(1, currentStep.presentation.fieldsPerPage || 1)
    : allCurrentStepFields.length || 1;
  const currentStepPages: FormField[][] = [];
  for (let index = 0; index < allCurrentStepFields.length; index += fieldsPerPage) {
    currentStepPages.push(allCurrentStepFields.slice(index, index + fieldsPerPage));
  }
  const totalPages = Math.max(1, currentStepPages.length);
  const currentPageFields = currentStepPages[currentPageIndex] || [];

  useEffect(() => {
    setCurrentPageIndex(0);
  }, [currentStepIndex]);

  useEffect(() => {
    if (currentPageIndex >= totalPages) setCurrentPageIndex(totalPages - 1);
  }, [currentPageIndex, totalPages]);

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[fieldId];
        return copy;
      });
    }
  };

  /** مَسک زندهٔ فیلد شماره تلفن — روی هر ضربهٔ کیبورد بر اساس phoneFormat فرمت می‌شود */
  const handlePhoneChange = (field: FormField, rawInput: string) => {
    const format = field.validation?.phoneFormat;
    if (!format || format === 'custom') {
      handleInputChange(field.id, rawInput);
      return;
    }
    const config = PHONE_FORMAT_CONFIG[format];
    const digits = toLatinDigits(rawInput).replace(/\D/g, '').slice(0, config.maxDigits);
    handleInputChange(field.id, config.mask(digits));
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    currentPageFields.forEach(field => {
      const val = answers[field.id];
      const rules = field.validation;

      if (rules?.required) {
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          newErrors[field.id] = field.validation?.customErrorMessage || 'تکمیل این فیلد الزامی است.';
        }
      }

      if (val && rules?.minLength && typeof val === 'string' && val.length < rules.minLength) {
        newErrors[field.id] = `حداقل ${rules.minLength} کاراکتر وارد کنید.`;
      }

      if (val && field.charTypeAllowed && field.charTypeAllowed !== 'any' && typeof val === 'string') {
        const filtered = filterByCharType(val, field.charTypeAllowed);
        if (filtered !== val) {
          newErrors[field.id] = field.validation?.customErrorMessage || 'کاراکتر غیرمجاز وارد شده است.';
        }
      }

      if (val && field.type === 'phone' && rules?.phoneFormat && rules.phoneFormat !== 'custom' && typeof val === 'string') {
        const config = PHONE_FORMAT_CONFIG[rules.phoneFormat];
        if (!config.pattern.test(val.replace(/\s/g, ''))) {
          newErrors[field.id] = rules.customErrorMessage || config.errorMessage;
        }
      }

      if (val && field.type === 'email' && typeof val === 'string') {
        const domain = val.split('@')[1]?.toLowerCase().trim();
        if (domain) {
          if (rules?.allowedDomains && rules.allowedDomains.length > 0 && !rules.allowedDomains.some(d => domain === d.toLowerCase().trim())) {
            newErrors[field.id] = rules.customErrorMessage || `ایمیل باید از یکی از این دامنه‌ها باشد: ${rules.allowedDomains.join('، ')}`;
          } else if (rules?.blockFreeEmailProviders && FREE_EMAIL_PROVIDERS.includes(domain)) {
            newErrors[field.id] = rules.customErrorMessage || 'استفاده از ایمیل‌های عمومی رایگان (Gmail، Yahoo و...) مجاز نیست.';
          }
        }
      }

      if (val && (field.type === 'date' || field.type === 'datetime') && typeof val === 'string' && (rules?.disallowPastDates || rules?.disallowFutureDates)) {
        const isJalali = (field.calendarType || 'jalali') === 'jalali';
        let isoDate: string | null = null;
        if (isJalali) {
          try {
            const d = new DateObject({ calendar: persianCalendar, date: toEnglishDigits(val), format: 'YYYY/MM/DD' });
            isoDate = d.convert(gregorianCalendar).format('YYYY-MM-DD');
          } catch {
            isoDate = null;
          }
        } else {
          isoDate = val.slice(0, 10);
        }
        if (isoDate) {
          const today = todayIsoString();
          if (rules?.disallowPastDates && isoDate < today) {
            newErrors[field.id] = rules.customErrorMessage || 'امکان انتخاب تاریخ‌های گذشته وجود ندارد.';
          } else if (rules?.disallowFutureDates && isoDate > today) {
            newErrors[field.id] = rules.customErrorMessage || 'امکان انتخاب تاریخ‌های آینده وجود ندارد.';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validateStep()) {
      if (currentPageIndex < totalPages - 1) {
        setCurrentPageIndex(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
        setCurrentPageIndex(0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        await handleSubmit();
      }
    }
  };

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setCurrentPageIndex(0);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    // Calculate score if quiz
    let computedScore: number | undefined = undefined;
    if (form.quizConfig.isQuiz) {
      let total = 0;
      form.fields.forEach(field => {
        if (field.correctAnswer && answers[field.id] === field.correctAnswer) {
          total += field.points || 0;
        }
      });
      computedScore = total;
      setFinalScore(total);
    }

    const code = `${form.settings.trackingCodePrefix || 'FRM'}-${Math.floor(100000 + Math.random() * 900000)}`;
    const serverResult = onSubmitted
      ? await onSubmitted(answers, code, computedScore)
      : undefined;
    const persistedResult = serverResult && typeof serverResult === 'object' ? serverResult : undefined;
    setTrackingCode(persistedResult?.trackingCode || code);
    if (persistedResult?.scoreTotal !== undefined) setFinalScore(persistedResult.scoreTotal);
    setIsSubmitted(true);

    if (onSubmitted) {
      onSubmitted(answers, code, computedScore);
    }
  };

  // Helper for grade label calculation
  const getGradeInfo = () => {
    if (finalScore === undefined || !form.quizConfig.gradeThresholds) return null;
    return form.quizConfig.gradeThresholds.find(
      gt => finalScore >= gt.minScore && finalScore <= gt.maxScore
    );
  };

  if (isSubmitted) {
    const gradeInfo = getGradeInfo();

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 max-w-2xl mx-auto text-center animate-in zoom-in-95">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {form.settings.customSuccessMessage || 'ثبت با موفقیت انجام گردید!'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          اطلاعات شما در پایگاه داده سامانه ثبت شد و کد پیگیری زیر صادر گردید.
        </p>

        {/* Tracking Code Banner */}
        <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-teal-500/40 rounded-2xl p-6 mb-6 flex flex-col items-center justify-center gap-2">
          <span className="text-xs text-slate-500 font-medium">کد پیگیری یکتا (Tracking Code)</span>
          <span className="text-3xl font-black tracking-widest text-teal-700 dark:text-teal-400">
            {trackingCode}
          </span>
          <span className="text-xs text-slate-400">جهت پیگیری‌های بعدی، این کد را نزد خود نگه‌دارید.</span>
        </div>

        {/* Quiz score display */}
        {form.quizConfig.isQuiz && finalScore !== undefined && (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold mb-2">
              <Award className="w-5 h-5" /> نتیجه و کارنامه آزمون شما
            </div>
            <div className="text-4xl font-extrabold text-indigo-900 dark:text-indigo-100 mb-1">
              {finalScore} <span className="text-lg font-normal text-slate-500">از ۱۰۰ نمره</span>
            </div>
            {gradeInfo && (
              <div
                className="mt-3 inline-block px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: gradeInfo.color }}
              >
                {gradeInfo.gradeLabel} - {gradeInfo.feedbackText}
              </div>
            )}
          </div>
        )}

        {/* QR Code & Printable Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow hover:shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" /> چاپ و ذخیره رسید رسمی
          </button>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setAnswers({});
              setCurrentStepIndex(0);
              setCurrentPageIndex(0);
            }}
            className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> ارسال پاسخ جدید
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden ${
        isEmbedPreview ? 'max-w-full' : 'max-w-3xl mx-auto'
      }`}
    >
      {/* Form Header */}
      <div
        className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 text-white"
        style={{ backgroundColor: form.theme.primaryColor || '#0d9488' }}
      >
        <div className="flex items-center justify-between gap-4 mb-3">
          <span className="text-xs uppercase tracking-wider font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-md">
            {form.type === 'survey' ? 'پرسشنامه' : form.type === 'quiz' ? 'آزمون آنلاین' : 'فرم هوشمند'}
          </span>
          {form.settings.requireAuth && (
            <span className="text-xs text-white/90 flex items-center gap-1 bg-black/20 px-2.5 py-1 rounded-md">
              <ShieldCheck className="w-3.5 h-3.5" /> نیازمند احراز هویت
            </span>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold leading-snug">{form.title}</h1>
        {form.description && (
          <p className="text-sm text-white/90 mt-2 leading-relaxed opacity-90">{form.description}</p>
        )}
      </div>

      {/* Multi-step progress bar */}
      {form.settings.showProgressBar && steps.length > 1 && (
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            <span>
              گام {currentStepIndex + 1} از {steps.length}، صفحه {currentPageIndex + 1} از {totalPages}: {currentStep.title}
            </span>
                <span>{Math.round(((currentStepIndex * totalPages + currentPageIndex + 1) / (steps.length * totalPages)) * 100)}% تکمیلی</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${((currentStepIndex * totalPages + currentPageIndex + 1) / (steps.length * totalPages)) * 100}%`,
                backgroundColor: form.theme.primaryColor || '#0d9488'
              }}
            />
          </div>
        </div>
      )}

      {/* Form Step Body */}
      <div className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {currentPageFields.map(field => {
            const colSpan =
              field.columnWidth === '50%'
                ? 'md:col-span-6'
                : field.columnWidth === '33%'
                ? 'md:col-span-4'
                : 'md:col-span-12';

            const fieldError = errors[field.id];

            return (
              <div key={field.id} className={`${colSpan} space-y-2`}>
                <label htmlFor={field.id} className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {field.label?.trim() || field.placeholder?.trim() || 'این فیلد'}
                  {field.validation?.required && <span className="text-red-500 mr-1">*</span>}
                  {field.points && (
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-normal mr-2">
                      ({field.points} نمره)
                    </span>
                  )}
                </label>

                {field.helpText && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{field.helpText}</p>
                )}

                {/* Render specific field input */}
                {field.type === 'text' && (
                  <input
                    id={field.id}
                    type="text"
                    placeholder={field.placeholder}
                    value={answers[field.id] || ''}
                    onChange={e => handleInputChange(field.id, filterByCharType(e.target.value, field.charTypeAllowed))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    id={field.id}
                    rows={4}
                    placeholder={field.placeholder}
                    value={answers[field.id] || ''}
                    onChange={e => handleInputChange(field.id, filterByCharType(e.target.value, field.charTypeAllowed))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                )}

                {field.type === 'phone' && (() => {
                  const phoneFormat = field.validation?.phoneFormat;
                  const phoneConfig = phoneFormat && phoneFormat !== 'custom' ? PHONE_FORMAT_CONFIG[phoneFormat] : null;
                  return (
                    <input
                      id={field.id}
                      type="tel"
                      placeholder={field.placeholder || phoneConfig?.placeholder || '۰۹۱۲۳۴۵۶۷۸۹'}
                      value={answers[field.id] || ''}
                      onChange={e => handlePhoneChange(field, e.target.value)}
                      dir="ltr"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm text-right focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  );
                })()}

                {field.type === 'email' && (
                  <input
                    id={field.id}
                    type="email"
                    placeholder={field.placeholder || 'example@domain.com'}
                    value={answers[field.id] || ''}
                    onChange={e => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm dir-ltr text-right focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                )}

                {(field.type === 'date' || field.type === 'datetime') && (() => {
                  const isJalali = (field.calendarType || 'jalali') === 'jalali';
                  if (isJalali) {
                    return (
                      <JalaliDatepicker
                        value={answers[field.id] || ''}
                        onChange={v => handleInputChange(field.id, v)}
                        iconColor={field.iconColor}
                        minDate={field.validation?.disallowPastDates ? todayJalaliString() : undefined}
                        maxDate={field.validation?.disallowFutureDates ? todayJalaliString() : undefined}
                      />
                    );
                  }
                  return (
                    <input
                      id={field.id}
                      type={field.type === 'datetime' ? 'datetime-local' : 'date'}
                      value={answers[field.id] || ''}
                      min={field.validation?.disallowPastDates ? todayIsoString() : undefined}
                      max={field.validation?.disallowFutureDates ? todayIsoString() : undefined}
                      onChange={e => handleInputChange(field.id, e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  );
                })()}

                {field.type === 'time' && (
                  <input
                    id={field.id}
                    type="time"
                    value={answers[field.id] || ''}
                    onChange={e => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                )}

                {field.type === 'select' && (
                  <SelectField
                    field={field}
                    value={answers[field.id]}
                    onChange={v => handleInputChange(field.id, v)}
                  />
                )}

                {field.type === 'radio' && (
                  <div className={`pt-1 ${choiceLayoutClass(field.choiceLayout)}`}>
                    {field.options?.map(opt => (
                      <label
                        key={opt.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name={field.id}
                          value={opt.value}
                          checked={answers[field.id] === opt.value}
                          onChange={e => handleInputChange(field.id, e.target.value)}
                          className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {field.type === 'checkbox' && (() => {
                  const selected: string[] = Array.isArray(answers[field.id]) ? answers[field.id] : [];
                  return (
                    <div className={`pt-1 ${choiceLayoutClass(field.choiceLayout)}`}>
                      {field.options?.map(opt => {
                        const isChecked = selected.includes(opt.value);
                        return (
                          <label
                            key={opt.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() =>
                                handleInputChange(field.id, isChecked ? selected.filter(v => v !== opt.value) : [...selected, opt.value])
                              }
                              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-slate-300"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                              {opt.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  );
                })()}

                {field.type === 'switch' && (
                  <ToggleSwitch
                    id={field.id}
                    checked={!!answers[field.id]}
                    onChange={v => handleInputChange(field.id, v)}
                    onLabel={field.placeholder || 'فعال'}
                    offLabel="غیرفعال"
                  />
                )}

                {field.type === 'rating' && (() => {
                  const min = field.validation?.min ?? 1;
                  const max = field.validation?.max ?? 5;
                  const rating = Number(answers[field.id]) || 0;
                  const color = field.iconColor || '#fbbf24';
                  const iconType = field.ratingIconType || 'star';
                  const range = Array.from({ length: Math.max(1, max - min + 1) }, (_, i) => min + i);

                  let ratingControl: React.ReactNode;
                  if (iconType === 'emoji') {
                    const mid = Math.round((min + max) / 2);
                    const emojiOptions = [{ v: min, e: '🙁' }, { v: mid, e: '😐' }, { v: max, e: '🙂' }];
                    ratingControl = (
                      <div className="flex items-center gap-3">
                        {emojiOptions.map(opt => (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() => handleInputChange(field.id, opt.v)}
                            className={`text-3xl leading-none transition-transform hover:scale-110 rounded-full p-1 ${rating === opt.v ? 'ring-2' : 'opacity-40'}`}
                            style={rating === opt.v ? { ['--tw-ring-color' as any]: color } : undefined}
                          >
                            {opt.e}
                          </button>
                        ))}
                      </div>
                    );
                  } else if (iconType === 'number') {
                    ratingControl = (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {range.map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => handleInputChange(field.id, n)}
                            className="w-9 h-9 rounded-lg text-sm font-bold border transition-colors"
                            style={rating === n ? { backgroundColor: color, borderColor: color, color: '#fff' } : { borderColor: '#cbd5e1' }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    );
                  } else {
                    const Icon = iconType === 'heart' ? Heart : Star;
                    ratingControl = (
                      <div className="flex items-center gap-2 pt-2">
                        {range.map(n => (
                          <button
                            type="button"
                            key={n}
                            onClick={() => handleInputChange(field.id, n)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Icon
                              className={`w-8 h-8 ${rating >= n ? '' : 'text-slate-300 dark:text-slate-700'}`}
                              style={rating >= n ? { color, fill: color } : undefined}
                            />
                          </button>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-1">
                      {ratingControl}
                      {(field.startRatingLabel || field.endRatingLabel) && (
                        <div className="flex items-center justify-between text-[11px] text-slate-400 max-w-[220px]">
                          <span>{field.startRatingLabel}</span>
                          <span>{field.endRatingLabel}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {field.type === 'slider' && (
                  <div className="flex items-center gap-3">
                    <input
                      id={field.id}
                      type="range"
                      dir="ltr"
                      min={field.validation?.min ?? 0}
                      max={field.validation?.max ?? 100}
                      value={answers[field.id] ?? field.validation?.min ?? 0}
                      onChange={e => handleInputChange(field.id, Number(e.target.value))}
                      className="flex-1"
                      // علت dir="ltr" + scaleX(-1): مرورگرهای مبتنی بر Chromium جهت داخلی
                      // رنجر را مطابق dir="rtl" صفحه اصلاح نمی‌کنند و کلیک باعث پرش می‌شود
                      style={{ accentColor: '#0d9488', transform: 'scaleX(-1)' }}
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 text-center whitespace-nowrap">
                      {answers[field.id] ?? field.validation?.min ?? 0}
                      {field.numberUnit ? ` ${field.numberUnit}` : ''}
                    </span>
                  </div>
                )}

                {field.type === 'yesno' && (
                  <ToggleSwitch
                    id={field.id}
                    checked={answers[field.id] === 'yes'}
                    onChange={v => handleInputChange(field.id, v ? 'yes' : 'no')}
                    onLabel={field.yesLabel || 'بله'}
                    offLabel={field.noLabel || 'خیر'}
                  />
                )}


                {(field.type === 'address' || field.type === 'location') && (() => {
                  const addr = (answers[field.id] && typeof answers[field.id] === 'object') ? answers[field.id] : {};
                  const updateAddr = (key: string, val: any) => handleInputChange(field.id, { ...addr, [key]: val });
                  const isLocating = !!geoLocating[field.id];
                  const accent = form.theme.primaryColor || '#0d9488';
                  return (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={addr.full || ''}
                        placeholder={field.placeholder || 'آدرس کامل را وارد کنید...'}
                        onChange={e => updateAddr('full', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      {field.includeProvince !== false && (
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={addr.province || ''}
                            onChange={e => updateAddr('province', e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          >
                            <option value="">— استان —</option>
                            {IRAN_PROVINCES.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={addr.city || ''}
                            onChange={e => updateAddr('city', e.target.value)}
                            placeholder="شهر"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                          />
                        </div>
                      )}
                      {field.includePostalCode !== false && (
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={10}
                          value={addr.postalCode || ''}
                          onChange={e => updateAddr('postalCode', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="کد پستی ده‌رقمی"
                          dir="ltr"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                        />
                      )}
                      {field.includeGeoCoordinates !== false && (
                        <div className="space-y-2">
                          <GeoMapPicker
                            lat={addr.lat}
                            lng={addr.lng}
                            accent={accent}
                            onChange={(newLat, newLng) => handleInputChange(field.id, { ...addr, lat: newLat, lng: newLng })}
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (!navigator.geolocation) return;
                                setGeoLocating(prev => ({ ...prev, [field.id]: true }));
                                navigator.geolocation.getCurrentPosition(
                                  pos => {
                                    handleInputChange(field.id, { ...addr, lat: pos.coords.latitude, lng: pos.coords.longitude });
                                    setGeoLocating(prev => ({ ...prev, [field.id]: false }));
                                  },
                                  () => setGeoLocating(prev => ({ ...prev, [field.id]: false })),
                                  { enableHighAccuracy: true, timeout: 10000 }
                                );
                              }}
                              disabled={isLocating}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white flex items-center gap-1.5 disabled:opacity-60"
                              style={{ backgroundColor: accent }}
                            >
                              <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                              {isLocating ? 'در حال دریافت موقعیت...' : 'استفاده از موقعیت فعلی من'}
                            </button>
                            <span className="text-[10px] text-slate-400">یا روی نقشه کلیک کنید / پین را جابه‌جا کنید</span>
                            {addr.lat && addr.lng && (
                              <span className="text-[11px] font-mono text-slate-500" dir="ltr">
                                {addr.lat.toFixed(5)}, {addr.lng.toFixed(5)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {field.type === 'file' && (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-teal-500 transition-colors">
                    <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: field.iconColor || '#94a3b8' }} />
                    <label className="cursor-pointer text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                      انتخاب فایل از رایانه
                      <input
                        type="file"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFileNames(prev => ({ ...prev, [field.id]: file.name }));
                            handleInputChange(field.id, file.name);
                          }
                        }}
                      />
                    </label>
                    {fileNames[field.id] ? (
                      <p className="text-xs text-emerald-600 font-medium mt-2">
                        فایل انتخاب شد: {fileNames[field.id]}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">حداکثر حجم مجاز: ۵ مگابایت</p>
                    )}
                  </div>
                )}

                {field.type === 'signature' && (() => {
                  const padType = field.signaturePadType || 'draw';
                  if (padType === 'type') {
                    return (
                      <input
                        type="text"
                        value={answers[field.id] || ''}
                        placeholder={field.placeholder || 'نام خود را به‌عنوان امضا تایپ کنید...'}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        style={{ fontFamily: "'Lucida Handwriting', 'Brush Script MT', cursive", fontSize: '1.4rem', color: field.iconColor || '#0f172a' }}
                      />
                    );
                  }
                  if (padType === 'upload') {
                    return (
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-teal-500 transition-colors">
                        <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: field.iconColor || '#94a3b8' }} />
                        <label className="cursor-pointer text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                          بارگذاری تصویر امضای اسکن‌شده
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFileNames(prev => ({ ...prev, [field.id]: file.name }));
                                handleInputChange(field.id, file.name);
                              }
                            }}
                          />
                        </label>
                        {fileNames[field.id] && (
                          <p className="text-xs text-emerald-600 font-medium mt-2">فایل انتخاب شد: {fileNames[field.id]}</p>
                        )}
                      </div>
                    );
                  }
                  return (
                    <SignatureCanvasField
                      value={typeof answers[field.id] === 'string' ? answers[field.id] : ''}
                      onChange={dataUrl => handleInputChange(field.id, dataUrl)}
                      height={field.signatureCanvasHeight || 160}
                      color={field.iconColor}
                    />
                  );
                })()}

                {field.type === 'security' && field.securityType !== 'honeypot' && (
                  <div
                    className={`flex items-center gap-2 ${
                      field.securityStyle === 'card'
                        ? 'p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm'
                        : field.securityStyle === 'minimal'
                        ? ''
                        : 'p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                    }`}
                  >
                    <div
                      className="flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono tracking-[0.3em] text-slate-500 select-none shrink-0"
                      style={{ height: field.securitySize === 'lg' ? 72 : field.securitySize === 'sm' ? 40 : 56, minWidth: 120 }}
                    >
                      {field.securityType === 'image_challenge' ? '۷ + ۴ = ؟' : 'A7K9P'}
                    </div>
                    <button
                      type="button"
                      disabled
                      title="در حالت پیش‌نمایش، کد امنیتی واقعی تولید نمی‌شود"
                      className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-400 cursor-not-allowed"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      dir="ltr"
                      value={answers[field.id]?.value || ''}
                      onChange={e => handleInputChange(field.id, { token: 'preview', value: e.target.value })}
                      placeholder={field.placeholder || 'کد را وارد کنید'}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-left"
                    />
                  </div>
                )}

                {field.type === 'security' && field.securityType === 'honeypot' && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-700 dark:text-amber-400">
                    این فیلد امنیتی نامرئی است؛ در فرم نهایی هیچ کادری برای کاربر واقعی نمایش داده نمی‌شود.
                  </div>
                )}

                {/* Error message display */}
                {fieldError && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {fieldError}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Controls */}
      <div className={`p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center ${steps.length > 1 || totalPages > 1 ? 'justify-between' : 'justify-end'}`}>
        {(steps.length > 1 || totalPages > 1) && (
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0 && currentPageIndex === 0}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowRight className="w-4 h-4" /> صفحه قبلی
          </button>
        )}

        <button
          onClick={handleNext}
          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-teal-500/20 flex items-center gap-2 transition-all"
        >
          {currentStepIndex === steps.length - 1 && currentPageIndex === totalPages - 1 ? (
            <>
              ثبت نهایی و دریافت کد پیگیری <Send className="w-4 h-4" />
            </>
          ) : (
            <>
              صفحه بعدی <ArrowLeft className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
