// ============================================================
// WysiwygEditor — ویرایشگر WYSIWYG با قابلیت ویرایش مشترک
// مبتنی بر Tiptap + Y.js Collaboration
// ============================================================

import { useState, useEffect, useRef, memo, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-caret';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, AlignRight, AlignCenter, AlignLeft, AlignJustify,
  Quote, Minus, Undo2, Redo2, Link as LinkIcon, Image as ImageIcon,
  Highlighter, Palette, Table as TableIcon, RemoveFormatting,
  Globe, CodeSquare, Maximize2, Minimize2, Sparkles, Languages,
} from 'lucide-react';
import MediaManager from './MediaManager';
import { VariableInsertButton } from './PageVariables';
import { toPersianDigits } from '@/src/shared-utils/formatters';

/** Image extension with configurable width (for resize controls) */
const ResizableImage = Image.extend({
  selectable: true,
  // NOTE: draggable: true conflicts with click-to-select in ProseMirror's event pipeline.
  // When enabled, ProseMirror's drag handler intercepts mousedown on the image and
  // reverts NodeSelection back to TextSelection. Keep it false for reliable selection.
  draggable: false,
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => element.getAttribute('width') || element.style.width || null,
        renderHTML: attributes => {
          if (!attributes.width) return {};
          const width = String(attributes.width);
          return {
            width,
            style: `width: ${width}; height: auto;`,
          };
        },
      },
    };
  },
});

const IMAGE_SIZE_PRESETS = [
  { label: '۲۵٪', value: '25%' },
  { label: '۵۰٪', value: '50%' },
  { label: '۷۵٪', value: '75%' },
  { label: '۱۰۰٪', value: '100%' },
] as const;

// ===== Collaboration Config =====
const ROOM_PREFIX = 'news-editor-';

interface CollaboratorInfo {
  name: string;
  color: string;
}

const COLLAB_COLORS: CollaboratorInfo[] = [
  { name: 'کاربر ۱', color: '#10b981' },
  { name: 'کاربر ۲', color: '#6366f1' },
  { name: 'کاربر ۳', color: '#f59e0b' },
  { name: 'کاربر ۴', color: '#ef4444' },
  { name: 'کاربر ۵', color: '#8b5cf6' },
  { name: 'کاربر ۶', color: '#ec4899' },
  { name: 'کاربر ۷', color: '#236DB6' },
  { name: 'کاربر ۸', color: '#f97316' },
];

// ===== Toolbar Button =====
function ToolbarBtn({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 shadow-xs'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-0.5" />;
}

// ===== ImageSizePalette — image resize controls =====
// Shows floating width presets when an image is selected (NodeSelection).
// We rely on ProseMirror's built-in mousedown handler + handleClick in editorProps
// to create a stable NodeSelection. No DOM manipulation needed.
const ImageSizePalette = memo(function ImageSizePalette({ editor }: { editor: any }) {
  const [visible, setVisible] = useState(false);
  const [currentWidth, setCurrentWidth] = useState<string>('');

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { selection } = editor.state;
      if (!(selection instanceof NodeSelection)) {
        setVisible(false);
        return;
      }
      const node = selection.node;
      if (!node || node.type?.name !== 'image') {
        setVisible(false);
        return;
      }

      setVisible(true);
      setCurrentWidth(node.attrs?.width ?? '');
    };

    editor.on('selectionUpdate', update);
    update();

    return () => {
      editor.off('selectionUpdate', update);
    };
  }, [editor]);

  const setWidth = (width: string | null) => {
    const { selection } = editor.state;
    if (!(selection instanceof NodeSelection) || !selection.node || selection.node.type?.name !== 'image') return;
    editor.chain().updateAttributes('image', { width }).run();
  };

  const applyWidthInput = () => {
    if (!inputRef.current) return;
    const width = inputRef.current.value.trim() || null;
    const { selection } = editor.state;
    if (!(selection instanceof NodeSelection) || !selection.node || selection.node.type?.name !== 'image') return;
    editor.chain().updateAttributes('image', { width }).run();
  };

  const inputRef = useRef<HTMLInputElement>(null);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-1 mr-1 px-1.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800">
      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 whitespace-nowrap shrink-0">اندازه:</span>
      {IMAGE_SIZE_PRESETS.map(preset => (
        <button
          key={preset.value}
          type="button"
          onMouseDown={e => e.preventDefault()}
          onClick={() => setWidth(preset.value)}
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors shrink-0 ${
            currentWidth === preset.value
              ? 'bg-teal-600 text-white'
              : 'text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40'
          }`}
          title={`عرض تصویر ${preset.label}`}
        >
          {preset.label}
        </button>
      ))}
      <input
        ref={inputRef}
        type="text"
        defaultValue={currentWidth}
        onBlur={applyWidthInput}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        placeholder="مثلاً 300px"
        className="w-16 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-gray-800 border border-teal-300 dark:border-teal-700 text-gray-900 dark:text-white text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
        title="عرض دلخواه (px یا %)"
      />
      <button
        type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => setWidth(null)}
        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors shrink-0 ${
          !currentWidth
            ? 'bg-teal-600 text-white'
            : 'text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40'
        }`}
        title="اندازه پیش‌فرض"
      >
        خودکار
      </button>
    </div>
  );
});

