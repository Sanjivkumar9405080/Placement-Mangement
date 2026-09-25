import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatCard from '../../components/cards/StatCard';
import Loader from '../../components/common/Loader';
import { getCompanyProfile, getCompanyApplications } from '../../api/companyApi';
import { getAllDrives } from '../../api/driveApi';

const CompanyDashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError('');

      const [profileRes, appsRes, drivesRes] = await Promise.all([
        getCompanyProfile().catch(() => ({ profile: null })),
        getCompanyApplications().catch(() => ({ applications: [] })),
        getAllDrives().catch(() => ({ drives: [] })),
      ]);

      const companyProf = profileRes?.profile || null;
      setProfile(companyProf);

      const allApps = appsRes?.applications || [];
      setApplications(allApps);

      // Filter drives belonging only to this company
      const allDrives = drivesRes?.drives || [];
      const companyId = companyProf?._id;
      const myDrives = companyId
        ? allDrives.filter((d) => {
            const dCompId = typeof d.company === 'object' ? d.company?._id : d.company;
            return dCompId === companyId;
          })
        : [];

      setDrives(myDrives);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load company dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Company / Recruiter Dashboard">
        <Loader />
      </DashboardLayout>
    );
  }

  const isApproved = profile?.isApproved === true;
  const companyName = profile?.companyName || user?.name || 'Company Partner';

  // Derived drive statistics
  const totalDrives = drives.length;
  const pendingApprovals = drives.filter((d) => (d.approvalStatus || 'pending') === 'pending').length;
  const approvedDrives = drives.filter((d) => d.approvalStatus === 'approved').length;
  const rejectedDrives = drives.filter((d) => d.approvalStatus === 'rejected').length;

  // Candidate pipeline statistics
  const totalApplicants = applications.length;
  const shortlistedCount = applications.filter((app) => app.status === 'Shortlisted').length;
  const interviewCount = applications.filter((app) => app.status === 'Interview').length;
  const selectedCount = applications.filter((app) => app.status === 'Selected').length;

  // Recent applicants (latest 5)
  const recentApplicants = [...applications].slice(0, 5);

  return (
    <DashboardLayout
      title="Company / Recruiter Dashboard"
      subtitle={`Welcome back, ${user?.name || 'Recruiter'}! Manage your campus recruitment, hiring criteria, and candidate pipeline.`}
    >
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Recruiter Header & Verification Badge */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--bg-light) 100%)',
          borderLeft: `4px solid ${isApproved ? 'var(--success-color)' : 'var(--warning-color)'}`,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.35rem' }}>{companyName}</h2>
            {isApproved ? (
              <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}>
                🟢 Verified Partner
              </span>
            ) : (
              <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}>
                🟡 Pending Admin Verification
              </span>
            )}
          </div>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {isApproved
              ? 'Authorized to publish campus placement drives, configure job role criteria, and evaluate students.'
              : 'Your corporate account is awaiting administrative approval from the Training & Placement Cell.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {isApproved ? (
            <Link to="/company/drives/new" className="btn btn-primary" style={{ fontSize: '0.88rem' }}>
              ➕ Create Placement Drive
            </Link>
          ) : (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Drive creation unlocks upon approval
            </span>
          )}
        </div>
      </div>

      {/* OVERVIEW SECTION: Drive Lifecycle & Approvals */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Placement Drives Overview</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Tracking drive creation, administrative approvals, and student visibility
        </p>
      </div>

      <div className="stat-cards-grid" style={{ marginBottom: '1.75rem' }}>
        <StatCard
          title="Total Drives"
          value={totalDrives}
          icon="📁"
          color="var(--primary-color)"
          subtitle="All campus drives recorded"
        />
        <StatCard
          title="Pending Approval"
          value={pendingApprovals}
          icon="🟡"
          color="#d97706"
          subtitle="Under TPO administrative review"
        />
        <StatCard
          title="Approved Drives"
          value={approvedDrives}
          icon="🟢"
          color="var(--success-color)"
          subtitle="Active & published to students"
        />
        <StatCard
          title="Rejected Drives"
          value={rejectedDrives}
          icon="🔴"
          color="var(--danger-color)"
          subtitle="Requires criteria clarification"
        />
      </div>

      {/* CANDIDATE PIPELINE SECTION */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Recruitment Pipeline Overview</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Candidate progression across all placement drives
        </p>
      </div>

      <div className="stat-cards-grid" style={{ marginBottom: '2rem' }}>
        <StatCard
          title="Total Applicants"
          value={totalApplicants}
          icon="👥"
          color="#3b82f6"
          subtitle="Candidate applications received"
        />
        <StatCard
          title="Shortlisted"
          value={shortlistedCount}
          icon="⭐"
          color="#8b5cf6"
          subtitle="Advanced past initial screening"
        />
        <StatCard
          title="In Interview"
          value={interviewCount}
          icon="🎙️"
          color="#f59e0b"
          subtitle="Under technical / HR assessment"
        />
        <StatCard
          title="Selected Offers"
          value={selectedCount}
          icon="🏆"
          color="#059669"
          subtitle="Hired student candidates"
        />
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="quick-actions-bar" style={{ marginBottom: '2.25rem' }}>
        <Link to="/company/drives/new" className="card quick-action-card">
          <span className="quick-action-icon">➕</span>
          <div>
            <strong>Create Placement Drive</strong>
            <p>{isApproved ? 'Define job roles, responsibilities & eligibility' : 'Requires admin approval'}</p>
          </div>
        </Link>
        <Link to="/company/drives" className="card quick-action-card">
          <span className="quick-action-icon">📁</span>
          <div>
            <strong>Manage Drives ({totalDrives})</strong>
            <p>Update criteria, track approvals, and deadlines</p>
          </div>
        </Link>
        <Link to="/company/applicants" className="card quick-action-card">
          <span className="quick-action-icon">👥</span>
          <div>
            <strong>View Applicants ({totalApplicants})</strong>
            <p>Evaluate resumes, shortlist & update stages</p>
          </div>
        </Link>
        <Link to="/company/profile" className="card quick-action-card">
          <span className="quick-action-icon">🏢</span>
          <div>
            <strong>Company Profile</strong>
            <p>HR contact info, corporate website & verification</p>
          </div>
        </Link>
      </div>

      {/* RECENT PLACEMENT DRIVES SECTION */}
      <div className="dashboard-section-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem' }}>Recent Placement Drives</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Latest recruitment drives published by {companyName}
          </p>
        </div>
        <Link to="/company/drives" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
          View All Drives ({totalDrives}) →
        </Link>
      </div>

      {drives.length === 0 ? (
        <div className="card empty-state-box" style={{ marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '2.5rem' }}>📭</span>
          <h4>No Placement Drives Posted Yet</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            Start campus recruitment by creating your first flexible placement drive.
          </p>
          {isApproved ? (
            <Link to="/company/drives/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Create Placement Drive
            </Link>
          ) : (
            <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Drive creation unlocks upon admin approval.
            </p>
          )}
        </div>
      ) : (
        <div className="drives-grid" style={{ marginBottom: '2.5rem' }}>
          {drives.slice(0, 3).map((drive) => {
            const driveApps = applications.filter((app) => {
              const dId = typeof app.drive === 'object' ? app.drive?._id : app.drive;
              return dId === drive._id;
            });

            return (
              <div key={drive._id} className="card drive-card">
                <div className="drive-card-header">
                  <div>
                    {drive.jobRole && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--primary-color)', fontWeight: 600, textTransform: 'uppercase' }}>
                        {drive.jobRole} {drive.department ? `• ${drive.department}` : ''}
                      </span>
                    )}
                    <h3 className="drive-card-title" style={{ margin: '0.15rem 0 0' }}>{drive.jobTitle}</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      {drive.approvalStatus === 'approved' && (
                        <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                          🟢 Approved
                        </span>
                      )}
                      {(!drive.approvalStatus || drive.approvalStatus === 'pending') && (
                        <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                          🟡 Pending Approval
                        </span>
                      )}
                      {drive.approvalStatus === 'rejected' && (
                        <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
                          🔴 Rejected
                        </span>
                      )}
                    </div>
                    <span className={`status-badge status-${drive.status}`}>
                      {drive.status}
                    </span>
                  </div>
                </div>

                <div className="drive-card-body">
                  <div className="drive-metric-grid">
                    <div className="drive-metric-item">
                      <span className="drive-metric-label">Package</span>
                      <span className="drive-metric-val highlight">₹{drive.packageLPA} LPA</span>
                    </div>
                    <div className="drive-metric-item">
                      <span className="drive-metric-label">Min CGPA</span>
                      <span className="drive-metric-val">{drive.minimumCGPA > 0 ? drive.minimumCGPA : 'None'}</span>
                    </div>
                    <div className="drive-metric-item">
                      <span className="drive-metric-label">Backlogs</span>
                      <span className="drive-metric-val">Max {drive.maxBacklogs}</span>
                    </div>
                    <div className="drive-metric-item">
                      <span className="drive-metric-label">Applicants</span>
                      <span className="drive-metric-val">{driveApps.length}</span>
                    </div>
                  </div>

                  {/* Branches & Work Mode snippet */}
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {drive.workMode && (
                      <span className="branch-tag" style={{ fontSize: '0.72rem', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                        📍 {drive.workMode} {drive.workLocation ? `(${drive.workLocation})` : ''}
                      </span>
                    )}
                    {drive.employmentType && (
                      <span className="branch-tag" style={{ fontSize: '0.72rem', backgroundColor: '#f3e8ff', color: '#6b21a8' }}>
                        💼 {drive.employmentType}
                      </span>
                    )}
                    {drive.allowedBranches && drive.allowedBranches.length > 0 && (
                      <span className="branch-tag" style={{ fontSize: '0.72rem' }}>
                        🎓 {drive.allowedBranches.slice(0, 3).join(', ')}{drive.allowedBranches.length > 3 ? '...' : ''}
                      </span>
                    )}
                  </div>

                  {/* Rejection Notice */}
                  {drive.approvalStatus === 'rejected' && drive.rejectionReason && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#fef2f2',
                        borderLeft: '3px solid #ef4444',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        color: '#991b1b',
                      }}
                    >
                      <strong>Admin Rejection Reason:</strong> {drive.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="drive-card-footer">
                  <Link
                    to={`/company/drives/${drive._id}/applicants`}
                    className="btn btn-primary"
                    style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}
                  >
                    Applicants ({driveApps.length})
                  </Link>
                  <Link
                    to={`/company/drives/${drive._id}/edit`}
                    className="btn btn-outline"
                    style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem' }}
                  >
                    {drive.approvalStatus === 'rejected' ? 'Edit & Resubmit' : 'Edit Drive'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RECENT APPLICANTS LIVE FEED SECTION */}
      <div className="dashboard-section-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem' }}>Recent Candidate Submissions</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Latest applicants across your campus recruitment drives
          </p>
        </div>
        <Link to="/company/applicants" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
          All Applicants ({totalApplicants}) →
        </Link>
      </div>

      {recentApplicants.length === 0 ? (
        <div className="card empty-state-box">
          <span style={{ fontSize: '2.5rem' }}>👥</span>
          <h4>No Applications Yet</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            Applications will appear here as soon as eligible students apply to your approved drives.
          </p>
        </div>
      ) : (
        <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student Candidate</th>
                <th>Applied Role</th>
                <th>Branch & Roll</th>
                <th>CGPA</th>
                <th>Recruitment Stage</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentApplicants.map((app) => {
                const student = app.student || {};
                const userObj = student.user || {};
                const driveObj = app.drive || {};

                return (
                  <tr key={app._id}>
                    <td>
                      <div><strong>{userObj.name || 'Candidate'}</strong></div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{userObj.email || ''}</div>
                    </td>
                    <td>
                      <strong>{driveObj.jobTitle || 'Role'}</strong>
                      {driveObj.packageLPA && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--primary-color)' }}>₹{driveObj.packageLPA} LPA</div>
                      )}
                    </td>
                    <td>
                      <div>{student.branch || 'N/A'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{student.rollNumber || ''}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{student.cgpa !== undefined ? student.cgpa : 'N/A'}</span>
                    </td>
                    <td>
                      <span className={`badge status-${(app.status || 'applied').toLowerCase()}`} style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}>
                        {app.status || 'Applied'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/company/drives/${typeof driveObj === 'object' ? driveObj._id : driveObj}/applicants`}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                      >
                        Review Candidate →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CompanyDashboard;
