const db = require("../config/db");
const catchAsyncError = require("../middlewares/catchAsyncError")
const Errorhandler = require("../utils/error-handeler");
const { stringToInches, inchesToSapratedFeetANDInches } = require("../utils/get-height");


exports.uploadImageGetUrl = catchAsyncError(async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new Errorhandler('No image file uploaded'))
        }

        res.status(200).json({ success: true, image_url: req.file.location })
    } catch (error) {
        console.error(error);
        return next(new Errorhandler())
    }
})


exports.getUsersListTbl = catchAsyncError(async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1
        const rowPerPage = parseInt(req.query.rowPerPage) || 10
        const offset = (page - 1) * rowPerPage;

        const users = await db('tbl_user AS u')
            .select('u.*', 'ui.image_url')  // Select required columns from both tables
            .leftJoin('tbl_user_images AS ui', 'u.USERID', 'ui.USERID')  // Use alias for tbl_user_images
            .orderBy('u.Create_Date', 'desc')  // Order by user ID first
            .orderBy('ui.img_rank', 'asc') // Then order by img_rank within each user
            .limit(rowPerPage)
            .offset(offset)
            .groupBy('u.USERID')


        const totalUsers = await db('tbl_user')
            .count('USERID as total') // Count using "id" column (or any unique identifier)
            .first()


        res.status(200).json({
            success: true,
            users: users,
            totalUsers: totalUsers.total
        })
    } catch (error) {
        console.error(error);
        return next(new Errorhandler())
        // Handle errors appropriately, e.g., rollback transaction, send error response
    }
})


exports.getSingleUserForEdit = catchAsyncError(async (req, res, next) => {
    const USERID = parseInt(req.params.USERID, 10)
    try {

        const [userProfile, socialLinks, userImages] = await Promise.all([
            db('tbl_user').select('*').where('USERID', USERID).first(),
            db('tbl_social_media_links').select('link_url').where('USERID', USERID).orderBy('link_type', 'desc'),
            db('tbl_user_images').select('image_url').where('USERID', USERID).orderBy('img_rank', 'asc')
        ]);



        if (!userProfile) {
            return next(new Errorhandler('User not found', 404))
        }

        const { feet, inches } = await inchesToSapratedFeetANDInches(userProfile.Height || 0)

        userProfile.Height_IN_Feet = feet
        userProfile.Height_IN_Inch = inches


        userProfile.Special_Appearance = userProfile.Special_Appearance.split(',') || []

        const userImagesArray = userImages.slice(0, 5).map((image, index) => ({
            image_url: image?.image_url || '',
        }));

        if (userImages.length < 5) {
            for (let i = userImages.length; i < 5; i++) {
                userImagesArray.push({ image_url: '' });
            }
        }

        console.log(socialLinks[0] ? socialLinks[0].link_url : '')

        const userData = {
            ...userProfile,
            userImagesArray,
            Instagram_Link: socialLinks[0] ? socialLinks[0].link_url : '',
            Facebook_link: socialLinks[1] ? socialLinks[1].link_url : "",
            Youtube_link: socialLinks[2] ? socialLinks[2].link_url : "",
            Website_link: socialLinks[3] ? socialLinks[3].link_url : ""
        }

        res.status(200).json({ success: true, UserDetails: userData });

    } catch (error) {
        console.error(error);
        return next(new Errorhandler())

    }

})


exports.uploadSingleTest = catchAsyncError(async (req, res, next) => {
    try {
        if (req.body) {

            res.json({ message: 'File uploaded successfully!' });
        } else {
            res.status(400).json({ message: 'No file uploaded' });
        }
    } catch (error) {
        console.log(error);
        return next(new Errorhandler('Internal server error ', 500));
    }
});


