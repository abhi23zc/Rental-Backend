import cloudinary from "../config/cloudinaryConfig.js";
import { productSchema } from "../routes/zodSchema/productSchema.js";
import { Product } from "../schema/product.Schema.js";
import fs from "fs";
import { User } from "../schema/user.Schema.js";
import { Request } from "../schema/request.Schema.js";
import { Notification } from "../schema/notification.Schema.js";



// export const getProducts = async (req, res, next) => {
//   try {
//     const products = await Product.find({});
//     return res.status(200).json({
//       status: true,
//       message: "Products Fetched Succesfully",
//       data: products,
//     });
//   } catch (error) { }
// };

export const getProducts = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    if (latitude && longitude) {
      const radius = 30
      let filter = {};

      if (latitude && longitude) {
        filter.location = {
          $geoWithin: {
            $centerSphere: [
              [parseFloat(longitude), parseFloat(latitude)],
              parseFloat(radius) / 6378.1
            ],
          },
        };
      }

      const products = await Product.find(filter);

      return res.status(200).json({
        status: true,
        message: "Products Fetched Succesfully",
        data: products,
      });
    }
    else {
      const products = await Product.find({});
      return res.status(200).json({
        status: true,
        message: "Products Fetched Succesfully",
        data: products,
      });
    }


  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ status: false, message: "Server Error Occurred" });
  }
};


export const getProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {

      return res
        .status(400)
        .json({ status: false, message: "Product Not Found me me" });
    }
    // console.log(product.owner.toString(), req?.user?.userId);
    return res
      .status(200)
      .json({
        status: true,
        message: "Product Fetched Succesfully",
        data: product,
      });
  } catch (e) {
    return res
      .status(500)
      .json({ status: false, message: "Server Error Occured" });
  }
};


export const addProduct = async (req, res) => {
  console.log("product adding")
  try {

    const validateBody = productSchema.safeParse({
      ...req.body,
      owner: req?.user?.userId,
    });

    if (!validateBody.success) {
      return res
        .status(400)
        .json({ success: false, errors: validateBody.error.errors });
    }


    if (!req.files || !req.files.images) {
      return res
        .status(400)
        .json({ success: false, message: "No files were uploaded." });
    }

    const files = Array.isArray(req.files.images)
      ? req.files.images
      : [req.files.images];
    const timestamp = Math.round(new Date().getTime() / 1000);

    const uploadPromises = files.map((file) =>
      cloudinary.uploader.upload(file.tempFilePath, {
        folder: "renter-images",
        timestamp: timestamp,
      })
    );
    const results = await Promise.all(uploadPromises);


    files.forEach((file) => {
      fs.unlink(file.tempFilePath, (err) => {
        if (err) console.error("Failed to delete temp file:", err);
      });
    });


    const { latitude, longitude } = req.body;

    const product = new Product({
      ...req.body,
      owner: req?.user?.userId,
      images: results.map((result) => ({
        url: result.secure_url,
        public_id: result.public_id,
      })),

      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });


    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product Added Successfully",
      data: { product },
    });
  } catch (error) {
    console.error("Error uploading files or saving product:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error Occurred" });
  }
};


export const editProduct = async (req, res, next) => {
  const productId = req.params.id;

  try {

    let product = await Product.findById(productId);
    if (!product)
      return res
        .status(200)
        .json({ success: false, messgae: "Product Not found" });
    if (product.owner.toString() !== req?.user?.userId) {
      return res.status(400).json({ success: false, message: "Don't have access to edit" });
    }
    const validateBody = productSchema.safeParse({
      ...req.body,
      owner: req?.user?.userId,
    });

    if (!validateBody.success) {
      return res
        .status(400)
        .json({ success: false, errors: validateBody.error.errors });
    }

    const files = req?.files?.images;

    const uploadPromises = [];
    if (files) {
      if (Array.isArray(files)) {
        files.forEach((file) => {
          uploadPromises.push(
            cloudinary.uploader.upload(file.tempFilePath, {
              folder: "renter-images",
            })
          );
        });
      } else {
        uploadPromises.push(
          cloudinary.uploader.upload(files.tempFilePath, {
            folder: "renter-images",
          })
        );
      }
    }

    const results = await Promise.all(uploadPromises);

    if (uploadPromises.length > 0) {
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        {
          $set: {
            ...req.body,
            owner: req?.user?.userId,
            images: results,
          },
        },
        { new: true }
      );
      return res
        .status(200)
        .json({ success: true, message: "Product Updated Succesfully" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          ...req.body,
          owner: req?.user?.userId,
          images: product?.images,
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .json({ success: true, message: "Product Updated Succesfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error Occured" });
  }
  next();
};

export const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "Product Not Found" });
    }

    await Product.findByIdAndDelete(productId);
    return res
      .status(200)
      .json({ success: true, message: "Product Deleted Succesfully" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error Occured" });
  }
};