// ===== Props =====
interface WysiwygEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  /** Enable real-time collaboration */
  collaboration?: boolean;
  /** Document ID for collaboration room */
  documentId?: string;
  /** Current user info for collaboration cursors */
  currentUser?: { name: string; color: string };
  minHeight?: string;
  /** Optional callback when an image is uploaded from editor */
  onImageUpload?: (url: string) => void;
  /** حالت نمایش: 'basic' = فقط ابزارهای اساسی، 'full' = همه ابزارها (پیش‌فرض) */
  mode?: 'full' | 'basic';
  /** نمایش دکمهٔ بزرگ‌نمایی (باز شدن نسخهٔ کامل در دیالوگ) */
  showMaximize?: boolean;
  /** با زدن دکمهٔ بزرگ‌نمایی صدا زده می‌شود تا والد دیالوگ نسخهٔ کامل را باز کند */
  onRequestFullscreen?: () => void;
  /** در حالت full با زدن این دکمه صدا زده می‌شود تا والد به حالت پایه (basic) برگردد */
  onRequestCompact?: () => void;
  /** نمایش دکمهٔ درج آیکون (توکن [icon:name]) در نوار ابزار */
  showIconButton?: boolean;
  /** با زدن دکمهٔ درج آیکون صدا زده می‌شود تا والد، انتخابگر آیکون را باز کند */
  onRequestIcon?: () => void;
  /** نمایش دکمهٔ «درج متغیر» (توکن {{key}}) در نوار ابزار — منوی متغیرها خودکفاست، نیازی به هندلر باز/بسته شدن از والد نیست */
  showVariableButton?: boolean;
}

export interface WysiwygEditorHandle {
  /** درج توکن آیکون [icon:name] در محل مکان‌نما */
  insertIconToken: (iconName: string) => void;
  /** درج یک رشتهٔ خام (مثلاً توکن متغیر {{key}}) در محل مکان‌نما */
  insertRawText: (text: string) => void;
}

