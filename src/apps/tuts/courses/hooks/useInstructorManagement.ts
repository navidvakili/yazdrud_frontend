// ============================================================
// useInstructorManagement — Instructor CRUD operations
// ============================================================

import { useState } from 'react';
import api from '@/src/shared-api';

export function useInstructorManagement(showToast: (text: string, type?: 'success' | 'error' | 'info') => void) {
  const [instructors, setInstructors] = useState<{ id: number; name: string; specialty: string | null }[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(false);
  const [isInstructorManagementOpen, setIsInstructorManagementOpen] = useState(false);
  const [instructorFormMode, setInstructorFormMode] = useState<'create' | 'edit'>('create');
  const [editingInstructorId, setEditingInstructorId] = useState<number | null>(null);
  const [instructorFormName, setInstructorFormName] = useState('');
  const [instructorFormSpecialty, setInstructorFormSpecialty] = useState('');
  const [instructorFormBio, setInstructorFormBio] = useState('');
  const [instructorFormPhoto, setInstructorFormPhoto] = useState<File | null>(null);
  const [instructorFormPhotoPreview, setInstructorFormPhotoPreview] = useState<string | null>(null);
  const [instructorFormActive, setInstructorFormActive] = useState(true);
  const [instructorSubmitting, setInstructorSubmitting] = useState(false);

  const resetInstructorForm = () => {
    setInstructorFormMode('create');
    setEditingInstructorId(null);
    setInstructorFormName('');
    setInstructorFormSpecialty('');
    setInstructorFormBio('');
    setInstructorFormPhoto(null);
    setInstructorFormPhotoPreview(null);
    setInstructorFormActive(true);
  };

  const handleEditInstructor = async (inst: { id: number; name: string }) => {
    try {
      const instructor = await api.getInstructor(inst.id);
      setEditingInstructorId(inst.id);
      setInstructorFormName(instructor.name);
      setInstructorFormSpecialty(instructor.specialty || '');
      setInstructorFormBio(instructor.bio || '');
      setInstructorFormPhoto(null);
      setInstructorFormPhotoPreview(instructor.photo_url || null);
      setInstructorFormActive(instructor.active);
      setInstructorFormMode('edit');
    } catch (err) {
      showToast('خطا در دریافت اطلاعات استاد', 'error');
    }
  };

  const handleDeleteInstructor = async (inst: { id: number; name: string }) => {
    if (!window.confirm(`آیا از حذف استاد "${inst.name}" اطمینان دارید؟`)) return;
    try {
      await api.deleteInstructor(inst.id);
      setInstructors(prev => prev.filter(i => i.id !== inst.id));
      showToast(`استاد "${inst.name}" حذف شد.`);
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف استاد', 'error');
    }
  };

  const handleSubmitInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructorFormName) {
      showToast('نام استاد الزامی است.', 'error');
      return;
    }
    setInstructorSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', instructorFormName);
      formData.append('specialty', instructorFormSpecialty);
      formData.append('bio', instructorFormBio);
      formData.append('active', instructorFormActive ? '1' : '0');
      if (instructorFormPhoto) formData.append('photo', instructorFormPhoto);

      if (editingInstructorId) {
        formData.append('_method', 'PUT');
        const updated = await api.updateInstructor(editingInstructorId, formData);
        setInstructors(prev => prev.map(i => i.id === editingInstructorId
          ? { id: i.id, name: updated.name, specialty: updated.specialty || null }
          : i
        ));
        showToast(`استاد "${updated.name}" بروزرسانی شد.`);
      } else {
        const created = await api.createInstructor(formData);
        setInstructors(prev => [...prev, { id: created.id, name: created.name, specialty: created.specialty || null }]);
        showToast(`استاد "${created.name}" ثبت شد.`);
      }
      resetInstructorForm();
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره اطلاعات استاد', 'error');
    } finally {
      setInstructorSubmitting(false);
    }
  };

  return {
    instructors, setInstructors,
    instructorsLoading, setInstructorsLoading,
    isInstructorManagementOpen, setIsInstructorManagementOpen,
    instructorFormMode,
    editingInstructorId,
    instructorFormName, setInstructorFormName,
    instructorFormSpecialty, setInstructorFormSpecialty,
    instructorFormBio, setInstructorFormBio,
    instructorFormPhoto, setInstructorFormPhoto,
    instructorFormPhotoPreview, setInstructorFormPhotoPreview,
    instructorFormActive, setInstructorFormActive,
    instructorSubmitting,
    resetInstructorForm,
    handleEditInstructor,
    handleDeleteInstructor,
    handleSubmitInstructor,
  };
}
