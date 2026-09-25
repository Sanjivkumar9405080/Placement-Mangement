import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getCompanyApplications, updateApplicationStatus } from '../../api/companyApi';

const CompanyApplicationsPage = () => {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applications, setApplications] = useState([]);

  // Filters
  const [selectedDriveFilter, setSelectedDriveFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setSelectedStatusFilter(statusParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCompanyApplications();
      setApplications(data.applications || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch applicants');
    } finally {
      setLoading(false);
    }
  };

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
        return [];
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setUpdatingId(applicationId);
      setError('');
      setSuccess('');

      const res = await updateApplicationStatus(applicationId, newStatus);
      setSuccess(`Application status successfully updated to "${newStatus}".`);

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
      <DashboardLayout title="Company Applicants">
        <Loader />
      </DashboardLayout>
    );
  }

  // Extract unique drives for filter dropdown
  const uniqueDrivesMap = new Map();
  applications.forEach((app) => {
    if (app.drive && app.drive._id) {
      uniqueDrivesMap.set(app.drive._id, app.drive.jobTitle);
    }
  });
  const uniqueDrives = Array.from(uniqueDrivesMap.entries());

  const filteredApplications = applications.filter((app) => {
    // 1. Drive Filter
    if (selectedDriveFilter !== 'ALL') {
      const driveId = typeof app.drive === 'object' ? app.drive?._id : app.drive;
      if (driveId !== selectedDriveFilter) return false;
    }

    // 2. Status Filter
    if (selectedStatusFilter !== 'ALL' && app.status !== selectedStatusFilter) {
      return false;
    }

    // 3. Search Query (Student Name or Roll Number)
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
      title="All Company Applicants"
      subtitle="Comprehensive candidate management across all placement drives posted by your organization."
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter and Search Bar */}
      <div className="card filter-bar-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
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

          <div style={{ flex: 1.5, minWidth: '180px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Placement Drive</label>
            <select
              className="form-control"
              value={selectedDriveFilter}
              onChange={(e) => setSelectedDriveFilter(e.target.value)}
            >
              <option value="ALL">All Drives ({uniqueDrives.length})</option>
              {uniqueDrives.map(([driveId, title]) => (
                <option key={driveId} value={driveId}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Status</label>
            <select
              className="form-control"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
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

      {filteredApplications.length === 0 ? (
        <div className="card empty-state-box">
          <span style={{ fontSize: '2.5rem' }}>👥</span>
          <h4>No Applicants Found</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            {applications.length === 0
              ? 'No student applications have been received across your placement drives yet.'
              : 'No applicants match the current search filters.'}
          </p>
          {applications.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDriveFilter('ALL');
                setSelectedStatusFilter('ALL');
              }}
              className="btn btn-outline"
              style={{ marginTop: '1rem' }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student Candidate</th>
                <th>Drive / Role</th>
                <th>Branch & Roll</th>
                <th>CGPA & Backlogs</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Update Hiring Stage</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => {
                const student = app.student || {};
                const user = student.user || {};
                const drive = app.drive || {};
                const allowedTransitions = getAllowedNextStatuses(app.status);
                const isTerminal = allowedTransitions.length === 0;

                return (
                  <tr key={app._id}>
                    <td>
                      <strong>{user.name || 'Candidate'}</strong>
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
                      <strong>{drive.jobTitle || 'Role'}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>
                        ₹{drive.packageLPA} LPA
                      </div>
                    </td>
                    <td>
                      <span className="branch-tag">{student.branch || 'N/A'}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        <code>{student.rollNumber || 'N/A'}</code>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>CGPA: {student.cgpa}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Backlogs: {student.activeBacklogs || 0}
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

export default CompanyApplicationsPage;
