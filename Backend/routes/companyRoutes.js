const express = require('express');
const router = express.Router();
const {
  getCompanyApplications,
  getDriveApplications,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All company routes require authentication and company role
router.use(protect);
router.use(authorize('company'));

router.get('/applications', getCompanyApplications);
router.get('/drives/:driveId/applications', getDriveApplications);
router.put('/applications/:applicationId/status', updateApplicationStatus);

module.exports = router;
