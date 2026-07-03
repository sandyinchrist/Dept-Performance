import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Department, MonitoringHead, FocusArea, AdminUser } from '../types';
import { Save, RefreshCw, Eye, EyeOff, Users, Monitor, Key, Plus, Trash2, Building2 } from 'lucide-react';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'departments' | 'monitors' | 'passwords' | 'focusareas'>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [monitors, setMonitors] = useState<MonitoringHead[]>([]);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedDepartmentForFA, setSelectedDepartmentForFA] = useState<string>('');
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [newFocusAreaName, setNewFocusAreaName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [deptRes, monRes, adminRes] = await Promise.all([
        supabase.from('departments').select('*').order('sort_order'),
        supabase.from('monitoring_heads').select('*').order('sort_order'),
        supabase.from('admin_users').select('*').maybeSingle(),
      ]);
      if (deptRes.data) setDepartments(deptRes.data);
      if (monRes.data) setMonitors(monRes.data);
      if (adminRes.data) setAdminUser(adminRes.data);
      if (deptRes.data?.[0]) {
        setSelectedDepartmentForFA(deptRes.data[0].id);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDepartmentForFA) {
      const fetchFocusAreas = async () => {
        const { data } = await supabase
          .from('focus_areas')
          .select('*')
          .eq('department_id', selectedDepartmentForFA)
          .eq('is_active', true)
          .order('sort_order');
        if (data) setFocusAreas(data);
      };
      fetchFocusAreas();
    }
  }, [selectedDepartmentForFA]);

  const updateDepartment = async (id: string, field: keyof Department, value: string | number) => {
    setSaving(id);
    await supabase.from('departments').update({ [field]: value }).eq('id', id);
    setDepartments(departments.map(d => d.id === id ? { ...d, [field]: value } : d));
    setSaving(null);
  };

  const updateMonitor = async (id: string, field: keyof MonitoringHead, value: string | number) => {
    setSaving(id);
    await supabase.from('monitoring_heads').update({ [field]: value }).eq('id', id);
    setMonitors(monitors.map(m => m.id === id ? { ...m, [field]: value } : m));
    setSaving(null);
  };

  const updateFocusArea = async (id: string, field: keyof FocusArea, value: string | number | boolean) => {
    setSaving(id);
    await supabase.from('focus_areas').update({ [field]: value }).eq('id', id);
    setFocusAreas(focusAreas.map(f => f.id === id ? { ...f, [field]: value } : f));
    setSaving(null);
  };

  const addFocusArea = async () => {
    if (!newFocusAreaName.trim() || !selectedDepartmentForFA) return;
    const maxOrder = Math.max(...focusAreas.map(f => f.sort_order), 0);
    const { data } = await supabase
      .from('focus_areas')
      .insert({
        department_id: selectedDepartmentForFA,
        name: newFocusAreaName.trim(),
        sort_order: maxOrder + 1,
      })
      .select();
    if (data?.[0]) setFocusAreas([...focusAreas, data[0]]);
    setNewFocusAreaName('');
  };

  const deleteFocusArea = async (id: string) => {
    if (!confirm('Delete this focus area?')) return;
    await supabase.from('focus_areas').update({ is_active: false }).eq('id', id);
    setFocusAreas(focusAreas.filter(f => f.id !== id));
  };

  const updateAdminPassword = async (newPassword: string) => {
    if (!adminUser) return;
    setSaving('admin');
    await supabase.from('admin_users').update({ password: newPassword }).eq('id', adminUser.id);
    setAdminUser({ ...adminUser, password: newPassword });
    setSaving(null);
  };

  const tabs = [
    { id: 'departments', label: 'Department Names', icon: Building2 },
    { id: 'monitors', label: 'Monitor Names', icon: Monitor },
    { id: 'passwords', label: 'Passwords', icon: Key },
    { id: 'focusareas', label: 'Focus Areas', icon: Users },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
        <p className="text-slate-400">Manage departments, monitors, passwords, and focus areas</p>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'departments' && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-4 py-3 text-left text-slate-300 font-medium">S/N</th>
                <th className="px-4 py-3 text-left text-slate-300 font-medium">Department Name</th>
                <th className="px-4 py-3 text-left text-slate-300 font-medium">Code</th>
                <th className="px-4 py-3 text-left text-slate-300 font-medium">Sort Order</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, idx) => (
                <tr key={dept.id} className="border-t border-slate-700/50">
                  <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={dept.name}
                      onChange={(e) => updateDepartment(dept.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={dept.code}
                      onChange={(e) => updateDepartment(dept.id, 'code', e.target.value)}
                      className="w-24 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={dept.sort_order}
                      onChange={(e) => updateDepartment(dept.id, 'sort_order', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'monitors' && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-4 py-3 text-left text-slate-300 font-medium">S/N</th>
                <th className="px-4 py-3 text-left text-slate-300 font-medium">Monitoring Head Name</th>
                <th className="px-4 py-3 text-left text-slate-300 font-medium">Sort Order</th>
              </tr>
            </thead>
            <tbody>
              {monitors.map((mon, idx) => (
                <tr key={mon.id} className="border-t border-slate-700/50">
                  <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={mon.name}
                      onChange={(e) => updateMonitor(mon.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={mon.sort_order}
                      onChange={(e) => updateMonitor(mon.id, 'sort_order', parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'passwords' && (
        <div className="space-y-6">
          {/* Admin Password */}
          {adminUser && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Administrator Password
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-slate-400 w-24">Username:</span>
                <input
                  type="text"
                  value={adminUser.username}
                  disabled
                  className="flex-1 px-3 py-2 bg-slate-700/30 border border-slate-600 rounded text-slate-400"
                />
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-slate-400 w-24">Password:</span>
                <input
                  type={showPasswords['admin'] ? 'text' : 'password'}
                  value={adminUser.password}
                  onChange={(e) => setAdminUser({ ...adminUser, password: e.target.value })}
                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white"
                />
                <button
                  onClick={() => setShowPasswords({ ...showPasswords, admin: !showPasswords['admin'] })}
                  className="p-2 text-slate-400 hover:text-white"
                >
                  {showPasswords['admin'] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => updateAdminPassword(adminUser.password)}
                  disabled={saving === 'admin'}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded"
                >
                  {saving === 'admin' ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* Department Passwords */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Department Passwords
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center gap-4 p-3 bg-slate-700/30 rounded">
                  <span className="text-white text-sm truncate flex-1">{dept.name}</span>
                  <input
                    type={showPasswords[dept.id] ? 'text' : 'password'}
                    value={dept.password}
                    onChange={(e) => setDepartments(departments.map(d => d.id === dept.id ? { ...d, password: e.target.value } : d))}
                    className="w-32 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                  />
                  <button
                    onClick={() => setShowPasswords({ ...showPasswords, [dept.id]: !showPasswords[dept.id] })}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {showPasswords[dept.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={async () => {
                      setSaving(dept.id);
                      await supabase.from('departments').update({ password: dept.password }).eq('id', dept.id);
                      setSaving(null);
                    }}
                    disabled={saving === dept.id}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded"
                  >
                    {saving === dept.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Monitor Passwords */}
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-blue-400" />
              Monitoring Head Passwords
            </h3>
            <div className="grid grid-cols-5 gap-4">
              {monitors.map((mon) => (
                <div key={mon.id} className="p-3 bg-slate-700/30 rounded">
                  <div className="text-white text-sm mb-2">{mon.name}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type={showPasswords[mon.id] ? 'text' : 'password'}
                      value={mon.password}
                      onChange={(e) => setMonitors(monitors.map(m => m.id === mon.id ? { ...m, password: e.target.value } : m))}
                      className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    />
                    <button
                      onClick={() => setShowPasswords({ ...showPasswords, [mon.id]: !showPasswords[mon.id] })}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      {showPasswords[mon.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={async () => {
                        setSaving(mon.id);
                        await supabase.from('monitoring_heads').update({ password: mon.password }).eq('id', mon.id);
                        setSaving(null);
                      }}
                      disabled={saving === mon.id}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded"
                    >
                      {saving === mon.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'focusareas' && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Manage Focus Areas</h3>
            <select
              value={selectedDepartmentForFA}
              onChange={(e) => setSelectedDepartmentForFA(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={newFocusAreaName}
              onChange={(e) => setNewFocusAreaName(e.target.value)}
              placeholder="Enter new focus area name..."
              className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded text-white"
            />
            <button
              onClick={addFocusArea}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-3 py-2 text-left text-slate-300 font-medium">S/N</th>
                <th className="px-3 py-2 text-left text-slate-300 font-medium">Focus Area Name</th>
                <th className="px-3 py-2 text-left text-slate-300 font-medium">Annual Target</th>
                <th className="px-3 py-2 text-left text-slate-300 font-medium">Sort Order</th>
                <th className="px-3 py-2 text-left text-slate-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {focusAreas.map((fa, idx) => (
                <tr key={fa.id} className="border-t border-slate-700/50">
                  <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={fa.name}
                      onChange={(e) => setFocusAreas(focusAreas.map(f => f.id === fa.id ? { ...f, name: e.target.value } : f))}
                      onBlur={() => updateFocusArea(fa.id, 'name', fa.name)}
                      className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={fa.annual_target}
                      onChange={(e) => setFocusAreas(focusAreas.map(f => f.id === fa.id ? { ...f, annual_target: parseFloat(e.target.value) || 0 } : f))}
                      onBlur={() => updateFocusArea(fa.id, 'annual_target', fa.annual_target)}
                      className="w-24 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={fa.sort_order}
                      onChange={(e) => setFocusAreas(focusAreas.map(f => f.id === fa.id ? { ...f, sort_order: parseInt(e.target.value) || 0 } : f))}
                      onBlur={() => updateFocusArea(fa.id, 'sort_order', fa.sort_order)}
                      className="w-16 px-2 py-1 bg-slate-700/50 border border-slate-600 rounded text-white text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => deleteFocusArea(fa.id)}
                      className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
