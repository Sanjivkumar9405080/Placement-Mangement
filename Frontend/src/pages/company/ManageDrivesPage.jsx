import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getAllDrives, deleteDrive } from '../../api/driveApi';
import { getCompanyProfile, getCompanyApplications } from '../../api/companyApi';

const ManageDrivesPage = () => {
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);

  // Filters
  const [approvalFilter, setApprovalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchDrivesAndApplications();
  }, []);

  const fetchDrivesAndApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const [profileRes, drivesRes, appsRes] = await Promise.all([
        getCompanyProfile().catch(() => ({ profile: null })),
        getAllDrives().catch(() => ({ drives: [] })),
        getCompanyApplications().catch(() => ({ applications: [] })),
      ]);

      const compProfile = profileRes?.profile || null;
      setProfile(compProfile);
      setApplications(appsRes?.applications || []);

      // Filter only company owned drives
      const allDrives = drivesRes?.drives || [];
      const companyId = compProfile?._id;
      const myDrives = companyId
        ? allDrives.filter((d) => {
            const dCompId = typeof d.company === 'object' ? d.company?._id : d.company;
            return dCompId === companyId;
          })
        : [];

      setDrives(myDrives);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch company drives');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the placement drive for "${title}"?\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError('');
      setSuccess('');
      await deleteDrive(id);
      setSuccess(`Drive "${title}" was successfully deleted.`);
      setDrives((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete drive. You may not be authorized.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDrives = drives.filter((drive) => {
    if (approvalFilter && (drive.approvalStatus || 'pending') !== approvalFilter) {
      return false;
    }
    if (statusFilter && drive.status !== statusFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <DashboardLayout title="Manage Placement Drives">
        <Loader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Manage Placement Drives"
      subtitle="View, edit, track applicants, and manage the lifecycle and approval status of your campus recruitment drives."
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Total Drives: <strong>{drives.length}</strong> | Showing: <strong>{filteredDrives.length}</strong>
          </span>
        </div>
        <Link to="/company/drives/new" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
          ➕ Post New Drive
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter Bar */}
      <div className="card filter-bar-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div className="filter-controls-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.35rem' }}>
              Approval Status
            </label>
            <select
              className="form-control"
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
            >
              <option value="">All Approval States</option>
              <option value="pending">🟡 Pending Approval</option>
              <option value="approved">🟢 Approved</option>
              <option value="rejected">🔴 Rejected</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.35rem' }}>
              Drive Lifecycle Status
            </label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Drive States</option>
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {(approvalFilter || statusFilter) && (
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
              <button
                type="button"
                onClick={() => {
                  setApprovalFilter('');
                  setStatusFilter('');
                }}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {drives.length === 0 ? (
        <div className="card empty-state-box">
          <span style={{ fontSize: '2.5rem' }}>📂</span>
          <h4>No Placement Drives Found</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            You haven't posted any campus placement drives yet.
          </p>
          <Link to="/company/drives/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Create Your First Drive
          </Link>
        </div>
      ) : filteredDrives.length === 0 ? (
        <div className="card empty-state-box">
          <span style={{ fontSize: '2.5rem' }}>🔍</span>
          <h4>No Matching Drives</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            No placement drives match your selected filters.
          </p>
          <button
            onClick={() => {
              setApprovalFilter('');
              setStatusFilter('');
            }}
            className="btn btn-outline"
            style={{ marginTop: '1rem' }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Job Title / Role</th>
                <th>Package (CTC)</th>
                <th>Min CGPA</th>
                <th>Drive Date</th>
                <th>Deadline</th>
                <th>Approval Status</th>
                <th>Drive Status</th>
                <th>Applicants</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrives.map((drive) => {
                const driveApplicants = applications.filter((app) => {
                  const dId = typeof app.drive === 'object' ? app.drive?._id : app.drive;
                  return dId === drive._id;
                });

                return (
                  <tr key={drive._id}>
                    <td>
                      <strong>{drive.jobTitle}</strong>
                      {drive.allowedBranches && drive.allowedBranches.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {drive.allowedBranches.join(', ')}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                        ₹{drive.packageLPA} LPA
                      </span>
                    </td>
                    <td>{drive.minimumCGPA > 0 ? drive.minimumCGPA : 'None'}</td>
                    <td>
                      {drive.driveDate
                        ? new Date(drive.driveDate).toLocaleDateString()
                        : 'TBA'}
                    </td>
                    <td>
                      {drive.applicationDeadline
                        ? new Date(drive.applicationDeadline).toLocaleDateString()
                        : 'Open'}
                    </td>
                    <td>
                      {drive.approvalStatus === 'approved' && (
                        <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.3rem 0.6rem' }}>
                          🟢 Approved
                        </span>
                      )}
                      {(!drive.approvalStatus || drive.approvalStatus === 'pending') && (
                        <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.3rem 0.6rem' }}>
                          🟡 Pending Approval
                        </span>
                      )}
                      {drive.approvalStatus === 'rejected' && (
                        <div>
                          <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.3rem 0.6rem' }}>
                            🔴 Rejected
                          </span>
                          {drive.rejectionReason && (
                            <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', maxWidth: '200px', lineHeight: 1.3 }}>
                              <strong>Reason:</strong> {drive.rejectionReason}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-${drive.status}`}>
                        {drive.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/company/drives/${drive._id}/applicants`}
                        className="badge"
                        style={{
                          backgroundColor: driveApplicants.length > 0 ? '#dbeafe' : 'var(--bg-color)',
                          color: driveApplicants.length > 0 ? '#1e40af' : 'var(--text-muted)',
                          padding: '0.3rem 0.6rem',
                          textDecoration: 'none',
                        }}
                      >
                        👥 {driveApplicants.length}
                      </Link>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <Link
                          to={`/company/drives/${drive._id}/applicants`}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          title="View drive applicants"
                        >
                          Applicants
                        </Link>
                        <Link
                          to={`/company/drives/${drive._id}/edit`}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          title="Edit drive details"
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(drive._id, drive.jobTitle)}
                          disabled={deletingId === drive._id}
                          className="btn btn-danger"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          title="Delete drive"
                        >
                          {deletingId === drive._id ? '...' : '🗑️'}
                        </button>
                      </div>
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

export default ManageDrivesPage;
