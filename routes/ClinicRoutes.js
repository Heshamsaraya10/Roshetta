const express = require('express');
const authController = require('../controllers/authController');

const {
  getClinic,
  createClinic,
  getClinics,
  updateClinic,
  deleteClinic,
  //uploadCategoryImage,
  //resizeImage,
  uploadClinicImages,
  resizeClinicImages
} = require('../controllers/ClinicController');
const {
  createClinicValidator,
  getClinicValidator,
  updateClinicValidator,
  deleteClinicValidator,
} = require('../utils/validators/ClinicValidator');

// mergeParams: Allow us to access parameters on other routers
// ex: We need to access categoryId from category router
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .post(
    authController.protect,
    //uploadCategoryImage,
    //resizeImage,
    uploadClinicImages,
    resizeClinicImages,
    createClinicValidator,
    createClinic
  )
  .get(authController.protect,getClinics)
router
  .route('/:id')
  .get(authController.protect,getClinicValidator, getClinic)
  .put(
    authController.protect,
    //uploadCategoryImage,
    //resizeImage,
    //uploadClinicImages,
    //resizeClinicImages,
    updateClinicValidator,
    updateClinic
  )
  .delete(
    authController.protect,
    deleteClinicValidator,
    deleteClinic
  );

module.exports = router;