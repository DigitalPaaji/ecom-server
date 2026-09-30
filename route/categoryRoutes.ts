import express from "express";
import { createCategory, deleteCategory, EditCategory, getCategory } from "../controller/categoryController";
import { uploadCategory } from "../helper/addImages";
const route = express.Router();

route.post("/create",uploadCategory.fields([
    {name:"image",maxCount:1},
    {name:"desktop",maxCount:1},
    {name:"mobile",maxCount:1},


]),createCategory)
route.get("/get-all",getCategory)
route.delete("/delete/:id",deleteCategory)

route.put("/edit/:id",uploadCategory.fields([
    { name: "newimage", maxCount: 1 },
    { name: "newdesktop", maxCount: 1 },
    { name: "newmobile", maxCount: 1 },
  ]),EditCategory)



export default route;


