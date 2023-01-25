const { Router } = require('express');

const { triggerWakeUp } = require('../controllers/triggers.controller');

const router = Router();

router.get('/wakeup', triggerWakeUp );

module.exports = router;
