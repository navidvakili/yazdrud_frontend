// ============================================================
// CertificatePreviewDialog — Full PDF viewer for certificates
// Uses react-pdf with custom navigation and zoom controls
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Download, X, AlertTriangle } from 'lucide-react';
import { Document, Page } from 'react-pdf';

interface CertificatePreviewDialogProps {
  regId: string | null;
  registrantName: string;
  hasCertificate: boolean;
  getPublicViewUrl: (regId: string, download?: boolean) => string;
  toPersianDigits: (s: string | number) => string;
  onClose: () => void;
  onGenerateCertificate: (regId: string) => void;
}

export default function CertificatePreviewDialog({
  regId,
  registrantName,
  hasCertificate,
  getPublicViewUrl,
  toPersianDigits,
  onClose,
  onGenerateCertificate,
}: CertificatePreviewDialogProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [pdfKey, setPdfKey] = useState(0);

  const handleClose = () => {
    setPdfLoading(false);
    setPdfError(null);
    setPageNumber(1);
    setPdfKey(0);
    onClose();
  };

  const handleLoadSuccess = ({ numPages: np }: { numPages: number }) => {
    setNumPages(np);
    setPdfLoading(false);
    setPdfError(null);
  };

  const handleLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setPdfLoading(false);
    setPdfError('امکان بارگذاری گواهی وجود ندارد.');
  };

  return (
    <AnimatePresence>
      {regId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-500" />
                پیش‌نمایش گواهی
              </h3>
              <div className="flex items-center gap-2">
                {hasCertificate ? (
                  <a
                    href={getPublicViewUrl(regId, true)}
                    className="px-3 py-1.5 text-xs font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    دانلود مدرک
                  </a>
                ) : (
                  <button
                    onClick={() => onGenerateCertificate(regId)}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    صدور گواهی
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content — custom PDF viewer using react-pdf */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 min-h-[70vh] relative flex flex-col">
              {pdfError ? (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-center max-w-xs">
                    <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-2">{pdfError}</p>
                    <p className="text-xs text-gray-400">لطفاً مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.</p>
                  </div>
                </div>
              ) : (
                <>
                  {pdfLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="text-center">
                        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-xs text-gray-500">در حال بارگذاری گواهی...</p>
                      </div>
                    </div>
                  )}
                  <div className={`flex-1 overflow-auto p-4 flex justify-center ${pdfLoading ? 'opacity-0 absolute' : 'opacity-100'}`}>
                    <Document
                      key={pdfKey}
                      file={getPublicViewUrl(regId)}
                      onLoadSuccess={handleLoadSuccess}
                      onLoadError={handleLoadError}
                      loading={null}
                    >
                      <Page
                        pageNumber={pageNumber}
                        scale={pdfScale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="shadow-xl rounded-lg"
                      />
                    </Document>
                  </div>
                  {/* PDF Navigation Controls */}
                  {!pdfLoading && numPages > 0 && (
                    <div className="flex items-center justify-center gap-3 p-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                        disabled={pageNumber <= 1}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        قبلی
                      </button>
                      <span className="text-[10px] text-gray-500 font-bold">
                        {toPersianDigits(pageNumber)} از {toPersianDigits(numPages)}
                      </span>
                      <button
                        onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                        disabled={pageNumber >= numPages}
                        className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        بعدی
                      </button>
                      <div className="mr-4 flex items-center gap-1">
                        <button
                          onClick={() => setPdfScale(s => Math.max(0.5, s - 0.1))}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all cursor-pointer"
                        >
                          −
                        </button>
                        <span className="text-[10px] text-gray-500 min-w-[40px] text-center font-bold">
                          {Math.round(pdfScale * 100)}%
                        </span>
                        <button
                          onClick={() => setPdfScale(s => Math.min(2.0, s + 0.1))}
                          className="px-2 py-1 text-[10px] font-bold rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
