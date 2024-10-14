import { Router } from "express";
import {
    deleteProduct,
    addProduct,
    editProduct,
    getProduct,
    getProducts,
    getMyAds,
    searchProducts,
    RentalRequest,
    getOwnerRequest,
    getClientRequest,
    acceptRequest,
    getNotification
    ,
} from "../middlewares/product.middleware.js";
import { isAuthenticated } from "../middlewares/authenticate.js";
import { Product } from "../schema/product.Schema.js";

const router = Router();

router.get("/find", searchProducts);

router.get("/", getProducts);
router.get("/:id", getProduct);
router.put("/:id", isAuthenticated, editProduct);
router.delete("/:id", isAuthenticated, deleteProduct);
router.post("/", isAuthenticated, addProduct);
router.post("/request", isAuthenticated, RentalRequest);
router.get("/request/client", isAuthenticated, getClientRequest);
router.get("/request/owner", isAuthenticated, getOwnerRequest);
router.put("/request/approve", isAuthenticated, acceptRequest);



export const productRouter = router;
