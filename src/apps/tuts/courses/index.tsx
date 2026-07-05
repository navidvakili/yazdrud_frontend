import { RefObject } from 'react';
import CourseFilterBar from './CourseFilterBar';
import CourseCard from './CourseCard';
import { Pagination } from '@/src/shared-components';
import CourseDetailDialog from './dialogs/CourseDetailDialog';
import PreRegistrationDialog from './dialogs/PreRegistrationDialog';
import NewCourseDialog from './dialogs/NewCourseDialog';
import EditCourseDialog from './dialogs/EditCourseDialog';
import InstructorManagementDialog from './dialogs/InstructorManagementDialog';
import CourseReportDialog from './dialogs/CourseReportDialog';
import CategoryManagerDialog from './dialogs/CategoryManagerDialog';
import DeleteCourseDialog from './dialogs/DeleteCourseDialog';
import type { TutCourse, TutRegistrant, TutVoucher } from '../shared/types';

interface CoursesTabProps {
  coursesTopRef?: RefObject<HTMLDivElement | null>;
  courses: TutCourse[];
  registrants: TutRegistrant[];
  categories: string[];
  courseGroups: { id: number; title: string }[];
  loadingCourses: boolean;
  currentUserRole: string;

  // Course list filters
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;

  // Pagination
  listPage: number;
  setListPage: (v: number) => void;
  listPerPage: number;

  // Filtered courses
  filteredCoursesForListing: TutCourse[];

