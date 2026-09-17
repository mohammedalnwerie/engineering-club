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
    name: 'لجنة الفعاليات والأنشطة',
    code: 'EVT',
    roles: ['رئيس اللجنة', 'نائب رئيس اللجنة', 'منسق فعاليات', 'مسؤول تنظيم وميدان', 'مسؤول لوجستيات', 'عضو في اللجنة'],
  },
  {
    id: 'training',
    name: 'لجنة العلاقات والتدريب',
    code: 'REL',
    roles: ['رئيس اللجنة', 'نائب رئيس اللجنة', 'منسق تدريب وورش', 'مسؤول علاقات وشراكات', 'مسؤول تواصل مع المدربين', 'عضو في اللجنة'],
  },
  {
    id: 'media',
    name: 'اللجنة الإعلامية',
    code: 'MED',
    roles: ['رئيس اللجنة', 'نائب رئيس اللجنة', 'مصمم جرافيك', 'مصور وموثق', 'صانع محتوى', 'مونتير فيديو', 'مسؤول منصات التواصل', 'عضو في اللجنة'],
  },
];

/** Finds a committee by stored name (tolerates older/longer spellings). */
export function findCommittee(nameOrText?: string): CommitteeDefinition | undefined {
  const text = (nameOrText || '').trim();
  if (!text) return undefined;
  return (
    COMMITTEES.find((c) => c.name === text) ||
    (text.includes('عامة') ? COMMITTEES[0] : undefined) ||
    (text.includes('فعاليات') ? COMMITTEES[1] : undefined) ||
    (text.includes('تدريب') || text.includes('علاقات') ? COMMITTEES[2] : undefined) ||
    (text.includes('إعلام') ? COMMITTEES[3] : undefined)
  );
}

/** Committee the member actually serves in: the admin's assignment wins over the requested one. */
export function effectiveCommittee(app: { assignedCommittee?: string; targetCommittee?: string }): string {
  return app.assignedCommittee || app.targetCommittee || '';
}
