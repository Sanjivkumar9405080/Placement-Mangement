import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/cards/StatCard';
import Loader from '../../components/common/Loader';
import { getDashboardStats, getAllCompanies, getAllDrives } from '../../api/adminApi';

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');

      const [statsRes, compRes, drivesRes] = await Promise.all([
        getDashboardStats(),
        getAllCompanies().catch(() => ({ companies: [] })),
        getAllDrives().catch(() => ({ drives: [] })),
      ]);

      setStats(statsRes?.stats || null);
      setCompanies(compRes?.companies || []);
      setDrives(drivesRes?.drives || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to generate placement reports');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <DashboardLayout title="Placement Reports & Analytics">
        <Loader />
      </DashboardLayout>
    );
  }

  const {
    totalStudents = 0,
    totalCompanies = 0,
    totalDrives = 0,
    totalApplications = 0,
    selectedStudents = 0,
    rejectedApplications = 0,
    activeDrives = 0,
  } = stats || {};

  // Company breakdown
  const approvedCompanies = companies.filter((c) => c.isApproved).length;
  const pendingCompanies = companies.filter((c) => !c.isApproved).length;

  // Drive breakdown
  const upcomingDrives = drives.filter((d) => d.status === 'upcoming').length;
  const completedDrives = drives.filter((d) => d.status === 'completed').length;

  // Calculated metrics
  const placementRate = totalStudents > 0 ? ((selectedStudents / totalStudents) * 100).toFixed(1) : 0;
  const selectionRate = totalApplications > 0 ? ((selectedStudents / totalApplications) * 100).toFixed(1) : 0;
  const inProgressApplications = totalApplications - (selectedStudents + rejectedApplications);

  return (
    <DashboardLayout
      title="Institutional Placement Reports & Summary"
      subtitle="Auditable placement season metrics, corporate participation breakdowns, and candidate outcome summaries."
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Report Generated On: <strong>{new Date().toLocaleString()}</strong>
          </span>
        </div>
        <button onClick={handlePrint} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🖨️ Print / Save Report
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* 1. Placement Overview KPI Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          1. Placement Overview Metrics
        </h3>
        <div className="stat-cards-grid">
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon="🎓"
            color="var(--primary-color)"
            subtitle="Registered pool"
          />
          <StatCard
            title="Total Companies"
            value={totalCompanies}
            icon="🏢"
            color="#8b5cf6"
            subtitle="Registered corporate partners"
          />
          <StatCard
            title="Total Placement Drives"
            value={totalDrives}
            icon="📁"
            color="#0284c7"
            subtitle="Recruitment events scheduled"
          />
          <StatCard
            title="Total Applications"
            value={totalApplications}
            icon="📄"
            color="#d97706"
            subtitle="Candidate submissions"
          />
          <StatCard
            title="Selected Students"
            value={selectedStudents}
            icon="🏆"
            color="var(--success-color)"
            subtitle="Confirmed campus job offers"
          />
          <StatCard
            title="Rejected Applications"
            value={rejectedApplications}
            icon="❌"
            color="var(--danger-color)"
            subtitle="Non-selected applications"
          />
          <StatCard
            title="Active Drives"
            value={activeDrives}
            icon="⚡"
            color="#10b981"
            subtitle="Currently accepting candidates"
          />
        </div>
      </div>

      {/* 2. Structured Breakdown Section */}
      <div className="form-row" style={{ marginBottom: '2rem' }}>
        {/* Company Participation Breakdown */}
        <div className="card" style={{ flex: 1 }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            🏢 Corporate Recruiter Verification
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-md)' }}>
              <span>Approved Corporate Partners:</span>
              <strong style={{ color: '#15803d' }}>{approvedCompanies} ({totalCompanies > 0 ? ((approvedCompanies / totalCompanies) * 100).toFixed(0) : 0}%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: '#fffbeb', borderRadius: 'var(--radius-md)' }}>
              <span>Pending Admin Approval:</span>
              <strong style={{ color: '#b45309' }}>{pendingCompanies} ({totalCompanies > 0 ? ((pendingCompanies / totalCompanies) * 100).toFixed(0) : 0}%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
              <span>Total Recruiter Accounts:</span>
              <strong>{totalCompanies}</strong>
            </div>
          </div>
        </div>

        {/* Drives Status Distribution */}
        <div className="card" style={{ flex: 1 }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            📁 Placement Drive Lifecycle
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-md)' }}>
              <span>Active Placement Drives:</span>
              <strong style={{ color: 'var(--primary-color)' }}>{activeDrives}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: '#faf5ff', borderRadius: 'var(--radius-md)' }}>
              <span>Upcoming Scheduled Drives:</span>
              <strong style={{ color: '#6d28d9' }}>{upcomingDrives}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
              <span>Completed / Closed Drives:</span>
              <strong style={{ color: 'var(--text-muted)' }}>{completedDrives}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Student Placement Outcomes Overview */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          🎯 Candidate Outcomes & Selection Analytics
        </h4>
        <div className="drive-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          <div className="drive-metric-item">
            <span className="drive-metric-label">Institutional Placement Rate</span>
            <span className="drive-metric-val highlight">{placementRate}%</span>
          </div>
          <div className="drive-metric-item">
            <span className="drive-metric-label">Application Conversion Rate</span>
            <span className="drive-metric-val highlight">{selectionRate}%</span>
          </div>
          <div className="drive-metric-item">
            <span className="drive-metric-label">In-Progress Candidate Submissions</span>
            <span className="drive-metric-val">{Math.max(0, inProgressApplications)}</span>
          </div>
          <div className="drive-metric-item">
            <span className="drive-metric-label">Confirmed Placed Students</span>
            <span className="drive-metric-val" style={{ color: 'var(--success-color)' }}>
              {selectedStudents}
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
