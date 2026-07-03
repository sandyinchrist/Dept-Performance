import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Department, MonthlyRecord, ComplianceScore, MonitoringHead } from '../types';
import { MONTHS, CURRENT_YEAR } from '../types';
import { RefreshCw, Printer, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function ExecutiveReport() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth());
  const [departments, setDepartments] = useState<Department[]>([]);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [complianceScores, setComplianceScores] = useState<ComplianceScore[]>([]);
  const [monitoringHeads, setMonitoringHeads] = useState<MonitoringHead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, recRes, compRes, monRes] = await Promise.all([
        supabase.from('departments').select('*').order('sort_order'),
        supabase.from('monthly_records').select('*').eq('year', year).eq('month', month + 1),
        supabase.from('compliance_scores').select('*').eq('year', year).eq('month', month + 1),
        supabase.from('monitoring_heads').select('*').order('sort_order'),
      ]);

      if (deptRes.data) setDepartments(deptRes.data);
      if (recRes.data) setRecords(recRes.data);
      if (compRes.data) setComplianceScores(compRes.data);
      if (monRes.data) setMonitoringHeads(monRes.data);
    } catch (err) {
      console.error('Error fetching executive report:', err);
    }
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDepartmentMetrics = (deptId: string) => {
    const deptRecords = records.filter(r => r.department_id === deptId);
    const totalMonthlyAchievement = deptRecords.reduce((sum, r) => sum + (r.monthly_achievement || 0), 0);
    const totalMonthlyTarget = deptRecords.reduce((sum, r) => sum + (r.monthly_target || 0), 0);
    const totalAnnual = deptRecords.reduce((sum, r) => sum + (r.annual_total || 0), 0);
    const totalAnnualTarget = deptRecords.reduce((sum, r) => sum + (r.annual_target || 0), 0);

    const monthlyPercent = totalMonthlyTarget > 0 ? (totalMonthlyAchievement / totalMonthlyTarget) * 100 : 0;
    const annualPercent = totalAnnualTarget > 0 ? (totalAnnual / totalAnnualTarget) * 100 : 0;

    // Get compliance scores for this department
    const deptCompliance = complianceScores.filter(s => s.department_id === deptId);
    const totalCompliance = deptCompliance.reduce((sum, s) => sum + (s.monthly_score || 0), 0);
    const avgCompliance = deptCompliance.length > 0 ? totalCompliance / deptCompliance.length : 0;

    return {
      monthlyAchievement: totalMonthlyAchievement,
      monthlyTarget: totalMonthlyTarget,
      monthlyPercent,
      annualTotal: totalAnnual,
      annualTarget: totalAnnualTarget,
      annualPercent,
      complianceScore: avgCompliance,
      focusAreas: deptRecords.length,
    };
  };

  const handlePrint = () => window.print();

  const handleExport = () => {
    const csvRows = [
      ['S/N', 'Department', 'Monthly Achievement', 'Monthly %', 'Annual Total', 'Annual %', 'Compliance Score', 'Total Score'],
      ...departments.map((dept, idx) => {
        const m = getDepartmentMetrics(dept.id);
        return [
          idx + 1,
          dept.name,
          m.monthlyAchievement.toFixed(2),
          m.monthlyPercent.toFixed(1) + '%',
          m.annualTotal.toFixed(2),
          m.annualPercent.toFixed(1) + '%',
          m.complianceScore.toFixed(1),
          (m.annualPercent + m.complianceScore).toFixed(1),
        ];
      }),
    ];
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Executive_Report_${MONTHS[month]}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const overallMonthly = departments.reduce((sum, d) => sum + getDepartmentMetrics(d.id).monthlyAchievement, 0);
  const overallMonthlyTarget = departments.reduce((sum, d) => sum + getDepartmentMetrics(d.id).monthlyTarget, 0);
  const overallAnnualTotal = departments.reduce((sum, d) => sum + getDepartmentMetrics(d.id).annualTotal, 0);
  const overallAnnualTarget = departments.reduce((sum, d) => sum + getDepartmentMetrics(d.id).annualTarget, 0);
  const overallMonthlyPercent = overallMonthlyTarget > 0 ? (overallMonthly / overallMonthlyTarget) * 100 : 0;
  const overallAnnualPercent = overallAnnualTarget > 0 ? (overallAnnualTotal / overallAnnualTarget) * 100 : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive Report</h1>
          <p className="text-slate-400">{MONTHS[month]} {year} - All Departments Overview</p>
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
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-500/30 rounded-xl">
          <p className="text-emerald-400 text-sm">Overall Monthly Achievement</p>
          <p className="text-3xl font-bold text-white mt-1">{overallMonthlyPercent.toFixed(1)}%</p>
          <p className="text-slate-400 text-sm mt-1">{overallMonthly.toFixed(0)} / {overallMonthlyTarget.toFixed(0)}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl">
          <p className="text-blue-400 text-sm">Cumulative Annual Achievement</p>
          <p className="text-3xl font-bold text-white mt-1">{overallAnnualPercent.toFixed(1)}%</p>
          <p className="text-slate-400 text-sm mt-1">{overallAnnualTotal.toFixed(0)} / {overallAnnualTarget.toFixed(0)}</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-teal-600/20 to-teal-800/20 border border-teal-500/30 rounded-xl">
          <p className="text-teal-400 text-sm">Total Compliance Score</p>
          <p className="text-3xl font-bold text-white mt-1">
            {(() => {
              const totalCompliance = complianceScores.reduce((sum, s) => sum + (s.monthly_score || 0), 0);
              const totalScores = departments.reduce((sum, d) => sum + getDepartmentMetrics(d.id).complianceScore, 0);
              return (totalScores / departments.length).toFixed(1);
            })()}
          </p>
          <p className="text-slate-400 text-sm mt-1">Avg per department</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/30 rounded-xl">
          <p className="text-amber-400 text-sm">Active Departments</p>
          <p className="text-3xl font-bold text-white mt-1">{departments.length}</p>
          <p className="text-slate-400 text-sm mt-1">With {monitoringHeads.length} monitors</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden print:bg-white print:text-black">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 print:bg-gray-200">
                <th className="px-3 py-3 text-left text-slate-300 font-medium border-r border-slate-700 print:border-gray-400 sticky left-0 bg-slate-800/50 print:bg-gray-200 z-10">
                  S/N
                </th>
                <th className="px-3 py-3 text-left text-slate-300 font-medium border-r border-slate-700 print:border-gray-400 sticky left-[40px] bg-slate-800/50 print:bg-gray-200 z-10 min-w-[200px]">
                  Department
                </th>
                <th className="px-3 py-3 text-center text-slate-300 font-medium border-r border-slate-700 print:border-gray-400">
                  Focus Areas
                </th>
                <th className="px-3 py-3 text-center text-emerald-400 font-medium border-r border-slate-700 print:border-gray-400">
                  Monthly Achievement
                </th>
                <th className="px-3 py-3 text-center text-emerald-400 font-medium border-r border-slate-700 print:border-gray-400">
                  Monthly %
                </th>
                <th className="px-3 py-3 text-center text-blue-400 font-medium border-r border-slate-700 print:border-gray-400">
                  Annual Total
                </th>
                <th className="px-3 py-3 text-center text-blue-400 font-medium border-r border-slate-700 print:border-gray-400">
                  Annual % (Cumulative)
                </th>
                <th className="px-3 py-3 text-center text-teal-400 font-medium border-r border-slate-700 print:border-gray-400">
                  Compliance Score
                </th>
                <th className="px-3 py-3 text-center text-amber-400 font-medium">
                  Total Score
                </th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, idx) => {
                const m = getDepartmentMetrics(dept.id);
                return (
                  <tr key={dept.id} className="border-t border-slate-700/50 print:border-gray-300 hover:bg-slate-700/20 print:hover:bg-transparent">
                    <td className="px-3 py-2 text-slate-400 border-r border-slate-700/50 print:border-gray-400 sticky left-0 bg-slate-800/30 print:bg-white">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 text-white print:text-black border-r border-slate-700/50 print:border-gray-400 sticky left-[40px] bg-slate-800/30 print:bg-white z-10 font-medium">
                      {dept.name}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-300 border-r border-slate-700/50 print:border-gray-400">
                      {m.focusAreas}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-300 border-r border-slate-700/50 print:border-gray-400">
                      {m.monthlyAchievement.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right border-r border-slate-700/50 print:border-gray-400">
                      <span className={`font-medium ${m.monthlyPercent >= 80 ? 'text-emerald-400' : m.monthlyPercent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {m.monthlyPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-300 border-r border-slate-700/50 print:border-gray-400">
                      {m.annualTotal.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right border-r border-slate-700/50 print:border-gray-400">
                      <span className={`font-medium ${m.annualPercent >= 80 ? 'text-emerald-400' : m.annualPercent >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {m.annualPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right border-r border-slate-700/50 print:border-gray-400">
                      <span className={`font-medium ${m.complianceScore >= 70 ? 'text-teal-400' : m.complianceScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                        {m.complianceScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-bold ${m.annualPercent + m.complianceScore >= 150 ? 'text-emerald-400' : m.annualPercent + m.complianceScore >= 100 ? 'text-amber-400' : 'text-red-400'}`}>
                        {(m.annualPercent + m.complianceScore).toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {/* Totals */}
              <tr className="bg-slate-800/70 print:bg-gray-200 font-bold">
                <td colSpan={2} className="px-3 py-3 text-white print:text-black border-r border-slate-700 print:border-gray-400 sticky left-0 bg-slate-800/70 print:bg-gray-200">
                  GRAND TOTAL
                </td>
                <td className="px-3 py-3 text-center border-r border-slate-700 print:border-gray-400">
                  {records.filter(r => r.monthly_achievement > 0).length}
                </td>
                <td className="px-3 py-3 text-right text-emerald-400 border-r border-slate-700 print:border-gray-400">
                  {overallMonthly.toFixed(2)}
                </td>
                <td className="px-3 py-3 text-right text-emerald-400 border-r border-slate-700 print:border-gray-400">
                  {overallMonthlyPercent.toFixed(1)}%
                </td>
                <td className="px-3 py-3 text-right text-blue-400 border-r border-slate-700 print:border-gray-400">
                  {overallAnnualTotal.toFixed(2)}
                </td>
                <td className="px-3 py-3 text-right text-blue-400 border-r border-slate-700 print:border-gray-400">
                  {overallAnnualPercent.toFixed(1)}%
                </td>
                <td className="px-3 py-3 text-right text-teal-400 border-r border-slate-700 print:border-gray-400">
                  {(() => {
                    const totalScores = departments.reduce((sum, d) => sum + getDepartmentMetrics(d.id).complianceScore, 0);
                    return (totalScores / departments.length).toFixed(1);
                  })()}
                </td>
                <td className="px-3 py-3 text-right text-amber-400">
                  {(overallAnnualPercent + departments.reduce((sum, d) => sum + getDepartmentMetrics(d.id).complianceScore, 0) / departments.length).toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Breakdown by Monitor */}
      <div className="mt-6 p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl print:bg-white print:border-gray-400">
        <h2 className="text-xl font-bold text-white print:text-black mb-4">Compliance Scores by Monitoring Head</h2>
        <div className="grid grid-cols-5 gap-4">
          {monitoringHeads.map(mh => (
            <div key={mh.id} className="p-4 bg-slate-700/30 print:bg-gray-100 rounded-xl">
              <p className="text-slate-400 print:text-gray-600 text-sm">{mh.name}</p>
              <div className="mt-2 space-y-1">
                {departments.slice(0, 5).map(dept => {
                  const score = complianceScores.find(s => s.monitoring_head_id === mh.id && s.department_id === dept.id);
                  return (
                    <div key={dept.id} className="flex justify-between text-xs">
                      <span className="text-slate-500 truncate">{dept.name.slice(0, 15)}...</span>
                      <span className="font-medium text-teal-400">{score?.monthly_score || 0}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
