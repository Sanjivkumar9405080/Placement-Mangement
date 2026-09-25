import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Loader from '../../components/common/Loader';
import { getStudentProfile, updateStudentProfile } from '../../api/studentApi';

const StudentProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    rollNumber: '',
    phone: '',
    branch: '',
    cgpa: '',
    tenthPercentage: '',
    twelfthPercentage: '',
    activeBacklogs: 0,
    skills: '',
    resumeUrl: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getStudentProfile();
      if (data && data.profile) {
        populateForm(data.profile);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch student profile');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (profile) => {
    setFormData({
      name: profile.user?.name || '',
      email: profile.user?.email || '',
      role: profile.user?.role || 'student',
      rollNumber: profile.rollNumber || '',
      phone: profile.phone || '',
      branch: profile.branch || '',
      cgpa: profile.cgpa !== undefined && profile.cgpa !== null ? profile.cgpa : '',
      tenthPercentage:
        profile.tenthPercentage !== undefined && profile.tenthPercentage !== null
          ? profile.tenthPercentage
          : '',
      twelfthPercentage:
        profile.twelfthPercentage !== undefined && profile.twelfthPercentage !== null
          ? profile.twelfthPercentage
          : '',
      activeBacklogs:
        profile.activeBacklogs !== undefined && profile.activeBacklogs !== null
          ? profile.activeBacklogs
          : 0,
      skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills || '',
      resumeUrl: profile.resumeUrl || '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation matching backend rules
    const numCgpa = Number(formData.cgpa);
    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      setError('CGPA must be a valid number between 0 and 10');
      return;
    }

    if (formData.tenthPercentage !== '') {
      const numTenth = Number(formData.tenthPercentage);
      if (isNaN(numTenth) || numTenth < 0 || numTenth > 100) {
        setError('10th Percentage must be between 0 and 100');
        return;
      }
    }

    if (formData.twelfthPercentage !== '') {
      const numTwelfth = Number(formData.twelfthPercentage);
      if (isNaN(numTwelfth) || numTwelfth < 0 || numTwelfth > 100) {
        setError('12th Percentage must be between 0 and 100');
        return;
      }
    }

    const numBacklogs = Number(formData.activeBacklogs);
    if (isNaN(numBacklogs) || numBacklogs < 0) {
      setError('Active backlogs cannot be negative');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        branch: formData.branch.trim(),
        cgpa: numCgpa,
        tenthPercentage: formData.tenthPercentage !== '' ? Number(formData.tenthPercentage) : undefined,
        twelfthPercentage: formData.twelfthPercentage !== '' ? Number(formData.twelfthPercentage) : undefined,
        activeBacklogs: numBacklogs,
        skills: formData.skills
          ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const res = await updateStudentProfile(payload);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      if (res && res.profile) {
        populateForm(res.profile);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Academic Profile">
        <Loader />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Student Academic Profile"
      subtitle="View and maintain your academic records, contact info, and technical qualifications."
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card" style={{ maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {isEditing ? 'Edit Profile Details' : 'Student Information'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {isEditing ? 'Update editable academic and contact fields below' : 'Official student credentials for campus placement drives'}
            </p>
          </div>
          <div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                ✏️ Edit Profile
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsEditing(false);
                  fetchProfile();
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Read-Only Account Section */}
          <div className="form-section-title">🔒 Identity & Institutional Information (Read-Only)</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                disabled
                style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
              />
              <span className="form-hint">Institutional login email cannot be changed</span>
            </div>
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.rollNumber}
                disabled
                style={{ backgroundColor: 'var(--bg-color)', cursor: 'not-allowed' }}
              />
              <span className="form-hint">Assigned university enrollment number</span>
            </div>
          </div>

          {/* Personal & Contact Section */}
          <div className="form-section-title">👤 Personal & Contact Details</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Full Name <span className="req">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>

          {/* Academic Records Section */}
          <div className="form-section-title">🎓 Academic Records (Eligibility Criteria)</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Branch / Specialization <span className="req">*</span>
              </label>
              {isEditing ? (
                <select
                  name="branch"
                  className="form-control"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Branch</option>
                  <option value="CSE">CSE (Computer Science & Engineering)</option>
                  <option value="IT">IT (Information Technology)</option>
                  <option value="ECE">ECE (Electronics & Communication)</option>
                  <option value="EE">EE (Electrical Engineering)</option>
                  <option value="ME">ME (Mechanical Engineering)</option>
                  <option value="CE">CE (Civil Engineering)</option>
                  <option value="AI_DS">AI & DS (Artificial Intelligence & Data Science)</option>
                  <option value="MCA">MCA (Master of Computer Applications)</option>
                </select>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  value={formData.branch}
                  disabled
                />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Current CGPA (0.00 - 10.00) <span className="req">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                name="cgpa"
                className="form-control"
                value={formData.cgpa}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">10th Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                name="tenthPercentage"
                className="form-control"
                value={formData.tenthPercentage}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g. 88.5"
              />
            </div>

            <div className="form-group">
              <label className="form-label">12th / Diploma Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                name="twelfthPercentage"
                className="form-control"
                value={formData.twelfthPercentage}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g. 85.0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Active Backlogs</label>
              <input
                type="number"
                min="0"
                name="activeBacklogs"
                className="form-control"
                value={formData.activeBacklogs}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Technical Skills Section */}
          <div className="form-section-title">💻 Technical Skills</div>
          <div className="form-group">
            <label className="form-label">Skills (Comma-separated)</label>
            {isEditing ? (
              <>
                <input
                  type="text"
                  name="skills"
                  className="form-control"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="e.g. React, Node.js, Python, SQL, Git, Java"
                />
                <span className="form-hint">Separate individual skills with commas</span>
              </>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {formData.skills ? (
                  formData.skills.split(',').map((skill, i) => (
                    <span key={i} className="branch-tag">
                      {skill.trim()}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>No skills added yet</span>
                )}
              </div>
            )}
          </div>

          {isEditing && (
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  fetchProfile();
                }}
                className="btn btn-outline"
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfilePage;
