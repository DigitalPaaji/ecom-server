import express from "express";
import { createProduct, deleteProduct, getProduts, GetSingleProduct, updateProduct } from "../controller/productController.ts";
import { uploadProducts } from "../helper/addImages.ts";
const route = express.Router();


route.post("/create",uploadProducts.array("images",10),createProduct)
route.get("/all",getProduts)
route.delete("/delete/:id",deleteProduct)

route.get("/single/:slug",GetSingleProduct)

route.put("/update/:slug",uploadProducts.array("newimage",10),updateProduct)

export default route;


