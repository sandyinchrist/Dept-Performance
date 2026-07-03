import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { FocusArea, MonthlyRecord } from '../types';
import { MONTHS, CURRENT_YEAR } from '../types';
import { TrendingUp, Calendar, FileText, BarChart3 } from 'lucide-react';

interface DepartmentDashboardProps {
  departmentId: string;
  departmentName: string;
  onViewDataEntry: () => void;
}

export function DepartmentDashboard({ departmentId, departmentName, onViewDataEntry }: DepartmentDashboardProps) {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth());
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('monthly_records')
        .select('*')
        .eq('department_id', departmentId)
        .eq('year', year)
        .eq('month', month + 1);
      if (data) setRecords(data);
      setLoading(false);
    };
    fetchData();
  }, [departmentId, year, month]);

  const totalMonthlyAchievement = records.reduce((sum, r) => sum + (r.monthly_achievement || 0), 0);
  const totalMonthlyTarget = records.reduce((sum, r) => sum + (r.monthly_target || 0), 0);
  const totalAnnual = records.reduce((sum, r) => sum + (r.annual_total || 0), 0);
  const totalAnnualTarget = records.reduce((sum, r) => sum + (r.annual_target || 0), 0);
  const monthlyPercent = totalMonthlyTarget > 0 ? (totalMonthlyAchievement / totalMonthlyTarget) * 100 : 0;
  const annualPercent = totalAnnualTarget > 0 ? (totalAnnual / totalAnnualTarget) * 100 : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{departmentName}</h1>
          <p className="text-slate-400 mt-1">Dashboard Overview</p>
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
        <div className="p-6 bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-500/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-400 text-sm">Monthly Achievement</p>
              <p className="text-4xl font-bold text-white mt-1">{monthlyPercent.toFixed(1)}%</p>
              <p className="text-slate-400 text-sm mt-1">{totalMonthlyAchievement.toFixed(0)} / {totalMonthlyTarget.toFixed(0)}</p>
            </div>
            <Calendar className="w-10 h-10 text-emerald-500/50" />
          </div>
        </div>
        <div className="p-6 bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm">Annual Progress</p>
              <p className="text-4xl font-bold text-white mt-1">{annualPercent.toFixed(1)}%</p>
              <p className="text-slate-400 text-sm mt-1">{totalAnnual.toFixed(0)} / {totalAnnualTarget.toFixed(0)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-500/50" />
          </div>
        </div>
        <div className="p-6 bg-gradient-to-br from-teal-600/20 to-teal-800/20 border border-teal-500/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-400 text-sm">Focus Areas</p>
              <p className="text-4xl font-bold text-white mt-1">{records.length}</p>
              <p className="text-slate-400 text-sm mt-1">Active this month</p>
            </div>
            <FileText className="w-10 h-10 text-teal-500/50" />
          </div>
        </div>
        <div
          className="p-6 bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-2xl cursor-pointer hover:from-amber-600/30 hover:to-amber-800/30 transition-all"
          onClick={onViewDataEntry}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-400 text-sm">Data Entry</p>
              <p className="text-xl font-bold text-white mt-1">Enter Data</p>
              <p className="text-slate-400 text-sm mt-1">Click to add records</p>
            </div>
            <BarChart3 className="w-10 h-10 text-amber-500/50" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Executive Summary</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <p className="text-slate-400 text-sm">Monthly Achievement Percentage</p>
            <p className={`text-3xl font-bold mt-1 ${monthlyPercent >= 80 ? 'text-emerald-400' : monthlyPercent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {monthlyPercent.toFixed(1)}%
            </p>
            <div className="mt-3 h-2 bg-slate-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${monthlyPercent >= 80 ? 'bg-emerald-500' : monthlyPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(monthlyPercent, 100)}%` }}
              />
            </div>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <p className="text-slate-400 text-sm">Cumulative Annual Percentage</p>
            <p className={`text-3xl font-bold mt-1 ${annualPercent >= 80 ? 'text-emerald-400' : annualPercent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
              {annualPercent.toFixed(1)}%
            </p>
            <div className="mt-3 h-2 bg-slate-600 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${annualPercent >= 80 ? 'bg-blue-500' : annualPercent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(annualPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
