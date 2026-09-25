import axiosInstance from './axiosInstance';

// Apply to a placement drive
export const applyToDrive = async (driveId) => {
  const response = await axiosInstance.post('/applications', { driveId });
  return response.data;
};

// Get all applications submitted by logged-in student
export const getMyApplications = async () => {
  const response = await axiosInstance.get('/applications/my');
  return response.data;
};

// Get a specific application by ID
export const getApplicationById = async (id) => {
  const response = await axiosInstance.get(`/applications/${id}`);
  return response.data;
};
