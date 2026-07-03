export interface Department {
  id: string;
  name: string;
  code: string;
  password: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MonitoringHead {
  id: string;
  name: string;
  password: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FocusArea {
  id: string;
  department_id: string;
  name: string;
  annual_target: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthlyRecord {
  id: string;
  department_id: string;
  focus_area_id: string;
  year: number;
  month: number;
  annual_target: number;
  monthly_target: number;
  week1_achievement: number;
  week2_achievement: number;
  week3_achievement: number;
  week4_achievement: number;
  week5_achievement: number;
  week1_remark: string;
  week2_remark: string;
  week3_remark: string;
  week4_remark: string;
  week5_remark: string;
  monthly_achievement: number;
  monthly_percentage: number;
  monthly_remark: string;
  previous_annual_achievement: number;
  annual_total: number;
  cumulative_annual_percentage: number;
  annual_remark: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceScore {
  id: string;
  department_id: string;
  monitoring_head_id: string;
  year: number;
  month: number;
  week1_score: number;
  week2_score: number;
  week3_score: number;
  week4_score: number;
  week5_score: number;
  monthly_score: number;
  cumulative_annual_score: number;
  remarks: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'admin' | 'department' | 'monitor';

export interface UserSession {
  role: UserRole;
  id: string;
  name: string;
  departmentId?: string;
  monitorId?: string;
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CURRENT_YEAR = new Date().getFullYear();
