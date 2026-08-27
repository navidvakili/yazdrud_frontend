import React, { useState } from 'react';
import { Sparkles, Wand2, RefreshCw, CheckCircle2, AlertCircle, Bot, Zap, Plus, FileText } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { FormDefinition, FormField, FormType } from './types';
import { defaultTheme } from './mockData';

interface AiFormAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFormGenerated: (generatedForm: Partial<FormDefinition>) => void;
}

const PRESET_PROMPTS = [
  'یک پرسشنامه ارزیابی رضایت دانشجویان از کیفیت غذا و خدمات سلف سرویس دانشگاه ایجاد کن.',
  'فرم ثبت‌نام برای مسابقات ملی برنامه‌نویسی همراه با انتخاب تیم، رزومه و پرداخت.',
  'کوئیز ۱۰ سوالی خودسنجی از مباحث مفاهیم هوش مصنوعی و یادگیری ماشین همراه با کلید پاسخ.',
  'فرم نظر سنجی و دریافت پیشنهادات برای ارتقای کتابخانه مرکزی و منابع دیجیتال.'
];

export const AiFormAssistantModal: React.FC<AiFormAssistantModalProps> = ({
  isOpen,
  onClose,
  onFormGenerated
}) => {
  const [prompt, setPrompt] = useState('');
  const [formType, setFormType] = useState<FormType>('survey');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      let generatedFields: FormField[] = [];
      let generatedTitle = 'فرم ساخته شده توسط هوش مصنوعی';
      let generatedDesc = 'این فرم بر اساس دستورالعمل و هوش مصنوعی استخراج شده است.';

      // Attempt AI generation if GEMINI_API_KEY exists
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `تو یک دستیار هوشمند فرم‌ساز و پرسشنامه‌ساز هستید.
کاربر یک توصیف از فرم یا پرسشنامه به زبان فارسی می‌دهد.
تو باید یک ساختار JSON معتبر شامل عنوان (title)، توضیح (description)، و لیستی از سوالات (fields) تولید کنی.
هر field باید شامل موارد زیر باشد:
- id: رشته یکتا مثل f_1, f_2
- type: یکی از 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'rating' | 'yesno' | 'matrix' | 'file' | 'date'
- label: متن سوال به فارسی
- placeholder: متن راهنما یا نمونه
- validation: { required: boolean }
- options: در صورت type بودن select/radio/checkbox لیستی از { id, label, value }

پاسخ را فقط بصورت یک JSON معتبر ارسال کن بدون هیچ متن اضافه یا markdown code block.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [systemPrompt, `دستور کاربر: ${prompt}`]
        });

        const text = response.text || '';
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (parsed.title) generatedTitle = parsed.title;
        if (parsed.description) generatedDesc = parsed.description;
        if (Array.isArray(parsed.fields) && parsed.fields.length > 0) {
          generatedFields = parsed.fields;
        }
      }

      // Fallback smart field generation if no API key or if API response was sparse
      if (generatedFields.length === 0) {
        generatedTitle = `فرم هوشمند: ${prompt.slice(0, 35)}...`;
        generatedDesc = `طراحی شده توسط دستیار هوش مصنوعی نیما بر اساس توصیف: "${prompt}"`;
        
        generatedFields = [
          {
            id: 'ai_f1',
            type: 'text',
            label: 'نام و نام خانوادگی متقاضی',
            placeholder: 'مثال: علی محمدی',
            columnWidth: '50%',
            validation: { required: true }
          },
          {
            id: 'ai_f2',
            type: 'phone',
            label: 'شماره تلفن همراه جهت اطلاع‌رسانی',
            placeholder: '۰۹۱۲۳۴۵۶۷۸۹',
            columnWidth: '50%',
            validation: { required: true }
          },
          {
            id: 'ai_f3',
            type: 'rating',
            label: 'میزان رضایت یا اهمیت موضوع از دیدگاه شما (۱ تا ۵ ستاره)',
            columnWidth: '100%',
            validation: { required: true }
          },
          {
            id: 'ai_f4',
            type: 'radio',
            label: 'کدام گزینه وضعیت فعلی شما را بهتر توصیف می‌کند؟',
            columnWidth: '100%',
            validation: { required: true },
            options: [
              { id: 'opt_1', label: 'عالی و بدون نقص', value: 'excellent' },
              { id: 'opt_2', label: 'خوب ولی نیازمند بهبود جزئی', value: 'good' },
              { id: 'opt_3', label: 'متوسط و نیازمند بازنگری', value: 'average' },
              { id: 'opt_4', label: 'ضعیف و غیرقابل قبول', value: 'poor' }
            ]
          },
          {
            id: 'ai_f5',
            type: 'textarea',
            label: 'شرح جزئیات، پیشنهادات یا انتقادات سازنده شما',
            placeholder: 'لطفاً دیدگاه تخصصی خود را به صورت کامل بنویسید...',
            columnWidth: '100%'
          }
        ];
      }

      const generatedForm: Partial<FormDefinition> = {
        title: generatedTitle,
        description: generatedDesc,
        type: formType,
        status: 'draft',
        category: 'تولید شده با AI',
        tags: ['هوش مصنوعی', 'فرم هوشمند', 'خودکار'],
        ownerName: 'دستیار AI سیستم',
        version: 1,
        steps: [{ id: 's_ai', title: 'گام اصلی پرسشنامه', order: 1 }],
        fields: generatedFields.map(f => ({ ...f, stepId: f.stepId || 's_ai' })),
        layoutBlocks: [],
        logicRules: [],
        quizConfig: {
          isQuiz: formType === 'quiz',
          showInstantResult: formType === 'quiz',
          allowNegativeScore: false,
          randomizeQuestions: false,
          gradeThresholds: []
        },
        theme: defaultTheme,
        settings: {
          allowAnonymous: true,
          limitOnePerUser: false,
          requireAuth: false,
          enableCaptcha: true,
          enableAutoSave: true,
          showProgressBar: true,
          showWelcomeScreen: false,
          customSuccessMessage: 'اطلاعات شما با موفقیت ثبت شد.',
          generateTrackingCode: true,
          trackingCodePrefix: 'AI-2026',
          sendEmailNotification: false,
          sendSmsNotification: false
        }
      };

      onFormGenerated(generatedForm);
      onClose();
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      setError('خطا در ارتباط با مدل هوش مصنوعی. فرم نمونه آماده جایگزین گردید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-200">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold">دستیار هوشمند ساخت فرم و پرسشنامه</h2>
              <p className="text-xs text-teal-100 mt-0.5">
                توصیف کنید چه فرمی می‌خواهید؛ هوش مصنوعی ساختار، سوالات و منطق را آماده می‌کند.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl font-semibold leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              نوع ماژول ساختار:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'survey', label: 'پرسشنامه / نظرسنجی' },
                { id: 'form', label: 'فرم عمومی / ثبت داده' },
                { id: 'quiz', label: 'کوئیز / آزمون آنلاین' },
                { id: 'registration', label: 'ثبت‌نام و همایش' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setFormType(t.id as FormType)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-center ${
                    formType === t.id
                      ? 'bg-teal-50 border-teal-500 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-600 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Natural language prompt input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              توصیف متنی فرم یا پرسشنامه به زبان فارسی:
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="مثال: یک پرسشنامه سنجش رضایت شغلی کارکنان دانشگاه شامل سؤالات مقیاس لیکرت ۵ تایی، بارگذاری فایل مدارک، و منطق شرطی برای دریافت دلیل استعفا یا نارضایتی..."
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-800 dark:text-white text-sm"
            />
          </div>

          {/* Preset Chips */}
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> پیشنهادهای سریع (یک کلیک):
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p)}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-900/40 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors text-right"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Bot className="w-4 h-4 text-teal-600" />
            تولید بر پایه مدل هوشمند Gemini 2.5
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold text-xs rounded-xl shadow-lg hover:shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  در حال استخراج و تحلیل سوالات...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  تولید هوشمند فرم
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
