import React, { useState } from 'react';
import { Eye, EyeOff, Save, ExternalLink } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { SOCIAL_META } from '../../data/socials';
import type { ContactSettings } from '../../types';
import { validateEmail, validatePhone, validateUrl } from '../../utils/validation';
import { Button, ErrorNote, Field, PageHeader, Panel, inputClass } from './ui';

// Official accounts and contact details for the site footer. A link with the
// eye closed stays saved but never appears on the public site.

export const ContactPanel: React.FC<{ showToast: (m: string) => void }> = ({ showToast }) => {
  const [form, setForm] = useState<ContactSettings>(() => dataService.getContactSettings());
  const [error, setError] = useState<string | null>(null);

  const setLink = (platform: string, patch: { url?: string; visible?: boolean }) =>
    setForm((prev) => ({
      ...prev,
      links: prev.links.map((l) => (l.platform === platform ? { ...l, ...patch } : l)),
    }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const emailProblem = validateEmail(form.email);
    if (emailProblem) return setError(`البريد الرسمي: ${emailProblem}`);
    const phoneProblem = validatePhone(form.phone || '', false);
    if (phoneProblem) return setError(`رقم التواصل: ${phoneProblem}`);
    for (const link of form.links) {
      if (!link.url.trim()) continue;
      const urlProblem = validateUrl(link.url.trim());
      if (urlProblem) return setError(`${SOCIAL_META[link.platform].label}: ${urlProblem}`);
    }
    setError(null);
    dataService.saveContactSettings({
      ...form,
      email: form.email.trim(),
      links: form.links.map((l) => ({ ...l, url: l.url.trim(), visible: l.visible && Boolean(l.url.trim()) })),
    });
    showToast('تم حفظ روابط التواصل');
  };

  const shown = form.links.filter((l) => l.visible && l.url.trim()).length;

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="روابط التواصل الرسمية"
        description="تظهر في تذييل الموقع. الرابط الفارغ أو المخفي لا يظهر للطلبة إطلاقاً."
      />

      <form onSubmit={save} className="space-y-5 max-w-3xl">
        <Panel className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="البريد الرسمي للنادي" hint="يظهر في التذييل ويستقبل رسائل الطلبة">
              <input
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="رقم تواصل (اختياري)">
              <input
                type="tel"
                dir="ltr"
                placeholder="0599123456"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="العنوان" hint="مثال: جامعة فلسطين — غزة">
            <input
              type="text"
              value={form.addressAr || ''}
              onChange={(e) => setForm({ ...form, addressAr: e.target.value })}
              className={inputClass}
            />
          </Field>
        </Panel>

        <Panel className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white">الحسابات الرسمية</h3>
            <span className="text-xs text-gray-400">{shown} حساب ظاهر في الموقع</span>
          </div>

          <ul className="space-y-2.5">
            {form.links.map((link) => {
              const meta = SOCIAL_META[link.platform];
              const filled = Boolean(link.url.trim());
              return (
                <li
                  key={link.platform}
                  className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 rounded-xl bg-black/30 border border-white/10"
                >
                  <div className="flex items-center gap-2.5 sm:w-44 shrink-0">
                    <span className="w-8 h-8 rounded-lg bg-white/[0.06] text-gray-200 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d={meta.path} />
                      </svg>
                    </span>
                    <span className="text-sm font-bold text-white">{meta.label}</span>
                  </div>

                  <input
                    type="url"
                    dir="ltr"
                    placeholder={meta.hint}
                    value={link.url}
                    onChange={(e) => setLink(link.platform, { url: e.target.value })}
                    className={`${inputClass} flex-1`}
                    aria-label={`رابط ${meta.label}`}
                  />

                  <div className="flex items-center gap-2 shrink-0">
                    {filled && (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`فتح ${meta.label}`}
                        className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-gray-300"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <Button
                      onClick={() => setLink(link.platform, { visible: !link.visible })}
                      disabled={!filled}
                      icon={link.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      className={link.visible ? 'text-emerald-200' : ''}
                    >
                      {link.visible ? 'ظاهر' : 'مخفي'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-gray-500">
            زر الإظهار يشتغل بعد ما تحط الرابط. احفظ بعد التعديل حتى يظهر التغيير في الموقع.
          </p>
        </Panel>

        <ErrorNote message={error} />

        <Button type="submit" variant="primary" icon={<Save className="w-4 h-4" />}>
          حفظ روابط التواصل
        </Button>
      </form>
    </div>
  );
};
