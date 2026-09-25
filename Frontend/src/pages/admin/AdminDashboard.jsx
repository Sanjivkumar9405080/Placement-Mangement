import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/cards/StatCard';
import Loader from '../../components/common/Loader';
import {
  getDashboardStats,
  getAllCompanies,
  getAllDrives,
  approveCompany,
} from '../../api/adminApi';

const AdminDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [pendingDrives, setPendingDrives] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statsRes, compRes, drivesRes] = await Promise.all([
        getDashboardStats(),
        getAllCompanies({ status: 'pending' }).catch(() => ({ companies: [] })),
        getAllDrives({ approvalStatus: 'pending' }).catch(() => ({ drives: [] })),
      ]);

      setStats(statsRes?.stats || null);
      setPendingCompanies(compRes?.companies || []);
      setPendingDrives(drivesRes?.drives || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch admin control center data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApproveCompany = async (compId, compName) => {
    if (!window.confirm(`Are you sure you want to approve "${compName}" for campus placement?`)) {
      return;
    }
    try {
      setActionLoading(true);
      setError('');
      await approveCompany(compId, true);
      setSuccess(`Company "${compName}" approved successfully.`);
      fetchDashboardData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to approve company');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Placement Administration">
        <Loader />
      </DashboardLayout>
    );
  }

  const {
    totalStudents = 0,
    totalCompanies = 0,
    approvedCompanies = 0,
    pendingCompanies: pendingCompCount = 0,
    totalDrives = 0,
    pendingDriveApprovals = 0,
    approvedDrives = 0,
    rejectedDrives = 0,
    totalApplications = 0,
    selectedStudents = 0,
    rejectedApplications = 0,
    removedApplications = 0,
  } = stats || {};

  return (
    <DashboardLayout
      title="Placement Administration"
      subtitle="Manage companies, students, placement drives and recruitment activities."
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* QUICK ACTIONS BAR */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          padding: '1.25rem 1.5rem',
          backgroundColor: '#fff',
          borderLeft: '4px solid var(--primary-color)',
        }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
          ⚡ Fast Control Shortcuts
        </span>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/admin/companies" className="btn btn-outline" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            🏢 Manage Companies
          </Link>
          <Link to="/admin/drives?approval=pending" className="btn btn-primary" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            📁 Review Placement Drives ({pendingDriveApprovals})
          </Link>
          <Link to="/admin/students?focusSearch=true" className="btn btn-outline" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            🔍 Search Student
          </Link>
          <Link to="/admin/students" className="btn btn-outline" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            🎓 Manage Students
          </Link>
          <Link to="/admin/applications" className="btn btn-outline" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            📄 Applications Registry
          </Link>
          <Link to="/admin/reports" className="btn btn-outline" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            📈 Placement Reports
          </Link>
        </div>
      </div>

      {/* SECTION 2: COMPLETE KPI METRICS SUITE */}
      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
        📊 Institutional Placement Key Metrics
      </h3>

      <div className="stat-cards-grid" style={{ marginBottom: '2rem' }}>
        {/* Student KPIs */}
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon="🎓"
          color="var(--primary-color)"
          subtitle="Registered candidate profiles"
        />
        <StatCard
          title="Selected Students"
          value={selectedStudents}
          icon="🏆"
          color="#059669"
          subtitle="Confirmed placement offers"
        />

        {/* Company KPIs */}
        <StatCard
          title="Total Companies"
          value={totalCompanies}
          icon="🏢"
          color="#8b5cf6"
          subtitle="Corporate partners"
        />
        <StatCard
          title="Approved Companies"
          value={approvedCompanies}
          icon="✅"
          color="var(--success-color)"
          subtitle="Authorized to post drives"
        />
        <StatCard
          title="Pending Companies"
          value={pendingCompCount}
          icon="⏳"
          color="#d97706"
          subtitle="Awaiting partner approval"
        />

        {/* Drive KPIs */}
        <StatCard
          title="Total Placement Drives"
          value={totalDrives}
          icon="📁"
          color="#0284c7"
          subtitle="All campus drives recorded"
        />
        <StatCard
          title="Pending Drive Approvals"
          value={pendingDriveApprovals}
          icon="🟡"
          color="#f59e0b"
          subtitle="Awaiting TPO review"
        />
        <StatCard
          title="Approved Drives"
          value={approvedDrives}
          icon="🟢"
          color="var(--success-color)"
          subtitle="Active / Visible to students"
        />
        <StatCard
          title="Rejected Drives"
          value={rejectedDrives}
          icon="🔴"
          color="var(--danger-color)"
          subtitle="Returned with revision remarks"
        />

        {/* Application KPIs */}
        <StatCard
          title="Total Applications"
          value={totalApplications}
          icon="📄"
          color="#3b82f6"
          subtitle="All candidate submissions"
        />
        <StatCard
          title="Rejected Applications"
          value={rejectedApplications}
          icon="❌"
          color="#ef4444"
          subtitle="Candidate rejected status"
        />
        <StatCard
          title="Removed by TPO"
          value={removedApplications}
          icon="🚫"
          color="#6b7280"
          subtitle="Administrative drive removals"
        />
      </div>

      {/* ACTIONABLE QUEUES: PENDING DRIVES & PENDING COMPANIES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Drives Awaiting Review */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-color)' }}>
              🟡 Drives Awaiting Approval ({pendingDrives.length})
            </h4>
            <Link to="/admin/drives?approval=pending" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-color)' }}>
              View All →
            </Link>
          </div>

          {pendingDrives.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              ✅ All placement drives have been reviewed.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingDrives.slice(0, 4).map((d) => (
                <div
                  key={d._id}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.92rem' }}>{d.jobTitle}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      🏢 {d.company?.companyName} • ₹{d.packageLPA} LPA
                    </div>
                  </div>
                  <Link to="/admin/drives?approval=pending" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}>
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Companies Awaiting Approval */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-color)' }}>
              ⏳ Companies Awaiting Approval ({pendingCompanies.length})
            </h4>
            <Link to="/admin/companies?filter=pending" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary-color)' }}>
              View All →
            </Link>
          </div>

          {pendingCompanies.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              ✅ No pending company registrations.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingCompanies.slice(0, 4).map((comp) => (
                <div
                  key={comp._id}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.92rem' }}>{comp.companyName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Industry: {comp.industry || 'Not specified'} • HR: {comp.hrName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickApproveCompany(comp._id, comp.companyName)}
                    className="btn btn-primary"
                    disabled={actionLoading}
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem', backgroundColor: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* INSTITUTIONAL PLACEMENT SUMMARY RATIOS */}
      <div className="card" style={{ margin: 0 }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          📈 Placement Season Conversion Ratios
        </h4>
        <div className="drive-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="drive-metric-item">
            <span className="drive-metric-label">Offer Conversion Rate</span>
            <span className="drive-metric-val highlight">
              {totalApplications > 0
                ? `${((selectedStudents / totalApplications) * 100).toFixed(1)}%`
                : '0.0%'}
            </span>
          </div>
          <div className="drive-metric-item">
            <span className="drive-metric-label">Average Applications per Drive</span>
            <span className="drive-metric-val">
              {totalDrives > 0 ? (totalApplications / totalDrives).toFixed(1) : '0'}
            </span>
          </div>
          <div className="drive-metric-item">
            <span className="drive-metric-label">Campus Placement Ratio</span>
            <span className="drive-metric-val highlight">
              {totalStudents > 0
                ? `${((selectedStudents / totalStudents) * 100).toFixed(1)}%`
                : '0.0%'}
            </span>
          </div>
          <div className="drive-metric-item">
            <span className="drive-metric-label">Company Approval Ratio</span>
            <span className="drive-metric-val">
              {totalCompanies > 0
                ? `${((approvedCompanies / totalCompanies) * 100).toFixed(1)}%`
                : '0.0%'}
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
