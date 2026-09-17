import type { ComplaintItem, ComplaintPriority } from '../types';

// One source of truth for the ticket categories: the student form, the filters
// and the admin badges used to disagree about which ones exist.

export const COMPLAINT_CATEGORIES: { value: ComplaintItem['category']; label: string }[] = [
  { value: 'suggestion', label: 'مقترح أو فكرة' },
  { value: 'club_activities', label: 'أنشطة وفعاليات النادي' },
  { value: 'academic', label: 'معوقات أكاديمية' },
  { value: 'facilities', label: 'قاعات ومعامل ومرافق' },
  { value: 'complaint', label: 'شكوى' },
  { value: 'inquiry', label: 'استفسار' },
  { value: 'other', label: 'موضوع آخر' },
];

export const complaintCategoryLabel = (value: ComplaintItem['category']) =>
  COMPLAINT_CATEGORIES.find((c) => c.value === value)?.label || 'موضوع آخر';

export const PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  normal: 'عادي',
  medium: 'أهمية متوسطة',
  urgent: 'عاجل',
};
