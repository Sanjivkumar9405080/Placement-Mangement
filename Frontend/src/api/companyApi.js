import axiosInstance from './axiosInstance';

// Get currently authenticated company's profile info
export const getCompanyProfile = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};

// Get all applications across all drives created by the logged-in company
export const getCompanyApplications = async () => {
  const response = await axiosInstance.get('/company/applications');
  return response.data;
};

// Get applications for a specific drive created by the logged-in company
export const getDriveApplications = async (driveId) => {
  const response = await axiosInstance.get(`/company/drives/${driveId}/applications`);
  return response.data;
};

// Update an applicant's hiring status
export const updateApplicationStatus = async (applicationId, status) => {
  const response = await axiosInstance.put(`/company/applications/${applicationId}/status`, {
    status,
  });
  return response.data;
};
