const express = require('express')
const { addNewUserDataStep1, addnewUserInOneStep, getUsersListTbl, getSingleUserForEdit, uploadImageGetUrl, editOldUserData, addNewUserDataStep2andStep3 } = require('../controller/users-controller')
const { upload, } = require('../config/s3-with-multer-config')
const { isAuthenticatedUser } = require('../middlewares/auth')
const router = express.Router()

// router.route('/chaking-Upload-s3').post(upload.single('file'), uploadSingleTest)


router.route('/upload-image-get-url').post(upload.single('file'), uploadImageGetUrl)



router.route('/add-new-user--in-one-step').post(isAuthenticatedUser, upload.array('Add_Profile_Pics[]'), addnewUserInOneStep)
router.route('/edit-old-user--in-one-step').post(isAuthenticatedUser, editOldUserData)

// add user by user 
router.route('/create-new-user-by-user-step-one').post(upload.array('Add_Profile_Pics[]'), addNewUserDataStep1)

router.route('/update-old-user-by-user-for-step2-and-step3').post(addNewUserDataStep2andStep3)

router.route('/get-user/tbl-view').get(isAuthenticatedUser, getUsersListTbl)


// edit - user 
router.route('/get-user-details-for-edit/:USERID').get(isAuthenticatedUser, getSingleUserForEdit)


module.exports = router

