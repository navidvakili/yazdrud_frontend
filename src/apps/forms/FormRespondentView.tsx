import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Star,
  Printer,
  QrCode,
  Sparkles,
  Award,
  ShieldCheck,
  RotateCcw,
  Send,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { FormDefinition, FormField, FormStep, LogicRule } from './types';

interface FormRespondentViewProps {
  form: FormDefinition;
  onSubmitted?: (
    answers: Record<string, any>,
    trackingCode: string,
    totalScore?: number
  ) => Promise<{ trackingCode?: string; scoreTotal?: number; gradeLabel?: string } | void> | void;
  isEmbedPreview?: boolean;
}

export const FormRespondentView: React.FC<FormRespondentViewProps> = ({
  form,
  onSubmitted,
  isEmbedPreview = false
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [finalScore, setFinalScore] = useState<number | undefined>(undefined);
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  
  // Canvas refs for signatures
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = (fieldId: string) => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      handleInputChange(fieldId, canvas.toDataURL());
    }
  };

  const clearCanvas = (fieldId: string) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      handleInputChange(fieldId, '');
    }
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
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {field.label}
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
                    type="text"
                    placeholder={field.placeholder}
                    value={answers[field.id] || ''}
                    onChange={e => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    rows={4}
                    placeholder={field.placeholder}
                    value={answers[field.id] || ''}
                    onChange={e => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                )}

                {field.type === 'phone' && (
                  <input
                    type="tel"
                    placeholder={field.placeholder || '۰۹۱۲۳۴۵۶۷۸۹'}
                    value={answers[field.id] || ''}
                    onChange={e => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm dir-ltr text-right focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                )}

                {field.type === 'email' && (
                  <input
                    type="email"
                    placeholder={field.placeholder || 'example@domain.com'}
                    value={answers[field.id] || ''}
                    onChange={e => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm dir-ltr text-right focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={answers[field.id] || ''}
                    onChange={e => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">{field.placeholder || 'انتخاب کنید...'}</option>
                    {field.options?.map(opt => (
                      <option key={opt.id} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'radio' && (
                  <div className="space-y-2 pt-1">
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

                {field.type === 'rating' && (
                  <div className="flex items-center gap-2 pt-2">
                    {[1, 2, 3, 4, 5].map(starVal => (
                      <button
                        type="button"
                        key={starVal}
                        onClick={() => handleInputChange(field.id, starVal)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            (answers[field.id] || 0) >= starVal ? '' : 'text-slate-300 dark:text-slate-700'
                          }`}
                          style={
                            (answers[field.id] || 0) >= starVal
                              ? { color: field.iconColor || '#fbbf24', fill: field.iconColor || '#fbbf24' }
                              : undefined
                          }
                        />
                      </button>
                    ))}
                  </div>
                )}

                {field.type === 'yesno' && (
                  <div className="flex gap-4 pt-1">
                    {[
                      { label: 'بله', val: 'yes' },
                      { label: 'خیر', val: 'no' }
                    ].map(opt => (
                      <button
                        type="button"
                        key={opt.val}
                        onClick={() => handleInputChange(field.id, opt.val)}
                        className={`flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                          answers[field.id] === opt.val
                            ? 'bg-teal-600 border-teal-600 text-white shadow'
                            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {field.type === 'matrix' && field.matrixRows && field.matrixCols && (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl mt-2">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-bold">
                        <tr>
                          <th className="p-3">معیار ارزیابی</th>
                          {field.matrixCols.map(col => (
                            <th key={col.id} className="p-3 text-center">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {field.matrixRows.map(row => (
                          <tr key={row.id}>
                            <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                              {row.label}
                            </td>
                            {field.matrixCols!.map(col => (
                              <td key={col.id} className="p-3 text-center">
                                <input
                                  type="radio"
                                  name={`${field.id}_${row.id}`}
                                  checked={answers[field.id]?.[row.id] === col.id}
                                  onChange={() => {
                                    const currentMatrix = answers[field.id] || {};
                                    handleInputChange(field.id, {
                                      ...currentMatrix,
                                      [row.id]: col.id
                                    });
                                  }}
                                  className="w-4 h-4 text-teal-600"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

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

                {field.type === 'signature' && (
                  <div className="space-y-2">
                    <div className="border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden">
                      <canvas
                        ref={canvasRef}
                        width={500}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={() => stopDrawing(field.id)}
                        className="w-full cursor-crosshair touch-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => clearCanvas(field.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      پاک‌سازی امضا
                    </button>
                  </div>
                )}

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
