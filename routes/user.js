import express from 'express';
import authorisation from '../middleware/authorisation.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.post('/login', userController.login);

router.post('/debugLogin', userController.debugLogin);

router.post('/register', userController.register);

router.get("/:email/profile", authorisation, userController.getUserProfileFromEmail);


router.put("/:email/profile", authorisation, userController.putUserProfileFromEmail);

export default router;
