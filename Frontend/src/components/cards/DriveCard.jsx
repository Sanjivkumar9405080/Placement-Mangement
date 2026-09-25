import React from 'react';
import { Link } from 'react-router-dom';

const DriveCard = ({ drive, studentProfile, onApply, isApplying, isApplied }) => {
  const {
    _id,
    jobTitle,
    jobRole,
    company,
    packageLPA,
    stipend,
    minimumCGPA,
    maxBacklogs,
    minimumTenthPercentage,
    minimumTwelfthPercentage,
    allowedBranches = [],
    requiredSkills = [],
    employmentType,
    workMode,
    workLocation,
    driveDate,
    applicationDeadline,
    status,
  } = drive;

  const companyName = company?.companyName || 'Company';
  const companyWebsite = company?.website;
  const isCompleted = status === 'completed';
  const isDeadlinePassed = applicationDeadline && new Date() > new Date(applicationDeadline);

  // Eligibility evaluation if student profile is provided
  let isEligible = true;
  const eligibilityReasons = [];

  if (studentProfile) {
    if (studentProfile.cgpa < minimumCGPA) {
      isEligible = false;
      eligibilityReasons.push(`Min CGPA: ${minimumCGPA} (Yours: ${studentProfile.cgpa})`);
    }
    if (studentProfile.activeBacklogs > maxBacklogs) {
      isEligible = false;
      eligibilityReasons.push(`Max Backlogs: ${maxBacklogs} (Yours: ${studentProfile.activeBacklogs})`);
    }
    if (minimumTenthPercentage > 0) {
      const studentTenth = studentProfile.tenthPercentage !== undefined ? studentProfile.tenthPercentage : 0;
      if (studentTenth < minimumTenthPercentage) {
        isEligible = false;
        eligibilityReasons.push(`Min 10th: ${minimumTenthPercentage}% (Yours: ${studentTenth}%)`);
      }
    }
    if (minimumTwelfthPercentage > 0) {
      const studentTwelfth = studentProfile.twelfthPercentage !== undefined ? studentProfile.twelfthPercentage : 0;
      if (studentTwelfth < minimumTwelfthPercentage) {
        isEligible = false;
        eligibilityReasons.push(`Min 12th: ${minimumTwelfthPercentage}% (Yours: ${studentTwelfth}%)`);
      }
    }
    if (allowedBranches.length > 0) {
      const studentBranch = (studentProfile.branch || '').trim().toLowerCase();
      const branchAllowed = allowedBranches.some(
        (b) => b.trim().toLowerCase() === studentBranch
      );
      if (!branchAllowed) {
        isEligible = false;
        eligibilityReasons.push(`Branch ${studentProfile.branch} not in allowed list`);
      }
    }
  }

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <span className="status-badge status-active">Active</span>;
      case 'upcoming':
        return <span className="status-badge status-upcoming">Upcoming</span>;
      case 'completed':
        return <span className="status-badge status-completed">Closed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="card drive-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="drive-card-header">
        <div>
          <div className="drive-card-company">
            <span>{companyName}</span>
            {companyWebsite && (
              <a
                href={companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`}
                target="_blank"
                rel="noreferrer"
                className="drive-company-link"
                title="Visit Company Website"
              >
                ↗
              </a>
            )}
          </div>
          <h3 className="drive-card-title">{jobTitle}</h3>
          {jobRole && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Role: <strong>{jobRole}</strong>
            </div>
          )}
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      <div className="drive-card-body" style={{ flex: 1 }}>
        {/* Quick badges: Employment, Work Mode, Location */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {employmentType && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '4px' }}>
              💼 {employmentType}
            </span>
          )}
          {workMode && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', backgroundColor: '#f0fdf4', color: '#15803d', borderRadius: '4px' }}>
              📍 {workMode}
            </span>
          )}
          {workLocation && (
            <span style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              {workLocation}
            </span>
          )}
        </div>

        <div className="drive-metric-grid">
          <div className="drive-metric-item">
            <span className="drive-metric-label">CTC Package</span>
            <span className="drive-metric-val highlight">₹{packageLPA} LPA</span>
            {stipend > 0 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                ₹{stipend.toLocaleString()}/mo stipend
              </span>
            )}
          </div>
          <div className="drive-metric-item">
            <span className="drive-metric-label">Min CGPA</span>
            <span className="drive-metric-val">{minimumCGPA > 0 ? minimumCGPA : 'No criteria'}</span>
          </div>
          <div className="drive-metric-item">
            <span className="drive-metric-label">Max Backlogs</span>
            <span className="drive-metric-val">{maxBacklogs}</span>
          </div>
          <div className="drive-metric-item">
            <span className="drive-metric-label">Deadline</span>
            <span className="drive-metric-val">
              {applicationDeadline ? new Date(applicationDeadline).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>

        {/* Required skills tags */}
        {requiredSkills && requiredSkills.length > 0 && (
          <div style={{ marginTop: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.4rem' }}>
              Required Skills:
            </span>
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.3rem', verticalAlign: 'middle' }}>
              {requiredSkills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.15rem 0.45rem',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  {skill}
                </span>
              ))}
              {requiredSkills.length > 4 && (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                  +{requiredSkills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {allowedBranches.length > 0 ? (
          <div className="drive-branches-list" style={{ marginTop: '0.4rem' }}>
            <span className="drive-branches-label">Branches:</span>
            {allowedBranches.map((branch, index) => (
              <span key={index} className="branch-tag">
                {branch}
              </span>
            ))}
          </div>
        ) : (
          <div className="drive-branches-list" style={{ marginTop: '0.4rem' }}>
            <span className="branch-tag all-branches">Open to All Branches</span>
          </div>
        )}

        {studentProfile && !isEligible && (
          <div className="eligibility-notice ineligibility-alert" style={{ marginTop: '0.75rem' }}>
            ⚠️ <strong>Not Eligible:</strong> {eligibilityReasons.join(' | ')}
          </div>
        )}

        {isApplied && (
          <div className="eligibility-notice applied-alert" style={{ marginTop: '0.75rem' }}>
            ✅ You have already applied to this drive.
          </div>
        )}
      </div>

      <div className="drive-card-footer" style={{ marginTop: 'auto' }}>
        <Link to={`/student/drives/${_id}`} className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>
          View Details
        </Link>

        {onApply && (
          <button
            onClick={() => onApply(_id)}
            disabled={isApplied || !isEligible || isCompleted || isDeadlinePassed || isApplying}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            {isApplied
              ? 'Applied'
              : isApplying
              ? 'Applying...'
              : isCompleted || isDeadlinePassed
              ? 'Closed'
              : !isEligible
              ? 'Not Eligible'
              : 'Apply Now'}
          </button>
        )}
      </div>
    </div>
  );
};

export default DriveCard;
