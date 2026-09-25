import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getDriveById } from '../../api/driveApi';
import { getDriveApplications, updateApplicationStatus } from '../../api/companyApi';

const DriveApplicantsPage = () => {
  const { driveId } = useParams();

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drive, setDrive] = useState(null);
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDriveAndApplicants();
  }, [driveId]);

  const fetchDriveAndApplicants = async () => {
    try {
      setLoading(true);
      setError('');

      const [driveRes, appsRes] = await Promise.all([
        getDriveById(driveId),
        getDriveApplications(driveId),
      ]);

      setDrive(driveRes.drive || null);
      setApplications(appsRes.applications || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load drive applicants');
    } finally {
      setLoading(false);
    }
  };

  // Status transition state machine matching backend
  const getAllowedNextStatuses = (currentStatus) => {
    switch (currentStatus) {
      case 'Applied':
        return ['Shortlisted', 'Rejected'];
      case 'Shortlisted':
        return ['Interview', 'Rejected'];
      case 'Interview':
        return ['Selected', 'Rejected'];
      case 'Selected':
      case 'Rejected':
      default:
        return []; // Terminal states
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setUpdatingId(applicationId);
      setError('');
      setSuccess('');

      const res = await updateApplicationStatus(applicationId, newStatus);
      setSuccess(`Applicant status successfully updated to "${newStatus}".`);

      // Update in local state
      setApplications((prev) =>
        prev.map((app) => (app._id === applicationId ? res.application : app))
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update applicant status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Drive Applicants">
        <Loader />
      </DashboardLayout>
    );
  }

  const filteredApplicants = applications.filter((app) => {
    // 1. Status Filter
    if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;

    // 2. Search Query (Student Name or Roll Number)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const studentName = app.student?.user?.name?.toLowerCase() || '';
      const rollNumber = app.student?.rollNumber?.toLowerCase() || '';
      if (!studentName.includes(q) && !rollNumber.includes(q)) return false;
    }

    return true;
  });

  return (
    <DashboardLayout
      title={`Applicants: ${drive?.jobTitle || 'Drive'}`}
      subtitle={`Review candidate submissions, academic credentials, and advance hiring stages.`}
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/company/drives" style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 600 }}>
          ← Back to Manage Drives
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Drive Overview Mini Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              {drive?.jobTitle}
            </h4>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              <span>Package: <strong>₹{drive?.packageLPA} LPA</strong></span>
              <span>Min CGPA: <strong>{drive?.minimumCGPA || 0}</strong></span>
              <span>Status: <strong className={`status-badge status-${drive?.status}`}>{drive?.status}</strong></span>
              <span>Total Applicants: <strong>{applications.length}</strong></span>
            </div>
          </div>
          <Link to={`/company/drives/${driveId}/edit`} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
            ✏️ Edit Drive Criteria
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card filter-bar-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="filter-controls-row">
          <div style={{ flex: 2, minWidth: '220px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Search Candidates</label>
            <input
              type="text"
              placeholder="Search by student name or roll number..."
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, minWidth: '160px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Filter by Status</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses ({applications.length})</option>
              <option value="Applied">Applied ({applications.filter((a) => a.status === 'Applied').length})</option>
              <option value="Shortlisted">Shortlisted ({applications.filter((a) => a.status === 'Shortlisted').length})</option>
              <option value="Interview">Interview ({applications.filter((a) => a.status === 'Interview').length})</option>
              <option value="Selected">Selected ({applications.filter((a) => a.status === 'Selected').length})</option>
              <option value="Rejected">Rejected ({applications.filter((a) => a.status === 'Rejected').length})</option>
            </select>
          </div>
        </div>
      </div>

      {filteredApplicants.length === 0 ? (
        <div className="card empty-state-box">
          <span style={{ fontSize: '2.5rem' }}>👥</span>
          <h4>No Applicants Found</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            {applications.length === 0
              ? 'No students have applied to this placement drive yet.'
              : 'No applicants match your current search and filter settings.'}
          </p>
        </div>
      ) : (
        <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student Candidate</th>
                <th>Roll Number</th>
                <th>Branch</th>
                <th>Academic Scores</th>
                <th>Technical Skills</th>
                <th>Applied Date</th>
                <th>Current Status</th>
                <th style={{ textAlign: 'right' }}>Update Hiring Stage</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.map((app) => {
                const student = app.student || {};
                const user = student.user || {};
                const allowedTransitions = getAllowedNextStatuses(app.status);
                const isTerminal = allowedTransitions.length === 0;

                return (
                  <tr key={app._id}>
                    <td>
                      <strong>{user.name || 'Student Candidate'}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {user.email}
                      </div>
                      {student.phone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          📞 {student.phone}
                        </div>
                      )}
                    </td>
                    <td>
                      <code>{student.rollNumber || 'N/A'}</code>
                    </td>
                    <td>
                      <span className="branch-tag">{student.branch || 'N/A'}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <div>CGPA: <strong>{student.cgpa}</strong></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Backlogs: {student.activeBacklogs || 0}
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {student.skills && student.skills.length > 0 ? (
                          student.skills.slice(0, 3).map((s, idx) => (
                            <span key={idx} style={{ fontSize: '0.7rem', backgroundColor: 'var(--bg-color)', padding: '2px 5px', borderRadius: '3px', border: '1px solid var(--border-color)' }}>
                              {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>-</span>
                        )}
                        {student.skills && student.skills.length > 3 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            +{student.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${app.status.toLowerCase()}`}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isTerminal ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Terminal Stage
                        </span>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {allowedTransitions.map((nextStatus) => {
                            const isReject = nextStatus === 'Rejected';
                            return (
                              <button
                                key={nextStatus}
                                onClick={() => handleStatusChange(app._id, nextStatus)}
                                disabled={updatingId === app._id}
                                className={`btn ${isReject ? 'btn-danger' : 'btn-primary'}`}
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                {updatingId === app._id ? 'Updating...' : `→ ${nextStatus}`}
                              </button>
                            );
                          })}
                        </div>
                      )}
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

export default DriveApplicantsPage;
