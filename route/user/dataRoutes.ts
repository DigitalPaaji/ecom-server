import express from "express";
import { getAllCategory, getCartProduct, getProduts, getSingleProduct, getWishlistProduct } from "../../controller/user/dataController.ts";
import { loginUser, verifyOtp } from "../../controller/userContoller.ts";
const route = express.Router();


route.get("/category",getAllCategory)


route.get("/product/:slug",getSingleProduct)
route.get("/products",getProduts)
route.post("/getcart_product",getCartProduct)
route.post("/getwishlist_product",getWishlistProduct)


////// auth   ////////////
route.post("/login",loginUser)
route.post("/verifyotp",verifyOtp)



export default route