  // Category management
  isCategoryModalOpen: boolean;
  setIsCategoryModalOpen: (v: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;
  handleAddCategory: (e?: React.FormEvent) => Promise<void>;
  handleDeleteCategory: (cat: string) => Promise<void>;
  handleEditCategory: (old: string, newTitle: string) => Promise<boolean>;

  // Instructor management
  isInstructorManagementOpen: boolean;
  setIsInstructorManagementOpen: (v: boolean) => void;
  instructors: { id: number; name: string; specialty: string | null }[];
  setInstructors: React.Dispatch<React.SetStateAction<{ id: number; name: string; specialty: string | null }[]>>;

  // Course detail
  selectedCourseForDetail: TutCourse | null;
  setSelectedCourseForDetail: (v: TutCourse | null) => void;
  handleEditCourseFromDetail: (course: TutCourse) => void;

  // Course deletion
  courseToDelete: TutCourse | null;
  setCourseToDelete: (v: TutCourse | null) => void;
  confirmDeleteCourse: () => Promise<void>;

  // Pre-registration
  registeringCourse: TutCourse | null;
  studentName: string;
  setStudentName: (v: string) => void;
  studentIdNum: string;
  setStudentIdNum: (v: string) => void;
  studentEmail: string;
  setStudentEmail: (v: string) => void;
  studentPhone: string;
  setStudentPhone: (v: string) => void;
  studentProvince: string;
  setStudentProvince: (v: string) => void;
  simulatedDevice: 'desktop' | 'mobile';
  setSimulatedDevice: (v: 'desktop' | 'mobile') => void;
  simulatedReferrer: string;
  setSimulatedReferrer: (v: string) => void;
  studentVoucherCode: string;
  setStudentVoucherCode: (v: string) => void;
  appliedVoucher: TutVoucher | null;
  voucherError: string | null;
  voucherDiscountAmount: number;
  selectedInstallments: number;
  setSelectedInstallments: (v: number) => void;
  refCodeInput: string;
  setRefCodeInput: (v: string) => void;
  selectedBank: string;
  setSelectedBank: (v: string) => void;
  uploadProgress: number;
  uploadFileName: string;
  isUploading: boolean;
  handleSubmitPreRegister: (e: React.FormEvent) => void | Promise<void>;
  handleValidateVoucherCode: () => void;
  handleClosePreRegistration: () => void;
  handleSimulateUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // New course dialog
  isNewCourseModalOpen: boolean;
  setIsNewCourseModalOpen: (v: boolean) => void;
  newCourseTitle: string;
  setNewCourseTitle: (v: string) => void;
  newCourseCategory: string;
  setNewCourseCategory: (v: string) => void;
  newCourseInstructorSearch: string;
  setNewCourseInstructorSearch: (v: string) => void;
  newCourseInstructorOpen: boolean;
  setNewCourseInstructorOpen: (v: boolean) => void;
  newCourseInstructorId: string;
  setNewCourseInstructorId: (v: string) => void;
  newCourseSection: string[];
  setNewCourseSection: (v: string[]) => void;
  newCourseActive: boolean;
  setNewCourseActive: (v: boolean) => void;
  newCourseDuration: string;
  setNewCourseDuration: (v: string) => void;
  newCourseCapacity: string;
  setNewCourseCapacity: (v: string) => void;
  newCourseCost: string;
  setNewCourseCost: (v: string) => void;
  newCourseStartDate: string;
  setNewCourseStartDate: (v: string) => void;
  newCourseEndDate: string;
  setNewCourseEndDate: (v: string) => void;
  newCourseRegStartDate: string;
  setNewCourseRegStartDate: (v: string) => void;
  newCourseRegEndDate: string;
  setNewCourseRegEndDate: (v: string) => void;
  newCourseImage: File | null;
  setNewCourseImage: (v: File | null) => void;
  newCourseImagePreview: string | null;
  setNewCourseImagePreview: (v: string | null) => void;
  newCourseDescription: string;
  setNewCourseDescription: (v: string) => void;
  newCoursePrerequisites: string;
  setNewCoursePrerequisites: (v: string) => void;
  newCourseDaysOfWeek: string[];
  setNewCourseDaysOfWeek: (v: string[]) => void;
  newCourseTime: string;
  setNewCourseTime: (v: string) => void;
  newCourseLocation: string;
  setNewCourseLocation: (v: string) => void;
  filteredNewCourseInstructors: { id: number; name: string; specialty: string | null }[];
  handleCreateNewCourse: (e: React.FormEvent) => Promise<void>;

  // Edit course dialog
  editingCourse: TutCourse | null;
  setEditingCourse: (v: TutCourse | null) => void;
  editCourseTitle: string;
  setEditCourseTitle: (v: string) => void;
  editCourseCategory: string;
  setEditCourseCategory: (v: string) => void;
  editCourseInstructorSearch: string;
  setEditCourseInstructorSearch: (v: string) => void;
  editCourseInstructorOpen: boolean;
  setEditCourseInstructorOpen: (v: boolean) => void;
  editCourseInstructorId: string;
  setEditCourseInstructorId: (v: string) => void;
  editCourseSection: string[];
  setEditCourseSection: (v: string[]) => void;
  editCourseActive: boolean;
  setEditCourseActive: (v: boolean) => void;
  editCourseDuration: string;
  setEditCourseDuration: (v: string) => void;
  editCourseCapacity: string;
  setEditCourseCapacity: (v: string) => void;
  editCourseCost: string;
  setEditCourseCost: (v: string) => void;
  editCourseStartDate: string;
  setEditCourseStartDate: (v: string) => void;
  editCourseEndDate: string;
  setEditCourseEndDate: (v: string) => void;
  editCourseRegStartDate: string;
  setEditCourseRegStartDate: (v: string) => void;
  editCourseRegEndDate: string;
  setEditCourseRegEndDate: (v: string) => void;
  editCourseImage: File | null;
  setEditCourseImage: (v: File | null) => void;
  editCourseImagePreview: string | null;
  setEditCourseImagePreview: (v: string | null) => void;
  editCourseDescription: string;
  setEditCourseDescription: (v: string) => void;
  editCoursePrerequisites: string;
  setEditCoursePrerequisites: (v: string) => void;
  editCourseDaysOfWeek: string[];
  setEditCourseDaysOfWeek: (v: string[]) => void;
  editCourseTime: string;
  setEditCourseTime: (v: string) => void;
  editCourseLocation: string;
  setEditCourseLocation: (v: string) => void;
  filteredEditCourseInstructors: { id: number; name: string; specialty: string | null }[];
  handleUpdateCourse: (e: React.FormEvent) => Promise<void>;

  // Course report
  selectedCourseReport: TutCourse | null;
  setSelectedCourseReport: (v: TutCourse | null) => void;
  setReportFetchKey: React.Dispatch<React.SetStateAction<number>>;
  handleExportSingleCourseExcel: (course: TutCourse) => void;
  handleApproveAllCertificates: (courseId: string) => Promise<void>;
  handleDownloadAllCertificates: (courseId: string) => Promise<void>;
  handleApproveCertificate: (regId: string) => Promise<void>;
  handleRejectCertificate: (regId: string) => Promise<void>;
  handlePreviewCertificate: (regId: string) => void;

  // Actions
  handleCopyCourseUrl: (course: TutCourse) => void;
  handleToggleCourseStatus: (id: string) => Promise<void>;
  handleDeleteCourse: (id: string) => void;

  // Utility
  formatCurrency: (amount: number) => string;
  toPersianDigits: (num: string | number) => string;
  formatCostInput: (value: string) => string;

  // Toast
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CoursesTab(props: CoursesTabProps) {
  const {
    coursesTopRef, courses, registrants, categories, courseGroups, loadingCourses, currentUserRole,
    searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, viewMode, setViewMode,
    listPage, setListPage, listPerPage, filteredCoursesForListing,
    isCategoryModalOpen, setIsCategoryModalOpen, newCategoryName, setNewCategoryName,
    handleAddCategory, handleDeleteCategory, handleEditCategory,
    isInstructorManagementOpen, setIsInstructorManagementOpen, instructors, setInstructors,
    selectedCourseForDetail, setSelectedCourseForDetail, handleEditCourseFromDetail,
    courseToDelete, setCourseToDelete, confirmDeleteCourse,
    registeringCourse,
    studentName, setStudentName, studentIdNum, setStudentIdNum,
    studentEmail, setStudentEmail, studentPhone, setStudentPhone,
    studentProvince, setStudentProvince,
    simulatedDevice, setSimulatedDevice, simulatedReferrer, setSimulatedReferrer,
    studentVoucherCode, setStudentVoucherCode,
    appliedVoucher, voucherError, voucherDiscountAmount,
    selectedInstallments, setSelectedInstallments,
    refCodeInput, setRefCodeInput, selectedBank, setSelectedBank,
    uploadProgress, uploadFileName, isUploading,
    handleSubmitPreRegister, handleValidateVoucherCode, handleClosePreRegistration, handleSimulateUpload,
    isNewCourseModalOpen, setIsNewCourseModalOpen,
    newCourseTitle, setNewCourseTitle, newCourseCategory, setNewCourseCategory,
    newCourseInstructorSearch, setNewCourseInstructorSearch, newCourseInstructorOpen, setNewCourseInstructorOpen,
    newCourseInstructorId, setNewCourseInstructorId,
    newCourseSection, setNewCourseSection, newCourseActive, setNewCourseActive,
    newCourseDuration, setNewCourseDuration, newCourseCapacity, setNewCourseCapacity,
    newCourseCost, setNewCourseCost,
    newCourseStartDate, setNewCourseStartDate, newCourseEndDate, setNewCourseEndDate,
    newCourseRegStartDate, setNewCourseRegStartDate, newCourseRegEndDate, setNewCourseRegEndDate,
    newCourseImage, setNewCourseImage, newCourseImagePreview, setNewCourseImagePreview,
    newCourseDescription, setNewCourseDescription,
    newCoursePrerequisites, setNewCoursePrerequisites,
    newCourseDaysOfWeek, setNewCourseDaysOfWeek, newCourseTime, setNewCourseTime,
    newCourseLocation, setNewCourseLocation,
    filteredNewCourseInstructors, handleCreateNewCourse,
    editingCourse,
    setEditingCourse,
    editCourseTitle, setEditCourseTitle, editCourseCategory, setEditCourseCategory,
    editCourseInstructorSearch, setEditCourseInstructorSearch, editCourseInstructorOpen, setEditCourseInstructorOpen,
    editCourseInstructorId, setEditCourseInstructorId,
    editCourseSection, setEditCourseSection, editCourseActive, setEditCourseActive,
    editCourseDuration, setEditCourseDuration, editCourseCapacity, setEditCourseCapacity,
    editCourseCost, setEditCourseCost,
    editCourseStartDate, setEditCourseStartDate, editCourseEndDate, setEditCourseEndDate,
    editCourseRegStartDate, setEditCourseRegStartDate, editCourseRegEndDate, setEditCourseRegEndDate,
    editCourseImage, setEditCourseImage, editCourseImagePreview, setEditCourseImagePreview,
    editCourseDescription, setEditCourseDescription,
    editCoursePrerequisites, setEditCoursePrerequisites,
    editCourseDaysOfWeek, setEditCourseDaysOfWeek, editCourseTime, setEditCourseTime,
    editCourseLocation, setEditCourseLocation,
    filteredEditCourseInstructors, handleUpdateCourse,
    selectedCourseReport, setSelectedCourseReport, setReportFetchKey,
    handleExportSingleCourseExcel,
    handleApproveAllCertificates, handleDownloadAllCertificates,
    handleApproveCertificate, handleRejectCertificate, handlePreviewCertificate,
    handleCopyCourseUrl, handleToggleCourseStatus, handleDeleteCourse,
    formatCurrency, toPersianDigits, formatCostInput, showToast,
  } = props;

  return (
    <div className="space-y-6">
      <div ref={coursesTopRef} />
      {/* Top filter utility block */}
      <CourseFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        viewMode={viewMode}
        setViewMode={setViewMode}
        currentUserRole={currentUserRole}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        setIsInstructorManagementOpen={setIsInstructorManagementOpen}
        setIsNewCourseModalOpen={setIsNewCourseModalOpen}
        setListPage={setListPage}
      />

      {/* Courses grid */}
      {loadingCourses ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="animate-spin h-8 w-8 mb-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-bold">در حال دریافت لیست دوره‌ها...</span>
        </div>
      ) : (
        <>
          {(() => {
            const totalPages = Math.max(1, Math.ceil(filteredCoursesForListing.length / listPerPage));
            const safePage = Math.min(listPage, totalPages);
            const paginatedCourses = filteredCoursesForListing.slice(
              (safePage - 1) * listPerPage,
              safePage * listPerPage
            );
            const isListView = viewMode === 'list';
            return (
              <div className={isListView ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                {paginatedCourses.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-400">
                    هیچ کارگاه یا دوره آموزشی منطبق با فیلتر شما پیدا نشد.
                  </div>
                ) : (
                  paginatedCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      viewMode={viewMode}
                      registrants={registrants}
                      currentUserRole={currentUserRole}
                      onDetail={(c) => setSelectedCourseForDetail(c)}
                      onCopyUrl={(c) => handleCopyCourseUrl(c)}
                      onEdit={(c) => {
                        setEditingCourse(c);
                        setEditCourseTitle(c.title);
                        setEditCourseDuration(c.duration);
                        setEditCourseCost(formatCostInput(c.cost.toString()));
                        setEditCourseCapacity(c.capacity.toString());
                        setEditCourseStartDate(c.startDate);
                        setEditCourseCategory(c.category);
                        setEditCourseDescription(c.description);
                        setEditCourseEndDate(c.endDate);
                        setEditCourseRegStartDate(c.registrationStartDate || '');
                        setEditCourseRegEndDate(c.registrationEndDate || '');
                        setEditCourseActive(c.status === 'active');
                        setEditCourseSection(Array.isArray(c.sections) ? c.sections : ['normal']);
                        setEditCourseImagePreview(c.image || null);
                        setEditCourseImage(null);
                        setEditCourseInstructorId(c.instructor_id ? String(c.instructor_id) : '');
                        setEditCourseInstructorSearch(c.instructor_name || '');
                        setEditCoursePrerequisites(c.prerequisites || '');
                        setEditCourseDaysOfWeek(c.daysOfWeek || []);
                        setEditCourseTime(c.courseTime || '');
                        setEditCourseLocation(c.location || '');
                      }}
                      onReport={(c) => { setSelectedCourseReport(c); setReportFetchKey(k => k + 1); }}
                      onToggleStatus={(courseId) => handleToggleCourseStatus(courseId)}
                      onExportExcel={(c) => handleExportSingleCourseExcel(c)}
                      onDelete={(courseId) => handleDeleteCourse(courseId)}
                    />
                  ))
                )}
              </div>
            );
          })()}

          {/* Pagination Controls for Courses */}
          {filteredCoursesForListing.length > listPerPage && (
            <Pagination
              currentPage={listPage}
              totalItems={filteredCoursesForListing.length}
              perPage={listPerPage}
              onPageChange={setListPage}
            />
          )}
        </>
      )}

