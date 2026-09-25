import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getStudentById, removeStudentFromDrive } from '../../api/adminApi';

const REMOVAL_REASONS = [
  'Student no longer meets eligibility criteria',
  'Duplicate application',
  'TPO administrative decision',
  'Disciplinary action / Placement policy violation',
  'Other',
];

const StudentDetailsPage = () => {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [metrics, setMetrics] = useState({
    totalApplications: 0,
    shortlisted: 0,
    interview: 0,
    selected: 0,
    rejected: 0,
    removed: 0,
  });

  // Removal Modal State
  const [removingApp, setRemovingApp] = useState(null);
  const [selectedReason, setSelectedReason] = useState(REMOVAL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchStudentProfile();
  }, [id]);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getStudentById(id);
      setStudentData(data.student);
      setApplications(data.applications || []);
      setMetrics(
        data.metrics || {
          totalApplications: 0,
          shortlisted: 0,
          interview: 0,
          selected: 0,
          rejected: 0,
          removed: 0,
        }
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch student record');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRemoveModal = (app) => {
    setRemovingApp(app);
    setSelectedReason(REMOVAL_REASONS[0]);
    setCustomReason('');
    setModalError('');
  };

  const handleCloseRemoveModal = () => {
    setRemovingApp(null);
    setModalError('');
  };

  const handleConfirmRemoval = async (e) => {
    e.preventDefault();
    if (!removingApp) return;

    const finalReason =
      selectedReason === 'Other'
        ? customReason.trim() || 'TPO administrative decision'
        : customReason.trim()
        ? `${selectedReason}: ${customReason.trim()}`
        : selectedReason;

    try {
      setActionLoading(true);
      setModalError('');
      await removeStudentFromDrive(removingApp._id, { reason: finalReason });
      setSuccess(
        `Successfully removed student from "${removingApp.drive?.jobTitle || 'placement drive'}".`
      );
      handleCloseRemoveModal();
      fetchStudentProfile();
    } catch (err) {
      setModalError(err?.response?.data?.message || 'Failed to remove student from drive');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Dossier">
        <Loader />
      </DashboardLayout>
    );
  }

  if (error || !studentData) {
    return (
      <DashboardLayout title="Student Dossier">
        <div className="alert alert-danger">{error || 'Student not found'}</div>
        <Link to="/admin/students" className="btn btn-outline" style={{ marginTop: '1rem' }}>
          ← Back to Students Directory
        </Link>
      </DashboardLayout>
    );
  }

  const user = studentData.user || {};

  return (
    <DashboardLayout
      title={`Student Profile: ${user.name || 'Candidate'}`}
      subtitle={`Roll Number: ${studentData.rollNumber} | Department: ${studentData.branch}`}
    >
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link to="/admin/students" style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 600 }}>
          ← Back to Students Directory
        </Link>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Registered on: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Top Profile Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Personal & Contact Credentials */}
        <div className="card" style={{ margin: 0 }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            👤 Personal & Contact Info
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Full Name</span>
              <strong>{user.name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Roll Number</span>
              <strong style={{ color: 'var(--primary-color)' }}>{studentData.rollNumber}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Institutional Email</span>
              <a href={`mailto:${user.email}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                {user.email}
              </a>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Phone Contact</span>
              <span>{studentData.phone || 'Not Provided'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Account Status</span>
              <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`} style={{ backgroundColor: user.isActive ? '#dcfce7' : '#fee2e2', color: user.isActive ? '#15803d' : '#b91c1c' }}>
                {user.isActive ? 'Active Student' : 'Deactivated'}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Profile */}
        <div className="card" style={{ margin: 0 }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--primary-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            🎓 Academic Record & Skills
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Branch / Dept</span>
              <strong>{studentData.branch}</strong>
            </div>
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Current CGPA</span>
              <strong style={{ color: 'var(--primary-color)', fontSize: '1.05rem' }}>{studentData.cgpa} / 10</strong>
            </div>
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>10th Percentage</span>
              <strong>{studentData.tenthPercentage !== undefined ? `${studentData.tenthPercentage}%` : 'N/A'}</strong>
            </div>
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>12th Percentage</span>
              <strong>{studentData.twelfthPercentage !== undefined ? `${studentData.twelfthPercentage}%` : 'N/A'}</strong>
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
              Active Backlogs: <strong>{studentData.activeBacklogs}</strong>
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Skills Inventory</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {studentData.skills && studentData.skills.length > 0 ? (
                studentData.skills.map((skill, idx) => (
                  <span key={idx} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '4px', fontWeight: 600 }}>
                    {skill}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None listed</span>
              )}
            </div>
          </div>

          {studentData.resumeUrl && (
            <div style={{ marginTop: '0.85rem' }}>
              <a href={studentData.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
                📄 Open Student Resume ↗
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Placement Funnel Metrics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div className="card" style={{ margin: 0, padding: '1rem', textAlign: 'center', borderLeft: '4px solid var(--primary-color)' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Total Applied</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-color)' }}>{metrics.totalApplications}</span>
        </div>
        <div className="card" style={{ margin: 0, padding: '1rem', textAlign: 'center', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Shortlisted</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6' }}>{metrics.shortlisted}</span>
        </div>
        <div className="card" style={{ margin: 0, padding: '1rem', textAlign: 'center', borderLeft: '4px solid #8b5cf6' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Interviews</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6' }}>{metrics.interview}</span>
        </div>
        <div className="card" style={{ margin: 0, padding: '1rem', textAlign: 'center', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Selected / Offers</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{metrics.selected}</span>
        </div>
        <div className="card" style={{ margin: 0, padding: '1rem', textAlign: 'center', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Rejected</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>{metrics.rejected}</span>
        </div>
        <div className="card" style={{ margin: 0, padding: '1rem', textAlign: 'center', borderLeft: '4px solid #6b7280' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Removed by TPO</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6b7280' }}>{metrics.removed}</span>
        </div>
      </div>

      {/* Placement History & Participation Control */}
      <div className="card" style={{ margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>📋 Placement Drive History & Participation</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Inspect student applications across campus drives, interview statuses, and administrative controls.
            </p>
          </div>
          <span className="badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' }}>
            {applications.length} Records
          </span>
        </div>

        {applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
            No placement applications submitted by this student yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {applications.map((app) => {
              const drive = app.drive || {};
              const company = drive.company || {};
              const isRemoved = app.status === 'Removed' || app.isRemoved;

              return (
                <div
                  key={app._id}
                  style={{
                    border: isRemoved ? '1px dashed #ef4444' : '1px solid var(--border-color)',
                    backgroundColor: isRemoved ? '#fef2f2' : 'var(--bg-color)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                          {drive.jobTitle || 'Placement Drive'}
                        </h4>
                        {drive.jobRole && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            ({drive.jobRole})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        🏢 <strong>{company.companyName || 'Company'}</strong> • Package: <strong>₹{drive.packageLPA} LPA</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Status Badge */}
                      {isRemoved ? (
                        <span style={{ padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }}>
                          🚫 Administratively Removed
                        </span>
                      ) : (
                        <span className={`status-badge status-${app.status?.toLowerCase() || 'applied'}`}>
                          {app.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
                    <div>
                      Applied Date: <strong>{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}</strong>
                    </div>

                    {/* Audit Information if Removed */}
                    {isRemoved && (
                      <div style={{ color: '#991b1b', fontSize: '0.82rem', backgroundColor: '#fff', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #fecaca' }}>
                        <strong>Audit:</strong> Removed by {app.removedBy?.name || 'TPO Admin'} on{' '}
                        {app.removedAt ? new Date(app.removedAt).toLocaleDateString() : 'N/A'}
                        {app.removalReason ? ` — Reason: "${app.removalReason}"` : ''}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {drive._id && (
                        <Link to={`/admin/drives`} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}>
                          View Drive
                        </Link>
                      )}

                      {!isRemoved && (
                        <button
                          type="button"
                          onClick={() => handleOpenRemoveModal(app)}
                          className="btn btn-danger"
                          style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}
                        >
                          Remove From Drive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL: REMOVE STUDENT FROM SPECIFIC DRIVE */}
      {removingApp && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '540px',
              width: '100%',
              backgroundColor: '#fff',
              borderRadius: '10px',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#b91c1c' }}>
                ⚠️ Remove Student From Placement Drive
              </h3>
              <button
                type="button"
                onClick={handleCloseRemoveModal}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {modalError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{modalError}</div>}

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: '0 0 1rem', lineHeight: 1.5 }}>
              Are you sure you want to remove this student from this specific placement drive?
            </p>

            <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.85rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Student Name:</span> <strong>{user.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Roll Number:</span> <strong>{studentData.rollNumber}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Placement Drive:</span> <strong>{removingApp.drive?.jobTitle || 'Drive'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Company:</span> <strong>{removingApp.drive?.company?.companyName || 'Company'}</strong>
              </div>
            </div>

            <form onSubmit={handleConfirmRemoval}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Removal Reason <span className="req">*</span>
                </label>
                <select
                  className="form-control"
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  style={{ fontSize: '0.88rem' }}
                >
                  {REMOVAL_REASONS.map((r, idx) => (
                    <option key={idx} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                  Additional Notes / Specific Remarks (Optional)
                </label>
                <textarea
                  rows="2"
                  className="form-control"
                  placeholder="Provide additional context for the audit record..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem', backgroundColor: '#fffbeb', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #fde68a' }}>
                ℹ️ <strong>Note:</strong> The student account will remain active. The student will be excluded from this drive's applicant roster and cannot re-apply to this specific drive.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseRemoveModal}
                  className="btn btn-outline"
                  disabled={actionLoading}
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={actionLoading}
                  style={{ fontSize: '0.85rem' }}
                >
                  {actionLoading ? 'Removing Student...' : 'Confirm Removal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDetailsPage;
