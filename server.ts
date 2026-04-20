import dotenv from "dotenv";
dotenv.config()
import express from "express";
import mongoose from "mongoose";
import cors from "cors"
import cookieParser from "cookie-parser"
import path from "path";

import adminuser from "./route/adminRoutes.ts"
import bannersuses from "./route/bannerRoutes.ts"
import categoryuses from "./route/categoryRoutes.ts"
import productRoutes from "./route/productRoutes.ts"
import userRoutes from "./route/userRoutes.ts"
import cartRoutes from "./route/cartRoutes.ts"
import addressRoutes from "./route/addressRoutes.ts"
import collectionRoutes from "./route/collectionRoutes.ts"
import { rateLimiter } from "./helper/rateLimiter.ts";
import UserData  from "./route/user/dataRoutes.ts"



const app = express()
app.use(express.json());
app.use(cookieParser());
app.use( cors({
    origin: process.env.FRONTEND_URL!.split(","),
    credentials: true,               
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }))

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"),
 {
    maxAge: "7d",              
    etag: true,               
    lastModified: true,        
    immutable: true            
  })
);

app.use("/api/v1/admin",adminuser)
app.use("/api/v1/banners",bannersuses)
app.use("/api/v1/category",categoryuses)
app.use("/api/v1/products",productRoutes)
app.use("/api/v1/user",userRoutes)


app.use("/api/v1/cart",cartRoutes)
app.use("/api/v1/address",addressRoutes)
app.use("/api/v1/collection",collectionRoutes)



app.use("/api/v1/user/get",UserData)





const PORT = process.env.PORT;

mongoose.connect(process.env.DB_URL!).then(()=>{
 app.listen(PORT,()=>{
     
  console.log(`server running on http://localhost:${PORT}`);
 
})
    
})


