// ============================================================
// CategoryManagerDialog — مدیریت گروه‌های علمی (Modal)
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Layers, Edit2, Check, XCircle } from 'lucide-react';
import type { TutCategory } from '../../shared/types';

interface CategoryManagerDialogProps {
    isOpen: boolean;
    onClose: () => void;
    newCategoryName: string;
    setNewCategoryName: (v: string) => void;
    categories: TutCategory[];
    handleAddCategory: () => void;
    handleDeleteCategory: (id: string) => void;
    handleEditCategory: (oldTitle: string, newTitle: string) => Promise<boolean>;
}

export default function CategoryManagerDialog({
    isOpen,
    onClose,
    newCategoryName,
    setNewCategoryName,
    categories,
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
}: CategoryManagerDialogProps) {
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editCategoryName, setEditCategoryName] = useState('');

    const handleClose = () => {
        onClose();
        setNewCategoryName('');
        setEditingCategory(null);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-5 rounded-3xl shadow-2xl max-w-md w-full space-y-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                            <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-teal-600" />
                                مدیریت گروه‌های علمی
                            </h4>
                            <button onClick={handleClose}
                                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[250px] overflow-y-auto">
                            {categories.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-6">هیچ گروه علمی تعریف نشده است.</p>
                            ) : (
                                categories.map((cat: string, idx: number) => {
                                    const isEditing = editingCategory === cat;
                                    return (
                                        <div key={idx}
                                            className="flex items-center justify-between p-3 bg-gray-55/50 dark:bg-gray-950/50 rounded-2xl border border-gray-100/50 dark:border-gray-850">
                                            {isEditing ? (
                                                <div className="flex-1 flex items-center gap-2 ml-2">
                                                    <input
                                                        type="text"
                                                        value={editCategoryName}
                                                        onChange={(e) => setEditCategoryName(e.target.value)}
                                                        onKeyDown={async (e) => {
                                                            if (e.key === 'Enter') {
                                                                const success = await handleEditCategory(cat, editCategoryName);
                                                                if (success) setEditingCategory(null);
                                                            }
                                                            if (e.key === 'Escape') setEditingCategory(null);
                                                        }}
                                                        className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-teal-500/40 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
                                                        autoFocus
                                                    />
                                                    <button onClick={async () => {
                                                        const success = await handleEditCategory(cat, editCategoryName);
                                                        if (success) setEditingCategory(null);
                                                    }}
                                                        className="p-1 rounded-lg text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all cursor-pointer">
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => setEditingCategory(null)}
                                                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{cat}</span>
                                            )}
                                            <div className="flex items-center gap-1">
                                                {!isEditing && (
                                                    <button onClick={() => { setEditingCategory(cat); setEditCategoryName(cat); }}
                                                        className="p-1 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all cursor-pointer">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteCategory(cat)}
                                                    className="p-1 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && newCategoryName.trim()) { handleAddCategory(); } }}
                                placeholder="نام گروه جدید را وارد کنید..."
                                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                            />
                            <button
                                onClick={handleAddCategory}
                                disabled={!newCategoryName.trim()}
                                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                افزودن
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
