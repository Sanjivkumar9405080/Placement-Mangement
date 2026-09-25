import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getMyApplications } from '../../api/applicationApi';

const MyApplicationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyApplications();
      setApplications(data.applications || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch your applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Applied':
        return <span className="status-badge status-applied">Applied</span>;
      case 'Shortlisted':
        return <span className="status-badge status-shortlisted">Shortlisted</span>;
      case 'Interview':
        return <span className="status-badge status-interview">Interview</span>;
      case 'Selected':
        return <span className="status-badge status-selected">🎉 Selected</span>;
      case 'Rejected':
        return <span className="status-badge status-rejected">Rejected</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'IN_PROGRESS') {
      return ['Applied', 'Shortlisted', 'Interview'].includes(app.status);
    }
    return app.status === statusFilter;
  });

  return (
    <DashboardLayout
      title="My Campus Applications"
      subtitle="Track your application statuses, review drive details, and monitor interview calls."
    >
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter Tabs */}
      <div className="role-tabs" style={{ maxWidth: '650px', marginBottom: '1.5rem' }}>
        <button
          className={`role-tab ${statusFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setStatusFilter('ALL')}
        >
          All ({applications.length})
        </button>
        <button
          className={`role-tab ${statusFilter === 'IN_PROGRESS' ? 'active' : ''}`}
          onClick={() => setStatusFilter('IN_PROGRESS')}
        >
          In Progress ({applications.filter((a) => ['Applied', 'Shortlisted', 'Interview'].includes(a.status)).length})
        </button>
        <button
          className={`role-tab ${statusFilter === 'Selected' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Selected')}
        >
          Selected ({applications.filter((a) => a.status === 'Selected').length})
        </button>
        <button
          className={`role-tab ${statusFilter === 'Rejected' ? 'active' : ''}`}
          onClick={() => setStatusFilter('Rejected')}
        >
          Rejected ({applications.filter((a) => a.status === 'Rejected').length})
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : filteredApplications.length === 0 ? (
        <div className="card empty-state-box">
          <span style={{ fontSize: '2.5rem' }}>📄</span>
          <h4>No Applications Found</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            {statusFilter === 'ALL'
              ? 'You have not submitted applications to any campus placement drives yet.'
              : `No applications match the '${statusFilter}' filter.`}
          </p>
          <Link to="/student/drives" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Explore Available Drives
          </Link>
        </div>
      ) : (
        <div className="applications-list">
          {filteredApplications.map((app) => {
            const drive = app.drive || {};
            const company = drive.company || {};

            return (
              <div key={app._id} className="card application-item-card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      🏢 {company.companyName || 'Campus Partner'}
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.2rem 0' }}>
                      {drive.jobTitle || 'Role'}
                    </h3>
                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span>💰 CTC: <strong>₹{drive.packageLPA} LPA</strong></span>
                      <span>📅 Applied On: <strong>{new Date(app.createdAt).toLocaleDateString()}</strong></span>
                      {drive.driveDate && (
                        <span>📆 Drive Date: <strong>{new Date(drive.driveDate).toLocaleDateString()}</strong></span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                    {getStatusBadge(app.status)}
                    <Link
                      to={`/student/applications/${app._id}`}
                      className="btn btn-outline"
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem' }}
                    >
                      Track Application →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyApplicationsPage;
