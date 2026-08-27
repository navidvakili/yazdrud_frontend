import React from 'react';
import { SmartFormBuilderStudio } from './SmartFormBuilderStudio';

interface FormsAppProps {
  onOpenTab?: (tabId: string, title?: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function FormsApp({ onOpenTab, onDirtyChange }: FormsAppProps) {
  return <SmartFormBuilderStudio onOpenTab={onOpenTab} onDirtyChange={onDirtyChange} />;
}
