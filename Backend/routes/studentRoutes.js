const express = require('express');
const router = express.Router();
const {
  getStudentProfile,
  updateStudentProfile,
} = require('../controllers/studentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All student routes require authentication and student role
router.use(protect);
router.use(authorize('student'));

router
  .route('/profile')
  .get(getStudentProfile)
  .put(updateStudentProfile);

module.exports = router;
