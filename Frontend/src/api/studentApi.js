import axiosInstance from './axiosInstance';

// Get logged-in student profile
export const getStudentProfile = async () => {
  const response = await axiosInstance.get('/students/profile');
  return response.data;
};

// Update student profile
export const updateStudentProfile = async (profileData) => {
  const response = await axiosInstance.put('/students/profile', profileData);
  return response.data;
};
