import { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '@/components/Layout';
import { Download, Plus, Trash2, Loader2 } from 'lucide-react';
import { cvApi, tokenStorage, sessionStorage_ } from '@/services/api';
import type { ApiCV } from '@shared/api';
import axios from 'axios';

// ── Local UI types ──────────────────────────────────────────────────────────

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  school: string;
  field: string;
  graduationDate: string;
}

interface Skill {
  id: string;
  name: string;
}

type Template = 'modern' | 'classic' | 'minimal';

const TEMPLATE_MAP: Record<Template, 1 | 2 | 3> = { modern: 1, classic: 2, minimal: 3 };
const TEMPLATE_REVERSE: Record<number, Template> = { 1: 'modern', 2: 'classic', 3: 'minimal' };

// ── API ↔ UI conversion helpers ──────────────────────────────────────────────

function apiToUi(cv: ApiCV) {
  const pi = cv.personal_info;
  return {
    personalInfo: {
      fullName: pi.full_name,
      email: pi.email,
      phone: pi.phone,
      location: [pi.city, pi.country].filter(Boolean).join(', ') || pi.address,
      summary: pi.summary,
    } as PersonalInfo,
    experiences: cv.experiences.map((e, i) => ({
      id: String(i),
      title: e.position,
      company: e.company,
      startDate: e.start_date,
      endDate: e.is_current ? 'Present' : e.end_date,
      description: e.description,
    })) as Experience[],
    educations: cv.education.map((e, i) => ({
      id: String(i),
      degree: e.degree,
      school: e.institution,
      field: e.field_of_study,
      graduationDate: e.end_date,
    })) as Education[],
    skills: cv.skills.map((s, i) => ({ id: String(i), name: s.name })) as Skill[],
    template: TEMPLATE_REVERSE[cv.template_choice] ?? 'modern' as Template,
  };
}

function uiToApi(
  personalInfo: PersonalInfo,
  experiences: Experience[],
  educations: Education[],
  skills: Skill[],
  template: Template
): Partial<ApiCV> {
  return {
    template_choice: TEMPLATE_MAP[template],
    personal_info: {
      full_name: personalInfo.fullName,
      email: personalInfo.email,
      phone: personalInfo.phone,
      address: personalInfo.location,
      city: '',
      country: '',
      linkedin: '',
      github: '',
      website: '',
      summary: personalInfo.summary,
    },
    experiences: experiences.map((e, i) => ({
      company: e.company,
      position: e.title,
      location: '',
      start_date: e.startDate,
      end_date: e.endDate === 'Present' ? '' : e.endDate,
      is_current: e.endDate === 'Present',
      description: e.description,
      order: i,
    })),
    education: educations.map((e, i) => ({
      institution: e.school,
      degree: e.degree,
      field_of_study: e.field,
      location: '',
      start_date: '',
      end_date: e.graduationDate,
      is_current: false,
      gpa: '',
      description: '',
      order: i,
    })),
    skills: skills
      .filter((s) => s.name.trim())
      .map((s, i) => ({ name: s.name, level: 'intermediate' as const, category: '', order: i })),
    languages: [],
    certificates: [],
  };
}

// ── Component ────────────────────────────────────────────────────────────────

const CV_ID_KEY = 'tezcv_current_cv';

