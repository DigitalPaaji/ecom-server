import express from "express";
import { createCategory, deleteCategory, getCategory } from "../controller/categoryController.ts";
import { uploadCategory } from "../helper/addImages.ts";
const route = express.Router();

route.post("/create",uploadCategory.single("image"),createCategory)
route.get("/get-all",getCategory)
route.delete("/delete/:id",deleteCategory)




export default route;


