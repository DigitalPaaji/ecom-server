import type { Request, Response } from "express";
import Order from "../model/orderModel.ts";

interface AuthRequest extends Request {
  user: any;
}

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { addressid, paymentMethod, price, discount, totalPrice, items } =
      req.body;

    const order = await Order.create({
      user: user._id,
      address: addressid,
      items,
      paymentMethod,
      price,
      discount,
      totalPrice,
    });
  } catch (error) {}
};

export const Addtrackid = async (req: Request, res: Response) => {
  try {
    const { orderid, trackingId } = req.body;

    if (!orderid || !trackingId) {
      return res.status(400).json({
        success: false,
        message: "Order ID and Tracking ID are required",
      });
    }

    const order = await Order.findById(orderid);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.trackingId = trackingId;
    order.orderStatus = "Shipped";
    await order?.save();

    return res.status(200).json({
      success: true,
      message: "Tracking ID added successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const removeTrackid = async (req: Request, res: Response)=>{
    try {
    const orderid = req.params.orderid;
   if (!orderid) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

 const order  = await Order.findById(orderid)
  if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

  order.trackingId = null
  order.orderStatus = "Pending";
  await order?.save()
 return res.status(200).json({
      success: true,
      message: "Tracking ID removed successfully",
      order,
    });
  } catch (error) {
      return res.status(500).json({
      success: false,
      message: "Server Error",
    });  
    }
}
