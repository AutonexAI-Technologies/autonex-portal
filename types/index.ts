// Minimal Client type for PDF generation in portal
export type ClientStatus = 'Lead' | 'Active' | 'Completed' | 'Paused' | 'Cancelled'
export type ProjectType = 'Setup' | 'Retainer' | 'Both'

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  service: string
  total_fee: number
  deposit_fee: number
  start_date?: string
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  upi_id?: string
  invoice_number?: string
  status: ClientStatus
  project_type: ProjectType
  notes?: string
  deleted_at?: string | null
  created_at: string
  updated_at?: string
}
