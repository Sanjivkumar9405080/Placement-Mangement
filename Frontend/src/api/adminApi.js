import axiosInstance from './axiosInstance';

// Get dashboard statistics
export const getDashboardStats = async () => {
  const response = await axiosInstance.get('/admin/stats');
  return response.data;
};

// Get all students with optional filters (branch, minCGPA, search)
export const getAllStudents = async (params = {}) => {
  const response = await axiosInstance.get('/admin/students', { params });
  return response.data;
};

// Get single student profile with full placement history & metrics
export const getStudentById = async (id) => {
  const response = await axiosInstance.get(`/admin/students/${id}`);
  return response.data;
};

// Get all companies with populated user details
export const getAllCompanies = async (params = {}) => {
  const response = await axiosInstance.get('/admin/companies', { params });
  return response.data;
};

// Approve or revoke company profile approval
export const approveCompany = async (id, isApproved) => {
  const response = await axiosInstance.put(`/admin/companies/${id}/approve`, {
    isApproved,
  });
  return response.data;
};

// Get all drives across all companies with optional filters (status, company, approvalStatus)
export const getAllDrives = async (params = {}) => {
  const response = await axiosInstance.get('/admin/drives', { params });
  return response.data;
};

// Review placement drive approval (Approve or Reject with reason)
export const reviewDriveApproval = async (id, { approvalStatus, rejectionReason }) => {
  const response = await axiosInstance.put(`/admin/drives/${id}/approval`, {
    approvalStatus,
    rejectionReason,
  });
  return response.data;
};

// Get all applicants for a placement drive (Admin view)
export const getAdminDriveApplicants = async (driveId) => {
  const response = await axiosInstance.get(`/admin/drives/${driveId}/applicants`);
  return response.data;
};

// Get all applications across drives (Applications registry)
export const getAllApplications = async (params = {}) => {
  const response = await axiosInstance.get('/admin/applications', { params });
  return response.data;
};

// Remove a student from a specific placement drive (Soft removal with audit tracking)
export const removeStudentFromDrive = async (applicationId, { reason }) => {
  const response = await axiosInstance.delete(`/admin/applications/${applicationId}`, {
    data: { reason },
  });
  return response.data;
};
