const express = require('express');
const router = express.Router();
const {
  applyToDrive,
  getMyApplications,
  getApplicationById,
} = require('../controllers/applicationController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// All student application routes require student authentication
router.use(protect);
router.use(authorize('student'));

router.post('/', applyToDrive);
router.get('/my', getMyApplications);
router.get('/:id', getApplicationById);

module.exports = router;
