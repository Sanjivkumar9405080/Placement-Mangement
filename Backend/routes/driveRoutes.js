const express = require('express');
const router = express.Router();
const {
  createDrive,
  getAllDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
} = require('../controllers/driveController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All drive routes require authentication
router.use(protect);

router
  .route('/')
  .post(authorize('company'), createDrive)
  .get(authorize('student', 'company', 'admin'), getAllDrives);

router
  .route('/:id')
  .get(authorize('student', 'company', 'admin'), getDriveById)
  .put(authorize('company'), updateDrive)
  .delete(authorize('company'), deleteDrive);

module.exports = router;
