// ============================================================
// useSurveyOps — Survey operations
// ============================================================

import { useState } from 'react';
import type { TutCourse, TutSurvey } from '../../shared/types';

export function useSurveyOps(
  courses: TutCourse[],
  surveys: TutSurvey[],
  setSurveys: React.Dispatch<React.SetStateAction<TutSurvey[]>>,
  individualSurveys: any[],
  setIndividualSurveys: React.Dispatch<React.SetStateAction<any[]>>,
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
) {
  const [surveyFormCourseId, setSurveyFormCourseId] = useState('');
  const [surveyFormUser, setSurveyFormUser] = useState('');
  const [surveyFormRating, setSurveyFormRating] = useState(5);
  const [surveyFormContent, setSurveyFormContent] = useState(90);
  const [surveyFormLecturer, setSurveyFormLecturer] = useState(95);
  const [surveyFormOrg, setSurveyFormOrg] = useState(85);
  const [surveyFormFacilities, setSurveyFormFacilities] = useState(80);
  const [surveyFormComment, setSurveyFormComment] = useState('');

  const [surveySearch, setSurveySearch] = useState('');
  const [surveyFromDate, setSurveyFromDate] = useState('');
  const [surveyToDate, setSurveyToDate] = useState('');
  const [surveyPage, setSurveyPage] = useState(1);
  const [selectedSurveyDetails, setSelectedSurveyDetails] = useState<any | null>(null);

  const handleSubmitSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyFormComment.trim()) {
      showToast('لطفاً دیدگاه متنی خود را وارد کنید.', 'error');
      return;
    }
    const targetCourse = courses.find(c => c.id === surveyFormCourseId);
    if (!targetCourse) return;

    const newComment = {
      user: surveyFormUser || 'کاربر مهمان پورتال',
      rating: surveyFormRating,
      comment: surveyFormComment,
      date: '۱۴۰۵/۰۳/۲۳',
    };

    const existingIndex = surveys.findIndex(s => s.courseId === surveyFormCourseId);
    if (existingIndex > -1) {
      setSurveys(prev => {
        const updated = [...prev];
        const s = updated[existingIndex];
        const oldTotal = s.totalResponses;
        const newTotal = oldTotal + 1;
        const newRating = parseFloat(((s.rating * oldTotal + surveyFormRating) / newTotal).toFixed(1));
        updated[existingIndex] = {
          ...s, rating: newRating, totalResponses: newTotal,
          breakdown: {
            content: Math.round((s.breakdown.content * oldTotal + surveyFormContent) / newTotal),
            lecturer: Math.round((s.breakdown.lecturer * oldTotal + surveyFormLecturer) / newTotal),
            organization: Math.round((s.breakdown.organization * oldTotal + surveyFormOrg) / newTotal),
            facilities: Math.round((s.breakdown.facilities * oldTotal + surveyFormFacilities) / newTotal),
          },
          comments: [newComment, ...s.comments],
        };
        return updated;
      });
    } else {
      const newSurvey: TutSurvey = {
        courseId: surveyFormCourseId,
        courseTitle: targetCourse.title,
        rating: surveyFormRating,
        totalResponses: 1,
        breakdown: { content: surveyFormContent, lecturer: surveyFormLecturer, organization: surveyFormOrg, facilities: surveyFormFacilities },
        comments: [newComment],
      };
      setSurveys(prev => [newSurvey, ...prev]);
    }

    const newIndividual = {
      id: individualSurveys.length > 0 ? Math.max(...individualSurveys.map((x: any) => x.id)) + 1 : 1,
      name: surveyFormUser || 'کاربر مهمان پورتال',
      phone: '۰۹۱۲۰۰۰۰۰۰۰',
      date: '۱۴۰۵/۰۳/۲۳ ۱۲:۰۰',
      courseTitle: targetCourse.title,
      rating: surveyFormRating,
      comment: surveyFormComment,
      answers: { content: surveyFormContent, lecturer: surveyFormLecturer, organization: surveyFormOrg, facilities: surveyFormFacilities },
    };
    setIndividualSurveys(prev => [newIndividual, ...prev]);

    showToast('دیدگاه و ارزیابی شما با موفقیت ثبت شد.', 'success');
    setSurveyFormComment('');
  };

  return {
    surveyFormCourseId, setSurveyFormCourseId,
    surveyFormUser, setSurveyFormUser,
    surveyFormRating, setSurveyFormRating,
    surveyFormContent, setSurveyFormContent,
    surveyFormLecturer, setSurveyFormLecturer,
    surveyFormOrg, setSurveyFormOrg,
    surveyFormFacilities, setSurveyFormFacilities,
    surveyFormComment, setSurveyFormComment,
    surveySearch, setSurveySearch,
    surveyFromDate, setSurveyFromDate,
    surveyToDate, setSurveyToDate,
    surveyPage, setSurveyPage,
    selectedSurveyDetails, setSelectedSurveyDetails,
    handleSubmitSurvey,
  };
}
