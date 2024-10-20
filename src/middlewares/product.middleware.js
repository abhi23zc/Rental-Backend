import cloudinary from "../config/cloudinaryConfig.js";
import { productSchema } from "../routes/zodSchema/productSchema.js";
import { Product } from "../schema/product.Schema.js";
import fs from "fs";
import { User } from "../schema/user.Schema.js";
import { Request } from "../schema/request.Schema.js";
import { Notification } from "../schema/notification.Schema.js";
import redis from "../config/redisClient.js";
// MONGODB_URI = mongodb+srv://zrf:abhi123@cluster0.mhsmca1.mongodb.net/renter

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

export const getProducts = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const cacheKey = latitude != "null" && longitude !== "null" ? `products:${latitude},${longitude}` : `products:all`;
    if (latitude == "null" && longitude == "null") {

      const products = await Product.find({});
      await redis.set(cacheKey, JSON.stringify(products), 'EX', 36000);
      return res.status(200).json({ status: true, message: "Products Fetched Successfully", data: products });
    }



    const cachedData = await redis.get(cacheKey);

    if (cachedData) {

      return res.status(200).json({
        status: true,
        message: "Products Fetched Successfully (from cache)",
        data: JSON.parse(cachedData),
      });
    }


    let filter = {};
    if (latitude && longitude) {
      const radius = 30;
      filter.location = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            parseFloat(radius) / 6378.1,
          ],
        },
      };
    }

    const products = await Product.find(filter);
    if (products && products.length == 0) {

      const products = await Product.find({});
      return res.status(200).json({
        status: true,
        message: "Products Fetched Successfully",
        data: products,
      })
    }

    await redis.set(cacheKey, JSON.stringify(products), 'EX', 36000);

    return res.status(200).json({
      status: true,
      message: "Products Fetched Successfully",
      data: products,
    });
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
      return res.status(400).json({ status: false, message: "Product Not Found" });
    }

    return res.status(200).json({
      status: true,
      message: "Product Fetched Successfully",
      data: product,
    });
  } catch (e) {
    return res.status(500).json({ status: false, message: "Server Error Occurred" });
  }
};

export const addProduct = async (req, res) => {
  console.log("product adding");
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

    await redis.del("products:all");
    await redis.del(`products:${latitude},${longitude}`);

    return res.status(200).json({
      success: true,
      message: "Product Added Successfully",
      data: { product },
    });
  } catch (error) {
    console.error("Error uploading files or saving product:", error);
    return res.status(500).json({ success: false, message: "Server Error Occurred" });
  }
};

export const editProduct = async (req, res, next) => {
  const productId = req.params.id;

  try {
    let product = await Product.findById(productId);
    if (!product)
      return res.status(200).json({ success: false, message: "Product Not Found" });

    if (product.owner.toString() !== req?.user?.userId) {
      return res.status(400).json({ success: false, message: "Don't have access to edit" });
    }

    const validateBody = productSchema.safeParse({
      ...req.body,
      owner: req?.user?.userId,
    });

    if (!validateBody.success) {
      return res.status(400).json({ success: false, errors: validateBody.error.errors });
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
      await Product.findByIdAndUpdate(
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

      return res.status(200).json({ success: true, message: "Product Updated Successfully" });
    }

    await Product.findByIdAndUpdate(
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

    redis.flushdb((err, result) => {
      if (err) {
        console.error("Error flushing the current Redis database:", err);
      } else {
        console.log("Current Redis database deleted:", result);
      }
    });

    return res.status(200).json({ success: true, message: "Product Updated Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server Error Occurred" });
  }
  next();
};

export const deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({ success: false, message: "Product Not Found" });
    }

    await Product.findByIdAndDelete(productId);


    redis.flushdb((err, result) => {
      if (err) {
        console.error("Error flushing the current Redis database:", err);
      } else {
        console.log("Current Redis database deleted:", result);
      }
    });
    return res.status(200).json({ success: true, message: "Product Deleted Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server Error Occurred" });
  }
};

export const getMyAds = async (req, res, next) => {
  try {
    const products = await Product.find({ owner: req?.user?.userId });
    return res.status(200).json({
      status: true,
      message: "Products Fetched Successfully",
      data: products,
    });
  } catch (e) {
    return res.status(500).json({ status: false, message: "Server Error Occurred" });
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
      $text: { $search: query }
    }).sort({ createdAt: -1 });

    res.status(200).json(
      products
    );
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ status: false, error: 'Server error' });
  }
};


export const getlikedProducts = async (req, res, next) => {

  try {
    const likedProducts = await Product.find({ likedBy: req.user.userId });
    return res.status(200).json({
      status: true,
      message: "Liked Products Fetched Successfully",
      data: likedProducts,
    });
  } catch (error) {
    console.error('Error fetching liked products:', error);
    return res.status(500).json({ status: false, error: 'Server error' });
  }


}

export const likeProduct = async (req, res, next) => {
  try {
    const id = req.params.id;
    const fetchProduct = await Product.findById(id);

    if (fetchProduct.likedBy.includes(req.user.userId)) {
      const product = await Product.findByIdAndUpdate(id, { $pull: { likedBy: req.user.userId } }, { new: true });
      redis.flushdb((err, result) => {
        if (err) {
          console.error("Error flushing the current Redis database:", err);
        } else {
          console.log("Current Redis database deleted:", result);
        }
      });
      return res.status(200).json({ status: true, message: "Product disliked Successfully", data: product });



    }

    const product = await Product.findByIdAndUpdate(id, { $addToSet: { likedBy: req.user.userId } }, { new: true });
    if (!product) {
      return res.status(400).json({ status: false, message: "Product Not Found" });
    }

    redis.flushdb((err, result) => {
      if (err) {
        console.error("Error flushing the current Redis database:", err);
      } else {
        console.log("Current Redis database deleted:", result);
      }
    });


    return res.status(200).json({ status: true, message: "Product Liked Successfully", data: product });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: "Server Error Occurred" });
  }
}
