import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Department, MonthlyRecord, FocusArea } from '../types';
import { MONTHS, CURRENT_YEAR } from '../types';
import { RefreshCw, ChevronRight, TrendingUp, FileText } from 'lucide-react';

interface AdminDepartmentsProps {
  onViewDepartment: (deptId: string) => void;
}

export function AdminDepartments({ onViewDepartment }: AdminDepartmentsProps) {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth());
  const [departments, setDepartments] = useState<Department[]>([]);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, recRes] = await Promise.all([
        supabase.from('departments').select('*').order('sort_order'),
        supabase.from('monthly_records').select('*').eq('year', year).eq('month', month + 1),
      ]);

      if (deptRes.data) setDepartments(deptRes.data);
      if (recRes.data) setRecords(recRes.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDepartmentMetrics = (deptId: string) => {
    const deptRecords = records.filter(r => r.department_id === deptId);
    const totalMonthly = deptRecords.reduce((sum, r) => sum + (r.monthly_achievement || 0), 0);
    const totalMonthlyTarget = deptRecords.reduce((sum, r) => sum + (r.monthly_target || 0), 0);
    const totalAnnual = deptRecords.reduce((sum, r) => sum + (r.annual_total || 0), 0);
    const totalAnnualTarget = deptRecords.reduce((sum, r) => sum + (r.annual_target || 0), 0);

    return {
      focusAreas: deptRecords.length,
      monthlyAchievement: totalMonthly,
      monthlyTarget: totalMonthlyTarget,
      monthlyPercent: totalMonthlyTarget > 0 ? (totalMonthly / totalMonthlyTarget) * 100 : 0,
      annualTotal: totalAnnual,
      annualTarget: totalAnnualTarget,
      annualPercent: totalAnnualTarget > 0 ? (totalAnnual / totalAnnualTarget) * 100 : 0,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">All Departments</h1>
          <p className="text-slate-400">{MONTHS[month]} {year} Performance Overview</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
          >
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-500/30 rounded-xl">
          <p className="text-emerald-400 text-sm">Total Departments</p>
          <p className="text-3xl font-bold text-white mt-1">{departments.length}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl">
          <p className="text-blue-400 text-sm">Active Focus Areas</p>
          <p className="text-3xl font-bold text-white mt-1">{records.filter(r => r.monthly_achievement > 0).length}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-teal-600/20 to-teal-800/20 border border-teal-500/30 rounded-xl">
          <p className="text-teal-400 text-sm">Total Monthly Achievement</p>
          <p className="text-3xl font-bold text-white mt-1">{records.reduce((sum, r) => sum + (r.monthly_achievement || 0), 0).toFixed(0)}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-xl">
          <p className="text-amber-400 text-sm">Total Annual Progress</p>
          <p className="text-3xl font-bold text-white mt-1">
            {(() => {
              const total = records.reduce((sum, r) => sum + (r.annual_total || 0), 0);
              const target = records.reduce((sum, r) => sum + (r.annual_target || 0), 0);
              if (target === 0) return '0%';
              return ((total / target) * 100).toFixed(0) + '%';
            })()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {departments.map((dept) => {
          const m = getDepartmentMetrics(dept.id);
          return (
            <div
              key={dept.id}
              className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 hover:border-emerald-500/50 transition-all cursor-pointer group"
              onClick={() => onViewDepartment(dept.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white">{dept.name}</h3>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-slate-700/30 rounded">
                  <p className="text-slate-400 text-xs">Monthly</p>
                  <p className={`font-bold ${m.monthlyPercent >= 80 ? 'text-emerald-400' : m.monthlyPercent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {m.monthlyPercent.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-slate-700/30 rounded">
                  <p className="text-slate-400 text-xs">Annual</p>
                  <p className={`font-bold ${m.annualPercent >= 80 ? 'text-emerald-400' : m.annualPercent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {m.annualPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <FileText className="w-4 h-4" />
                {m.focusAreas} focus areas
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
