import  { Document, model, Schema } from "mongoose";


interface IItems {
  product:Schema.Types.ObjectId;
  price:Number;
  quantity:Number;
}


interface IOrder extends Document{
  user:Schema.Types.ObjectId;
  address:Schema.Types.ObjectId;
  items :IItems[];
  orderStatus: "Pending" | "Confirmed" | "Shipped" | "Out for Delivery" | "Delivered" | "Cancelled";
  paymentStatus:"Pending" | "Paid" | "Failed" | "Refunded";
  paymentMethod : "COD" | "Online" | "UPI" | "Card";
  price:Number;
  discount:Number;
  totalPrice:Number;
  trackingId:String | null;

}



const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    address: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },

    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "Online", "UPI", "Card"],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    trackingId:{
      type:String,
      default:null
    }
  },
  {
    timestamps: true, 
  }
);

const Order = model<IOrder>("Order", orderSchema);
export default Order