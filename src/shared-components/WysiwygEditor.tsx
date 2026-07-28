// ============================================================
// WysiwygEditor — ویرایشگر WYSIWYG با قابلیت ویرایش مشترک
// مبتنی بر Tiptap + Y.js Collaboration
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
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
  Highlighter, Palette, Table as TableIcon, Type, RemoveFormatting,
  Users, Globe, CodeSquare, Upload,
} from 'lucide-react';
import MediaManager from './MediaManager';

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
  { name: 'کاربر ۷', color: '#14b8a6' },
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
}

// ===== Main Component =====
export default function WysiwygEditor({
  content,
  onChange,
  placeholder = 'متن خود را بنویسید...',
  editable = true,
  collaboration = false,
  documentId,
  currentUser,
  minHeight = '320px',
  onImageUpload,
}: WysiwygEditorProps) {
  const yDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const collabInitRef = useRef(false);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [htmlSourceText, setHtmlSourceText] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showMediaManager, setShowMediaManager] = useState(false);
  const [tableHover, setTableHover] = useState({ r: 0, c: 0 });

  // ===== Setup Collaboration =====
  const setupCollaboration = useCallback((docId: string) => {
    if (collabInitRef.current) return;

    const yDoc = new Y.Doc();
    yDocRef.current = yDoc;

    const roomName = `${ROOM_PREFIX}${docId}`;
    const provider = new WebrtcProvider(roomName, yDoc, {
      signaling: ['wss://signaling.yjs.dev'],
    });
    providerRef.current = provider;

    // Set user info for cursor
    if (currentUser) {
      provider.awareness.setLocalStateField('user', {
        name: currentUser.name,
        color: currentUser.color,
      });
    }

    collabInitRef.current = true;
  }, [currentUser]);

  // ===== Cleanup =====
  useEffect(() => {
    return () => {
      providerRef.current?.disconnect();
      providerRef.current?.destroy();
      yDocRef.current?.destroy();
    };
  }, []);

  // ===== Extensions =====
  const baseExtensions = [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Placeholder.configure({ placeholder }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Image.configure({ inline: false, allowBase64: true }),
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

  // Add collaboration extensions if enabled
  const collabExtensions: any[] = [];
  if (collaboration && documentId && yDocRef.current) {
    collabExtensions.push(
      Collaboration.configure({ document: yDocRef.current }),
    );
    if (currentUser) {
      collabExtensions.push(
        CollaborationCursor.configure({
          provider: providerRef.current!,
          user: currentUser,
        }),
      );
    }
  }

  const extensions = [...baseExtensions, ...collabExtensions];

  const editor = useEditor({
    extensions,
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-sm max-w-none focus:outline-none min-h-[280px] p-4 text-xs leading-relaxed',
        dir: 'rtl',
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  // ===== Sync content from outside =====
  useEffect(() => {
    if (editor && !collaboration) {
      const currentContent = editor.getHTML();
      if (content !== currentContent) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [content, editor, collaboration]);

  // ===== Setup collaboration on mount =====
  useEffect(() => {
    if (collaboration && documentId) {
      setupCollaboration(documentId);
    }
  }, [collaboration, documentId, setupCollaboration]);

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

  const toggleHtmlSource = () => {
    if (showHtmlSource) {
      // Switch back to WYSIWYG — set content from textarea
      editor.commands.setContent(htmlSourceText, { emitUpdate: true });
      setShowHtmlSource(false);
    } else {
      setHtmlSourceText(editor.getHTML());
      setShowHtmlSource(true);
    }
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

          <ToolbarDivider />

          {/* Media & Links */}
          <ToolbarBtn onClick={setLink} active={editor.isActive('link')} title="لینک">
            <LinkIcon className="w-4 h-4" />
          </ToolbarBtn>
          <ToolbarBtn onClick={addImage} title="تصویر">
            <ImageIcon className="w-4 h-4" />
          </ToolbarBtn>

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
          <EditorContent editor={editor} />
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
}