exports.addnewUserInOneStep = catchAsyncError(async (req, res, next) => {
    try {
        const {
            First_Name,
            Last_Name,
            Profile_Description,
            Email_ID,
            Primary_Phone_Number,
            Whatsapp_Secondary_Phone_Number,// optional
            Height_IN_Inch,
            Height_IN_Feet,
            Weight,
            Gender,
            Age,
            Mother_Tongue,
            Languages_Spoken,
            Current_City_of_Residence,
            Native_State,
            Manager_Name,
            Manager_Phone_Number,
            Manager_Email,
            Complexion_Type,
            Ethnicity_Type,
            Body_Type,
            Special_Appearance,
            Citizenship,
            Instagram_Link, Facebook_link, Youtube_link, Website_link,
            Is_Flagged, Performance_Rating, User_Classification, USER_Job_Profiles
        } = req.body


        const userImages = req.files;


        const existUserWithPrimaryPhone = await db('tbl_user').where('Primary_Phone_Number', Primary_Phone_Number).first()



        if (existUserWithPrimaryPhone) {
            return next(new Errorhandler('User with same Primary Phone Number already exists', 400));
        }

        const TotalHeight = await stringToInches(Height_IN_Feet, Height_IN_Inch)

        await db.transaction(async (trx) => {
            const insertedUserId = await trx('tbl_user').insert({
                Profile_Description,
                First_Name,
                Last_Name,
                Primary_Phone_Number,
                Whatsapp_Secondary_Phone_Number,
                Manager_Name,
                Manager_Phone_Number,
                Manager_Email,
                Email_ID,
                Age,
                Weight,
                Complexion_Type,
                Ethnicity_Type,
                Body_Type,
                Gender,
                Mother_Tongue,
                Languages_Spoken,
                Current_City_of_Residence,
                Native_State,
                Special_Appearance,
                Citizenship, Is_Flagged, Performance_Rating, User_Classification, USER_Job_Profiles,
                "Height": TotalHeight
            });

            if (insertedUserId && userImages && userImages.length > 0) {
                const userImageRecords = userImages.map((image, index) => ({
                    USERID: insertedUserId,
                    image_url: image.location, // Assuming the image path is stored in the image object's path property
                    img_rank: index + 1,
                    image_type: image.mimetype.split('/')[1], // Extract image type from mimetype
                }));

                await trx('tbl_user_images').insert(userImageRecords);
            }

            // Insert social media links if provided
            const socialMediaLinks = [];
            if (Instagram_Link) {
                socialMediaLinks.push({ USERID: insertedUserId, link_type: 'Instagram', link_url: Instagram_Link });
            }
            if (Facebook_link) {
                socialMediaLinks.push({ USERID: insertedUserId, link_type: 'Facebook', link_url: Facebook_link });
            }
            if (Youtube_link) {
                socialMediaLinks.push({ USERID: insertedUserId, link_type: 'Youtube', link_url: Youtube_link });
            }
            if (Website_link) {
                socialMediaLinks.push({ USERID: insertedUserId, link_type: 'Website', link_url: Website_link });
            }

            if (socialMediaLinks.length > 0) {
                await trx('tbl_social_media_links').insert(socialMediaLinks);
            }

            await trx.commit();

            res.status(200).json({ success: true, message: 'User Created Successfully', user: req.body, photo: userImages }); // Assuming userImages is an array of image objects

        });



    } catch (error) {
        console.error(error);
        return next(new Errorhandler())
        // Handle errors appropriately, e.g., rollback transaction, send error response
    }
})

