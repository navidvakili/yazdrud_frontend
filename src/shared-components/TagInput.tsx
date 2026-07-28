// ============================================================
// TagInput — کامپوننت ورودی برچسب‌ها با نمایش بصری
// ============================================================

import { useState, useRef, KeyboardEvent } from 'react';
import { X, Tag, Plus } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
}

export default function TagInput({
  tags,
  onChange,
  placeholder = 'برچسب را تایپ کنید و Enter بزنید...',
  maxTags = 20,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (value: string) => {
    const trimmed = value.trim().replace(/[,،]/g, '').trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) return;
    if (tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      className="w-full px-3 py-2 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500/20 transition-all cursor-text min-h-[42px] flex flex-wrap items-center gap-1.5"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-[11px] font-bold group transition-all"
        >
          <Tag className="w-3 h-3 opacity-60" />
          <span>{tag}</span>
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="p-0.5 rounded-full hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 transition-colors cursor-pointer"
              title="حذف برچسب"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}

      {tags.length < maxTags && !disabled && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) addTag(inputValue);
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none py-1"
        />
      )}

      {tags.length >= maxTags && (
        <span className="text-[10px] text-gray-400 font-mono">حداکثر {maxTags} برچسب</span>
      )}
    </div>
  );
}
