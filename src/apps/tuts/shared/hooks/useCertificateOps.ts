// ============================================================
// useCertificateOps — Certificate management operations
// ============================================================

import { useState } from 'react';
import api from '@/src/shared-api';
import type { TutRegistrant } from '../types';
import { mapRegistrant } from '../utils';
import { BACKEND_API_URL } from '@/src/shared-constants';

export function useCertificateOps(
  registrants: TutRegistrant[],
  setRegistrants: React.Dispatch<React.SetStateAction<TutRegistrant[]>>,
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
) {
  const [previewRegId, setPreviewRegId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [pdfKey, setPdfKey] = useState(0);
  const [certificateNotif, setCertificateNotif] = useState<string | null>(null);

  const handleApproveCertificate = async (registerId: string) => {
    try {
      const res = await api.approveCertificate(registerId);
      setRegistrants(prev => prev.map(r =>
        r.id === registerId ? { ...r, certificateApproved: true } : r
      ));
      setCertificateNotif(res.message || 'تایید شد.');
      showToast(res.message || 'ثبت‌نام برای صدور گواهی تایید شد.');
    } catch (err: any) {
      showToast(err.message || 'خطا در تایید گواهی', 'error');
    }
  };

  const handleRejectCertificate = async (registerId: string) => {
    try {
      const res = await api.rejectCertificate(registerId);
      setRegistrants(prev => prev.map(r =>
        r.id === registerId ? { ...r, certificateApproved: false, certificateNumber: undefined, hasCertificate: false } : r
      ));
      setCertificateNotif(res.message || 'تایید لغو شد.');
      showToast(res.message || 'تایید صدور گواهی لغو شد.');
    } catch (err: any) {
      showToast(err.message || 'خطا در لغو تایید گواهی', 'error');
    }
  };

  const handleGenerateCertificate = async (registerId: string, name?: string) => {
    try {
      window.open(`${BACKEND_API_URL}/certificate/${registerId}`, '_blank');
      const res = await api.getAllRegistrations({ per_page: 1000 });
      setRegistrants((res.data || []).map(mapRegistrant));
      showToast('گواهی با موفقیت صادر شد.');
      setPdfKey(k => k + 1);
    } catch (err: any) {
      showToast(err.message || 'خطا در صدور گواهی', 'error');
    }
  };

  const handlePreviewCertificate = async (registerId: string) => {
    setPdfError(null);
    setPdfLoading(true);
    setPageNumber(1);
    setPdfKey(0);
    setPreviewRegId(registerId);
  };

  const handleApproveAllCertificates = async (courseId?: string) => {
    if (!courseId) {
      showToast('لطفاً ابتدا یک دوره را انتخاب کنید.', 'error');
      return;
    }
    if (!confirm('آیا از تایید همه ثبت‌نام‌های این دوره برای صدور گواهی مطمئن هستید؟')) return;
    try {
      const res = await api.approveAllCertificates(Number(courseId));
      setRegistrants(prev => prev.map(r =>
        r.courseId === courseId ? { ...r, certificateApproved: true } : r
      ));
      showToast(res.message || 'همه ثبت‌نام‌ها برای صدور گواهی تایید شدند.');
    } catch (err: any) {
      showToast(err.message || 'خطا در تایید همه', 'error');
    }
  };

  const handleDownloadAllCertificates = async (courseId?: number) => {
    try {
      const blob = await api.downloadAllCertificates(courseId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificates_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('فایل فشرده گواهی‌ها با موفقیت دانلود شد.');
    } catch (err: any) {
      showToast(err.message || 'خطا در دانلود فایل فشرده', 'error');
    }
  };

  return {
    previewRegId, setPreviewRegId,
    pdfLoading, setPdfLoading,
    pdfError, setPdfError,
    numPages, setNumPages,
    pageNumber, setPageNumber,
    pdfScale, setPdfScale,
    pdfKey, setPdfKey,
    certificateNotif, setCertificateNotif,
    handleApproveCertificate,
    handleRejectCertificate,
    handleGenerateCertificate,
    handlePreviewCertificate,
    handleApproveAllCertificates,
    handleDownloadAllCertificates,
  };
}
