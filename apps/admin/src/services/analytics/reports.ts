
export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  agent_id?: number;
  client_id?: number;
  status?: string;
  format?: 'json' | 'csv' | 'pdf';
}