export default function Builder() {
  const [cvId, setCvId] = useState<string | null>(null);
  const [template, setTemplate] = useState<Template>('modern');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isDownloading, setIsDownloading] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
  });
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // ── Load or create CV on mount ────────────────────────────────────────────

  useEffect(() => {
    const storedId = localStorage.getItem(CV_ID_KEY);
    if (storedId) {
      cvApi.get(storedId)
        .then(({ data }) => {
          const ui = apiToUi(data);
          setPersonalInfo(ui.personalInfo);
          setExperiences(ui.experiences);
          setEducations(ui.educations);
          setSkills(ui.skills);
          setTemplate(ui.template);
          setCvId(data.id);
        })
        .catch(() => {
          // CV no longer exists; create a fresh one
          localStorage.removeItem(CV_ID_KEY);
          createNewCv();
        });
    } else {
      createNewCv();
    }
  }, []);

  function createNewCv() {
    cvApi.create().then(({ data }) => {
      localStorage.setItem(CV_ID_KEY, data.id);
      setCvId(data.id);
    });
  }

  // ── Debounced auto-save ───────────────────────────────────────────────────

  const scheduleSave = useCallback(
    (pi: PersonalInfo, exp: Experience[], edu: Education[], sk: Skill[], tpl: Template) => {
      if (!cvId) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus('saving');
      saveTimerRef.current = setTimeout(async () => {
        try {
          await cvApi.update(cvId, uiToApi(pi, exp, edu, sk, tpl));
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
          setSaveStatus('error');
        }
      }, 800);
    },
    [cvId]
  );

  // Trigger save whenever state changes (after cvId is known)
  useEffect(() => {
    if (cvId) scheduleSave(personalInfo, experiences, educations, skills, template);
  }, [personalInfo, experiences, educations, skills, template, cvId]);

  // ── PDF download ──────────────────────────────────────────────────────────

  const downloadPDF = async () => {
    if (!cvId) return;
    setIsDownloading(true);
    try {
      const url = cvApi.exportPdfUrl(cvId);
      const headers: Record<string, string> = {};
      const token = tokenStorage.getAccess();
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const sk = sessionStorage_.get();
      if (sk) headers['X-Session-Key'] = sk;

      const response = await axios.get(url, {
        responseType: 'blob',
        headers,
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${personalInfo.fullName || 'CV'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      console.error('PDF download failed', e);
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Experience helpers ────────────────────────────────────────────────────

  const addExperience = () => {
    const updated = [...experiences, { id: Date.now().toString(), title: '', company: '', startDate: '', endDate: '', description: '' }];
    setExperiences(updated);
  };
  const updateExperience = (id: string, field: string, value: string) => {
    setExperiences(experiences.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };
  const removeExperience = (id: string) => setExperiences(experiences.filter((e) => e.id !== id));

  // ── Education helpers ────────────────────────────────────────────────────

  const addEducation = () => {
    setEducations([...educations, { id: Date.now().toString(), degree: '', school: '', field: '', graduationDate: '' }]);
  };
  const updateEducation = (id: string, field: string, value: string) => {
    setEducations(educations.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };
  const removeEducation = (id: string) => setEducations(educations.filter((e) => e.id !== id));

  // ── Skill helpers ────────────────────────────────────────────────────────

  const addSkill = () => setSkills([...skills, { id: Date.now().toString(), name: '' }]);
  const updateSkill = (id: string, name: string) => setSkills(skills.map((s) => (s.id === id ? { ...s, name } : s)));
  const removeSkill = (id: string) => setSkills(skills.filter((s) => s.id !== id));

  // ── Template change helper ────────────────────────────────────────────────
  const handleTemplateChange = (t: Template) => setTemplate(t);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">CV Builder</h1>
            <p className="text-muted-foreground">Fill in your details to create your professional CV</p>
          </div>
          <div className="text-sm text-muted-foreground pt-1">
            {saveStatus === 'saving' && <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>}
            {saveStatus === 'saved' && <span className="text-green-600">Saved</span>}
            {saveStatus === 'error' && <span className="text-destructive">Save failed</span>}
          </div>
        </div>

        {/* Template Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {(['modern', 'classic', 'minimal'] as Template[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTemplateChange(t)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${template === t ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            >
              <div className="font-display font-semibold capitalize mb-2">{t}</div>
              <div className="text-sm text-muted-foreground">
                {t === 'modern' && 'Clean and contemporary design'}
                {t === 'classic' && 'Timeless professional layout'}
                {t === 'minimal' && 'Simple and elegant format'}
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-8">
            {/* Personal Information */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-xl font-display font-bold mb-4">Personal Information</h2>
              <div className="space-y-4">
                {[
                  { label: 'Full Name', key: 'fullName', type: 'text' },
                  { label: 'Email', key: 'email', type: 'email' },
                  { label: 'Phone', key: 'phone', type: 'tel' },
                  { label: 'Location', key: 'location', type: 'text' },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1">{label}</label>
                    <input
                      type={type}
                      value={(personalInfo as any)[key]}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, [key]: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-1">Professional Summary</label>
                  <textarea
                    value={personalInfo.summary}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Experience Section */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-display font-bold">Experience</h2>
                <button onClick={addExperience} className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              <div className="space-y-6">
                {experiences.map((exp) => (
                  <div key={exp.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Job Title" value={exp.title} onChange={(e) => updateExperience(exp.id, 'title', e.target.value)} className="col-span-2 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                      <input type="text" placeholder="Company" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                      <input type="text" placeholder="End Date (or Present)" value={exp.endDate} onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)} className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                      <input type="text" placeholder="Start Date" value={exp.startDate} onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)} className="col-span-2 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                    <textarea placeholder="Description" value={exp.description} onChange={(e) => updateExperience(exp.id, 'description', e.target.value)} rows={2} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" />
                    <button onClick={() => removeExperience(exp.id)} className="flex items-center gap-2 text-xs text-destructive hover:opacity-70">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Education Section */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-display font-bold">Education</h2>
                <button onClick={addEducation} className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              <div className="space-y-6">
                {educations.map((edu) => (
                  <div key={edu.id} className="border border-border rounded-lg p-4 space-y-3">
                    <input type="text" placeholder="Degree" value={edu.degree} onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    <input type="text" placeholder="School/University" value={edu.school} onChange={(e) => updateEducation(edu.id, 'school', e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Field of Study" value={edu.field} onChange={(e) => updateEducation(edu.id, 'field', e.target.value)} className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                      <input type="text" placeholder="Graduation Date" value={edu.graduationDate} onChange={(e) => updateEducation(edu.id, 'graduationDate', e.target.value)} className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                    </div>
                    <button onClick={() => removeEducation(edu.id)} className="flex items-center gap-2 text-xs text-destructive hover:opacity-70">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Section */}
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-display font-bold">Skills</h2>
                <button onClick={addSkill} className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <div key={skill.id} className="relative group">
                    <input type="text" placeholder="Skill" value={skill.name} onChange={(e) => updateSkill(skill.id, e.target.value)} className="px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm w-32" />
                    <button onClick={() => removeSkill(skill.id)} className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground rounded-full p-1 transition-opacity">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={downloadPDF}
              disabled={!cvId || isDownloading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isDownloading ? 'Generating PDF…' : 'Download CV as PDF'}
            </button>
          </div>

          {/* Preview Section */}
          <div className="sticky top-24">
            <div className="bg-white border border-border rounded-lg shadow-lg p-8 space-y-6">
              <div className={template === 'modern' ? 'border-b-4 border-primary pb-4' : 'border-b-2 border-border pb-4'}>
                <h1 className={`font-display font-bold ${template === 'minimal' ? 'text-2xl' : 'text-3xl'}`}>
                  {personalInfo.fullName || 'Your Name'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{personalInfo.summary.split('\n')[0] || 'Your professional title'}</p>
              </div>

              <div className="text-xs">
                <div className="flex flex-wrap gap-3">
                  {personalInfo.email && <span>{personalInfo.email}</span>}
                  {personalInfo.phone && <><span>•</span><span>{personalInfo.phone}</span></>}
                  {personalInfo.location && <><span>•</span><span>{personalInfo.location}</span></>}
                </div>
              </div>

              {personalInfo.summary && (
                <p className="text-xs leading-relaxed text-muted-foreground">{personalInfo.summary}</p>
              )}

              {experiences.some((e) => e.title) && (
                <div>
                  <h2 className={`font-display font-semibold ${template === 'modern' ? 'text-sm border-b-2 border-primary pb-2 mb-3' : 'text-xs uppercase tracking-wide mb-3'}`}>Experience</h2>
                  <div className="space-y-4">
                    {experiences.filter((e) => e.title).map((exp) => (
                      <div key={exp.id} className="text-xs">
                        <div className="font-semibold">{exp.title}</div>
                        <div className="text-muted-foreground">{exp.company}{exp.startDate && ` • ${exp.startDate}`}{exp.endDate && ` - ${exp.endDate}`}</div>
                        {exp.description && <p className="text-muted-foreground mt-1">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {educations.some((e) => e.degree) && (
                <div>
                  <h2 className={`font-display font-semibold ${template === 'modern' ? 'text-sm border-b-2 border-primary pb-2 mb-3' : 'text-xs uppercase tracking-wide mb-3'}`}>Education</h2>
                  <div className="space-y-3">
                    {educations.filter((e) => e.degree).map((edu) => (
                      <div key={edu.id} className="text-xs">
                        <div className="font-semibold">{edu.degree}{edu.field && ` in ${edu.field}`}</div>
                        <div className="text-muted-foreground">{edu.school}{edu.graduationDate && ` • ${edu.graduationDate}`}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {skills.some((s) => s.name) && (
                <div>
                  <h2 className={`font-display font-semibold ${template === 'modern' ? 'text-sm border-b-2 border-primary pb-2 mb-3' : 'text-xs uppercase tracking-wide mb-3'}`}>Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.filter((s) => s.name).map((skill) => (
                      <span key={skill.id} className={`text-xs px-3 py-1 rounded-full ${template === 'modern' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'}`}>
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
