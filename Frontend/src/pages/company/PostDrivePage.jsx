import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { createDrive } from '../../api/driveApi';
import { getCompanyProfile } from '../../api/companyApi';

const AVAILABLE_BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'AI_DS', 'MCA'];
const AVAILABLE_DEGREES = ['B.Tech', 'B.E.', 'MCA', 'M.Tech', 'BCA', 'B.Sc'];

const PostDrivePage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isApproved, setIsApproved] = useState(false);

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
    allowedBranches: ['CSE', 'IT'],
    eligibleDegrees: ['B.Tech', 'B.E.'],
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
    recruitmentRounds: ['Online Assessment', 'Technical Interview', 'HR Interview'],
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
    checkApprovalStatus();
  }, []);

  const checkApprovalStatus = async () => {
    try {
      setLoading(true);
      const data = await getCompanyProfile();
      const approved = data?.profile?.isApproved === true;
      setIsApproved(approved);
    } catch (err) {
      setError('Failed to verify company approval status');
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

    if (!isApproved) {
      setError('Your company account must be approved by the admin before you can post a placement drive.');
      return;
    }

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
      setSubmitting(true);
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

      await createDrive(payload);
      setSuccess('Your placement drive has been submitted for Admin approval.');
      setTimeout(() => {
        navigate('/company/drives');
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create placement drive');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Create Placement Drive">
        <Loader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Create Placement Drive & Job Role Builder"
      subtitle="Define complete job specifications, responsibilities, skills, academic criteria, and recruitment rounds."
    >
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/company/drives" style={{ color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 600 }}>
          ← Back to Manage Drives
        </Link>
      </div>

      {!isApproved && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <strong>Action Disabled:</strong> Your company profile is awaiting admin verification. You will be able to post drives once approved.
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

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
              className="btn btn-outline"
              onClick={() => handleAddItem('responsibilities', newRespInput, setNewRespInput)}
            >
              + Add
            </button>
          </div>

          {formData.responsibilities.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem' }}>
              {formData.responsibilities.map((resp, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.4rem 0.75rem',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: '4px',
                    marginBottom: '0.35rem',
                    fontSize: '0.88rem',
                  }}
                >
                  <span>✓ {resp}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('responsibilities', idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                    title="Remove responsibility"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* SECTION 3: SKILLS MATRIX */}
          <div className="form-section-title" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2rem', marginBottom: '1.25rem' }}>
            3. 🛠️ Technical & Professional Skills Matrix
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {/* Required Skills */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Required Skills (Mandatory)</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. React, Node.js"
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
                  className="btn btn-outline"
                  onClick={() => handleAddItem('requiredSkills', newReqSkillInput, setNewReqSkillInput)}
                >
                  + Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {formData.requiredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="branch-tag"
                    style={{ backgroundColor: '#dbeafe', color: '#1e40af', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('requiredSkills', idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Skills */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Preferred / Bonus Skills (Optional)</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
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
                  className="btn btn-outline"
                  onClick={() => handleAddItem('preferredSkills', newPrefSkillInput, setNewPrefSkillInput)}
                >
                  + Add
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {formData.preferredSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="branch-tag"
                    style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem('preferredSkills', idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 4: ACADEMIC & EDUCATION CRITERIA */}
          <div className="form-section-title" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2rem', marginBottom: '1.25rem' }}>
            4. 🎓 Academic & Education Requirements
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
              <label className="form-label">Maximum Backlogs Allowed</label>
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
                min="0"
                max="100"
                name="minimumTenthPercentage"
                className="form-control"
                placeholder="e.g. 60"
                value={formData.minimumTenthPercentage}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min 12th Percentage (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                name="minimumTwelfthPercentage"
                className="form-control"
                placeholder="e.g. 60"
                value={formData.minimumTwelfthPercentage}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Eligible Branches */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Eligible Academic Branches</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {AVAILABLE_BRANCHES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleToggleArrayItem('allowedBranches', b)}
                  className={`btn ${formData.allowedBranches.includes(b) ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  {formData.allowedBranches.includes(b) ? `✓ ${b}` : b}
                </button>
              ))}
            </div>
          </div>

          {/* Eligible Degrees */}
          <div className="form-group">
            <label className="form-label">Eligible Degrees</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {AVAILABLE_DEGREES.map((deg) => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => handleToggleArrayItem('eligibleDegrees', deg)}
                  className={`btn ${formData.eligibleDegrees.includes(deg) ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  {formData.eligibleDegrees.includes(deg) ? `✓ ${deg}` : deg}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 5: EXPERIENCE & WORK ARRANGEMENT */}
          <div className="form-section-title" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2rem', marginBottom: '1.25rem' }}>
            5. 💼 Experience & Work Arrangement
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Experience Requirement</label>
              <select
                name="experienceType"
                className="form-control"
                value={formData.experienceType}
                onChange={handleChange}
              >
                <option value="freshers">Freshers Welcome</option>
                <option value="experienced">Experienced Only</option>
                <option value="both">Both Freshers & Experienced</option>
              </select>
            </div>

            {formData.experienceType !== 'freshers' && (
              <div className="form-group">
                <label className="form-label">Min Experience (Years)</label>
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
                <option value="Internship + Full Time">Internship + Full Time PPO</option>
                <option value="Contract">Contractual</option>
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
                <option value="On-site">On-site (Office)</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">100% Remote</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Work Location / City</label>
              <input
                type="text"
                name="workLocation"
                className="form-control"
                placeholder="e.g. New Delhi, Bengaluru, Hyderabad"
                value={formData.workLocation}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* SECTION 6: COMPENSATION & BOND */}
          <div className="form-section-title" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '2rem', marginBottom: '1.25rem' }}>
            6. 💰 Compensation, Stipend & Service Agreement
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">
                Package / CTC (in ₹ LPA) <span className="req">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="packageLPA"
                className="form-control"
                placeholder="e.g. 10.5"
                value={formData.packageLPA}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Min CTC (Optional LPA)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="minimumCTC"
                className="form-control"
                placeholder="e.g. 8"
                value={formData.minimumCTC}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max CTC (Optional LPA)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="maximumCTC"
                className="form-control"
                placeholder="e.g. 12"
                value={formData.maximumCTC}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Internship Stipend (₹ / Month)</label>
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

          {/* Bond Agreement */}
          <div style={{ backgroundColor: 'var(--bg-light)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: formData.bondRequired ? '0.75rem' : '0' }}>
              <input
                type="checkbox"
                id="bondRequired"
                name="bondRequired"
                checked={formData.bondRequired}
                onChange={handleChange}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="bondRequired" style={{ fontWeight: 600, margin: 0, cursor: 'pointer' }}>
                Service Agreement / Employment Bond Required
              </label>
            </div>

            {formData.bondRequired && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Bond Duration (Years)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    name="bondDuration"
                    className="form-control"
                    placeholder="e.g. 1.5"
                    value={formData.bondDuration}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bond Details & Terms</label>
                  <input
                    type="text"
                    name="bondDetails"
                    className="form-control"
                    placeholder="e.g. 1 year agreement with ₹1,00,000 security clause"
                    value={formData.bondDetails}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 7: SELECTION PROCESS & ADDITIONAL REQUIREMENTS */}
          <div className="form-section-title" style={{ fontSize: '1.15rem', color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: '1rem', marginBottom: '1.25rem' }}>
            7. 🚀 Selection Process & Schedule
          </div>

          {/* Recruitment Rounds */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Recruitment Rounds</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Coding Assessment, Group Discussion"
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
                className="btn btn-outline"
                onClick={() => handleAddItem('recruitmentRounds', newRoundInput, setNewRoundInput)}
              >
                + Add Round
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {formData.recruitmentRounds.map((round, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: '#e0e7ff',
                    color: '#3730a3',
                    padding: '0.3rem 0.7rem',
                    borderRadius: '16px',
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Round {idx + 1}: {round}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('recruitmentRounds', idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Additional Requirements / Conditions */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Additional Requirements / Notes</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Willingness to relocate, Portfolio / GitHub links required"
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
                className="btn btn-outline"
                onClick={() => handleAddItem('additionalRequirements', newReqNoteInput, setNewReqNoteInput)}
              >
                + Add Note
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {formData.additionalRequirements.map((note, idx) => (
                <span
                  key={idx}
                  className="branch-tag"
                  style={{ backgroundColor: '#fef3c7', color: '#92400e', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {note}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem('additionalRequirements', idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Dates & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Application Deadline</label>
              <input
                type="date"
                name="applicationDeadline"
                className="form-control"
                value={formData.applicationDeadline}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Scheduled Drive Date</label>
              <input
                type="date"
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
                <option value="upcoming">Upcoming</option>
                <option value="active">Active (Immediate)</option>
                <option value="completed">Completed / Closed</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <Link to="/company/drives" className="btn btn-outline" disabled={submitting}>
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !isApproved}
              style={{ padding: '0.65rem 1.75rem', fontSize: '0.95rem' }}
            >
              {submitting ? 'Submitting for Admin Approval...' : 'Submit Placement Drive 🚀'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default PostDrivePage;