      {/* Expandable Course Detail Drawer / Modal */}
      <CourseDetailDialog
        course={selectedCourseForDetail}
        onClose={() => setSelectedCourseForDetail(null)}
        onEdit={handleEditCourseFromDetail}
        formatCurrency={formatCurrency}
        toPersianDigits={toPersianDigits}
      />

      {/* Interactive Workshop Pre-Registration Modal (Slip Receipt Form) */}
      <PreRegistrationDialog
        course={registeringCourse}
        studentName={studentName}
        setStudentName={setStudentName}
        studentIdNum={studentIdNum}
        setStudentIdNum={setStudentIdNum}
        studentEmail={studentEmail}
        setStudentEmail={setStudentEmail}
        studentPhone={studentPhone}
        setStudentPhone={setStudentPhone}
        studentProvince={studentProvince}
        setStudentProvince={setStudentProvince}
        simulatedDevice={simulatedDevice}
        setSimulatedDevice={setSimulatedDevice}
        simulatedReferrer={simulatedReferrer}
        setSimulatedReferrer={setSimulatedReferrer}
        studentVoucherCode={studentVoucherCode}
        setStudentVoucherCode={setStudentVoucherCode}
        appliedVoucher={appliedVoucher}
        voucherError={voucherError}
        voucherDiscountAmount={voucherDiscountAmount}
        selectedInstallments={selectedInstallments}
        setSelectedInstallments={setSelectedInstallments}
        refCodeInput={refCodeInput}
        setRefCodeInput={setRefCodeInput}
        selectedBank={selectedBank}
        setSelectedBank={setSelectedBank}
        uploadProgress={uploadProgress}
        uploadFileName={uploadFileName}
        isUploading={isUploading}
        formatCurrency={formatCurrency}
        toPersianDigits={toPersianDigits}
        onSubmit={handleSubmitPreRegister}
        onValidateVoucher={() => handleValidateVoucherCode()}
        onSimulateUpload={handleSimulateUpload}
        onClose={handleClosePreRegistration}
      />

