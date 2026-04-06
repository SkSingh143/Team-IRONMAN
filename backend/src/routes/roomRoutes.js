const router = require('express').Router();
const { body } = require('express-validator');
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

// All room routes require valid Bearer token
router.use(authMiddleware);

router.post('/', body('name').notEmpty().isLength({ max: 80 }), roomController.create);
router.get('/:roomId', roomController.getRoom);
router.delete('/:roomId', roomController.deleteRoom);
router.post('/:roomId/kick', body('userId').notEmpty(), roomController.kickUser);

module.exports = router;