exports.editOldUserData = catchAsyncError(async (req, res, next) => {


    const {
        USERID,
        Profile_Description, First_Name, Last_Name, Primary_Phone_Number,
        Height_IN_Feet, Height_IN_Inch, Whatsapp_Secondary_Phone_Number,
        Manager_Name, Manager_Phone_Number, Manager_Email, Email_ID, Age,
        Complexion_Type, Ethnicity_Type, Body_Type, Weight, Gender, Mother_Tongue,
        Languages_Spoken, Native_State, Current_City_of_Residence, Special_Appearance,
        Citizenship, Instagram_Link, Facebook_link, Youtube_link, Website_link, Images_url, Is_Flagged, Performance_Rating, User_Classification, USER_Job_Profiles,
    } = req.body;



    try {
        const existUserWithPrimaryPhone = await db('tbl_user')
            .where('Primary_Phone_Number', Primary_Phone_Number)
            .whereNot('USERID', USERID)
            .count('USERID AS count') // Use count for existence check

        if (existUserWithPrimaryPhone[0].count > 0) {
            return next(new Errorhandler('User with same Primary Phone Number already exists', 400));
        }






        const TotalHeight = await stringToInches(Height_IN_Feet, Height_IN_Inch);


        const userDataUpdated = {
            Profile_Description,
            First_Name,
            Last_Name,
            Primary_Phone_Number,
            Whatsapp_Secondary_Phone_Number,
            Manager_Name,
            Manager_Phone_Number,
            Manager_Email,
            Email_ID, Age,
            'Height': TotalHeight,
            Weight,
            Complexion_Type,
            Ethnicity_Type,
            Body_Type, Gender,
            Mother_Tongue,
            Languages_Spoken,
            Current_City_of_Residence,
            Native_State, Special_Appearance, Is_Flagged, Performance_Rating, User_Classification, USER_Job_Profiles,
            Citizenship,
        }

        await db.transaction(async (trx) => {
            await trx('tbl_user').update(userDataUpdated).where({ USERID });
            if (Images_url && Images_url.length > 0) {
                const values = Images_url.map((image, index) => ({
                    USERID,
                    image_url: image.image_url,
                    img_rank: index + 1,
                    image_type: "unknown"
                }));
                await trx('tbl_user_images').where({ USERID }).delete();
                await trx('tbl_user_images').insert(values);
            }


            const socialMediaLinks = [
                Instagram_Link && { USERID, link_type: 'Instagram', link_url: Instagram_Link },
                Facebook_link && { USERID, link_type: 'Facebook', link_url: Facebook_link },
                Youtube_link && { USERID, link_type: 'Youtube', link_url: Youtube_link },
                Website_link && { USERID, link_type: 'Website', link_url: Website_link },
            ].filter(Boolean);

            if (socialMediaLinks.length > 0) {
                await trx('tbl_social_media_links').where({ USERID }).delete();
                await trx('tbl_social_media_links').insert(socialMediaLinks);
            } else {
                await trx('tbl_social_media_links').where({ USERID }).delete();
            }

            await trx.commit();


        });


        return res.status(200).json({
            success: true,
            message: 'User Details Updated Successfully',

        });
    } catch (error) {
        console.error(error);
        return next(new Errorhandler("Internal Server Error"));
    }
});





