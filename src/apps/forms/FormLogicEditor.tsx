import React, { useState } from 'react';
import { GitBranch, Plus, Trash2, ArrowLeft, Zap, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FormDefinition, LogicRule, LogicOperator, LogicAction } from './types';

interface FormLogicEditorProps {
  form: FormDefinition;
  onChange: (updatedForm: FormDefinition) => void;
}

export const FormLogicEditor: React.FC<FormLogicEditorProps> = ({ form, onChange }) => {
  const [sourceFieldId, setSourceFieldId] = useState(form.fields[0]?.id || '');
  const [operator, setOperator] = useState<LogicOperator>('equals');
  const [val, setVal] = useState('yes');
  const [action, setAction] = useState<LogicAction>('show_field');
  const [targetId, setTargetId] = useState(form.fields[1]?.id || form.fields[0]?.id || '');
  const [validationError, setValidationError] = useState('');

  const handleAddRule = () => {
    if (!sourceFieldId || !targetId) {
      setValidationError('لطفاً سؤال مبدأ و سؤال مقصد را انتخاب کنید.');
      return;
    }
    if (sourceFieldId === targetId) {
      setValidationError('سؤال مبدأ و سؤال مقصد نمی‌توانند یکسان باشند.');
      return;
    }
    setValidationError('');

    const newRule: LogicRule = {
      id: `lr_${Date.now()}`,
      fieldId: sourceFieldId,
      operator,
      value: val,
      action,
      targetId
    };

    onChange({
      ...form,
      logicRules: [...form.logicRules, newRule]
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    onChange({
      ...form,
      logicRules: form.logicRules.filter(r => r.id !== ruleId)
    });
  };

  const getFieldLabel = (id: string) => {
    const f = form.fields.find(item => item.id === id);
    return f ? f.label : id;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              مدیریت منطق شرطی و جریان پویای پرسشنامه (Conditional Flow)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تعریف قانون‌های شرطی برای نمایش/مخفی‌سازی هوشمند سوالات بر اساس پاسخ قبلی کاربر
            </p>
          </div>
        </div>
        <span className="text-xs font-extrabold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
          {form.logicRules.length} قانون فعال
        </span>
      </div>

      {/* New Rule Creator Box */}
      {form.fields.length < 2 ? (
        <div className="text-center py-10 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-500 text-xs space-y-1">
          <AlertCircle className="w-5 h-5 mx-auto text-amber-500" />
          <p className="font-bold">برای تعریف شرط، فرم باید حداقل ۲ سؤال داشته باشد.</p>
          <p>ابتدا از تب «طراح دیداری» چند سؤال به فرم اضافه کنید، سپس به این تب برگردید.</p>
        </div>
      ) : (
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> تعریف شرط جدید:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
          {/* IF Source Field */}
          <div className="md:col-span-3 space-y-1">
            <label className="font-bold text-slate-600 dark:text-slate-400">اگر در سوال:</label>
            <select
              value={sourceFieldId}
              onChange={e => setSourceFieldId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            >
              {form.fields.map(f => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Operator */}
          <div className="md:col-span-2 space-y-1">
            <label className="font-bold text-slate-600 dark:text-slate-400">شرط (پاسخ):</label>
            <select
              value={operator}
              onChange={e => setOperator(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            >
              <option value="equals">برابر باشد با</option>
              <option value="not_equals">مخالف باشد با</option>
              <option value="contains">شامل متن باشد</option>
            </select>
          </div>

          {/* Target Value */}
          <div className="md:col-span-2 space-y-1">
            <label className="font-bold text-slate-600 dark:text-slate-400">مقدار پاسخ:</label>
            <input
              type="text"
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder="مثال: yes یا b3"
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            />
          </div>

          {/* Action */}
          <div className="md:col-span-2 space-y-1">
            <label className="font-bold text-slate-600 dark:text-slate-400">آنگاه (عملیات):</label>
            <select
              value={action}
              onChange={e => setAction(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            >
              <option value="show_field">نمایش دادن سوال</option>
              <option value="hide_field">مخفی کردن سوال</option>
              <option value="skip_to_step">پرش به گام بعد</option>
            </select>
          </div>

          {/* Target Field */}
          <div className="md:col-span-3 space-y-1">
            <label className="font-bold text-slate-600 dark:text-slate-400">سوال مقصد:</label>
            <select
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
            >
              {form.fields.map(f => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleAddRule}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow hover:shadow-teal-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> افزودن قانون به سیستم
          </button>
          {validationError && (
            <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {validationError}
            </span>
          )}
        </div>
      </div>
      )}

      {/* Rules List Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          قوانین فعال تعریف شده ({form.logicRules.length}):
        </h3>

        {form.logicRules.length === 0 ? (
          <div className="text-center py-10 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 text-xs">
            هیچ قانون شرطی ثبت نشده است. پرسشنامه با روند خطی اجرا می‌شود.
          </div>
        ) : (
          <div className="space-y-2">
            {form.logicRules.map((rule, idx) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 text-xs font-medium"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-slate-500">اگر </span>
                    <span className="font-bold text-teal-700 dark:text-teal-400">
                      «{getFieldLabel(rule.fieldId)}»
                    </span>
                    <span className="text-slate-500"> برابر با </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      «{String(rule.value)}»
                    </span>
                    <span className="text-slate-500"> شد ➔ آنگاه </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {rule.action === 'show_field' ? 'نمایش داده شود' : 'مخفی شود'}:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 ml-1">
                      «{getFieldLabel(rule.targetId || '')}»
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                  title="حذف شرط"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
