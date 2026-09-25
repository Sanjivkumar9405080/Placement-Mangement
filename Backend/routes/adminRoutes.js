const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllStudents,
  getStudentById,
  getAllCompanies,
  approveCompany,
  getAllDrives,
  reviewDriveApproval,
  getDriveApplicants,
  removeStudentFromDrive,
  getAllApplications,
} = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard stats
router.get('/stats', getDashboardStats);

// Student management
router.get('/students', getAllStudents);
router.get('/students/:id', getStudentById);

// Company management
router.get('/companies', getAllCompanies);
router.put('/companies/:id/approve', approveCompany);

// Placement drives & drive applicants
router.get('/drives', getAllDrives);
router.put('/drives/:id/approval', reviewDriveApproval);
router.get('/drives/:id/applicants', getDriveApplicants);

// Applications registry & administrative removal
router.get('/applications', getAllApplications);
router.delete('/applications/:id', removeStudentFromDrive);

module.exports = router;
