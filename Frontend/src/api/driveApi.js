import axiosInstance from './axiosInstance';

// Create a new placement drive (Approved Company only)
export const createDrive = async (driveData) => {
  const response = await axiosInstance.post('/drives', driveData);
  return response.data;
};

// Get all drives with optional query filters (status, branch, minCGPA)
export const getAllDrives = async (params = {}) => {
  const response = await axiosInstance.get('/drives', { params });
  return response.data;
};

// Get single placement drive by ID
export const getDriveById = async (id) => {
  const response = await axiosInstance.get(`/drives/${id}`);
  return response.data;
};

// Update an existing placement drive (Company owner only)
export const updateDrive = async (id, driveData) => {
  const response = await axiosInstance.put(`/drives/${id}`, driveData);
  return response.data;
};

// Delete a placement drive (Company owner only)
export const deleteDrive = async (id) => {
  const response = await axiosInstance.delete(`/drives/${id}`);
  return response.data;
};
