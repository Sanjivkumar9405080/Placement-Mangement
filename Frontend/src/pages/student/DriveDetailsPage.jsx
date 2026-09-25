import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getDriveById } from '../../api/driveApi';
import { getStudentProfile } from '../../api/studentApi';
import { getMyApplications, applyToDrive } from '../../api/applicationApi';

const DriveDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [drive, setDrive] = useState(null);
  const [profile, setProfile] = useState(null);
  const [existingApplication, setExistingApplication] = useState(null);

  useEffect(() => {
    fetchDriveDetails();
  }, [id]);

  const fetchDriveDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const [driveRes, profileRes, appsRes] = await Promise.all([
        getDriveById(id),
        getStudentProfile().catch(() => ({ profile: null })),
        getMyApplications().catch(() => ({ applications: [] })),
      ]);

      setDrive(driveRes.drive || null);
      setProfile(profileRes.profile || null);

      // Check if current student already applied
      const match = (appsRes.applications || []).find((app) => {
        const driveId = typeof app.drive === 'object' ? app.drive?._id : app.drive;
        return driveId === id;
      });
      setExistingApplication(match || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Placement drive not available.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      setError('');
      setSuccess('');
      const res = await applyToDrive(id);
      setSuccess('Applied successfully! Good luck with your selection process.');
      setExistingApplication(res.application);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to apply to drive');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Drive Details">
        <Loader />
      </DashboardLayout>
    );
  }

  if (!drive) {
    return (
      <DashboardLayout title="Drive Details">
        <div className="card empty-state-box">
          <span style={{ fontSize: '2.5rem' }}>⚠️</span>
          <h4>Placement Drive Not Available</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            The requested placement drive is not available or has not been approved for campus recruitment.
          </p>
          <Link to="/student/drives" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Browse Drives
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const {
    jobTitle,
    jobRole,
    department,
    company,
    description,
    responsibilities = [],
    requiredSkills = [],
    preferredSkills = [],
    packageLPA,
    minimumCTC,
    maximumCTC,
    stipend,
    minimumCGPA,
    maxBacklogs,
    minimumTenthPercentage,
    minimumTwelfthPercentage,
    allowedBranches = [],
    eligibleDegrees = [],
    eligibleSpecializations = [],
    experienceType,
    minimumExperience,
    employmentType,
    workMode,
    workLocation,
    bondRequired,
    bondDuration,
    bondDetails,
    recruitmentRounds = [],
    additionalRequirements = [],
    driveDate,
    applicationDeadline,
    status,
  } = drive;

  const isCompleted = status === 'completed';
  const isDeadlinePassed = applicationDeadline && new Date() > new Date(applicationDeadline);

  // Detailed criteria breakdown
  const cgpaCheck = profile ? profile.cgpa >= (minimumCGPA || 0) : true;
  const backlogsCheck = profile ? profile.activeBacklogs <= (maxBacklogs !== undefined ? maxBacklogs : 99) : true;
  const tenthCheck =
    profile && minimumTenthPercentage > 0
      ? (profile.tenthPercentage !== undefined ? profile.tenthPercentage : 0) >= minimumTenthPercentage
      : true;
  const twelfthCheck =
    profile && minimumTwelfthPercentage > 0
      ? (profile.twelfthPercentage !== undefined ? profile.twelfthPercentage : 0) >= minimumTwelfthPercentage
      : true;
  const branchCheck =
    profile && allowedBranches.length > 0
      ? allowedBranches.some((b) => b.trim().toLowerCase() === (profile.branch || '').trim().toLowerCase())
      : true;

  const isFullyEligible = cgpaCheck && backlogsCheck && tenthCheck && twelfthCheck && branchCheck;

  return (
    <DashboardLayout
      title={jobTitle}
      subtitle={`Offered by ${company?.companyName || 'Company'}`}
    >
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/student/drives" style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 600 }}>
          ← Back to All Drives
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="drive-details-layout" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Main Drive Content */}
        <div style={{ flex: '1 1 65%', minWidth: '320px' }}>
          {/* Card: Header Overview */}
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>{jobTitle}</h2>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.35rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    🏢 {company?.companyName}
                  </span>
                  {company?.website && (
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.85rem', color: 'var(--primary-color)', textDecoration: 'underline' }}
                    >
                      Visit Website ↗
                    </a>
                  )}
                  {jobRole && (
                    <span className="badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                      Role: {jobRole}
                    </span>
                  )}
                  {department && (
                    <span className="badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' }}>
                      Dept: {department}
                    </span>
                  )}
                </div>
              </div>
              <span className={`status-badge status-${status}`}>
                {status.toUpperCase()}
              </span>
            </div>

            {/* Quick Arrangement Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {employmentType && (
                <span style={{ fontSize: '0.82rem', fontWeight: 600, padding: '0.25rem 0.65rem', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '4px' }}>
                  💼 {employmentType}
                </span>
              )}
              {workMode && (
                <span style={{ fontSize: '0.82rem', fontWeight: 600, padding: '0.25rem 0.65rem', backgroundColor: '#f0fdf4', color: '#15803d', borderRadius: '4px' }}>
                  📍 {workMode}
                </span>
              )}
              {workLocation && (
                <span style={{ fontSize: '0.82rem', fontWeight: 500, padding: '0.25rem 0.65rem', backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  Location: {workLocation}
                </span>
              )}
              {experienceType && (
                <span style={{ fontSize: '0.82rem', fontWeight: 500, padding: '0.25rem 0.65rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '4px' }}>
                  🎓 {experienceType === 'freshers' ? 'Freshers Eligible' : experienceType === 'both' ? 'Freshers & Experienced' : `Experienced (${minimumExperience}+ Yrs)`}
                </span>
              )}
            </div>

            {/* Key Metrics Grid */}
            <div className="drive-metric-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="drive-metric-item">
                <span className="drive-metric-label">CTC Package</span>
                <span className="drive-metric-val highlight">
                  ₹{packageLPA} LPA
                  {minimumCTC > 0 && maximumCTC > 0 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: 'normal' }}>
                      ({minimumCTC} - {maximumCTC} LPA)
                    </span>
                  )}
                </span>
              </div>
              <div className="drive-metric-item">
                <span className="drive-metric-label">Monthly Stipend</span>
                <span className="drive-metric-val">
                  {stipend > 0 ? `₹${stipend.toLocaleString()}` : 'N/A'}
                </span>
              </div>
              <div className="drive-metric-item">
                <span className="drive-metric-label">Min CGPA</span>
                <span className="drive-metric-val">{minimumCGPA > 0 ? minimumCGPA : 'No criteria'}</span>
              </div>
              <div className="drive-metric-item">
                <span className="drive-metric-label">Max Backlogs</span>
                <span className="drive-metric-val">{maxBacklogs}</span>
              </div>
            </div>

            {/* SECTION 1: Job Description */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--primary-color)' }}>
                📄 Job Overview & Scope
              </h4>
              <div style={{ whiteSpace: 'pre-line', color: 'var(--text-main)', lineHeight: 1.7, backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                {description || 'No detailed description provided by the company.'}
              </div>
            </div>

            {/* SECTION 2: Responsibilities */}
            {responsibilities && responsibilities.length > 0 && (
              <div style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--primary-color)' }}>
                  📋 Key Responsibilities
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  {responsibilities.map((resp, idx) => (
                    <li key={idx}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* SECTION 3: Skills Matrix */}
            {((requiredSkills && requiredSkills.length > 0) || (preferredSkills && preferredSkills.length > 0)) && (
              <div style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary-color)' }}>
                  🛠️ Skills & Competencies
                </h4>
                {requiredSkills && requiredSkills.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger-color)', display: 'block', marginBottom: '0.35rem' }}>
                      Mandatory / Required Skills:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {requiredSkills.map((skill, idx) => (
                        <span key={idx} style={{ padding: '0.25rem 0.6rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600 }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {preferredSkills && preferredSkills.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)', display: 'block', marginBottom: '0.35rem' }}>
                      Preferred / Desirable Skills:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {preferredSkills.map((skill, idx) => (
                        <span key={idx} style={{ padding: '0.25rem 0.6rem', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600 }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 4: Academic Criteria & Degrees */}
            <div style={{ marginBottom: '1.75rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--primary-color)' }}>
                🎓 Academic Criteria & Eligible Streams
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Minimum CGPA</strong>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{minimumCGPA > 0 ? minimumCGPA : 'No Cutoff'}</span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Max Active Backlogs</strong>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{maxBacklogs}</span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>10th Percentage Cutoff</strong>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{minimumTenthPercentage > 0 ? `${minimumTenthPercentage}%` : 'No Cutoff'}</span>
                </div>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>12th Percentage Cutoff</strong>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{minimumTwelfthPercentage > 0 ? `${minimumTwelfthPercentage}%` : 'No Cutoff'}</span>
                </div>
              </div>

              {/* Branches */}
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Eligible Branches: </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                  {allowedBranches && allowedBranches.length > 0 ? allowedBranches.join(', ') : 'All Branches Eligible'}
                </span>
              </div>

              {/* Degrees */}
              {eligibleDegrees && eligibleDegrees.length > 0 && (
                <div style={{ marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Eligible Degrees: </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{eligibleDegrees.join(', ')}</span>
                </div>
              )}

              {/* Specializations */}
              {eligibleSpecializations && eligibleSpecializations.length > 0 && (
                <div style={{ marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Specializations: </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{eligibleSpecializations.join(', ')}</span>
                </div>
              )}
            </div>

            {/* SECTION 5: Service Agreement / Bond */}
            {bondRequired && (
              <div style={{ marginBottom: '1.75rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.35rem', color: '#92400e' }}>
                  📝 Service Agreement / Employment Bond
                </h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#78350f' }}>
                  Duration: <strong>{bondDuration || 0} Months</strong>
                  {bondDetails ? ` — ${bondDetails}` : ''}
                </p>
              </div>
            )}

            {/* SECTION 6: Recruitment Rounds */}
            {recruitmentRounds && recruitmentRounds.length > 0 && (
              <div style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--primary-color)' }}>
                  🎯 Selection & Evaluation Process
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recruitmentRounds.map((round, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.6rem 0.9rem',
                        backgroundColor: 'var(--bg-color)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary-color)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontWeight: 600 }}>{round}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 7: Additional Instructions */}
            {additionalRequirements && additionalRequirements.length > 0 && (
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--primary-color)' }}>
                  ℹ️ Additional Instructions & Guidelines
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  {additionalRequirements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Eligibility Analyzer & Apply Action */}
        <div style={{ flex: '1 1 30%', minWidth: '280px' }}>
          {/* Eligibility Card */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Your Eligibility Status
            </h4>

            {profile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="eligibility-check-item">
                  <span>{cgpaCheck ? '✅' : '❌'}</span>
                  <div>
                    <strong>CGPA:</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Cutoff: {minimumCGPA || 0} | Yours: {profile.cgpa}
                    </div>
                  </div>
                </div>

                <div className="eligibility-check-item">
                  <span>{backlogsCheck ? '✅' : '❌'}</span>
                  <div>
                    <strong>Active Backlogs:</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Max Allowed: {maxBacklogs} | Yours: {profile.activeBacklogs}
                    </div>
                  </div>
                </div>

                {minimumTenthPercentage > 0 && (
                  <div className="eligibility-check-item">
                    <span>{tenthCheck ? '✅' : '❌'}</span>
                    <div>
                      <strong>10th Percentage:</strong>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Cutoff: {minimumTenthPercentage}% | Yours: {profile.tenthPercentage ?? 0}%
                      </div>
                    </div>
                  </div>
                )}

                {minimumTwelfthPercentage > 0 && (
                  <div className="eligibility-check-item">
                    <span>{twelfthCheck ? '✅' : '❌'}</span>
                    <div>
                      <strong>12th Percentage:</strong>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Cutoff: {minimumTwelfthPercentage}% | Yours: {profile.twelfthPercentage ?? 0}%
                      </div>
                    </div>
                  </div>
                )}

                <div className="eligibility-check-item">
                  <span>{branchCheck ? '✅' : '❌'}</span>
                  <div>
                    <strong>Branch Eligibility:</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {allowedBranches.length > 0 ? allowedBranches.join(', ') : 'All Branches'}
                      <br />
                      Yours: <strong>{profile.branch || 'Not Set'}</strong>
                    </div>
                  </div>
                </div>

                <div className="eligibility-check-item">
                  <span>{!isDeadlinePassed ? '✅' : '❌'}</span>
                  <div>
                    <strong>Application Deadline:</strong>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {applicationDeadline ? new Date(applicationDeadline).toLocaleString() : 'Open'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Please configure your student profile to evaluate eligibility.
              </p>
            )}
          </div>

          {/* Action Box */}
          <div className="card">
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Application Action
            </h4>

            {existingApplication ? (
              <div>
                <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                  <strong>Already Applied</strong>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    Current Status: <strong>{existingApplication.status}</strong>
                  </div>
                </div>
                <Link
                  to={`/student/applications/${existingApplication._id}`}
                  className="btn btn-outline"
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  View Application Status →
                </Link>
              </div>
            ) : isCompleted || isDeadlinePassed ? (
              <div className="alert alert-danger" style={{ margin: 0 }}>
                This drive is no longer accepting applications (Deadline Passed or Closed).
              </div>
            ) : !isFullyEligible ? (
              <div>
                <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                  You do not meet the minimum eligibility criteria set by {company?.companyName}.
                </div>
                <button disabled className="btn btn-outline" style={{ width: '100%' }}>
                  Not Eligible to Apply
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  By applying, your academic profile and credentials will be transmitted directly to the campus recruitment coordinator.
                </p>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem' }}
                >
                  {applying ? 'Submitting Application...' : '🚀 Submit Application'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DriveDetailsPage;