      <NewCourseDialog
        isOpen={isNewCourseModalOpen}
        title={newCourseTitle}
        setTitle={setNewCourseTitle}
        category={newCourseCategory}
        setCategory={setNewCourseCategory}
        instructorSearch={newCourseInstructorSearch}
        setInstructorSearch={setNewCourseInstructorSearch}
        instructorOpen={newCourseInstructorOpen}
        setInstructorOpen={setNewCourseInstructorOpen}
        instructorId={newCourseInstructorId}
        setInstructorId={setNewCourseInstructorId}
        section={newCourseSection}
        setSection={setNewCourseSection}
        active={newCourseActive}
        setActive={setNewCourseActive}
        duration={newCourseDuration}
        setDuration={setNewCourseDuration}
        capacity={newCourseCapacity}
        setCapacity={setNewCourseCapacity}
        cost={newCourseCost}
        setCost={setNewCourseCost}
        startDate={newCourseStartDate}
        setStartDate={setNewCourseStartDate}
        endDate={newCourseEndDate}
        setEndDate={setNewCourseEndDate}
        regStartDate={newCourseRegStartDate}
        setRegStartDate={setNewCourseRegStartDate}
        regEndDate={newCourseRegEndDate}
        setRegEndDate={setNewCourseRegEndDate}
        image={newCourseImage}
        setImage={setNewCourseImage}
        imagePreview={newCourseImagePreview}
        setImagePreview={setNewCourseImagePreview}
        description={newCourseDescription}
        setDescription={setNewCourseDescription}
        prerequisites={newCoursePrerequisites}
        setPrerequisites={setNewCoursePrerequisites}
        daysOfWeek={newCourseDaysOfWeek}
        setDaysOfWeek={setNewCourseDaysOfWeek}
        courseTime={newCourseTime}
        setCourseTime={setNewCourseTime}
        location={newCourseLocation}
        setLocation={setNewCourseLocation}
        categories={categories}
        instructors={instructors}
        filteredInstructors={filteredNewCourseInstructors}
        onSubmit={handleCreateNewCourse}
        onClose={() => setIsNewCourseModalOpen(false)}
        formatCostInput={formatCostInput}
      />

