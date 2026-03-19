export interface Grant {
  id: string;
  title: string;
  amount: string;
  deadline: string;
  portal: string;
  matchScore: number;
  description?: string;
  url?: string;
  matchReason?: string;
  probability?: number;
  probabilityReason?: string;
  requirements?: string[];
  location?: string;
  type?: string;
}

export interface Application extends Grant {
  status: string;
  progress: number;
}

export interface Organization {
  name: string;
  mission: string;
  pastGrants: string[];
  focusAreas?: string[];
  minGrant?: string;
  maxGrant?: string;
  timeline?: string;
  regions?: string[];
  teamSize?: string;
  yearsOperating?: string;
  internationalEligible?: boolean;
  type?: string;
  matchedGrants?: Grant[];
}