exports.addNewUserDataStep1 = catchAsyncError(async (req, res, next) => {
    const {
        USERID,
        USER_Job_Profiles,
        Primary_Phone_Number,
        Whatsapp_Secondary_Phone_Number,
        First_Name,
        Last_Name,
        Gender,
        Age,
        Instagram_Link,
        Facebook_Link,
        Youtube_Link,
        Website_Link
    } = req.body;

    const userImages = req.files;

    const requiredFields = [
        USER_Job_Profiles,
        First_Name,
        Last_Name,
        Primary_Phone_Number,
        Whatsapp_Secondary_Phone_Number,
        Gender,
        Age,
    ];

    const missingFields = requiredFields.filter((field) => !field);
    if (missingFields.length > 0) {
        return next(new Error(`Missing required fields: ${missingFields.join(',')}`));
    }

    const hasSocialLink = Instagram_Link || Facebook_Link || Youtube_Link || Website_Link;
    if (!hasSocialLink) {
        return next(new Error('Please provide at least one social media link (Instagram, Facebook, Youtube, Website)'));
    }

    try {

        if (!USERID) {
            const existUserWithPrimaryPhone = await db('tbl_user').where('Primary_Phone_Number', Primary_Phone_Number).first();
            if (existUserWithPrimaryPhone) {
                return next(new Error('User with the same Primary Phone Number already exists'));
            }
            await db.transaction(async (trx) => {
                const insertedUserId = await trx('tbl_user').insert({
                    USER_Job_Profiles,
                    Primary_Phone_Number,
                    Whatsapp_Secondary_Phone_Number,
                    First_Name,
                    Last_Name,
                    Age,
                    Gender,
                });

                if (insertedUserId && userImages && userImages.length > 0) {
                    const userImageRecords = userImages.map((image, index) => ({
                        USERID: insertedUserId,
                        image_url: image.location,
                        img_rank: index + 1,
                        image_type: image.mimetype.split('/')[1], // Extract image type from mimetype
                    }));

                    await trx('tbl_user_images').insert(userImageRecords);
                }

                const socialMediaLinks = [];
                if (Instagram_Link) {
                    socialMediaLinks.push({ USERID: insertedUserId, link_type: 'Instagram', link_url: Instagram_Link });
                }
                if (Facebook_Link) {
                    socialMediaLinks.push({ USERID: insertedUserId, link_type: 'Facebook', link_url: Facebook_Link });
                }
                if (Youtube_Link) {
                    socialMediaLinks.push({ USERID: insertedUserId, link_type: 'Youtube', link_url: Youtube_Link });
                }
                if (Website_Link) {
                    socialMediaLinks.push({ USERID: insertedUserId, link_type: 'Website', link_url: Website_Link });
                }

                if (socialMediaLinks.length > 0) {
                    await trx('tbl_social_media_links').insert(socialMediaLinks);
                }
                await trx.commit();
                res.status(200).json({ success: true, message: 'User Created Successfully', user: req.body, photo: userImages });
            });
        } else {

            await db.transaction(async (trx) => {
                await trx('tbl_user')
                    .where('USERID', USERID)
                    .update({
                        USER_Job_Profiles,
                        Primary_Phone_Number,
                        Whatsapp_Secondary_Phone_Number,
                        First_Name,
                        Last_Name,
                        Age,
                        Gender,
                    });

                if (userImages && userImages.length > 0) {
                    await trx('tbl_user_images').where('USERID', USERID).del(); // Clear existing images
                    const userImageRecords = userImages.map((image, index) => ({
                        USERID: USERID,
                        image_url: image.location,
                        img_rank: index + 1,
                        image_type: image.mimetype.split('/')[1], // Extract image type from mimetype
                    }));

                    await trx('tbl_user_images').insert(userImageRecords);
                }

                await trx('tbl_social_media_links').where('USERID', USERID).del(); // Clear existing social media links
                const socialMediaLinks = [];
                if (Instagram_Link) {
                    socialMediaLinks.push({ USERID: USERID, link_type: 'Instagram', link_url: Instagram_Link });
                }
                if (Facebook_Link) {
                    socialMediaLinks.push({ USERID: USERID, link_type: 'Facebook', link_url: Facebook_Link });
                }
                if (Youtube_Link) {
                    socialMediaLinks.push({ USERID: USERID, link_type: 'Youtube', link_url: Youtube_Link });
                }
                if (Website_Link) {
                    socialMediaLinks.push({ USERID: USERID, link_type: 'Website', link_url: Website_Link });
                }

                if (socialMediaLinks.length > 0) {
                    await trx('tbl_social_media_links').insert(socialMediaLinks);
                }
                await trx.commit();
                res.status(200).json({ success: true, message: 'User Updated Successfully', user: req.body, photo: userImages });
            });

        }

    } catch (error) {
        // Rollback transaction on error
        console.error('Error in transaction:', error);
        return next(new Errorhandler('Internal Server Error', 500));
    }
});


exports.addNewUserDataStep2andStep3 = catchAsyncError(async (req, res, next) => {
    try {

        const {
            userMobile,
            Body_Type, Citizenship, Complexion_Type,
            Current_City_of_Residence, Email_ID, Ethnicity_Type,
            Height_IN_Feet, Height_IN_Inch, Languages_Spoken,
            Manager_Email, Manager_Name, Manager_Phone_Number,
            Mother_Tongue, Native_State, Profile_Description,
            Special_Appearance
        } = req.body

        if (!userMobile) {
            return next(new Errorhandler('Invalid Cridentials', 404))
        }

        const userData = db('tbl_user').where('Primary_Phone_Number', userMobile).first()

        if (!userData) {
            return next(new Errorhandler("User not found. Please re-register user details from step 1.", 404));
        }


        const TotalHeight = await stringToInches(Height_IN_Feet, Height_IN_Inch)
        // Ensure Special_Appearance is an array before joining
        const specialAppearanceString = Array.isArray(Special_Appearance) ? Special_Appearance.join(',') : Special_Appearance;


        // Update the user data in the database
        await db('tbl_user')
            .where('Primary_Phone_Number', userMobile)
            .update({
                Body_Type,
                Citizenship,
                Complexion_Type,
                Current_City_of_Residence,
                Email_ID,
                Ethnicity_Type,
                Height: TotalHeight, // Assuming TotalHeight is in inches
                Languages_Spoken,
                Manager_Email,
                Manager_Name,
                Manager_Phone_Number,
                Mother_Tongue,
                Native_State,
                Profile_Description,
                Special_Appearance: specialAppearanceString
            });
        res.status(200).json({ success: true, message: 'Details updated successfully' })

    } catch (error) {
        console.log(error)
        return next(new Errorhandler())
    }

})