      <EditCourseDialog
        editingCourse={editingCourse}
        title={editCourseTitle}
        setTitle={setEditCourseTitle}
        category={editCourseCategory}
        setCategory={setEditCourseCategory}
        instructorSearch={editCourseInstructorSearch}
        setInstructorSearch={setEditCourseInstructorSearch}
        instructorOpen={editCourseInstructorOpen}
        setInstructorOpen={setEditCourseInstructorOpen}
        instructorId={editCourseInstructorId}
        setInstructorId={setEditCourseInstructorId}
        section={editCourseSection}
        setSection={setEditCourseSection}
        active={editCourseActive}
        setActive={setEditCourseActive}
        duration={editCourseDuration}
        setDuration={setEditCourseDuration}
        capacity={editCourseCapacity}
        setCapacity={setEditCourseCapacity}
        cost={editCourseCost}
        setCost={setEditCourseCost}
        startDate={editCourseStartDate}
        setStartDate={setEditCourseStartDate}
        endDate={editCourseEndDate}
        setEndDate={setEditCourseEndDate}
        regStartDate={editCourseRegStartDate}
        setRegStartDate={setEditCourseRegStartDate}
        regEndDate={editCourseRegEndDate}
        setRegEndDate={setEditCourseRegEndDate}
        image={editCourseImage}
        setImage={setEditCourseImage}
        imagePreview={editCourseImagePreview}
        setImagePreview={setEditCourseImagePreview}
        description={editCourseDescription}
        setDescription={setEditCourseDescription}
        prerequisites={editCoursePrerequisites}
        setPrerequisites={setEditCoursePrerequisites}
        daysOfWeek={editCourseDaysOfWeek}
        setDaysOfWeek={setEditCourseDaysOfWeek}
        courseTime={editCourseTime}
        setCourseTime={setEditCourseTime}
        location={editCourseLocation}
        setLocation={setEditCourseLocation}
        categories={categories}
        instructors={instructors}
        filteredInstructors={filteredEditCourseInstructors}
        onSubmit={handleUpdateCourse}
        onClose={() => setEditingCourse(null)}
        formatCostInput={formatCostInput}
      />

