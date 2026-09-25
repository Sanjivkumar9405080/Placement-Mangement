import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getDriveById, updateDrive } from '../../api/driveApi';
import { getCompanyProfile } from '../../api/companyApi';

const AVAILABLE_BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'AI_DS', 'MCA'];
const AVAILABLE_DEGREES = ['B.Tech', 'B.E.', 'MCA', 'M.Tech', 'BCA', 'B.Sc'];

const EditDrivePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Section 1: Job Info
    jobTitle: '',
    jobRole: '',
    department: '',
    description: '',
    // Section 2: Responsibilities
    responsibilities: [],
    // Section 3: Skills
    requiredSkills: [],
    preferredSkills: [],
    // Section 4: Academic Criteria
    minimumCGPA: 0,
    maxBacklogs: 0,
    minimumTenthPercentage: 0,
    minimumTwelfthPercentage: 0,
    allowedBranches: [],
    eligibleDegrees: [],
    eligibleSpecializations: [],
    // Section 5: Experience & Arrangement
    experienceType: 'freshers',
    minimumExperience: 0,
    employmentType: 'Full Time',
    workMode: 'On-site',
    workLocation: '',
    // Section 6: Compensation & Bond
    packageLPA: '',
    minimumCTC: '',
    maximumCTC: '',
    stipend: '',
    bondRequired: false,
    bondDuration: 0,
    bondDetails: '',
    // Section 7: Process & Schedule
    recruitmentRounds: [],
    additionalRequirements: [],
    driveDate: '',
    applicationDeadline: '',
    status: 'upcoming',
  });

  // Local builder inputs
  const [newRespInput, setNewRespInput] = useState('');
  const [newReqSkillInput, setNewReqSkillInput] = useState('');
  const [newPrefSkillInput, setNewPrefSkillInput] = useState('');
  const [newSpecInput, setNewSpecInput] = useState('');
  const [newRoundInput, setNewRoundInput] = useState('');
  const [newReqNoteInput, setNewReqNoteInput] = useState('');

  useEffect(() => {
    fetchDrive();
  }, [id]);

  const fetchDrive = async () => {
    try {
      setLoading(true);
      setError('');

      const [driveRes, compRes] = await Promise.all([
        getDriveById(id),
        getCompanyProfile().catch(() => null),
      ]);

      const drive = driveRes.drive;
      if (!drive) {
        setError('Drive not found');
        return;
      }

      // Check ownership
      const currentCompanyId = compRes?.profile?._id;
      const driveCompanyId = typeof drive.company === 'object' ? drive.company?._id : drive.company;
      if (currentCompanyId && driveCompanyId && currentCompanyId.toString() !== driveCompanyId.toString()) {
        setError('Forbidden: You are not authorized to edit another company’s drive');
        return;
      }

      // Format ISO dates to datetime-local input string YYYY-MM-DDTHH:mm
      const formatForInput = (d) => {
        if (!d) return '';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
          date.getHours()
        )}:${pad(date.getMinutes())}`;
      };

      setFormData({
        jobTitle: drive.jobTitle || '',
        jobRole: drive.jobRole || '',
        department: drive.department || '',
        description: drive.description || '',
        responsibilities: Array.isArray(drive.responsibilities) ? drive.responsibilities : [],
        requiredSkills: Array.isArray(drive.requiredSkills) ? drive.requiredSkills : [],
        preferredSkills: Array.isArray(drive.preferredSkills) ? drive.preferredSkills : [],
        minimumCGPA: drive.minimumCGPA !== undefined ? drive.minimumCGPA : 0,
        maxBacklogs: drive.maxBacklogs !== undefined ? drive.maxBacklogs : 0,
        minimumTenthPercentage: drive.minimumTenthPercentage !== undefined ? drive.minimumTenthPercentage : 0,
        minimumTwelfthPercentage: drive.minimumTwelfthPercentage !== undefined ? drive.minimumTwelfthPercentage : 0,
        allowedBranches: Array.isArray(drive.allowedBranches) ? drive.allowedBranches : [],
        eligibleDegrees: Array.isArray(drive.eligibleDegrees) ? drive.eligibleDegrees : [],
        eligibleSpecializations: Array.isArray(drive.eligibleSpecializations) ? drive.eligibleSpecializations : [],
        experienceType: drive.experienceType || 'freshers',
        minimumExperience: drive.minimumExperience !== undefined ? drive.minimumExperience : 0,
        employmentType: drive.employmentType || 'Full Time',
        workMode: drive.workMode || 'On-site',
        workLocation: drive.workLocation || '',
        packageLPA: drive.packageLPA !== undefined ? drive.packageLPA : '',
        minimumCTC: drive.minimumCTC !== undefined ? drive.minimumCTC : '',
        maximumCTC: drive.maximumCTC !== undefined ? drive.maximumCTC : '',
        stipend: drive.stipend !== undefined ? drive.stipend : '',
        bondRequired: Boolean(drive.bondRequired),
        bondDuration: drive.bondDuration !== undefined ? drive.bondDuration : 0,
        bondDetails: drive.bondDetails || '',
        recruitmentRounds: Array.isArray(drive.recruitmentRounds) ? drive.recruitmentRounds : [],
        additionalRequirements: Array.isArray(drive.additionalRequirements) ? drive.additionalRequirements : [],
        driveDate: formatForInput(drive.driveDate),
        applicationDeadline: formatForInput(drive.applicationDeadline),
        status: drive.status || 'upcoming',
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch drive details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Generic array toggle helper
  const handleToggleArrayItem = (field, item) => {
    setFormData((prev) => {
      const list = [...prev[field]];
      const idx = list.indexOf(item);
      if (idx > -1) {
        list.splice(idx, 1);
      } else {
        list.push(item);
      }
      return { ...prev, [field]: list };
    });
  };

  // Add Item to Array
  const handleAddItem = (field, inputVal, setInputFunc) => {
    if (!inputVal.trim()) return;
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], inputVal.trim()],
    }));
    setInputFunc('');
  };

  // Remove Item from Array
  const handleRemoveItem = (field, index) => {
    setFormData((prev) => {
      const list = [...prev[field]];
      list.splice(index, 1);
      return { ...prev, [field]: list };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Required field validation
    if (!formData.jobTitle.trim()) {
      setError('Job title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Job description is required');
      return;
    }

    const numPackage = Number(formData.packageLPA);
    if (isNaN(numPackage) || numPackage < 0) {
      setError('Package (LPA) must be a non-negative number');
      return;
    }

    const numCgpa = Number(formData.minimumCGPA);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      setError('Minimum CGPA must be between 0 and 10');
      return;
    }

    const numBacklogs = Number(formData.maxBacklogs);
    if (isNaN(numBacklogs) || numBacklogs < 0) {
      setError('Max backlogs cannot be negative');
      return;
    }

    const num10th = Number(formData.minimumTenthPercentage);
    if (isNaN(num10th) || num10th < 0 || num10th > 100) {
      setError('Minimum 10th percentage must be between 0 and 100');
      return;
    }

    const num12th = Number(formData.minimumTwelfthPercentage);
    if (isNaN(num12th) || num12th < 0 || num12th > 100) {
      setError('Minimum 12th percentage must be between 0 and 100');
      return;
    }

    // Date validations
    if (formData.applicationDeadline && formData.driveDate) {
      const deadlineDate = new Date(formData.applicationDeadline);
      const driveDateTime = new Date(formData.driveDate);
      if (deadlineDate > driveDateTime) {
        setError('Application deadline cannot be after the scheduled drive date');
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        jobTitle: formData.jobTitle.trim(),
        jobRole: formData.jobRole.trim(),
        department: formData.department.trim(),
        description: formData.description.trim(),
        responsibilities: formData.responsibilities,
        requiredSkills: formData.requiredSkills,
        preferredSkills: formData.preferredSkills,
        minimumCGPA: numCgpa,
        maxBacklogs: numBacklogs,
        minimumTenthPercentage: num10th,
        minimumTwelfthPercentage: num12th,
        allowedBranches: formData.allowedBranches,
        eligibleDegrees: formData.eligibleDegrees,
        eligibleSpecializations: formData.eligibleSpecializations,
        experienceType: formData.experienceType,
        minimumExperience: Number(formData.minimumExperience) || 0,
        employmentType: formData.employmentType,
        workMode: formData.workMode,
        workLocation: formData.workLocation.trim(),
        packageLPA: numPackage,
        minimumCTC: formData.minimumCTC ? Number(formData.minimumCTC) : 0,
        maximumCTC: formData.maximumCTC ? Number(formData.maximumCTC) : 0,
        stipend: formData.stipend ? Number(formData.stipend) : 0,
        bondRequired: Boolean(formData.bondRequired),
        bondDuration: formData.bondRequired ? Number(formData.bondDuration) || 0 : 0,
        bondDetails: formData.bondRequired ? formData.bondDetails.trim() : '',
        recruitmentRounds: formData.recruitmentRounds,
        additionalRequirements: formData.additionalRequirements,
        driveDate: formData.driveDate ? formData.driveDate : undefined,
        applicationDeadline: formData.applicationDeadline ? formData.applicationDeadline : undefined,
        status: formData.status,
      };

      await updateDrive(id, payload);
      setSuccess('Placement drive updated successfully and resubmitted for admin review.');
      setTimeout(() => {
        navigate('/company/drives');
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update placement drive');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Edit Placement Drive">
        <Loader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Edit Placement Drive & Role Specifications"
      subtitle="Modify job criteria, responsibilities, compensation details, and schedule."
    >
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/company/drives" style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 600 }}>
          ← Back to Manage Drives
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Drive Re-Approval Notice */}
      <div
        className="alert"
        style={{
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          color: '#92400e',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          padding: '1rem 1.25rem',
          borderRadius: '8px',
        }}
      >
        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚠️</span>
        <div style={{ fontSize: '0.88rem' }}>
          <strong>Drive Re-Approval Policy:</strong>
          <p style={{ margin: '0.25rem 0 0' }}>
            Saving edits to this placement drive will automatically set its approval status to <strong>Pending Approval</strong>.
            The Admin / TPO must re-verify and approve the updated specifications before students can view or apply to it.
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          {/* SECTION 1: JOB INFORMATION */}
          <div className="form-section-title" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
            1. 📌 Job Role & Organizational Information
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                Job Title <span className="req">*</span>
              </label>
              <input
                type="text"
                name="jobTitle"
                className="form-control"
                placeholder="e.g. Software Engineer, Data Analyst"
                value={formData.jobTitle}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Job Role / Designation</label>
              <input
                type="text"
                name="jobRole"
                className="form-control"
                placeholder="e.g. Full Stack Developer, ML Engineer"
                value={formData.jobRole}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department / Team</label>
              <input
                type="text"
                name="department"
                className="form-control"
                placeholder="e.g. Engineering, Core Analytics, QA"
                value={formData.department}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label className="form-label">
              Role Description & Mission <span className="req">*</span>
            </label>
            <textarea
              name="description"
              className="form-control"
              rows="4"
              placeholder="Provide an overview of the position, team mission, and the impact the candidate will have..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* SECTION 2: RESPONSIBILITIES */}
          <div className="form-section-title" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2rem', marginBottom: '1.25rem' }}>
            2. 📋 Core Job Responsibilities
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
            Add specific day-to-day duties and expectations for this role:
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Build and optimize RESTful APIs in Node.js"
              value={newRespInput}
              onChange={(e) => setNewRespInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem('responsibilities', newRespInput, setNewRespInput);
                }
              }}
            />
            <button
              type="button"
              onClick={() => handleAddItem('responsibilities', newRespInput, setNewRespInput)}
              className="btn btn-outline"
              style={{ whiteSpace: 'nowrap' }}
            >
              + Add
            </button>
          </div>

          {formData.responsibilities.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
              {formData.responsibilities.map((resp, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.85rem',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.88rem',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>•</span>
                    {resp}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('responsibilities', idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
              No specific responsibilities added yet.
            </div>
          )}

          {/* SECTION 3: SKILLS MATRIX */}
          <div className="form-section-title" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2rem', marginBottom: '1.25rem' }}>
            3. 🛠️ Skills Matrix & Competencies
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Required Skills */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--danger-color)' }}>
                Required / Mandatory Skills
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. React, Python, SQL"
                  value={newReqSkillInput}
                  onChange={(e) => setNewReqSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem('requiredSkills', newReqSkillInput, setNewReqSkillInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddItem('requiredSkills', newReqSkillInput, setNewReqSkillInput)}
                  className="btn btn-outline"
                >
                  Add
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', minHeight: '36px' }}>
                {formData.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.65rem',
                      backgroundColor: '#fee2e2',
                      color: '#991b1b',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('requiredSkills', idx)}
                      style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Skills */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                Preferred / Nice-to-Have Skills
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Docker, AWS, GraphQL"
                  value={newPrefSkillInput}
                  onChange={(e) => setNewPrefSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem('preferredSkills', newPrefSkillInput, setNewPrefSkillInput);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAddItem('preferredSkills', newPrefSkillInput, setNewPrefSkillInput)}
                  className="btn btn-outline"
                >
                  Add
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', minHeight: '36px' }}>
                {formData.preferredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.65rem',
                      backgroundColor: '#e0e7ff',
                      color: '#3730a3',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('preferredSkills', idx)}
                      style={{ background: 'none', border: 'none', color: '#3730a3', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: ACADEMIC CRITERIA */}
          <div className="form-section-title" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2rem', marginBottom: '1.25rem' }}>
            4. 🎓 Academic Criteria & Eligibility
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Minimum CGPA (0 - 10)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                name="minimumCGPA"
                className="form-control"
                value={formData.minimumCGPA}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Maximum Backlogs</label>
              <input
                type="number"
                min="0"
                name="maxBacklogs"
                className="form-control"
                value={formData.maxBacklogs}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min 10th Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                name="minimumTenthPercentage"
                className="form-control"
                value={formData.minimumTenthPercentage}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min 12th Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                name="minimumTwelfthPercentage"
                className="form-control"
                value={formData.minimumTwelfthPercentage}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Branches */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Eligible Engineering Branches
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, allowedBranches: [...AVAILABLE_BRANCHES] }))}
                  className="btn-link"
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}
                >
                  Select All
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, allowedBranches: [] }))}
                  className="btn-link"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {AVAILABLE_BRANCHES.map((b) => {
                const sel = formData.allowedBranches.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleToggleArrayItem('allowedBranches', b)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: sel ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                      backgroundColor: sel ? 'var(--primary-color)' : 'var(--bg-color)',
                      color: sel ? '#fff' : 'var(--text-color)',
                    }}
                  >
                    {sel ? '✓ ' : '+ '}
                    {b}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Selected: {formData.allowedBranches.length > 0 ? formData.allowedBranches.join(', ') : 'All Branches Eligible'}
            </span>
          </div>

          {/* Degrees */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Eligible Degree Programs</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {AVAILABLE_DEGREES.map((deg) => {
                const sel = formData.eligibleDegrees.includes(deg);
                return (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => handleToggleArrayItem('eligibleDegrees', deg)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: sel ? '1.5px solid var(--success-color)' : '1px solid var(--border-color)',
                      backgroundColor: sel ? 'var(--success-color)' : 'var(--bg-color)',
                      color: sel ? '#fff' : 'var(--text-color)',
                    }}
                  >
                    {sel ? '✓ ' : '+ '}
                    {deg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specializations Tag Builder */}
          <div className="form-group">
            <label className="form-label">Eligible Specializations (Optional)</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Cloud Computing, Cyber Security, Robotics"
                value={newSpecInput}
                onChange={(e) => setNewSpecInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem('eligibleSpecializations', newSpecInput, setNewSpecInput);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddItem('eligibleSpecializations', newSpecInput, setNewSpecInput)}
                className="btn btn-outline"
              >
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {formData.eligibleSpecializations.map((spec, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.25rem 0.6rem',
                    backgroundColor: 'var(--bg-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.82rem',
                  }}
                >
                  {spec}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('eligibleSpecializations', idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* SECTION 5: EXPERIENCE & WORK ARRANGEMENT */}
          <div className="form-section-title" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2rem', marginBottom: '1.25rem' }}>
            5. 💼 Experience Level & Work Arrangement
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Target Experience Type</label>
              <select
                name="experienceType"
                className="form-control"
                value={formData.experienceType}
                onChange={handleChange}
              >
                <option value="freshers">Freshers Only</option>
                <option value="experienced">Experienced Only</option>
                <option value="both">Both Freshers & Experienced</option>
              </select>
            </div>

            {formData.experienceType !== 'freshers' && (
              <div className="form-group">
                <label className="form-label">Minimum Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  name="minimumExperience"
                  className="form-control"
                  value={formData.minimumExperience}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Employment Type</label>
              <select
                name="employmentType"
                className="form-control"
                value={formData.employmentType}
                onChange={handleChange}
              >
                <option value="Full Time">Full Time</option>
                <option value="Internship">Internship</option>
                <option value="Internship + Full Time">Internship + Full Time</option>
                <option value="Contractual">Contractual</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Work Mode</label>
              <select
                name="workMode"
                className="form-control"
                value={formData.workMode}
                onChange={handleChange}
              >
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Work Location(s) / Posting Office</label>
            <input
              type="text"
              name="workLocation"
              className="form-control"
              placeholder="e.g. Bangalore, Hyderabad, Pune or Pan India"
              value={formData.workLocation}
              onChange={handleChange}
            />
          </div>

          {/* SECTION 6: COMPENSATION & BOND */}
          <div className="form-section-title" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2rem', marginBottom: '1.25rem' }}>
            6. 💰 Compensation, Stipend & Service Agreement
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">
                Headline Package (CTC in LPA) <span className="req">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="packageLPA"
                className="form-control"
                placeholder="e.g. 8.5"
                value={formData.packageLPA}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min CTC (LPA, Optional)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="minimumCTC"
                className="form-control"
                placeholder="e.g. 7.0"
                value={formData.minimumCTC}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max CTC (LPA, Optional)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="maximumCTC"
                className="form-control"
                placeholder="e.g. 10.0"
                value={formData.maximumCTC}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Internship Stipend (₹)</label>
              <input
                type="number"
                min="0"
                name="stipend"
                className="form-control"
                placeholder="e.g. 25000"
                value={formData.stipend}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Service Agreement / Bond */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: formData.bondRequired ? '1rem' : 0 }}>
              <input
                type="checkbox"
                id="bondRequired"
                name="bondRequired"
                checked={formData.bondRequired}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="bondRequired" style={{ fontWeight: 600, cursor: 'pointer', margin: 0, fontSize: '0.92rem' }}>
                Service Agreement / Employment Bond Applicable
              </label>
            </div>

            {formData.bondRequired && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Bond Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    name="bondDuration"
                    className="form-control"
                    placeholder="e.g. 12 or 24"
                    value={formData.bondDuration}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Bond Terms / Breach Conditions</label>
                  <input
                    type="text"
                    name="bondDetails"
                    className="form-control"
                    placeholder="e.g. 1 Year service bond of ₹1,00,000"
                    value={formData.bondDetails}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 7: RECRUITMENT ROUNDS & SCHEDULE */}
          <div className="form-section-title" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2rem', marginBottom: '1.25rem' }}>
            7. 🪜 Selection Rounds, Schedule & Additional Rules
          </div>

          {/* Rounds */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Recruitment Process Rounds</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Add round step (e.g. Coding Assessment, Group Discussion, HR Interview)"
                value={newRoundInput}
                onChange={(e) => setNewRoundInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem('recruitmentRounds', newRoundInput, setNewRoundInput);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddItem('recruitmentRounds', newRoundInput, setNewRoundInput)}
                className="btn btn-outline"
                style={{ whiteSpace: 'nowrap' }}
              >
                + Add Round
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {formData.recruitmentRounds.map((round, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.55rem 0.85rem',
                    backgroundColor: 'var(--bg-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>
                    <strong style={{ color: 'var(--primary-color)', marginRight: '0.5rem' }}>Round {index + 1}:</strong>
                    {round}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('recruitmentRounds', index)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--danger-color)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Requirements */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Additional Instructions / Candidate Notes</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Bring 2 hard copies of resume and college ID card"
                value={newReqNoteInput}
                onChange={(e) => setNewReqNoteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem('additionalRequirements', newReqNoteInput, setNewReqNoteInput);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddItem('additionalRequirements', newReqNoteInput, setNewReqNoteInput)}
                className="btn btn-outline"
                style={{ whiteSpace: 'nowrap' }}
              >
                + Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {formData.additionalRequirements.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.75rem',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                  }}
                >
                  <span>ℹ️ {item}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('additionalRequirements', idx)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Dates & Drive Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Application Deadline</label>
              <input
                type="datetime-local"
                name="applicationDeadline"
                className="form-control"
                value={formData.applicationDeadline}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Drive Commencement Date</label>
              <input
                type="datetime-local"
                name="driveDate"
                className="form-control"
                value={formData.driveDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Drive Lifecycle Status</label>
              <select
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="upcoming">Upcoming (Announced)</option>
                <option value="active">Active (Open for Applications)</option>
                <option value="completed">Completed / Closed</option>
              </select>
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <Link to="/company/drives" className="btn btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ minWidth: '220px' }}
            >
              {saving ? 'Saving Changes...' : 'Save Drive Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditDrivePage;
