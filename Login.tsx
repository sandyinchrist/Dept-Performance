import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Department, ComplianceScore } from '../types';
import { MONTHS, CURRENT_YEAR } from '../types';
import { RefreshCw, Save, CheckCircle } from 'lucide-react';

interface ComplianceScoringProps {
  monitorId: string;
  monitorName: string;
}

export function ComplianceScoring({ monitorId, monitorName }: ComplianceScoringProps) {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth());
  const [departments, setDepartments] = useState<Department[]>([]);
  const [scores, setScores] = useState<Map<string, ComplianceScore>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, scoreRes] = await Promise.all([
        supabase.from('departments').select('*').order('sort_order'),
        supabase
          .from('compliance_scores')
          .select('*')
          .eq('monitoring_head_id', monitorId)
          .eq('year', year)
          .eq('month', month + 1),
      ]);

      if (deptRes.data) {
        setDepartments(deptRes.data);
      }
      if (scoreRes.data) {
        const scoreMap = new Map<string, ComplianceScore>();
        scoreRes.data.forEach((s) => scoreMap.set(s.department_id, s));
        setScores(scoreMap);
      }
    } catch (err) {
      console.error('Error fetching compliance data:', err);
    }
    setLoading(false);
  }, [monitorId, year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getScore = (deptId: string): ComplianceScore => {
    const existing = scores.get(deptId);
    if (existing) return existing;
    return {
      id: '',
      department_id: deptId,
      monitoring_head_id: monitorId,
      year,
      month: month + 1,
      week1_score: 0,
      week2_score: 0,
      week3_score: 0,
      week4_score: 0,
      week5_score: 0,
      monthly_score: 0,
      cumulative_annual_score: 0,
      remarks: '',
      created_at: '',
      updated_at: '',
    };
  };

  const updateScore = (deptId: string, updates: Partial<ComplianceScore>) => {
    setScores((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(deptId) || getScore(deptId);
      const updated = { ...current, ...updates };

      // Auto-calculate monthly score
      updated.monthly_score =
        (updated.week1_score || 0) +
        (updated.week2_score || 0) +
        (updated.week3_score || 0) +
        (updated.week4_score || 0) +
        (updated.week5_score || 0);

      newMap.set(deptId, updated);
      return newMap;
    });
  };

  const saveScore = async (deptId: string) => {
    const score = scores.get(deptId);
    if (!score) return;

    setSaving(deptId);
    try {
      const dataToSave = {
        department_id: deptId,
        monitoring_head_id: monitorId,
        year,
        month: month + 1,
        week1_score: score.week1_score,
        week2_score: score.week2_score,
        week3_score: score.week3_score,
        week4_score: score.week4_score,
        week5_score: score.week5_score,
        monthly_score: score.monthly_score,
        cumulative_annual_score: score.cumulative_annual_score,
        remarks: score.remarks,
      };

      if (score.id) {
        await supabase.from('compliance_scores').update(dataToSave).eq('id', score.id);
      } else {
        const { data } = await supabase.from('compliance_scores').insert(dataToSave).select();
        if (data?.[0]) {
          setScores((prev) => {
            const newMap = new Map(prev);
            newMap.set(deptId, data[0]);
            return newMap;
          });
        }
      }
    } catch (err) {
      console.error('Error saving:', err);
    }
    setSaving(null);
  };

  const getPreviousCumulative = async (deptId: string): Promise<number> => {
    let cumulative = 0;
    for (let m = 0; m < month; m++) {
      const { data } = await supabase
        .from('compliance_scores')
        .select('monthly_score')
        .eq('department_id', deptId)
        .eq('monitoring_head_id', monitorId)
        .eq('year', year)
        .eq('month', m + 1)
        .maybeSingle();
      if (data) {
        cumulative += data.monthly_score;
      }
    }
    return cumulative;
  };

  useEffect(() => {
    const loadPreviousCumulative = async () => {
      for (const dept of departments) {
        const prev = await getPreviousCumulative(dept.id);
        const score = scores.get(dept.id);
        if (score && score.cumulative_annual_score !== prev) {
          updateScore(dept.id, { cumulative_annual_score: prev + (score.monthly_score || 0) });
        } else if (!score) {
          updateScore(dept.id, { cumulative_annual_score: prev });
        }
      }
    };
    if (departments.length > 0) {
      loadPreviousCumulative();
    }
  }, [month, year, departments]);

  const numInputClass = 'w-16 px-2 py-1.5 bg-slate-700/50 border border-slate-600 rounded text-sm text-white text-right focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent';
  const calcClass = 'w-16 px-2 py-1.5 bg-slate-600/50 rounded text-sm text-right font-medium';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance Scoring</h1>
          <p className="text-slate-400">{monitorName}</p>
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

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-3 py-3 text-left text-slate-300 font-medium border-r border-slate-700 sticky left-0 bg-slate-800/50 z-10 min-w-[40px]">
                  S/N
                </th>
                <th className="px-3 py-3 text-left text-slate-300 font-medium border-r border-slate-700 sticky left-[40px] bg-slate-800/50 z-10 min-w-[200px]">
                  Department
                </th>
                <th className="px-3 py-3 text-center text-blue-400 font-medium border-r border-slate-700 min-w-[70px]">
                  Wk 1
                </th>
                <th className="px-3 py-3 text-center text-blue-400 font-medium border-r border-slate-700 min-w-[70px]">
                  Wk 2
                </th>
                <th className="px-3 py-3 text-center text-blue-400 font-medium border-r border-slate-700 min-w-[70px]">
                  Wk 3
                </th>
                <th className="px-3 py-3 text-center text-blue-400 font-medium border-r border-slate-700 min-w-[70px]">
                  Wk 4
                </th>
                <th className="px-3 py-3 text-center text-blue-400 font-medium border-r border-slate-700 min-w-[70px]">
                  Wk 5
                </th>
                <th className="px-3 py-3 text-center text-emerald-400 font-medium border-r border-slate-700 min-w-[80px]">
                  Monthly
                </th>
                <th className="px-3 py-3 text-center text-teal-400 font-medium border-r border-slate-700 min-w-[80px]">
                  Cumulative
                </th>
                <th className="px-3 py-3 text-center text-slate-400 font-medium border-r border-slate-700 min-w-[200px]">
                  Remarks
                </th>
                <th className="px-3 py-3 text-center text-slate-300 font-medium min-w-[60px]">
                  Save
                </th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, idx) => {
                const score = scores.get(dept.id) || getScore(dept.id);
                const isSaving = saving === dept.id;
                return (
                  <tr key={dept.id} className="border-t border-slate-700/50 hover:bg-slate-700/20">
                    <td className="px-3 py-2 text-slate-400 border-r border-slate-700/50 bg-slate-800/30 sticky left-0">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 text-white border-r border-slate-700/50 sticky left-[40px] bg-slate-800/30 z-10">
                      {dept.name}
                    </td>
                    <td className="px-2 py-2 border-r border-slate-700/50">
                      <input
                        type="number"
                        value={score.week1_score}
                        onChange={(e) => updateScore(dept.id, { week1_score: parseFloat(e.target.value) || 0 })}
                        className={numInputClass}
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-slate-700/50">
                      <input
                        type="number"
                        value={score.week2_score}
                        onChange={(e) => updateScore(dept.id, { week2_score: parseFloat(e.target.value) || 0 })}
                        className={numInputClass}
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-slate-700/50">
                      <input
                        type="number"
                        value={score.week3_score}
                        onChange={(e) => updateScore(dept.id, { week3_score: parseFloat(e.target.value) || 0 })}
                        className={numInputClass}
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-slate-700/50">
                      <input
                        type="number"
                        value={score.week4_score}
                        onChange={(e) => updateScore(dept.id, { week4_score: parseFloat(e.target.value) || 0 })}
                        className={numInputClass}
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-slate-700/50">
                      <input
                        type="number"
                        value={score.week5_score}
                        onChange={(e) => updateScore(dept.id, { week5_score: parseFloat(e.target.value) || 0 })}
                        className={numInputClass}
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-2 py-2 border-r border-slate-700/50">
                      <div className={calcClass + ' text-emerald-400 text-center'}>{score.monthly_score.toFixed(0)}</div>
                    </td>
                    <td className="px-2 py-2 border-r border-slate-700/50">
                      <div className={calcClass + ' text-teal-400 text-center'}>{score.cumulative_annual_score.toFixed(0)}</div>
                    </td>
                    <td className="px-2 py-2 border-r border-slate-700/50">
                      <input
                        type="text"
                        value={score.remarks}
                        onChange={(e) => updateScore(dept.id, { remarks: e.target.value })}
                        className="w-full px-2 py-1.5 bg-slate-700/50 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Add remarks..."
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => saveScore(dept.id)}
                        disabled={isSaving}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded transition-colors disabled:opacity-50"
                      >
                        {isSaving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
        <h3 className="text-lg font-bold text-white mb-3">Scoring Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <p className="text-slate-400 text-sm">Total Monthly Compliance Score</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {Array.from(scores.values()).reduce((sum, s) => sum + (s.monthly_score || 0), 0).toFixed(0)}
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <p className="text-slate-400 text-sm">Total Cumulative Score</p>
            <p className="text-2xl font-bold text-teal-400 mt-1">
              {Array.from(scores.values()).reduce((sum, s) => sum + (s.cumulative_annual_score || 0), 0).toFixed(0)}
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-xl">
            <p className="text-slate-400 text-sm">Departments Scored</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {departments.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
