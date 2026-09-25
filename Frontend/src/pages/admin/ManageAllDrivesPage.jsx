import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import {
  getAllDrives,
  getAllCompanies,
  reviewDriveApproval,
  getAdminDriveApplicants,
  removeStudentFromDrive,
} from '../../api/adminApi';

const REMOVAL_REASONS = [
  'Student no longer meets eligibility criteria',
  'Duplicate application',
  'TPO administrative decision',
  'Disciplinary action / Placement policy violation',
  'Other',
];

const ManageAllDrivesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialApproval = searchParams.get('approval') || '';

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState(initialApproval);
  const [companyFilter, setCompanyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal state
  const [reviewDrive, setReviewDrive] = useState(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [modalError, setModalError] = useState('');

  // Drive Applicants Modal State
  const [viewApplicantsDrive, setViewApplicantsDrive] = useState(null);
  const [driveApplicants, setDriveApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState('');

  // Remove Applicant from Drive State
  const [removingApp, setRemovingApp] = useState(null);
  const [removalReasonSelect, setRemovalReasonSelect] = useState(REMOVAL_REASONS[0]);
  const [customRemovalNotes, setCustomRemovalNotes] = useState('');
  const [removalLoading, setRemovalLoading] = useState(false);
  const [removalError, setRemovalError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      const [drivesRes, companiesRes] = await Promise.all([
        getAllDrives(),
        getAllCompanies().catch(() => ({ companies: [] })),
      ]);

      setDrives(drivesRes.drives || []);
      setCompanies(companiesRes.companies || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch placement drives');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivesFiltered = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (companyFilter) params.company = companyFilter;
      if (approvalFilter) params.approvalStatus = approvalFilter;

      const data = await getAllDrives(params);
      setDrives(data.drives || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to filter placement drives');
    }
  };

  useEffect(() => {
    fetchDrivesFiltered();
  }, [statusFilter, companyFilter, approvalFilter]);

  const handleClearFilters = () => {
    setStatusFilter('');
    setApprovalFilter('');
    setCompanyFilter('');
    setSearchQuery('');
    setSearchParams({});
  };

  // Open Drive Review modal
  const openReviewModal = (drive) => {
    setReviewDrive(drive);
    setShowRejectForm(false);
    setRejectionReason(drive.rejectionReason || '');
    setModalError('');
  };

  const closeReviewModal = () => {
    setReviewDrive(null);
    setShowRejectForm(false);
    setRejectionReason('');
    setModalError('');
  };

  // Open Drive Applicants modal
  const openApplicantsModal = async (drive) => {
    setViewApplicantsDrive(drive);
    setApplicantsLoading(true);
    setApplicantsError('');
    try {
      const data = await getAdminDriveApplicants(drive._id);
      setDriveApplicants(data.applicants || []);
    } catch (err) {
      setApplicantsError(err?.response?.data?.message || 'Failed to load applicants for this drive');
    } finally {
      setApplicantsLoading(false);
    }
  };

  const closeApplicantsModal = () => {
    setViewApplicantsDrive(null);
    setDriveApplicants([]);
    setApplicantsError('');
  };

  // Remove Applicant Modal Handlers
  const handleOpenRemoveModal = (app) => {
    setRemovingApp(app);
    setRemovalReasonSelect(REMOVAL_REASONS[0]);
    setCustomRemovalNotes('');
    setRemovalError('');
  };

  const handleCloseRemoveModal = () => {
    setRemovingApp(null);
    setRemovalError('');
  };

  const handleConfirmRemoval = async (e) => {
    e.preventDefault();
    if (!removingApp) return;

    const fullReason =
      removalReasonSelect === 'Other'
        ? customRemovalNotes.trim() || 'Other'
        : customRemovalNotes.trim()
        ? `${removalReasonSelect} - ${customRemovalNotes.trim()}`
        : removalReasonSelect;

    try {
      setRemovalLoading(true);
      setRemovalError('');
      await removeStudentFromDrive(removingApp._id, { removalReason: fullReason });

      // Update local applicants list
      setDriveApplicants((prev) =>
        prev.map((a) =>
          a._id === removingApp._id
            ? {
                ...a,
                status: 'Removed',
                isRemoved: true,
                removalReason: fullReason,
                removedAt: new Date().toISOString(),
              }
            : a
        )
      );

      setSuccess(`Student ${removingApp.student?.fullName || 'Candidate'} removed from drive successfully.`);
      handleCloseRemoveModal();
    } catch (err) {
      setRemovalError(err?.response?.data?.message || 'Failed to remove candidate from drive');
    } finally {
      setRemovalLoading(false);
    }
  };

  // Handle Approve
  const handleApprove = async () => {
    if (!reviewDrive) return;
    try {
      setActionLoading(true);
      setModalError('');
      const res = await reviewDriveApproval(reviewDrive._id, {
        approvalStatus: 'approved',
      });
      setSuccess('Placement drive approved successfully.');
      // Update local drive state
      setDrives((prev) =>
        prev.map((d) => (d._id === reviewDrive._id ? res.drive : d))
      );
      closeReviewModal();
    } catch (err) {
      setModalError(err?.response?.data?.message || 'Failed to approve placement drive');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async (e) => {
    e.preventDefault();
    if (!reviewDrive) return;

    if (!rejectionReason.trim()) {
      setModalError('Please specify a rejection reason for the recruiter.');
      return;
    }

    try {
      setActionLoading(true);
      setModalError('');
      const res = await reviewDriveApproval(reviewDrive._id, {
        approvalStatus: 'rejected',
        rejectionReason: rejectionReason.trim(),
      });
      setSuccess('Placement drive rejected.');
      // Update local drive state
      setDrives((prev) =>
        prev.map((d) => (d._id === reviewDrive._id ? res.drive : d))
      );
      closeReviewModal();
    } catch (err) {
      setModalError(err?.response?.data?.message || 'Failed to reject placement drive');
    } finally {
      setActionLoading(false);
    }
  };

  // Client-side text filter for search query
  const filteredDrives = drives.filter((drive) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = drive.jobTitle?.toLowerCase() || '';
    const compName = drive.company?.companyName?.toLowerCase() || '';
    return title.includes(q) || compName.includes(q);
  });

  return (
    <DashboardLayout
      title="All Campus Placement Drives"
      subtitle="Institutional oversight of recruitment drives, candidate eligibility rules, and drive schedules."
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter and Search Controls */}
      <div className="card filter-bar-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div className="filter-controls-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '220px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Search Role or Company
            </label>
            <input
              type="text"
              placeholder="e.g. Software Engineer, Google..."
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ flex: 1.2, minWidth: '170px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Approval Status
            </label>
            <select
              className="form-control"
              value={approvalFilter}
              onChange={(e) => {
                setApprovalFilter(e.target.value);
                setSearchParams(e.target.value ? { approval: e.target.value } : {});
              }}
            >
              <option value="">All Approval States</option>
              <option value="pending">🟡 Pending Review</option>
              <option value="approved">🟢 Approved</option>
              <option value="rejected">🔴 Rejected</option>
            </select>
          </div>

          <div style={{ flex: 1.2, minWidth: '170px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Drive Status
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

          <div style={{ flex: 1.5, minWidth: '180px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Company Partner
            </label>
            <select
              className="form-control"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="">All Companies ({companies.length})</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-outline"
              style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredDrives.length}</strong> drive{filteredDrives.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <Loader />
      ) : filteredDrives.length === 0 ? (
        <div className="card empty-state-box">
          <span style={{ fontSize: '2.5rem' }}>📁</span>
          <h4>No Placement Drives Found</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            No campus placement drives match the specified filters.
          </p>
          {(statusFilter || approvalFilter || companyFilter || searchQuery) && (
            <button onClick={handleClearFilters} className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Job Title / Role</th>
                <th>Company Partner</th>
                <th>Package</th>
                <th>Min CGPA</th>
                <th>Branches</th>
                <th>Backlogs</th>
                <th>Drive Date</th>
                <th>Deadline</th>
                <th>Approval</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrives.map((drive) => {
                const company = drive.company || {};

                return (
                  <tr key={drive._id}>
                    <td>
                      <strong>{drive.jobTitle}</strong>
                    </td>
                    <td>
                      <div><strong>{company.companyName || 'Corporate Partner'}</strong></div>
                      {company.website && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {company.website.replace(/^https?:\/\//, '')}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                        ₹{drive.packageLPA} LPA
                      </span>
                    </td>
                    <td>{drive.minimumCGPA > 0 ? drive.minimumCGPA : 'None'}</td>
                    <td style={{ maxWidth: '140px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                        {drive.allowedBranches && drive.allowedBranches.length > 0 ? (
                          drive.allowedBranches.map((b, idx) => (
                            <span key={idx} className="branch-tag" style={{ fontSize: '0.7rem' }}>
                              {b}
                            </span>
                          ))
                        ) : (
                          <span className="branch-tag all-branches" style={{ fontSize: '0.7rem' }}>
                            All
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{drive.maxBacklogs}</td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {drive.driveDate
                          ? new Date(drive.driveDate).toLocaleDateString()
                          : 'TBA'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {drive.applicationDeadline
                          ? new Date(drive.applicationDeadline).toLocaleDateString()
                          : 'Open'}
                      </span>
                    </td>
                    <td>
                      {drive.approvalStatus === 'approved' && (
                        <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.3rem 0.6rem' }}>
                          🟢 Approved
                        </span>
                      )}
                      {(!drive.approvalStatus || drive.approvalStatus === 'pending') && (
                        <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.3rem 0.6rem' }}>
                          🟡 Pending
                        </span>
                      )}
                      {drive.approvalStatus === 'rejected' && (
                        <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.3rem 0.6rem' }}>
                          🔴 Rejected
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-${drive.status}`}>
                        {drive.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={() => openApplicantsModal(drive)}
                          className="btn btn-outline"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                          title="Inspect registered candidates for this drive"
                        >
                          👥 Applicants
                        </button>
                        <button
                          type="button"
                          onClick={() => openReviewModal(drive)}
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                        >
                          🔍 Review
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

      {/* Drive Review Modal */}
      {reviewDrive && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {reviewDrive.company?.companyName || 'Corporate Partner'}
                </span>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.3rem' }}>{reviewDrive.jobTitle}</h3>
              </div>
              <button
                type="button"
                onClick={closeReviewModal}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {modalError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{modalError}</div>}

            {/* Current Status Pills */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Approval Status:</span>
                {reviewDrive.approvalStatus === 'approved' && (
                  <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.25rem 0.6rem' }}>
                    🟢 Approved
                  </span>
                )}
                {(!reviewDrive.approvalStatus || reviewDrive.approvalStatus === 'pending') && (
                  <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.25rem 0.6rem' }}>
                    🟡 Pending Review
                  </span>
                )}
                {reviewDrive.approvalStatus === 'rejected' && (
                  <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.25rem 0.6rem' }}>
                    🔴 Rejected
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Drive Status:</span>
                <span className={`status-badge status-${reviewDrive.status}`}>
                  {reviewDrive.status}
                </span>
              </div>
            </div>

            {/* Rejection notice if previously rejected */}
            {reviewDrive.approvalStatus === 'rejected' && reviewDrive.rejectionReason && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  borderLeft: '4px solid #ef4444',
                  padding: '0.75rem 1rem',
                  borderRadius: '4px',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                  color: '#991b1b',
                }}
              >
                <strong>Current Rejection Reason:</strong> {reviewDrive.rejectionReason}
              </div>
            )}

            {/* Role & Work Arrangement Summary */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
              {reviewDrive.jobRole && (
                <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                  Role: {reviewDrive.jobRole}
                </span>
              )}
              {reviewDrive.department && (
                <span className="badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' }}>
                  Dept: {reviewDrive.department}
                </span>
              )}
              {reviewDrive.employmentType && (
                <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>
                  💼 {reviewDrive.employmentType}
                </span>
              )}
              {reviewDrive.workMode && (
                <span className="badge" style={{ backgroundColor: '#fdf4ff', color: '#86198f' }}>
                  📍 {reviewDrive.workMode}
                </span>
              )}
              {reviewDrive.workLocation && (
                <span className="badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' }}>
                  Office: {reviewDrive.workLocation}
                </span>
              )}
              {reviewDrive.experienceType && (
                <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                  🎓 {reviewDrive.experienceType === 'freshers' ? 'Freshers' : reviewDrive.experienceType === 'both' ? 'Freshers & Experienced' : `${reviewDrive.minimumExperience}+ Yrs Exp`}
                </span>
              )}
            </div>

            {/* Criteria & Compensation Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-light)',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Package (CTC)</span>
                <strong style={{ color: 'var(--primary-color)', fontSize: '1rem' }}>₹{reviewDrive.packageLPA} LPA</strong>
                {reviewDrive.minimumCTC > 0 && reviewDrive.maximumCTC > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                    ({reviewDrive.minimumCTC} - {reviewDrive.maximumCTC} LPA)
                  </span>
                )}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Monthly Stipend</span>
                <strong>{reviewDrive.stipend > 0 ? `₹${reviewDrive.stipend.toLocaleString()}` : 'None'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Minimum CGPA</span>
                <strong>{reviewDrive.minimumCGPA > 0 ? reviewDrive.minimumCGPA : 'No Cutoff'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Max Backlogs</span>
                <strong>{reviewDrive.maxBacklogs}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>10th / 12th Cutoffs</span>
                <strong>
                  {reviewDrive.minimumTenthPercentage > 0 ? `${reviewDrive.minimumTenthPercentage}%` : 'None'} / {reviewDrive.minimumTwelfthPercentage > 0 ? `${reviewDrive.minimumTwelfthPercentage}%` : 'None'}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Drive Date</span>
                <strong>{reviewDrive.driveDate ? new Date(reviewDrive.driveDate).toLocaleDateString() : 'TBA'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Deadline</span>
                <strong>{reviewDrive.applicationDeadline ? new Date(reviewDrive.applicationDeadline).toLocaleDateString() : 'Open'}</strong>
              </div>
            </div>

            {/* Allowed Branches & Degrees */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                Eligible Branches & Degrees:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.4rem' }}>
                {reviewDrive.allowedBranches && reviewDrive.allowedBranches.length > 0 ? (
                  reviewDrive.allowedBranches.map((b, idx) => (
                    <span key={idx} className="branch-tag" style={{ fontSize: '0.75rem' }}>
                      {b}
                    </span>
                  ))
                ) : (
                  <span className="branch-tag all-branches" style={{ fontSize: '0.75rem' }}>
                    Open to All Branches
                  </span>
                )}
              </div>
              {reviewDrive.eligibleDegrees && reviewDrive.eligibleDegrees.length > 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Degrees: <strong>{reviewDrive.eligibleDegrees.join(', ')}</strong>
                </div>
              )}
            </div>

            {/* Skills Matrix */}
            {((reviewDrive.requiredSkills && reviewDrive.requiredSkills.length > 0) || (reviewDrive.preferredSkills && reviewDrive.preferredSkills.length > 0)) && (
              <div style={{ marginBottom: '1rem', backgroundColor: 'var(--bg-color)', padding: '0.75rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Skills Requirements:
                </span>
                {reviewDrive.requiredSkills && reviewDrive.requiredSkills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger-color)', alignSelf: 'center', marginRight: '4px' }}>Required:</span>
                    {reviewDrive.requiredSkills.map((s, idx) => (
                      <span key={idx} style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontWeight: 600 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {reviewDrive.preferredSkills && reviewDrive.preferredSkills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-color)', alignSelf: 'center', marginRight: '4px' }}>Preferred:</span>
                    {reviewDrive.preferredSkills.map((s, idx) => (
                      <span key={idx} style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '4px', fontWeight: 600 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Responsibilities */}
            {reviewDrive.responsibilities && reviewDrive.responsibilities.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Responsibilities:
                </span>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-color)', lineHeight: 1.5 }}>
                  {reviewDrive.responsibilities.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bond / Service Agreement */}
            {reviewDrive.bondRequired && (
              <div style={{ marginBottom: '1rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', color: '#92400e' }}>
                <strong>Service Agreement / Bond:</strong> {reviewDrive.bondDuration || 0} Months
                {reviewDrive.bondDetails ? ` (${reviewDrive.bondDetails})` : ''}
              </div>
            )}

            {/* Recruitment Rounds */}
            {reviewDrive.recruitmentRounds && reviewDrive.recruitmentRounds.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                  Selection Rounds:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {reviewDrive.recruitmentRounds.map((round, idx) => (
                    <span
                      key={idx}
                      style={{
                        backgroundColor: '#e0e7ff',
                        color: '#3730a3',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                      }}
                    >
                      Round {idx + 1}: {round}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                Job Description:
              </span>
              <p style={{ fontSize: '0.88rem', whiteSpace: 'pre-wrap', color: 'var(--text-color)', lineHeight: 1.5, margin: 0 }}>
                {reviewDrive.description || 'No detailed job description provided.'}
              </p>
            </div>

            {/* Additional Instructions */}
            {reviewDrive.additionalRequirements && reviewDrive.additionalRequirements.length > 0 && (
              <div style={{ marginBottom: '1.25rem', backgroundColor: 'var(--bg-color)', padding: '0.6rem 0.85rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                  Candidate Instructions:
                </span>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {reviewDrive.additionalRequirements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Company / Recruiter Details */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Company Contact Information:
              </span>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                <div>🏢 <strong>Industry:</strong> {reviewDrive.company?.industry || 'N/A'}</div>
                <div>👤 <strong>HR Contact:</strong> {reviewDrive.company?.hrName || 'N/A'}</div>
                <div>📧 <strong>HR Email:</strong> {reviewDrive.company?.hrEmail || 'N/A'}</div>
                {reviewDrive.company?.hrPhone && <div>📞 <strong>HR Phone:</strong> {reviewDrive.company?.hrPhone}</div>}
              </div>
            </div>

            {/* Rejection Form Input */}
            {showRejectForm ? (
              <form onSubmit={handleReject} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--danger-color)' }}>
                    Rejection Reason <span className="req">*</span>
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>
                    Explain clearly why this drive cannot be approved so the recruiter can revise the criteria.
                  </p>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="e.g. Minimum CGPA criteria needs clarification; recruitment rounds are incomplete."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
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
                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            ) : (
              /* Modal Actions */
              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="btn btn-outline"
                  disabled={actionLoading}
                  style={{ fontSize: '0.85rem' }}
                >
                  Close
                </button>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const d = reviewDrive;
                      closeReviewModal();
                      openApplicantsModal(d);
                    }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.85rem' }}
                  >
                    👥 View Applicants
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(true)}
                    className="btn btn-danger"
                    disabled={actionLoading || reviewDrive.approvalStatus === 'rejected'}
                    style={{ fontSize: '0.85rem' }}
                  >
                    ❌ Reject Drive
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="btn btn-primary"
                    disabled={actionLoading || reviewDrive.approvalStatus === 'approved'}
                    style={{ fontSize: '0.85rem', backgroundColor: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                  >
                    {actionLoading ? 'Approving...' : '✅ Approve Drive'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drive Applicants Modal */}
      {viewApplicantsDrive && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 1050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflowY: 'auto',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.75rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {viewApplicantsDrive.company?.companyName || 'Recruiter'}
                </span>
                <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.3rem' }}>
                  Applicants for {viewApplicantsDrive.jobTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeApplicantsModal}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {applicantsError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{applicantsError}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Package: <strong>₹{viewApplicantsDrive.packageLPA} LPA</strong> • Min CGPA: <strong>{viewApplicantsDrive.minimumCGPA || 'None'}</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                  Total Registered: {driveApplicants.length}
                </span>
                <span className="badge" style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>
                  Active: {driveApplicants.filter(a => a.status !== 'Removed' && !a.isRemoved).length}
                </span>
                <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                  Removed: {driveApplicants.filter(a => a.status === 'Removed' || a.isRemoved).length}
                </span>
              </div>
            </div>

            {applicantsLoading ? (
              <Loader />
            ) : driveApplicants.length === 0 ? (
              <div className="card empty-state-box" style={{ padding: '2.5rem 1rem' }}>
                <span style={{ fontSize: '2.5rem' }}>👥</span>
                <h4>No Applicants Yet</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No students have applied to this placement drive yet.
                </p>
              </div>
            ) : (
              <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="custom-table" style={{ fontSize: '0.88rem' }}>
                  <thead>
                    <tr>
                      <th>Candidate / Roll No</th>
                      <th>Branch & Batch</th>
                      <th>CGPA</th>
                      <th>Applied On</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driveApplicants.map((app) => {
                      const st = app.student || {};
                      const isRemoved = app.status === 'Removed' || app.isRemoved;

                      return (
                        <tr
                          key={app._id}
                          style={{
                            backgroundColor: isRemoved ? '#fef2f2' : 'transparent',
                            opacity: isRemoved ? 0.8 : 1,
                          }}
                        >
                          <td>
                            <div>
                              <strong>{st.fullName || 'Student'}</strong>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {st.rollNumber || 'N/A'} • {st.email || ''}
                            </div>
                          </td>
                          <td>
                            <div>{st.branch || 'N/A'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Batch {st.passingYear || 'N/A'}
                            </div>
                          </td>
                          <td>
                            <strong>{st.cgpa != null ? st.cgpa : 'N/A'}</strong>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem' }}>
                              {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>
                          <td>
                            {isRemoved ? (
                              <div>
                                <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                                  🚫 Removed
                                </span>
                                {app.removalReason && (
                                  <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: '0.2rem', maxWidth: '160px' }}>
                                    {app.removalReason}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className={`status-badge status-${app.status?.toLowerCase() || 'applied'}`}>
                                {app.status || 'Applied'}
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                              <Link
                                to={`/admin/students/${st._id}`}
                                className="btn btn-outline"
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                                title="Inspect Student Dossier"
                              >
                                👤 Dossier
                              </Link>
                              {!isRemoved ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRemoveModal(app)}
                                  className="btn btn-danger"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                                  title="Remove Candidate From Drive"
                                >
                                  ❌ Remove
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', padding: '0 0.4rem' }}>
                                  Archived
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={closeApplicantsModal}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Applicant Confirmation Modal */}
      {removingApp && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 1150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              borderTop: '4px solid var(--danger-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--danger-color)' }}>
                ⚠️ Remove Candidate from Drive
              </h3>
              <button
                type="button"
                onClick={handleCloseRemoveModal}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            {removalError && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                {removalError}
              </div>
            )}

            <div
              style={{
                backgroundColor: 'var(--bg-light)',
                padding: '0.85rem 1rem',
                borderRadius: '6px',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
              }}
            >
              <div><strong>Student:</strong> {removingApp.student?.fullName} ({removingApp.student?.rollNumber || 'N/A'})</div>
              <div><strong>Drive:</strong> {viewApplicantsDrive?.jobTitle} • {viewApplicantsDrive?.company?.companyName}</div>
            </div>

            <form onSubmit={handleConfirmRemoval}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Select Removal Reason <span className="req">*</span>
                </label>
                <select
                  className="form-control"
                  value={removalReasonSelect}
                  onChange={(e) => setRemovalReasonSelect(e.target.value)}
                  style={{ fontSize: '0.88rem' }}
                >
                  {REMOVAL_REASONS.map((r, idx) => (
                    <option key={idx} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  Additional Notes / Specific Clarification
                </label>
                <textarea
                  rows="2"
                  className="form-control"
                  placeholder="Provide context for audit records..."
                  value={customRemovalNotes}
                  onChange={(e) => setCustomRemovalNotes(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: '#991b1b',
                  marginBottom: '1.25rem',
                  lineHeight: 1.4,
                }}
              >
                <strong>Audit & Enforcement Policy:</strong>
                <ul style={{ margin: '0.3rem 0 0', paddingLeft: '1.2rem' }}>
                  <li>This drive participation will be revoked.</li>
                  <li>The candidate will no longer see this drive in their applications.</li>
                  <li>The candidate will be permanently blocked from re-applying to this drive.</li>
                  <li>The student's general account will remain active.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseRemoveModal}
                  className="btn btn-outline"
                  disabled={removalLoading}
                  style={{ fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={removalLoading}
                  style={{ fontSize: '0.85rem' }}
                >
                  {removalLoading ? 'Removing...' : 'Confirm Candidate Removal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageAllDrivesPage;