// ===== Main Component =====
export default forwardRef<WysiwygEditorHandle, WysiwygEditorProps>(function WysiwygEditor(
  {
    content,
    onChange,
    placeholder = 'متن خود را بنویسید...',
    editable = true,
    collaboration = false,
    documentId,
    currentUser,
    minHeight = '320px',
    onImageUpload,
    mode = 'full',
    showMaximize = false,
    onRequestFullscreen,
    onRequestCompact,
    showIconButton = false,
    onRequestIcon,
    showVariableButton = false,
  }: WysiwygEditorProps,
  ref
) {
  const isBasic = mode === 'basic';
  const yDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const isInternalUpdate = useRef(false);
  const lastSyncedContentRef = useRef(content);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [htmlSourceText, setHtmlSourceText] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [tableHover, setTableHover] = useState({ r: 0, c: 0 });

  // ===== Create yDoc BEFORE extensions if collaboration enabled =====
  // This ensures Collaboration extensions have access to yDoc at editor creation time
  if (collaboration && documentId && !yDocRef.current) {
    const yDoc = new Y.Doc();
    yDocRef.current = yDoc;
    const provider = new WebrtcProvider(`${ROOM_PREFIX}${documentId}`, yDoc, {
      signaling: ['wss://signaling.yjs.dev'],
    });
    providerRef.current = provider;
    if (currentUser) {
      provider.awareness.setLocalStateField('user', {
        name: currentUser.name,
        color: currentUser.color,
      });
    }
  }

  // ===== Cleanup =====
  useEffect(() => {
    return () => {
      providerRef.current?.disconnect();
      providerRef.current?.destroy();
      yDocRef.current?.destroy();
    };
  }, []);

  // ===== Extensions (stable reference — initialized once) =====
  const extensionsRef = useRef<any[] | null>(null);
  if (!extensionsRef.current) {
    const exts: any[] = [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ResizableImage.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-teal-600 underline' } }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ];

    // Add Collaboration extensions if yDoc is ready (created before extensions)
    if (yDocRef.current && providerRef.current) {
      exts.push(Collaboration.configure({ document: yDocRef.current }));
      exts.push(CollaborationCursor.configure({ provider: providerRef.current }));
    }

    extensionsRef.current = exts;
  }

  const editor = useEditor({
    extensions: extensionsRef.current,
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'tiptap-editor max-w-none focus:outline-none min-h-[280px] p-4 text-xs',
        dir: 'rtl',
        style: `min-height: ${minHeight}`,
      },
      handleDOMEvents: {
        mousedown(view, event) {
          // Handle image clicks at the EARLIEST possible moment (mousedown)
          // to call event.preventDefault() before the browser creates a
          // DOM selection, and return true to skip ProseMirror's built-in
          // mouseDown() (which would set up a mouseup listener that could
          // fire extra transactions).
          const target = event.target;
          if (!(target instanceof HTMLElement)) return false;
          const imgEl = target.tagName === 'IMG' ? target : target.closest('img');
          if (!imgEl) return false;
          const imgPos = view.posAtDOM(imgEl, 0);
          if (imgPos === undefined || imgPos === null) return false;
          const $pos = view.state.doc.resolve(imgPos);
          if ($pos.nodeAfter?.type.name === 'image') {
            event.preventDefault();
            const nodeSel = new NodeSelection($pos);
            view.dispatch(view.state.tr.setSelection(nodeSel));
            return true;
          }
          return false;
        },
      },
      handleClick(view, pos, event) {
        // Backup: reinforce NodeSelection in case the DOM selectionchange
        // observer fired between mousedown and click.
        const $pos = view.state.doc.resolve(pos);
        if ($pos.nodeAfter?.type.name === 'image') {
          event.preventDefault();
          const nodeSel = new NodeSelection($pos);
          view.dispatch(view.state.tr.setSelection(nodeSel));
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: e }) => {
      isInternalUpdate.current = true;
      lastSyncedContentRef.current = e.getHTML();
      onChange(e.getHTML());
    },
  });

  // ===== Sync content from outside (only for GENUINE external changes) =====
  // Uses isInternalUpdate flag to ignore changes caused by our own onUpdate.
  // This breaks the endless loop: onUpdate → parent setState → content prop → setContent → selection destroyed
  useEffect(() => {
    if (!editor) return;

    // Skip if this content change was triggered by our own editing
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    // Use ref comparison to avoid infinite loop from formatting differences
    // between editor.getHTML() and the content prop (e.g., '' vs '<p></p>').
    if (lastSyncedContentRef.current === content) return;

    lastSyncedContentRef.current = content;

    // Genuine external change (e.g., loading a new document)
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  // EditorContent مستقیماً رندر می‌شود
  const editorView = <EditorContent editor={editor} />;

  // درج توکن آیکون [icon:name] در محل مکان‌نما (دعوت‌شده توسط والد از طریق ref)
  useImperativeHandle(
    ref,
    () => ({
      insertIconToken: (iconName: string) => {
        if (!editor || !iconName) return;
        editor.chain().focus().insertContent(`[icon:${iconName}]`).run();
      },
      insertRawText: (text: string) => {
        if (!editor || !text) return;
        editor.chain().focus().insertContent(text).run();
      },
    }),
    [editor]
  );

  // ===== Toolbar Actions =====
  if (!editor) return null;

  const addImage = () => {
    setShowMediaManager(true);
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('آدرس لینک را وارد کنید:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setShowTableModal(false);
    setTableHover({ r: 0, c: 0 });
  };

  // تبدیل ارقام انگلیسی به فارسی — اگر متنی انتخاب شده باشد فقط همان، وگرنه کل متن ویرایشگر.
  // برای حفظ فرمت‌بندی (بولد/رنگ و...)، هر گرهٔ متنی با همان مارک‌های خودش جایگزین می‌شود؛
  // ترتیب اعمال از انتهای سند به ابتدا است تا موقعیت بخش‌های قبلی با ادیت‌های بعدی جابه‌جا نشود.
  const convertDigitsToPersian = () => {
    const { state } = editor;
    const { selection, schema } = state;
    const hasSelection = !selection.empty;
    const from = hasSelection ? selection.from : 0;
    const to = hasSelection ? selection.to : state.doc.content.size;

    const replacements: { from: number; to: number; text: string; marks: any }[] = [];
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText || !node.text) return;
      const nodeFrom = Math.max(pos, from);
      const nodeTo = Math.min(pos + node.text.length, to);
      if (nodeFrom >= nodeTo) return;
      const original = node.text.slice(nodeFrom - pos, nodeTo - pos);
      const converted = toPersianDigits(original);
      if (converted !== original) {
        replacements.push({ from: nodeFrom, to: nodeTo, text: converted, marks: node.marks });
      }
    });
    if (replacements.length === 0) return;

    const tr = state.tr;
    for (let i = replacements.length - 1; i >= 0; i--) {
      const r = replacements[i];
      tr.replaceWith(r.from, r.to, schema.text(r.text, r.marks));
    }
    editor.view.dispatch(tr);
  };

  const toggleHtmlSource = () => {
    if (showHtmlSource) {
      // Switch back to WYSIWYG — set content from textarea
      editor.commands.setContent(htmlSourceText, { emitUpdate: true });
      setShowHtmlSource(false);
    } else {
      setHtmlSourceText(editor.getHTML());
      setShowHtmlSource(true);    }
  };

  const collaborators = providerRef.current?.awareness?.getStates
    ? Array.from(providerRef.current.awareness.getStates().values())
        .map((s: any) => s.user)
        .filter(Boolean)
    : [];

  return (
    <div className="wysiwyg-editor border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800/80">
      {/* ===== Toolbar ===== */}
      {editable && (
        <div className="relative z-50 flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 rounded-t-2xl">
          {/* Undo / Redo */}
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="بازگشت (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="بازانجام (Ctrl+Y)">
            <Redo2 className="w-4 h-4" />
          </ToolbarBtn>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="تیتر ۱"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="تیتر ۲"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="تیتر ۳"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarBtn>

          <ToolbarDivider />

          {/* Text Formatting */}
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="بولد (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="ایتالیک (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="زیرخط (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="خط‌دار (Ctrl+Shift+X)"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarBtn>
          {!isBasic && (
            <>
              <ToolbarBtn
                onClick={() => editor.chain().focus().toggleCode().run()}
                active={editor.isActive('code')}
                title="کد"
              >
                <Code className="w-4 h-4" />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
                active={editor.isActive('highlight')}
                title="هایلایت"
              >
                <Highlighter className="w-4 h-4" />
              </ToolbarBtn>
            </>
          )}

          {!isBasic && (
            <>
              <ToolbarDivider />

              {/* Color */}
              <div className="relative">
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { setShowColorPicker(v => !v); setShowTableModal(false); }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                showColorPicker
                  ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="رنگ متن"
            >
              <Palette className="w-4 h-4" />
            </button>
            {showColorPicker && (
              <div
                onMouseDown={e => e.preventDefault()}
                className="absolute top-full left-0 mt-1 flex items-center gap-1 p-2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
              >
                {['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                    className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 shadow-xs cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                  className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 shadow-xs cursor-pointer hover:scale-110 transition-transform flex items-center justify-center text-[10px] text-gray-400"
                  title="حذف رنگ"
                >
                  ✕
                </button>
              </div>
            )}
              </div>
            </>
          )}

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="لیست نقطه‌ای"
          >
            <List className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="لیست شماره‌دار"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarBtn>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="راست‌چین"
          >
            <AlignRight className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="وسط‌چین"
          >
            <AlignCenter className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="چپ‌چین"
          >
            <AlignLeft className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            active={editor.isActive({ textAlign: 'justify' })}
            title="تراز کامل"
          >
            <AlignJustify className="w-4 h-4" />
          </ToolbarBtn>

          <ToolbarDivider />

          {/* تبدیل اعداد انگلیسی به فارسی — روی متن انتخاب‌شده، وگرنه کل متن */}
          <ToolbarBtn
            onClick={convertDigitsToPersian}
            title="تبدیل اعداد انگلیسی به فارسی (روی متن انتخاب‌شده یا کل متن)"
          >
            <Languages className="w-4 h-4" />
          </ToolbarBtn>

          {!isBasic && (
            <>
              <ToolbarDivider />

              {/* Block Elements */}
              <ToolbarBtn
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive('blockquote')}
                title="نقل‌قول"
              >
                <Quote className="w-4 h-4" />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="خط افقی"
              >
                <Minus className="w-4 h-4" />
              </ToolbarBtn>
            </>
          )}

          <ToolbarDivider />

          {/* Media & Links */}
          <ToolbarBtn onClick={setLink} active={editor.isActive('link')} title="لینک">
            <LinkIcon className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={addImage} title="تصویر">
            <ImageIcon className="w-4 h-4" />
          </ToolbarBtn>
          {!isBasic && <ImageSizePalette editor={editor} />}

          {!isBasic && (
            <>
              <ToolbarDivider />

              {/* Table */}
              <div className="relative">
                <ToolbarBtn
                  onClick={() => { setShowTableModal(v => !v); setShowColorPicker(false); }}
                  active={showTableModal}
                  title="درج جدول"
                >
                  <TableIcon className="w-4 h-4" />
                </ToolbarBtn>
                {showTableModal && (
                  <div
                    onMouseDown={e => e.preventDefault()}
                    className="absolute top-full right-0 mt-1 p-3 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[60] min-w-[280px]"
                  >
                    <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2">انتخاب اندازه جدول</div>
                    <div
                      className="inline-grid gap-1 mb-2"
                      style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}
                      onMouseLeave={() => setTableHover({ r: 0, c: 0 })}
                    >
                      {Array.from({ length: 64 }, (_, i) => {
                        const r = Math.floor(i / 8);
                        const c = i % 8;
                        const active = r < tableHover.r && c < tableHover.c;
                        return (
                          <div
                            key={`${r}-${c}`}
                            className={`w-7 h-7 border cursor-pointer rounded-md transition-colors ${
                              active
                                ? 'bg-teal-400 dark:bg-teal-500 border-teal-500'
                                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-teal-400'
                            }`}
                            onMouseEnter={() => setTableHover({ r: r + 1, c: c + 1 })}
                            onClick={() => insertTable(r + 1, c + 1)}
                          />
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-gray-400 text-center">
                      {tableHover.r > 0 ? `${tableHover.r} × ${tableHover.c}` : 'ردیف × ستون'}
                    </div>
                  </div>
                )}
              </div>

              <ToolbarDivider />

              {/* Clear Formatting */}
              <ToolbarBtn
                onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                title="پاک کردن قالب‌بندی"
              >
                <RemoveFormatting className="w-4 h-4" />
              </ToolbarBtn>

              {/* HTML Source Toggle */}
              <ToolbarBtn
                onClick={toggleHtmlSource}
                active={showHtmlSource}
                title={showHtmlSource ? 'بازگشت به ویرایشگر' : 'مشاهده کد HTML'}
              >
                <CodeSquare className="w-4 h-4" />
              </ToolbarBtn>
            </>
          )}

          {/* دکمهٔ درج آیکون — توکن [icon:name] */}
          {showIconButton && (
            <ToolbarBtn
              onClick={() => onRequestIcon?.()}
              title="درج آیکون در متن (توکن [icon:name])"
            >
              <Sparkles className="w-4 h-4" />
            </ToolbarBtn>
          )}

          {/* دکمهٔ درج متغیر — توکن {{key}} */}
          {showVariableButton && (
            <VariableInsertButton
              onInsert={(token) => editor.chain().focus().insertContent(token).run()}
            />
          )}

          {/* دکمه‌های تغییر حالت پایه/کامل — با آیکون */}
          {isBasic && showMaximize && (
            <ToolbarBtn
              onClick={() => onRequestFullscreen?.()}
              title="بزرگ‌نمایی — ویرایش در پنجرهٔ کامل"
            >
              <Maximize2 className="w-4 h-4" />
            </ToolbarBtn>
          )}
          {!isBasic && onRequestCompact && (
            <ToolbarBtn
              onClick={() => onRequestCompact()}
              title="بازگشت به حالت پایه — ویرایش کوچک"
            >
              <Minimize2 className="w-4 h-4" />
            </ToolbarBtn>
          )}

          {/* Collaboration Indicator */}
          {collaboration && (
            <>
              <ToolbarDivider />
              <div className="flex items-center gap-1.5 ml-auto">
                <Globe className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                <span className="text-[10px] text-gray-400 font-bold">ویرایش مشترک فعال</span>
                <div className="flex -space-x-1.5">
                  {collaborators.slice(0, 4).map((u: any, i: number) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-[8px] text-white font-black"
                      style={{ backgroundColor: u.color }}
                      title={u.name}
                    >
                      {u.name?.charAt(0)}
                    </div>
                  ))}
                  {collaborators.length > 4 && (
                    <div className="w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 bg-gray-400 flex items-center justify-center text-[8px] text-white font-black">
                      +{collaborators.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== Editor Content ===== */}
      {/* Click-outside closer for popups */}
      {(showColorPicker || showTableModal) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowColorPicker(false); setShowTableModal(false); }}
        />
      )}
      {showHtmlSource ? (
        <div className="p-0 overflow-hidden rounded-b-2xl">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <CodeSquare className="w-3.5 h-3.5" />
              کد HTML منبع
            </span>
            <button
              type="button"
              onClick={toggleHtmlSource}
              className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold cursor-pointer transition-colors"
            >
              بازگشت به ویرایشگر
            </button>
          </div>
          <textarea
            value={htmlSourceText}
            onChange={e => setHtmlSourceText(e.target.value)}
            dir="ltr"
            className="w-full min-h-[320px] p-4 bg-gray-950 dark:bg-black text-green-400 font-mono text-xs leading-relaxed resize-y focus:outline-none border-0"
            spellCheck={false}
            style={{ minHeight }}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-b-2xl">
          {editorView}
        </div>
      )}

      {/* Media Manager Dialog */}
      <MediaManager
        open={showMediaManager}
        onClose={() => setShowMediaManager(false)}
        onSelect={(url) => {
          if (editor) {
            editor.chain().focus().setImage({ src: url }).run();
          }
          onImageUpload?.(url);
        }}
        filter="image"
        title="انتخاب تصویر"
      />
    </div>
  );
});
