import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/cards/StatCard';
import DriveCard from '../../components/cards/DriveCard';
import Loader from '../../components/common/Loader';
import { getStudentProfile } from '../../api/studentApi';
import { getAllDrives } from '../../api/driveApi';
import { getMyApplications, applyToDrive } from '../../api/applicationApi';

const StudentDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const [profileRes, drivesRes, appsRes] = await Promise.all([
        getStudentProfile().catch((err) => {
          console.warn('Profile fetch warning:', err);
          return { profile: null };
        }),
        getAllDrives({ status: 'active' }).catch((err) => {
          console.warn('Drives fetch warning:', err);
          return { drives: [] };
        }),
        getMyApplications().catch((err) => {
          console.warn('Applications fetch warning:', err);
          return { applications: [] };
        }),
      ]);

      setProfile(profileRes.profile || null);
      setDrives(drivesRes.drives || []);
      setApplications(appsRes.applications || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Profile completion calculation (10 evaluated fields)
  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.user?.name) score += 10;
    if (profile.user?.email) score += 10;
    if (profile.phone) score += 10;
    if (profile.rollNumber) score += 10;
    if (profile.branch) score += 10;
    if (profile.cgpa !== undefined && profile.cgpa !== null) score += 10;
    if (profile.tenthPercentage !== undefined && profile.tenthPercentage !== null) score += 10;
    if (profile.twelfthPercentage !== undefined && profile.twelfthPercentage !== null) score += 10;
    if (profile.skills && profile.skills.length > 0) score += 10;
    if (profile.resumeUrl) score += 10;
    return score;
  };

  const handleApply = async (driveId) => {
    try {
      setApplyingId(driveId);
      setActionSuccess('');
      setError('');
      await applyToDrive(driveId);
      setActionSuccess('Application submitted successfully! Track status in My Applications.');
      // Refresh applications list
      const appsRes = await getMyApplications();
      setApplications(appsRes.applications || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to apply to drive');
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard">
        <Loader />
      </DashboardLayout>
    );
  }

  const completionRate = calculateProfileCompletion();
  const appliedDriveIds = applications.map((app) =>
    typeof app.drive === 'object' ? app.drive?._id : app.drive
  );

  const shortlistedCount = applications.filter((app) =>
    ['Shortlisted', 'Interview'].includes(app.status)
  ).length;

  const selectedCount = applications.filter((app) => app.status === 'Selected').length;

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.name || 'Student'}! 👋`}
      subtitle="Track your campus placements, upcoming drives, and application progress."
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {actionSuccess && <div className="alert alert-success">{actionSuccess}</div>}

      {/* Profile Completion Bar */}
      <div className="card profile-progress-banner" style={{ marginBottom: '1.5rem' }}>
        <div className="profile-progress-header">
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
              Profile Completion Status
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
              {completionRate === 100
                ? 'Your profile is 100% complete! You are ready for all campus drives.'
                : 'Complete your profile to ensure eligibility for campus placement drives.'}
            </p>
          </div>
          <div className="profile-progress-badge">
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-color)' }}>
              {completionRate}%
            </span>
          </div>
        </div>

        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{
              width: `${completionRate}%`,
              backgroundColor: completionRate >= 80 ? 'var(--success-color)' : 'var(--primary-color)',
            }}
          />
        </div>

        {completionRate < 100 && (
          <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
            <Link to="/student/profile" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.35rem 0.8rem' }}>
              Update Profile Details →
            </Link>
          </div>
        )}
      </div>

      {/* KPI Stat Cards */}
      <div className="stat-cards-grid" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Active Drives"
          value={drives.length}
          icon="🏢"
          color="var(--primary-color)"
          subtitle="Currently open for application"
        />
        <StatCard
          title="Total Applied"
          value={applications.length}
          icon="📝"
          color="#8b5cf6"
          subtitle="Applications submitted"
        />
        <StatCard
          title="Shortlisted / Interview"
          value={shortlistedCount}
          icon="🎯"
          color="var(--warning-color)"
          subtitle="Progressing to next rounds"
        />
        <StatCard
          title="Offers / Selected"
          value={selectedCount}
          icon="🏆"
          color="var(--success-color)"
          subtitle="Confirmed job offers"
        />
      </div>

      {/* Quick Action Cards */}
      <div className="quick-actions-bar" style={{ marginBottom: '2rem' }}>
        <Link to="/student/drives" className="card quick-action-card">
          <span className="quick-action-icon">🔍</span>
          <div>
            <strong>Browse All Drives</strong>
            <p>Explore opportunities filtered by branch, CTC, and eligibility</p>
          </div>
        </Link>
        <Link to="/student/applications" className="card quick-action-card">
          <span className="quick-action-icon">📋</span>
          <div>
            <strong>My Applications</strong>
            <p>View hiring stages, application status and history</p>
          </div>
        </Link>
        <Link to="/student/profile" className="card quick-action-card">
          <span className="quick-action-icon">⚙️</span>
          <div>
            <strong>Academic Profile</strong>
            <p>Manage CGPA, marks, contact info, and technical skills</p>
          </div>
        </Link>
      </div>

      {/* Active Campus Drives Highlights */}
      <div className="dashboard-section-header">
        <div>
          <h3>Active Placement Drives</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Latest open campus recruitment opportunities
          </p>
        </div>
        <Link to="/student/drives" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
          View All Drives ({drives.length}) →
        </Link>
      </div>

      {drives.length === 0 ? (
        <div className="card empty-state-box">
          <span style={{ fontSize: '2.5rem' }}>📭</span>
          <h4>No Active Placement Drives</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            There are currently no active drives open. Check back later or review upcoming drives in Browse Drives.
          </p>
        </div>
      ) : (
        <div className="drives-grid">
          {drives.slice(0, 4).map((drive) => (
            <DriveCard
              key={drive._id}
              drive={drive}
              studentProfile={profile}
              onApply={handleApply}
              isApplying={applyingId === drive._id}
              isApplied={appliedDriveIds.includes(drive._id)}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
