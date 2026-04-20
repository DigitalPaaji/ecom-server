import express from "express";
import { createAddress, getAllAddress } from "../controller/addressController.ts";
import { verifyUser } from "../middlewere/getUser.ts";

const route = express.Router();

route.post("/create",verifyUser as any,createAddress as any)
route.get("/get",verifyUser as any,getAllAddress as any)

export default route
