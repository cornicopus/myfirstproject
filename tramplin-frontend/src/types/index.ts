export interface User {
  id: number;
  email: string;
  role: 'seeker' | 'employer' | 'curator';
  full_name?: string;
  company_name?: string;
}

export interface Opportunity {
  id: number;
  title: string;
  description: string;
  companyName: string;
  companyLogo?: string;
  type: string;
  workFormat: string;
  location: string;
  lat: number;
  lon: number;
  salary?: {
    from: number;
    to: number;
  };
  tags: string[];
  company_id: number;
}

export interface Filters {
  search?: string;
  skills?: string[];
  salaryMin?: number;
  salaryMax?: number;
  workFormat?: string[];
  type?: string[];
}