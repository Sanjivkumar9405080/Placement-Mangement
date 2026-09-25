import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getCompanyProfile } from '../../api/companyApi';

const CompanyProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getCompanyProfile();
      setProfileData(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Company Profile">
        <Loader />
      </DashboardLayout>
    );
  }

  const user = profileData?.user || {};
  const profile = profileData?.profile || {};
  const isApproved = profile.isApproved === true;

  return (
    <DashboardLayout
      title="Company Profile & Verification"
      subtitle="Corporate overview, recruiter contact details, and institutional verification status."
    >
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ maxWidth: '850px', margin: '0 auto' }}>
        {/* Verification Status Header Banner */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
              {profile.companyName || user.name || 'Company Profile'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
              Registered corporate recruitment partner
            </p>
          </div>
          <div>
            {isApproved ? (
              <span className="status-badge status-active">
                ✅ Approved by TPO
              </span>
            ) : (
              <span className="status-badge status-shortlisted">
                ⏳ Pending Admin Approval
              </span>
            )}
          </div>
        </div>

        {/* Notice regarding API update capability as mandated by prompt */}
        <div
          className="alert alert-danger"
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            marginBottom: '1.5rem',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>ℹ️</span>
          <span>Company profile update API is not currently available. Fields below reflect official registered records.</span>
        </div>

        {/* Account & Recruiter Details */}
        <div className="form-section-title">👤 Recruiter Account Credentials</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Recruiter Name</label>
            <input
              type="text"
              className="form-control"
              value={user.name || ''}
              disabled
              style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address (Login ID)</label>
            <input
              type="email"
              className="form-control"
              value={user.email || ''}
              disabled
              style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
            />
            <span className="form-hint">Immutable account identifier</span>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Account Role</label>
            <input
              type="text"
              className="form-control"
              value={user.role || 'company'}
              disabled
              style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">User ID</label>
            <input
              type="text"
              className="form-control"
              value={user._id || ''}
              disabled
              style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
            />
          </div>
        </div>

        {/* Corporate Profile Details */}
        <div className="form-section-title">🏢 Corporate Organization Profile</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              type="text"
              className="form-control"
              value={profile.companyName || ''}
              disabled
              style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Website</label>
            <input
              type="text"
              className="form-control"
              value={profile.website || ''}
              disabled
              style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Industry / Sector</label>
          <input
            type="text"
            className="form-control"
            value={profile.industry || 'Information Technology'}
            disabled
            style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
          />
        </div>

        {/* HR Representative Details */}
        <div className="form-section-title">📞 Human Resources (HR) Point of Contact</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">HR Contact Name</label>
            <input
              type="text"
              className="form-control"
              value={profile.hrName || ''}
              disabled
              style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">HR Official Email</label>
            <input
              type="email"
              className="form-control"
              value={profile.hrEmail || ''}
              disabled
              style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">HR Phone Number</label>
          <input
            type="text"
            className="form-control"
            value={profile.hrPhone || ''}
            disabled
            style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyProfilePage;
