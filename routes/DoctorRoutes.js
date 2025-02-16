const express = require('express');
const authController = require('../controllers/authController');

const {
  getDoctor,
  createDoctor,
  getDoctors,
  updateDoctor,
  deleteDoctor,
  uploadCategoryImage,
  resizeImage
} = require('../controllers/DoctorController');
const {
  createDoctorValidator,
  getDoctorValidator,
  updateDoctorValidator,
  deleteDoctorValidator,
} = require('../utils/validators/DoctorValidator');



// mergeParams: Allow us to access parameters on other routers
// ex: We need to access categoryId from category router
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .post(
    authController.protect,
    uploadCategoryImage,
    resizeImage,
    createDoctorValidator,
    createDoctor,
  )
  .get(authController.protect,getDoctors);
router
  .route('/:id')
  .get(authController.protect,getDoctorValidator, getDoctor)
  .put(
    authController.protect,
    uploadCategoryImage,
    resizeImage,
    updateDoctorValidator,
    updateDoctor,
  )
  .delete(
    authController.protect,
    deleteDoctorValidator,
    deleteDoctor
  );

module.exports = router;