const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactory');
const Center = require('../models/centerModel');
const { uploadSingleImage } = require('../middlewares/uploadImageMiddleware');
const { uploadMixOfImages } = require('../middlewares/uploadImageMiddleware');

// Upload single image
/*exports.uploadLogoImage = uploadSingleImage('logo');

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `logo-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(`uploads/logo/${filename}`);

    // Save image into our db
    req.body.logo = filename;
  }

  next();
});*/

exports.uploadCenterImages = uploadMixOfImages([
  {
    name: 'logo',
    maxCount: 1,
  },
  {
    name: 'centerPhotos',
    maxCount: 10,
  },
]);

exports.resizeCenterImages = asyncHandler(async (req, res, next) => {
  // console.log(req.files);
  //1- Image processing for imageCover
  if (req.files.logo) {
    const imageCoverFileName = `center-${uuidv4()}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.logo[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 95 })
      .toFile(`uploads/centers/${imageCoverFileName}`);

    // Save image into our db
    req.body.logo = imageCoverFileName;
  }
    //2- Image processing for images
    if (req.files.centerPhotos) {
      req.body.centerPhotos = [];
      await Promise.all(
        req.files.centerPhotos.map(async (img, index) => {
          const imageName = `center-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
  
          await sharp(img.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 95 })
            .toFile(`uploads/centerProfile/${imageName}`);
  
          // Save image into our db
          req.body.centerPhotos.push(imageName);
        })
      );
  
      next();
    }
  });


// @desc    Get list of centers
// @route   GET /api/v1/centers
// @access  Public
exports.getCenters = factory.getAll(Center);

// @desc    Get specific center by id with reviews and doctors
// @route   GET /api/v1/centers/:id
// @access  Public
exports.getCenter = async (req, res, next) => {
  try {
    const centerId = req.params.id;

    // Populate both reviews and doctors fields
    const center = await Center.findById(centerId)
      .populate('reviews')
      .populate('doctors');

    if (!center) {
      return res.status(404).json({
        success: false,
        error: 'Center not found',
      });
    }

    // Return the center data with reviews and doctors
    res.status(200).json({
      success: true,
      data: center,
    });
  } catch (error) {
    // Handle errors
    next(error);
  }
};

// @desc    Create center
// @route   POST  /api/v1/centers
// @access  Private
exports.createCenter = factory.createOne(Center);

// @desc    Update specific center
// @route   PUT /api/v1/centers/:id
// @access  Private
exports.updateCenter = factory.updateOne(Center);

// @desc    Delete specific center
// @route   DELETE /api/v1/centers/:id
// @access  Private
exports.deleteCenter = factory.deleteOne(Center);