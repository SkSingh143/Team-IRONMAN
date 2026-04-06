const router = require('express').Router();
const { body } = require('express-validator');
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

// All room routes require valid Bearer token
router.use(authMiddleware);

router.post('/', body('name').notEmpty().isLength({ max: 80 }), roomController.create);
router.get('/me/history', roomController.getHistory);
router.get('/:roomId', roomController.getRoom);
router.delete('/:roomId', roomController.deleteRoom);
router.post('/:roomId/ban', body('userId').notEmpty(), roomController.banUser);
router.put('/:roomId/permissions', body('allowAllPermissions').isBoolean(), roomController.toggleAllPermissions);
router.put('/:roomId/member/:memberId/permission', body('canParticipate').isBoolean(), roomController.toggleMemberPermission);

module.exports = router;
