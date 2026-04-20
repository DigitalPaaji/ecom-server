import type { Request, Response } from "express";
import Cart from "../model/cartModel.ts";
import Product from "../model/productSchema.ts"

interface UserAuth extends Request{
    user : any
}

export const addToCart=async(req:UserAuth,res:Response)=>{
try {
    const user = req.user;
     const {productid,quantity} = req.body;
    if (!productid || !quantity || quantity <= 0) {
      return res.status(400).json({ success:false, message: "Invalid data" });
    }   const product = await Product.findById(productid);
     if (!product || !product.isActive) {
      return res.status(404).json({  success:false,message: "Product not available" });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success:false, message: "Insufficient stock" });
    }


     let cartItem  = await Cart.findOne({user:user._id,product:productid});

     if(cartItem ){
        cartItem.quantity +=quantity;

    if( Number(cartItem.quantity) > Number(product.stock) ){
 return res.status(400).json({  success:false,message: "Stock limit exceeded" });
    }

      cartItem.price = product.basePrice;
      cartItem.total = Number(cartItem.quantity) * Number(cartItem.price);

      await cartItem.save();

     }else{
       cartItem = await Cart.create({
        user: user._id,
        product: productid,
        quantity,
        price: product.basePrice,
        total: product.basePrice * quantity,
      });
     }


  return res.status(200).json({
      message: "Product added to cart",
      
      success:true
    });

    
} catch (error) {
        return res.status(500).json({ success:false, message: "Server error" });

}
}

export const addIncrement = async (req: UserAuth, res: Response) => {
  try {
    const user = req.user;
    const { cartid } = req.params;

    const cart = await Cart.findOne({
      _id: cartid,
      user: user._id,
    }).populate("product");

    if (!cart) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const product = cart.product as any;

   
    if ( Number(cart?.quantity) + 1 > product.stock) {
      return res.status(400).json({ message: "Stock limit reached" });
    }

    cart.quantity  =  Number(cart?.quantity) + 1 ;
    cart.total = Number(cart.quantity) * Number(cart.price);

    await cart.save();

    return res.status(200).json({
      message: "Quantity increased",
      cart,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const cartDecrement = async (req: UserAuth, res: Response) => {
  try {
    const user = req.user;
    const { cartid } = req.params;

    const cart = await Cart.findOne({
      _id: cartid,
      user: user._id,
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    

    if (Number(cart.quantity) <= 1) {
      await Cart.deleteOne({ _id: cartid });

      return res.status(200).json({
        message: "Item removed from cart",
      });
    }

    // 🔥 Otherwise decrease quantity
    cart.quantity =   Number(cart.quantity)  - 1;
    cart.total = Number(cart.quantity) * Number(cart.price);

    await cart.save();

    return res.status(200).json({
      message: "Quantity decreased",
      cart,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteCart = async (req: UserAuth, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const cart = await Cart.findOne({
      _id: id,
      user: user._id, // 🔥 ensure cart belongs to user
    });

    if (!cart) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    await cart.deleteOne();

    return res.status(200).json({
      message: "Cart item removed successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllCartitem = async (req: UserAuth, res: Response) => {
  try {
    const user = req.user;

    const cartItems = await Cart.find({ user: user._id })
      .populate("product")
      .sort({ createdAt: -1 });

 
    const grandTotal = cartItems.reduce(
      (acc, item) => acc + Number(item.total),
      0
    );

    return res.status(200).json({
      message: "Cart fetched successfully",
      count: cartItems.length,
      grandTotal,
      cartItems,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};


