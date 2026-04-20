import express from "express";
import { addProduct, createCollection, deleteCollection, getAllProduct, getCollection, removeProduct } from "../controller/collectionController.ts";
import { uploadCollection } from "../helper/addImages.ts";

const route  = express.Router();

route.post("/create",uploadCollection.single("image"),createCollection)
route.get("/get",getCollection)
route.put("/removeproduct/:id",removeProduct)
route.put("/addproduct/:id",addProduct)
route.get("/getproduct",getAllProduct)
route.delete("/delete/:id",deleteCollection)
export default route;