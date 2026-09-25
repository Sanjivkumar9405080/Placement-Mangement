import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DriveCard from '../../components/cards/DriveCard';
import Loader from '../../components/common/Loader';
import { getAllDrives } from '../../api/driveApi';
import { getStudentProfile } from '../../api/studentApi';
import { getMyApplications, applyToDrive } from '../../api/applicationApi';

const BrowseDrivesPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drives, setDrives] = useState([]);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applyingId, setApplyingId] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibleOnly, setEligibleOnly] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const [profileRes, appsRes] = await Promise.all([
        getStudentProfile().catch(() => ({ profile: null })),
        getMyApplications().catch(() => ({ applications: [] })),
      ]);
      setProfile(profileRes.profile || null);
      setApplications(appsRes.applications || []);
      await fetchDrives();
    } catch (err) {
      setError('Failed to load drive catalog');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrives = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (branchFilter) params.branch = branchFilter;
      const res = await getAllDrives(params);
      setDrives(res.drives || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch drives');
    }
  };

  useEffect(() => {
    fetchDrives();
  }, [statusFilter, branchFilter]);

  const handleApply = async (driveId) => {
    try {
      setApplyingId(driveId);
      setError('');
      setSuccess('');
      await applyToDrive(driveId);
      setSuccess('Applied successfully! You can track this under My Applications.');
      // Refresh applications list
      const appsRes = await getMyApplications();
      setApplications(appsRes.applications || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplyingId(null);
    }
  };

  const appliedDriveIds = applications.map((app) =>
    typeof app.drive === 'object' ? app.drive?._id : app.drive
  );

  // Client-side filtering for search query & eligibility toggle
  const filteredDrives = drives.filter((drive) => {
    // 1. Search Query (Job Title or Company Name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = drive.jobTitle?.toLowerCase().includes(q);
      const matchCompany = drive.company?.companyName?.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany) return false;
    }

    // 2. Eligible Only Filter
    if (eligibleOnly && profile) {
      if (profile.cgpa < drive.minimumCGPA) return false;
      if (profile.activeBacklogs > drive.maxBacklogs) return false;
      if (drive.allowedBranches && drive.allowedBranches.length > 0) {
        const studentBranch = (profile.branch || '').trim().toLowerCase();
        const allowed = drive.allowedBranches.some(
          (b) => b.trim().toLowerCase() === studentBranch
        );
        if (!allowed) return false;
      }
    }

    return true;
  });

  return (
    <DashboardLayout
      title="Browse Placement Drives"
      subtitle="Discover career opportunities, check your eligibility, and submit applications."
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter and Search Bar */}
      <div className="card filter-bar-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div className="filter-controls-row">
          <div style={{ flex: 2, minWidth: '220px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Search by Role or Company</label>
            <input
              type="text"
              placeholder="e.g. Software Engineer, Google..."
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Status</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="upcoming">Upcoming Only</option>
              <option value="completed">Closed / Completed</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Branch</label>
            <select
              className="form-control"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EE">EE</option>
              <option value="ME">ME</option>
              <option value="CE">CE</option>
              <option value="AI_DS">AI & DS</option>
              <option value="MCA">MCA</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={eligibleOnly}
                onChange={(e) => setEligibleOnly(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <strong>Eligible Only</strong>
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : filteredDrives.length === 0 ? (
        <div className="card empty-state-box">
          <span style={{ fontSize: '2.5rem' }}>🔍</span>
          <h4>No Placement Drives Found</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            No recruitment drives match your current search and filter settings.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
              setBranchFilter('');
              setEligibleOnly(false);
            }}
            className="btn btn-outline"
            style={{ marginTop: '1rem' }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="drives-grid">
          {filteredDrives.map((drive) => (
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

export default BrowseDrivesPage;
