import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getAllStudents } from '../../api/adminApi';

const BRANCH_OPTIONS = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'AI_DS', 'MCA'];

const ManageStudentsPage = () => {
  const [searchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);

  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [minCgpaFilter, setMinCgpaFilter] = useState('');

  // Selected student quick result
  const [highlightedStudent, setHighlightedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
    if (searchParams.get('focusSearch') === 'true' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [branchFilter, minCgpaFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (branchFilter) params.branch = branchFilter;
      if (minCgpaFilter) params.minCGPA = minCgpaFilter;
      if (searchInput.trim()) params.search = searchInput.trim();

      const data = await getAllStudents(params);
      const studentList = data.students || [];
      setStudents(studentList);

      // If user performed a search, highlight exact or top match
      if (searchInput.trim() && studentList.length > 0) {
        setHighlightedStudent(studentList[0]);
      } else {
        setHighlightedStudent(null);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch student records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setBranchFilter('');
    setMinCgpaFilter('');
    setHighlightedStudent(null);
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getAllStudents({});
        setStudents(data.students || []);
      } catch (err) {
        setError('Failed to reload students');
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <DashboardLayout
      title="Student Directory & Placement Tracking"
      subtitle="Search candidates by Roll Number, monitor placement participation, and inspect individual academic histories."
    >
      {error && <div className="alert alert-danger">{error}</div>}

      {/* DEDICATED STUDENT SEARCH BAR (ROLL NUMBER PRIMARY) */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          padding: '1.5rem',
          backgroundColor: '#fff',
          borderLeft: '4px solid var(--primary-color)',
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-color)' }}>
          🔍 Search Student by Roll Number, Name, or Email
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
          Enter an exact Roll Number (e.g. <code>2026CSE101</code>) or candidate name to locate profile and application records immediately.
        </p>

        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '3 1 300px' }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Enter Roll Number / Name / Email..."
                className="form-control"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ fontSize: '0.95rem', padding: '0.65rem 1rem' }}
              />
            </div>

            <div style={{ flex: '1 1 140px' }}>
              <select
                className="form-control"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                style={{ fontSize: '0.9rem', padding: '0.65rem' }}
              >
                <option value="">All Branches</option>
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: '1 1 120px' }}>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="Min CGPA"
                className="form-control"
                value={minCgpaFilter}
                onChange={(e) => setMinCgpaFilter(e.target.value)}
                style={{ fontSize: '0.9rem', padding: '0.65rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', whiteSpace: 'nowrap' }}>
                Search Student
              </button>
              {(searchInput || branchFilter || minCgpaFilter) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn btn-outline"
                  style={{ padding: '0.65rem 1rem', whiteSpace: 'nowrap' }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* HIGHLIGHTED STUDENT SEARCH RESULT CARD */}
      {highlightedStudent && (
        <div
          className="card"
          style={{
            marginBottom: '1.75rem',
            padding: '1.5rem',
            backgroundColor: '#f8fafc',
            border: '1.5px solid var(--primary-color)',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-color)', display: 'block' }}>
                ⭐ Verified Student Match
              </span>
              <h3 style={{ margin: '0.2rem 0', fontSize: '1.3rem' }}>
                {highlightedStudent.user?.name}
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Roll Number: <strong style={{ color: 'var(--primary-color)' }}>{highlightedStudent.rollNumber}</strong> • Email: {highlightedStudent.user?.email}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                to={`/admin/students/${highlightedStudent._id}`}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                View Full Profile & History →
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div style={{ backgroundColor: '#fff', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Branch</span>
              <strong>{highlightedStudent.branch}</strong>
            </div>
            <div style={{ backgroundColor: '#fff', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>CGPA</span>
              <strong style={{ color: 'var(--primary-color)' }}>{highlightedStudent.cgpa} / 10</strong>
            </div>
            <div style={{ backgroundColor: '#fff', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Active Backlogs</span>
              <strong style={{ color: highlightedStudent.activeBacklogs > 0 ? 'var(--danger-color)' : 'inherit' }}>
                {highlightedStudent.activeBacklogs}
              </strong>
            </div>
            <div style={{ backgroundColor: '#fff', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Total Applications</span>
              <strong>{highlightedStudent.applicationCount || 0}</strong>
            </div>
            <div style={{ backgroundColor: '#fff', padding: '0.6rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Offers (Selected)</span>
              <strong style={{ color: '#15803d' }}>{highlightedStudent.selectedCount || 0}</strong>
            </div>
          </div>

          {highlightedStudent.skills && highlightedStudent.skills.length > 0 && (
            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>Skills:</span>
              <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.35rem', verticalAlign: 'middle' }}>
                {highlightedStudent.skills.map((s, idx) => (
                  <span key={idx} style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem', backgroundColor: '#e0e7ff', color: '#3730a3', borderRadius: '4px', fontWeight: 600 }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STUDENT ROSTER TABLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Showing <strong>{students.length}</strong> candidate record{students.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <Loader />
      ) : students.length === 0 ? (
        <div className="card empty-state-box" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>🎓</span>
          <h4>No Students Found</h4>
          <p style={{ color: 'var(--text-muted)' }}>
            No registered student records match the specified search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Candidate</th>
                <th style={{ padding: '0.85rem 1rem' }}>Roll Number</th>
                <th style={{ padding: '0.85rem 1rem' }}>Branch</th>
                <th style={{ padding: '0.85rem 1rem' }}>CGPA</th>
                <th style={{ padding: '0.85rem 1rem' }}>10th / 12th %</th>
                <th style={{ padding: '0.85rem 1rem' }}>Backlogs</th>
                <th style={{ padding: '0.85rem 1rem' }}>Applications</th>
                <th style={{ padding: '0.85rem 1rem' }}>Offers</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const user = student.user || {};

                return (
                  <tr key={student._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong>{user.name || 'Candidate'}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {user.email}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <strong style={{ color: 'var(--primary-color)' }}>{student.rollNumber || 'N/A'}</strong>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="branch-tag" style={{ fontSize: '0.75rem' }}>{student.branch || 'N/A'}</span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                        {student.cgpa !== undefined ? student.cgpa : 'N/A'}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem' }}>
                      {student.tenthPercentage !== undefined ? `${student.tenthPercentage}%` : '-'} /{' '}
                      {student.twelfthPercentage !== undefined ? `${student.twelfthPercentage}%` : '-'}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span
                        style={{
                          fontWeight: student.activeBacklogs > 0 ? 700 : 400,
                          color: student.activeBacklogs > 0 ? 'var(--danger-color)' : 'inherit',
                        }}
                      >
                        {student.activeBacklogs || 0}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontWeight: 600 }}>{student.applicationCount || 0}</span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontWeight: 700, color: student.selectedCount > 0 ? 'var(--success-color)' : 'var(--text-muted)' }}>
                        {student.selectedCount || 0}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <Link
                        to={`/admin/students/${student._id}`}
                        className="btn btn-outline"
                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}
                      >
                        View Profile →
                      </Link>
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

export default ManageStudentsPage;
