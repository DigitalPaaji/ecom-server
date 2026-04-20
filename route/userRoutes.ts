import express from "express";
// import { getAllUser, getSingleUser, sendOtp, userLogin, verifyOtp } from "../controller/userContoller.ts";
import { verifyAdmin } from "../middlewere/getAdmin.ts";

const route = express.Router();

// route.post("/send-otp",sendOtp)
// route.post("/verify-otp",verifyOtp)
// route.get("/getusers",verifyAdmin as any,getAllUser)
// route.get("/getsingle/:id",verifyAdmin as any,getSingleUser)
// route.post("/login",userLogin);


export default route