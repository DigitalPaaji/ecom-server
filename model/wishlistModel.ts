import { Document, model, Schema } from "mongoose";


interface IWishlist extends Document{
    user:Schema.Types.ObjectId;
    product: Schema.Types.ObjectId[]
}



const wishlistSchema = new Schema<IWishlist>({
    user:{
        type: Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    product:[
        {type:Schema.Types.ObjectId,ref:"products"}
    ]
},{
    timestamps:true
})



const Wishlist=  model<IWishlist>("wishlist",wishlistSchema)

export default Wishlist