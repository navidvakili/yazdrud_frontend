// ============================================================
// useStatsFilter — Stats filter state
// ============================================================

import { useState } from 'react';

export function useStatsFilter() {
  const [statSelectedYear, setStatSelectedYear] = useState('۱۴۰۵');
  const [statSelectedCourse, setStatSelectedCourse] = useState('all');
  const [statAppliedYear, setStatAppliedYear] = useState('۱۴۰۵');
  const [statAppliedCourse, setStatAppliedCourse] = useState('all');

  return {
    statSelectedYear, setStatSelectedYear,
    statSelectedCourse, setStatSelectedCourse,
    statAppliedYear, setStatAppliedYear,
    statAppliedCourse, setStatAppliedCourse,
  };
}
