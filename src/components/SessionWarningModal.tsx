// ============================================================
// SessionWarningModal — نمایش هشدار نشست موازی به کاربر فعلی
// ============================================================

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Loader2, Monitor, Globe, MapPin, Clock } from 'lucide-react';

interface WarningDeviceInfo {
    ip_address: string | null;
    user_agent: string | null;
    browser_fingerprint: string | null;
}

interface SessionWarningModalProps {
    warning: { id: number } & WarningDeviceInfo | null;
    onRespond: (warningId: number, status: 'accepted' | 'rejected') => void;
    isLoading: boolean;
}

function formatTime(dateStr?: string): string {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
        return dateStr;
    }
}

function parseFingerprint(fp: string | null): Record<string, any> {
    if (!fp) return {};
    try {
        return JSON.parse(fp);
    } catch {
        return {};
    }
}

function getBrowserName(ua: string | null): string {
    if (!ua) return '—';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Google Chrome';
    if (ua.includes('Firefox')) return 'Mozilla Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Apple Safari';
    if (ua.includes('Edg')) return 'Microsoft Edge';
    if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
    return ua.split('/')[0] || '—';
}

function getOS(ua: string | null): string {
    if (!ua) return '—';
    if (ua.includes('Windows NT 10')) return 'Windows 10';
    if (ua.includes('Windows NT 11')) return 'Windows 11';
    if (ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return '—';
}

export default function SessionWarningModal({ warning, onRespond, isLoading }: SessionWarningModalProps) {
    const fingerprint = useMemo(() => parseFingerprint(warning?.browser_fingerprint ?? null), [warning?.browser_fingerprint]);

    return (
        <AnimatePresence>
            {warning !== null && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                    >
                        {/* Header */}
                        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-7 h-7 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                            هشدار نشست موازی
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4 text-center">
                            یک تلاش ورود هم‌زمان برای حساب کاربری شما شناسایی شد.
                            در صورت تأیید، نشست فعلی شما باطل شده و نشست جدید فعال می‌شود.
                        </p>

                        {/* Device Info Card */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-5 text-right space-y-2.5 text-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-500 ml-1">آی‌پی:</span>
                                <span className="font-medium text-gray-800" dir="ltr">{warning.ip_address || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <Monitor className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-500 ml-1">مرورگر:</span>
                                <span className="font-medium text-gray-800">{getBrowserName(warning.user_agent)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-500 ml-1">سیستم‌عامل:</span>
                                <span className="font-medium text-gray-800">{getOS(warning.user_agent)}</span>
                            </div>
                            {fingerprint.screenWidth && fingerprint.screenHeight && (
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Monitor className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-500 ml-1">صفحه‌نمایش:</span>
                                    <span className="font-medium text-gray-800" dir="ltr">
                                        {fingerprint.screenWidth} × {fingerprint.screenHeight}
                                        {fingerprint.pixelRatio > 1 && ` (${fingerprint.pixelRatio}x)`}
                                    </span>
                                </div>
                            )}
                            {fingerprint.platform && (
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-500 ml-1">پلتفرم:</span>
                                    <span className="font-medium text-gray-800">{fingerprint.platform}</span>
                                </div>
                            )}
                            {fingerprint.language && (
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-500 ml-1">زبان:</span>
                                    <span className="font-medium text-gray-800">{fingerprint.language}</span>
                                </div>
                            )}
                            {fingerprint.timezone && (
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-500 ml-1">منطقهٔ زمانی:</span>
                                    <span className="font-medium text-gray-800" dir="ltr">{fingerprint.timezone}</span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => onRespond(warning.id, 'rejected')}
                                disabled={isLoading}
                                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                خیر، رد کن
                            </button>
                            <button
                                onClick={() => onRespond(warning.id, 'accepted')}
                                disabled={isLoading}
                                className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        در حال پردازش...
                                    </>
                                ) : (
                                    'بله، نشست جدید فعال شود'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
