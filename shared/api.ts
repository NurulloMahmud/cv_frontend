// Shared API types between frontend layers

export interface ApiTokens {
  access: string;
  refresh: string;
}

export interface ApiUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  bio: string;
  date_joined: string;
}

export interface ApiPersonalInfo {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  linkedin: string;
  github: string;
  website: string;
  summary: string;
}

export interface ApiExperience {
  company: string;
  position: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  order: number;
}

export interface ApiEducation {
  institution: string;
  degree: string;
  field_of_study: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  gpa: string;
  description: string;
  order: number;
}

export interface ApiSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: string;
  order: number;
}

export interface ApiLanguage {
  name: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

export interface ApiCertificate {
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date: string;
  credential_url: string;
  description: string;
}

export interface ApiCV {
  id: string;
  title: string;
  template_choice: 1 | 2 | 3;
  is_public: boolean;
  personal_info: ApiPersonalInfo;
  experiences: ApiExperience[];
  education: ApiEducation[];
  skills: ApiSkill[];
  languages: ApiLanguage[];
  certificates: ApiCertificate[];
  created_at: string;
  updated_at: string;
}
