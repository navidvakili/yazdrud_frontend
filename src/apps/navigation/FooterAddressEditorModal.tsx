import React, { useMemo, useState } from 'react';
import { X, Check, MapPin, Building2, Phone, Printer, Link2, Image as ImageIcon, Globe, Plus, Trash2 } from 'lucide-react';
import { NavigationItem } from './types';

interface FooterAddressEditorModalProps {
  item: NavigationItem;
  onSave: (updatedItem: NavigationItem) => void;
  onClose: () => void;
}

export const FooterAddressEditorModal: React.FC<FooterAddressEditorModalProps> = ({
  item,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.settings.description || '');
  const [address, setAddress] = useState(item.settings.address || '');
  const [phone, setPhone] = useState(item.settings.phone || '');
  const [fax, setFax] = useState(item.settings.fax || '');
  const [buttonText, setButtonText] = useState(item.settings.buttonText || item.settings.mapButton?.text || 'نمایش روی نقشه');
  const [buttonIcon, setButtonIcon] = useState(item.settings.buttonIcon || item.settings.mapButton?.icon || 'MapPin');
  const [buttonUrl, setButtonUrl] = useState(item.settings.buttonUrl || item.settings.mapButton?.url || '/campus-map');
  const [imageUrl, setImageUrl] = useState(item.settings.imageUrl || '');
  const [imageAlt, setImageAlt] = useState(item.settings.imageAlt || '');
  const [itemType, setItemType] = useState(item.settings.footerItemType || 'address');
  const [socialLinks, setSocialLinks] = useState(item.settings.socialLinks || [
    { id: 'social_1', label: 'Linkedin', url: '#', icon: 'Linkedin', hoverColor: 'blue-600' },
  ]);

  const canShowImage = useMemo(() => ['image', 'social', 'text'].includes(itemType), [itemType]);

  const addSocialLink = () => {
    setSocialLinks((prev) => [...prev, { id: `social_${Date.now()}`, label: 'شبکه', url: '#', icon: 'Globe', hoverColor: 'blue-600' }]);
  };

  const updateSocialLink = (id: string, field: 'label' | 'url' | 'icon' | 'hoverColor', value: string) => {
    setSocialLinks(prev => prev.map(link => (link.id === id ? { ...link, [field]: value } : link)));
  };

  const removeSocialLink = (id: string) => {
    setSocialLinks(prev => prev.filter(link => link.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      ...item,
      title,
      settings: {
        ...item.settings,
        footerItemType: itemType,
        description,
        address,
        phone,
        fax,
        buttonText,
        buttonIcon,
        buttonUrl,
        imageUrl,
        imageAlt,
        socialLinks,
        mapButton: {
          text: buttonText,
          icon: buttonIcon,
          action: 'show_map',
          url: buttonUrl,
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">ویرایش بلوک فوتر</h3>
              <p className="text-xs text-slate-500">متن، آیکون، دکمه، تصویر و لینک‌های شبکه‌های اجتماعی</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">نوع بلوک</label>
            <select
              value={itemType}
              onChange={e => setItemType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              <option value="address">آدرس / اطلاعات تماس</option>
              <option value="text">متن با آیکون</option>
              <option value="button">دکمه با لینک</option>
              <option value="image">تصویر با آیکون</option>
              <option value="social">شبکه اجتماعی</option>
              <option value="link">لینک ساده</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">عنوان بلوک *</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold" />
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">توضیح کوتاه</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed" />
          </div>

          {(itemType === 'address' || itemType === 'text' || itemType === 'button') && (
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-500" /> آدرس / متن اصلی</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed" />
            </div>
          )}

          {itemType === 'address' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-500" /> تلفن</label>
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs dir-ltr text-left" />
              </div>
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5"><Printer className="w-3.5 h-3.5 text-slate-500" /> فکس</label>
                <input type="text" value={fax} onChange={e => setFax(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs dir-ltr text-left" />
              </div>
            </div>
          )}

          {(itemType === 'button' || itemType === 'address' || itemType === 'image' || itemType === 'social') && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-3">
              <h4 className="font-extrabold text-blue-900 dark:text-blue-200 flex items-center gap-1.5"><Link2 className="w-4 h-4" /> تنظیمات دکمه / لینک</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">متن دکمه</label>
                  <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نام آیکون</label>
                  <input type="text" value={buttonIcon} onChange={e => setButtonIcon(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">لینک هدف</label>
                <input type="text" value={buttonUrl} onChange={e => setButtonUrl(e.target.value)} placeholder="/about /contact https://..." className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono dir-ltr text-left" />
              </div>
            </div>
          )}

          {canShowImage && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
              <h4 className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5"><ImageIcon className="w-4 h-4" /> تصویر / آیکون</h4>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">آدرس تصویر</label>
                <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://.../image.jpg" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono dir-ltr text-left" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">متن جایگزین تصویر</label>
                <input type="text" value={imageAlt} onChange={e => setImageAlt(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
              </div>
            </div>
          )}

          {(itemType === 'social' || itemType === 'image') && (
            <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-violet-900 dark:text-violet-200 flex items-center gap-1.5"><Globe className="w-4 h-4" /> لینک‌های شبکه اجتماعی</h4>
                <button type="button" onClick={addSocialLink} className="px-2.5 py-1.5 bg-violet-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> افزودن
                </button>
              </div>

              {socialLinks.map(link => (
                <div key={link.id} className="rounded-xl border border-violet-200 dark:border-violet-700 bg-white dark:bg-slate-900 p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input value={link.label} onChange={e => updateSocialLink(link.id, 'label', e.target.value)} placeholder="عنوان" className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px]" />
                    <input value={link.url} onChange={e => updateSocialLink(link.id, 'url', e.target.value)} placeholder="https://..." className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono dir-ltr text-left" />
                    <input value={link.icon} onChange={e => updateSocialLink(link.id, 'icon', e.target.value)} placeholder="Linkedin" className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-mono" />
                  </div>
                  <div className="flex justify-between items-center">
                    <input value={link.hoverColor || 'blue-600'} onChange={e => updateSocialLink(link.id, 'hoverColor', e.target.value)} placeholder="hoverColor" className="w-32 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px]" />
                    <button type="button" onClick={() => removeSocialLink(link.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold">انصراف</button>
            <button type="submit" className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center gap-2">
              <Check className="w-4 h-4" /> ذخیره بلوک فوتر
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