export const getMyAds = async (req, res, next) => {
  try {
    const products = await Product.find({ owner: req?.user?.userId });
    return res.status(200).json({
      status: true,
      message: "Products Fetched Succesfully",
      data: products,
    });


  } catch (e) {
    return res
      .status(500)
      .json({ status: false, message: "Server Error Occured" });
  }
  next();
};

export const searchProducts = async (req, res, next) => {
  try {

    const query = req.query.query;

    if (!query) {
      return res.json([]);
    }


    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    });

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export const RentalRequest = async (req, res, next) => {
  try {



    const { productId, ownerId } = req.body;

    const request = await Request.findOne({ productId: productId, userId: req.user.userId })

    if (request) {
      return res.status(400).json({ status: false, message: "Already Requested" });
    }


    const user = await User.findById(req.user.userId);
    const owner = await User.findById(ownerId);
    const product = await Product.findById(productId);

    console.log(user._id, owner._id, product._id)

    if (!user || !owner || !product) {

      return res.status(400).json({ status: false, message: "Something went wrong" });
    }
    console.log()

    const newRentalRequest = new Request({
      productId: productId,
      productName: product.title,
      userId: req.user.userId,
      ownerId: ownerId,
      status: 'pending',
      price: product.price.toString(),
      ownerName: owner.username,
      userName: user.username

    });

    newRentalRequest.save()
      .then(request => {
        console.log('Rental Request Created:', request);
        const notification = new Notification({
          userId: ownerId,
          message: `${user.username} has requested for rental of ${product.title}`,
        })
        notification.save().then(() => {

          return res.status(200).json({ status: true, message: "Rental Request Created Succesfully" });
        }).catch((e) => {
          console.log(e)
        });
      })
      .catch(err => {
        console.error('Error creating rental request:', err);
        return res.status(400).json({ status: false, message: "Error creating rental request" });
      });
  } catch (e) {
    console.log(e)
    return res.status(500).json({ status: false, message: "Server Error Occured" });
  }
}

export const getOwnerRequest = async (req, res, next) => {
  try {
    const request = await Request.find({ ownerId: req.user.userId });
    return res.status(200).json({ status: true, message: "Rental Request Fetched Succesfully", data: request });
  } catch (e) {
    return res.status(500).json({ status: false, message: "Server Error Occured" });
  }
}

export const getClientRequest = async (req, res, next) => {
  try {

    const request = await Request.find({ userId: req.user.userId });
    return res.status(200).json({ status: true, message: "Rental Request Fetched Succesfully", data: request });
  } catch (e) {
    console.log(e)
    return res.status(500).json({ status: false, message: "Server Error Occured" });
  }
}

export const acceptRequest = async (req, res, next) => {
  try {
    const { productId, userId } = req.body;
    const fetchRequest = await Request.findOne({ productId: productId, userId: userId });
    if (!fetchRequest) {
      return res.status(400).json({ status: false, message: "Something went wrong" });
    }

    fetchRequest.status = 'approved';
    await fetchRequest.save();
    return res.status(200).json({ status: true, message: "Request Accepted Succesfully" });

  } catch (error) {
    console.log(error)
    return res.status(400).json({ status: false, message: "Server Error Occured" });
  }
}

export const getNotification = async (req, res, next) => {
  try {
    const notification = await Notification.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(10);
    return res.status(200).json({ status: true, message: "Notification Fetched Succesfully", data: notification });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ status: false, message: "Server Error Occured" });
  }
}