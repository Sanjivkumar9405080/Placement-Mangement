import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getApplicationById } from '../../api/applicationApi';

const ApplicationDetailsPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [application, setApplication] = useState(null);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getApplicationById(id);
      setApplication(data.application || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch application details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Application Details">
        <Loader />
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout title="Application Details">
        <div className="card empty-state-box">
          <span style={{ fontSize: '2.5rem' }}>⚠️</span>
          <h4>Application Not Found</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            The requested application does not exist or you do not have permission to view it.
          </p>
          <Link to="/student/applications" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to My Applications
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { status, createdAt, updatedAt, drive } = application;
  const company = drive?.company || {};

  // Stepper timeline
  const stages = ['Applied', 'Shortlisted', 'Interview', 'Selected'];
  const isRejected = status === 'Rejected';

  const getStageIndex = (currentStatus) => {
    return stages.indexOf(currentStatus);
  };

  const currentIndex = getStageIndex(status);

  return (
    <DashboardLayout
      title="Application Status Tracker"
      subtitle={`Application for ${drive?.jobTitle || 'Role'} at ${company.companyName || 'Company'}`}
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/student/applications" style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 600 }}>
          ← Back to All Applications
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Status Progress Stepper */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          Recruitment Progress Timeline
        </h3>

        {isRejected ? (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>❌</span>
            <div>
              <strong>Application Status: Rejected</strong>
              <div style={{ fontSize: '0.85rem' }}>
                Unfortunately, your application was not selected for further rounds. Keep applying to other available drives!
              </div>
            </div>
          </div>
        ) : (
          <div className="stepper-track">
            {stages.map((stage, idx) => {
              const isPassed = currentIndex >= idx;
              const isCurrent = currentIndex === idx;

              return (
                <div key={stage} className={`stepper-step ${isPassed ? 'passed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="stepper-circle">
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <div className="stepper-label">{stage}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Application & Drive Details */}
      <div className="form-row">
        <div className="card" style={{ flex: 1 }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Application Summary
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Application ID:</span>
              <br />
              <code style={{ fontSize: '0.85rem', backgroundColor: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px' }}>
                {application._id}
              </code>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
              <br />
              <span className={`status-badge status-${status.toLowerCase()}`}>
                {status}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Applied At:</span>
              <br />
              <strong>{new Date(createdAt).toLocaleString()}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Last Updated:</span>
              <br />
              <strong>{new Date(updatedAt).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="card" style={{ flex: 1.5 }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Placement Drive Information
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Role / Title:</span>
              <br />
              <strong>{drive?.jobTitle}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Company:</span>
              <br />
              <strong>{company.companyName}</strong> {company.website && `(${company.website})`}
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Compensation (CTC):</span>
              <br />
              <strong style={{ color: 'var(--primary-color)', fontSize: '1.05rem' }}>₹{drive?.packageLPA} LPA</strong>
            </div>
            {drive?.recruitmentRounds && drive.recruitmentRounds.length > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Evaluation Rounds:</span>
                <br />
                <span>{drive.recruitmentRounds.join(' → ')}</span>
              </div>
            )}
            <div style={{ marginTop: '0.5rem' }}>
              <Link to={`/student/drives/${drive?._id}`} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
                View Original Drive Page →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationDetailsPage;
