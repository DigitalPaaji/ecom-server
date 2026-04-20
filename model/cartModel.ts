import mongoose, { Document, model, Schema } from "mongoose";



interface ICart extends Document{
user:mongoose.Schema.Types.ObjectId;
product:mongoose.Schema.Types.ObjectId;
productvarient:string;
quantity:Number;
}


const cartSchema = new Schema<ICart>({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"products",
        required:true
    },
   
     productvarient:{
        type:String,
        
        required:true
    },
     quantity: {
      type: Number,
      default: 1,
      min: 1, 
    },
}, { timestamps: true });

const Cart = model<ICart>("cart",cartSchema)

export default Cart;
