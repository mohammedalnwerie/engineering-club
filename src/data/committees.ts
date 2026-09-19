export interface CommitteeDefinition {
  id: 'general' | 'events' | 'training' | 'media';
  /** Name exactly as stored on applications */
  name: string;
  /** Short code printed on the card serial */
  code: string;
  /** Suggested titles the admin can pick from (free text is also allowed) */
  roles: string[];
}

export const COMMITTEES: CommitteeDefinition[] = [
  {
    id: 'general',
    name: 'عضوية عامة (عضو بالنادي)',
    code: 'GEN',
    roles: ['عضو في النادي'],
  },
  {
    id: 'events',
    name: 'لجنة الأنشطة والبرامج',
    code: 'EVT',
    roles: ['رئيس اللجنة', 'نائب رئيس اللجنة', 'منسق أنشطة وبرامج', 'مسؤول تنظيم وميدان', 'مسؤول لوجستيات', 'عضو في اللجنة'],
  },
  {
    id: 'training',
    name: 'لجنة العلاقات والشراكات',
    code: 'REL',
    roles: ['رئيس اللجنة', 'نائب رئيس اللجنة', 'مسؤول علاقات وشراكات', 'منسق تدريب وتطوير', 'مسؤول تواصل واستقطاب', 'عضو في اللجنة'],
  },
  {
    id: 'media',
    name: 'لجنة الإعلام والاتصال',
    code: 'MED',
    roles: ['رئيس اللجنة', 'نائب رئيس اللجنة', 'مصمم جرافيك', 'مصور وموثق', 'صانع محتوى', 'مونتير فيديو', 'مسؤول منصات التواصل والاتصال', 'عضو في اللجنة'],
  },
];

/** Finds a committee by stored name (tolerates older/longer spellings). */
export function findCommittee(nameOrText?: string): CommitteeDefinition | undefined {
  const text = (nameOrText || '').trim();
  if (!text) return undefined;
  return (
    COMMITTEES.find((c) => c.name === text) ||
    (text.includes('عامة') ? COMMITTEES[0] : undefined) ||
    (text.includes('فعاليات') || text.includes('أنشطة') || text.includes('برامج') ? COMMITTEES[1] : undefined) ||
    (text.includes('تدريب') || text.includes('علاقات') || text.includes('شراكات') ? COMMITTEES[2] : undefined) ||
    (text.includes('إعلام') || text.includes('اعلام') || text.includes('اتصال') ? COMMITTEES[3] : undefined)
  );
}

/** Committee the member actually serves in: the admin's assignment wins over the requested one. */
export function effectiveCommittee(app: { assignedCommittee?: string; targetCommittee?: string }): string {
  return app.assignedCommittee || app.targetCommittee || '';
}

/** Determines if an assignment or title belongs to executive leadership / board of directors. */
export function isExecutivePosition(item?: {
  organizationalRole?: string;
  assignedCommittee?: string;
  targetCommittee?: string;
  membershipType?: string;
} | null): boolean {
  if (!item) return false;
  if (item.membershipType === 'executive' || item.membershipType === 'accredited') return true;
  const role = (item.organizationalRole || '').trim();
  const comm = (item.assignedCommittee || item.targetCommittee || '').trim();

  if (
    comm.includes('إدارية') ||
    comm.includes('مجلس الإدارة') ||
    comm.includes('رئاسة النادي') ||
    comm.includes('الهيئة التنفيذية')
  ) {
    return true;
  }
  if (
    role.includes('رئيس') ||
    role.includes('نائب') ||
    role.includes('أمين سر') ||
    role.includes('أمين صندوق') ||
    role.includes('ممثل كلية') ||
    role.includes('منسق كلية')
  ) {
    return true;
  }
  return false;
}