      <InstructorManagementDialog
        isOpen={isInstructorManagementOpen}
        onClose={() => setIsInstructorManagementOpen(false)}
        instructors={instructors}
        setInstructors={setInstructors}
        showToast={showToast}
      />

      {/* Course Report Modal (Admin/Staff only) */}
      <CourseReportDialog
        course={selectedCourseReport}
        registrants={registrants}
        currentUserRole={currentUserRole as 'admin' | 'student'}
        toPersianDigits={toPersianDigits}
        formatCurrency={formatCurrency}
        onClose={() => setSelectedCourseReport(null)}
        onApproveAllCertificates={() => selectedCourseReport && handleApproveAllCertificates(selectedCourseReport.id)}
        onDownloadAllCertificates={() => selectedCourseReport && handleDownloadAllCertificates(selectedCourseReport.id)}
        onApproveCertificate={handleApproveCertificate}
        onRejectCertificate={handleRejectCertificate}
        onPreviewCertificate={handlePreviewCertificate}
        onExportSingleCourseExcel={handleExportSingleCourseExcel}
      />

      <CategoryManagerDialog
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        categories={categories}
        handleAddCategory={handleAddCategory}
        handleDeleteCategory={handleDeleteCategory}
        handleEditCategory={handleEditCategory}
      />
      <DeleteCourseDialog
        course={courseToDelete}
        onClose={() => setCourseToDelete(null)}
        onConfirm={confirmDeleteCourse}
      />
    </div>
  );
}
