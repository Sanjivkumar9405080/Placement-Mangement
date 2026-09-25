import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getAllCompanies, approveCompany } from '../../api/adminApi';

const ManageCompaniesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilter = searchParams.get('filter');

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companies, setCompanies] = useState([]);
  const [statusFilter, setStatusFilter] = useState(
    urlFilter === 'pending' ? 'PENDING' : urlFilter === 'approved' ? 'APPROVED' : 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState('');

  // View Dossier Modal State
  const [viewingCompany, setViewingCompany] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (urlFilter === 'pending') {
      setStatusFilter('PENDING');
    } else if (urlFilter === 'approved') {
      setStatusFilter('APPROVED');
    }
  }, [urlFilter]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllCompanies();
      setCompanies(data.companies || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch company records');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (companyId, companyName, currentStatus) => {
    const nextStatus = !currentStatus;
    const actionWord = nextStatus ? 'approve' : 'revoke approval for';
    const confirmed = window.confirm(
      `Are you sure you want to ${actionWord} "${companyName}"?\n\n` +
        (nextStatus
          ? 'Once approved, the recruiter will be authorized to create and post campus placement drives.'
          : 'Once revoked, the recruiter will be blocked from posting new placement drives.')
    );
    if (!confirmed) return;

    try {
      setUpdatingId(companyId);
      setError('');
      setSuccess('');

      const res = await approveCompany(companyId, nextStatus);
      setSuccess(`Company "${companyName}" ${nextStatus ? 'approved' : 'approval revoked'} successfully.`);

      // Update in local state
      setCompanies((prev) =>
        prev.map((c) =>
          c._id === companyId
            ? { ...c, isApproved: res.company?.isApproved ?? nextStatus }
            : c
        )
      );

      if (viewingCompany && viewingCompany._id === companyId) {
        setViewingCompany((prev) => ({
          ...prev,
          isApproved: res.company?.isApproved ?? nextStatus,
        }));
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update company approval status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Manage Corporate Partners">
        <Loader />
      </DashboardLayout>
    );
  }

  const filteredCompanies = companies.filter((comp) => {
    // 1. Status Filter
    if (statusFilter === 'APPROVED' && !comp.isApproved) return false;
    if (statusFilter === 'PENDING' && comp.isApproved) return false;

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cName = comp.companyName?.toLowerCase() || '';
      const rName = comp.user?.name?.toLowerCase() || '';
      const ind = comp.industry?.toLowerCase() || '';
      const email = comp.user?.email?.toLowerCase() || '';
      const hrEmail = comp.hrEmail?.toLowerCase() || '';
      if (
        !cName.includes(q) &&
        !rName.includes(q) &&
        !ind.includes(q) &&
        !email.includes(q) &&
        !hrEmail.includes(q)
      ) {
        return false;
      }
    }

    return true;
  });

  const pendingCount = companies.filter((c) => !c.isApproved).length;
  const approvedCount = companies.filter((c) => c.isApproved).length;

  return (
    <DashboardLayout
      title="Corporate Partners & Recruiter Authorization"
      subtitle="Verify corporate credentials, manage drive-posting authorization, and inspect recruitment portfolios."
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter and Search Controls */}
      <div className="card filter-bar-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div className="filter-controls-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 260px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Search by Company, Recruiter, Email, or Industry
            </label>
            <input
              type="text"
              placeholder="e.g. Acme Software, Jane Recruiter, Tech..."
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Approval Status Filter
            </label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                if (e.target.value === 'PENDING') setSearchParams({ filter: 'pending' });
                else if (e.target.value === 'APPROVED') setSearchParams({ filter: 'approved' });
                else setSearchParams({});
              }}
            >
              <option value="ALL">All Companies ({companies.length})</option>
              <option value="PENDING">Pending Approval ({pendingCount})</option>
              <option value="APPROVED">Approved ({approvedCount})</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredCompanies.length}</strong> company record{filteredCompanies.length !== 1 ? 's' : ''}
          {pendingCount > 0 && (
            <span style={{ marginLeft: '1rem', color: '#b45309', fontWeight: 600 }}>
              ⚠️ {pendingCount} Pending Verification
            </span>
          )}
        </span>
      </div>

      {filteredCompanies.length === 0 ? (
        <div className="card empty-state-box" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🏢</span>
          <h4>No Companies Found</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            No registered company accounts match your current search and filter settings.
          </p>
        </div>
      ) : (
        <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Company</th>
                <th style={{ padding: '0.85rem 1rem' }}>Recruiter</th>
                <th style={{ padding: '0.85rem 1rem' }}>Industry</th>
                <th style={{ padding: '0.85rem 1rem' }}>HR Contact</th>
                <th style={{ padding: '0.85rem 1rem' }}>Drives</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((comp) => {
                const user = comp.user || {};
                const isApproved = comp.isApproved === true;

                return (
                  <tr key={comp._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong style={{ fontSize: '0.92rem' }}>{comp.companyName}</strong>
                      {comp.website && (
                        <div>
                          <a
                            href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--primary-color)', fontSize: '0.78rem' }}
                          >
                            {comp.website.replace(/^https?:\/\//, '')} ↗
                          </a>
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong>{user.name || 'Recruiter'}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {user.email}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="branch-tag" style={{ fontSize: '0.75rem' }}>{comp.industry || 'IT / Tech'}</span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem' }}>
                      <div>{comp.hrName || '-'}</div>
                      {comp.hrEmail && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          ✉️ {comp.hrEmail}
                        </div>
                      )}
                      {comp.hrPhone && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          📞 {comp.hrPhone}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                        {comp.drivesCount || 0}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {isApproved ? (
                        <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.25rem 0.6rem' }}>
                          🟢 Approved
                        </span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.25rem 0.6rem' }}>
                          🟡 Pending Review
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setViewingCompany(comp)}
                          className="btn btn-outline"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          View
                        </button>

                        {isApproved ? (
                          <button
                            type="button"
                            onClick={() => handleToggleApproval(comp._id, comp.companyName, isApproved)}
                            disabled={updatingId === comp._id}
                            className="btn btn-danger"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                            title="Revoke drive posting access"
                          >
                            {updatingId === comp._id ? 'Updating...' : 'Revoke'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleApproval(comp._id, comp.companyName, isApproved)}
                            disabled={updatingId === comp._id}
                            className="btn btn-primary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', backgroundColor: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                            title="Approve for campus drives"
                          >
                            {updatingId === comp._id ? 'Approving...' : '✓ Approve'}
                          </button>
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

      {/* VIEW COMPANY DOSSIER MODAL */}
      {viewingCompany && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '600px',
              width: '100%',
              backgroundColor: '#fff',
              borderRadius: '10px',
              padding: '1.75rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{viewingCompany.companyName}</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Industry: {viewingCompany.industry || 'Technology'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingCompany(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Approval Status:</span>
              {viewingCompany.isApproved ? (
                <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
                  🟢 Approved Campus Recruiter
                </span>
              ) : (
                <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
                  🟡 Pending TPO Verification
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Primary Recruiter</span>
                <strong>{viewingCompany.user?.name}</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{viewingCompany.user?.email}</div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>HR Contact</span>
                <strong>{viewingCompany.hrName || 'N/A'}</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {viewingCompany.hrEmail} {viewingCompany.hrPhone ? `• ${viewingCompany.hrPhone}` : ''}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Headquarters / Location</span>
                <strong>{viewingCompany.location || 'Not Specified'}</strong>
              </div>

              <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Placement Drives</span>
                <strong style={{ color: 'var(--primary-color)' }}>{viewingCompany.drivesCount || 0} Drives</strong>
              </div>
            </div>

            {viewingCompany.website && (
              <div style={{ marginBottom: '1rem', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Official Website: </span>
                <a
                  href={viewingCompany.website.startsWith('http') ? viewingCompany.website : `https://${viewingCompany.website}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}
                >
                  {viewingCompany.website} ↗
                </a>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Company Overview & Profile:
              </span>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6, backgroundColor: 'var(--bg-color)', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                {viewingCompany.description || 'No corporate description provided.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setViewingCompany(null)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Close
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link
                  to={`/admin/drives?company=${viewingCompany._id}`}
                  className="btn btn-outline"
                  style={{ fontSize: '0.85rem' }}
                >
                  View Drives ({viewingCompany.drivesCount || 0})
                </Link>

                {viewingCompany.isApproved ? (
                  <button
                    type="button"
                    onClick={() => handleToggleApproval(viewingCompany._id, viewingCompany.companyName, true)}
                    className="btn btn-danger"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Revoke Approval
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggleApproval(viewingCompany._id, viewingCompany.companyName, false)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem', backgroundColor: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                  >
                    ✓ Approve Company
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageCompaniesPage;
