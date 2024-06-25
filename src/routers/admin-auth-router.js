const express = require('express')
const { createAdmin, adminLogin, adminLoginWithOtp, adminlogOut } = require('../controller/admin-auth-controller')
const { isAuthenticatedUser } = require('../middlewares/auth')
const router = express.Router()

router.route('/add-new-admin-user-not-working-for-now-temp-disable').post(createAdmin)


router.route('/admin-authenticaiton/login').post(adminLogin)
router.route('/admin-authenticaiton/login-with-otp').post(adminLoginWithOtp)
router.route('/admin-authenticaiton/logout').put(isAuthenticatedUser, adminlogOut)

module.exports = router