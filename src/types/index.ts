export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  organization_id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  organization_id: string
  name: string
  domain?: string
  industry?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  notes?: string
  created_at: string
  updated_at: string
  contact_count?: number
}

export interface Contact {
  id: string
  organization_id: string
  company_id?: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  title?: string
  source?: string
  status: 'active' | 'inactive' | 'lead'
  notes?: string
  created_at: string
  updated_at: string
  company?: Company
}

export interface DealStage {
  id: string
  organization_id: string
  name: string
  position: number
  color: string
  created_at: string
}

export interface Deal {
  id: string
  organization_id: string
  contact_id?: string
  company_id?: string
  stage_id: string
  title: string
  amount: number
  currency: string
  close_date?: string
  probability?: number
  status: 'open' | 'won' | 'lost'
  notes?: string
  created_at: string
  updated_at: string
  contact?: Contact
  company?: Company
  stage?: DealStage
}

export interface Activity {
  id: string
  organization_id: string
  contact_id?: string
  deal_id?: string
  user_id?: string
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'voice_agent'
  title: string
  description?: string
  due_date?: string
  completed: boolean
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  contact?: Contact
  deal?: Deal
}

export interface Note {
  id: string
  organization_id: string
  contact_id?: string
  deal_id?: string
  company_id?: string
  user_id?: string
  content: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  organization_id: string
  name: string
  color?: string
  created_at: string
}

export interface EntityTag {
  id: string
  tag_id: string
  entity_type: 'contact' | 'company' | 'deal'
  entity_id: string
}

export interface CinematicSite {
  id: string
  organization_id: string
  name: string
  slug: string
  domain?: string
  api_key: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  organization_id: string
  contact_id?: string
  deal_id?: string
  company_id?: string
  name: string
  file_url: string
  file_type?: string
  file_size?: number
  created_at: string
}
