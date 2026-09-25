import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getAllApplications, removeStudentFromDrive } from '../../api/adminApi';

const REMOVAL_REASONS = [
  'Student no longer meets eligibility criteria',
  'Duplicate application',
  'TPO administrative decision',
  'Disciplinary action / Placement policy violation',
  'Other',
];

const ManageApplicationsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applications, setApplications] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');

  // Remove Modal State
  const [removingApp, setRemovingApp] = useState(null);
  const [selectedReason, setSelectedReason] = useState(REMOVAL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await getAllApplications(params);
      setApplications(data.applications || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch applications registry');
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
        `Successfully removed ${removingApp.student?.user?.name || 'student'} from "${removingApp.drive?.jobTitle || 'drive'}".`
      );
      handleCloseRemoveModal();
      fetchApplications();
    } catch (err) {
      setModalError(err?.response?.data?.message || 'Failed to remove student from drive');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter applications by search query
  const filteredApps = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const studentName = app.student?.user?.name?.toLowerCase() || '';
    const rollNumber = app.student?.rollNumber?.toLowerCase() || '';
    const studentEmail = app.student?.user?.email?.toLowerCase() || '';
    const jobTitle = app.drive?.jobTitle?.toLowerCase() || '';
    const companyName = app.drive?.company?.companyName?.toLowerCase() || '';

    return (
      studentName.includes(q) ||
      rollNumber.includes(q) ||
      studentEmail.includes(q) ||
      jobTitle.includes(q) ||
      companyName.includes(q)
    );
  });

  return (
    <DashboardLayout
      title="Placement Applications Registry"
      subtitle="Comprehensive control and oversight across all student drive applications and administrative removals."
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 320px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by student name, roll number, drive title, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            {['', 'Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Removed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  if (st) setSearchParams({ status: st });
                  else setSearchParams({});
                }}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: statusFilter === st ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                  backgroundColor: statusFilter === st ? 'var(--primary-color)' : 'var(--bg-color)',
                  color: statusFilter === st ? '#fff' : 'var(--text-color)',
                }}
              >
                {st === '' ? 'All Applications' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : filteredApps.length === 0 ? (
        <div className="card empty-state-box" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
          <h4>No Applications Found</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            No records matched your search query or selected status filter.
          </p>
          {(statusFilter || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setSearchQuery('');
                setSearchParams({});
              }}
              className="btn btn-outline"
              style={{ marginTop: '0.75rem' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Candidate</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Placement Drive</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Company</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Applied Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status / Audit</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => {
                  const student = app.student || {};
                  const user = student.user || {};
                  const drive = app.drive || {};
                  const company = drive.company || {};
                  const isRemoved = app.status === 'Removed' || app.isRemoved;

                  return (
                    <tr
                      key={app._id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isRemoved ? '#fef2f2' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong>{user.name || 'Student'}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Roll: <strong style={{ color: 'var(--primary-color)' }}>{student.rollNumber || 'N/A'}</strong> ({student.branch || 'N/A'})
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong>{drive.jobTitle || 'Drive'}</strong>
                        {drive.packageLPA && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            ₹{drive.packageLPA} LPA
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <strong>{company.companyName || 'Company'}</strong>
                        {company.industry && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {company.industry}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A'}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isRemoved ? (
                          <div>
                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }}>
                              🚫 Removed
                            </span>
                            {app.removalReason && (
                              <div style={{ fontSize: '0.74rem', color: '#991b1b', marginTop: '0.2rem' }}>
                                Reason: {app.removalReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={`status-badge status-${app.status?.toLowerCase() || 'applied'}`}>
                            {app.status}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {student._id && (
                            <Link
                              to={`/admin/students/${student._id}`}
                              className="btn btn-outline"
                              style={{ fontSize: '0.78rem', padding: '0.25rem 0.55rem' }}
                            >
                              Profile
                            </Link>
                          )}

                          {!isRemoved && (
                            <button
                              type="button"
                              onClick={() => handleOpenRemoveModal(app)}
                              className="btn btn-danger"
                              style={{ fontSize: '0.78rem', padding: '0.25rem 0.55rem' }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: REMOVE STUDENT */}
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
              maxWidth: '520px',
              width: '100%',
              backgroundColor: '#fff',
              borderRadius: '10px',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#b91c1c' }}>
                ⚠️ Remove Student From Drive
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

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: '0 0 1rem' }}>
              Confirm removing this candidate's application from the placement drive:
            </p>

            <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Student:</span> <strong>{removingApp.student?.user?.name}</strong> (Roll: {removingApp.student?.rollNumber})
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Drive:</span> <strong>{removingApp.drive?.jobTitle}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Company:</span> <strong>{removingApp.drive?.company?.companyName}</strong>
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
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  className="form-control"
                  placeholder="Reason details for audit trail..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
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
                  {actionLoading ? 'Removing...' : 'Confirm Removal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageApplicationsPage;
