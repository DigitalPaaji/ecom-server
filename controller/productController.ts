import type { Request, Response } from "express";
import Product from "../model/productSchema.ts";
import Category from "../model/categoryModel.ts";
import { Types } from "mongoose";
import { removeImage } from "../helper/removeImage.ts";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      shortDescription,
      category,
      slug,
     
      isFeatured,
   variants,
      tags,
      seo,
      details
    } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({
        message: "Name, Description, and Category are required",
      });
    }

    // -------- Slug --------
    let productSlug = slug;
    if (!productSlug) {
      productSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    const existingProduct = await Product.findOne({ slug: productSlug });
    if (existingProduct) {
      productSlug = `${productSlug}-${Date.now()}`;
    }

    // -------- Parse JSON fields --------
    let parsedTags: string[] = [];
    let parsedSeo: any = {};

    try {
      if (tags) parsedTags = JSON.parse(tags);
      if (seo) parsedSeo = JSON.parse(seo);
    } catch {
      return res
        .status(400)
        .json({ message: "Invalid JSON in tags or seo" });
    }

    // -------- Images --------
    const files = req.files as Express.Multer.File[];

    const images = files?.map(
      (file) => `/uploads/product/${file.filename}`
    );

    const getdetails =  details ? JSON.parse(details) :{}
  
    const product = await Product.create({
      name,
      slug: productSlug,
      description,
      shortDescription,
     
      category,
      tags: parsedTags,
      seo: parsedSeo,
      images,
      isFeatured,
variants:JSON.parse(variants),
      details:getdetails
    });


    const findCaegory = await Category.findById(category)
      if(!findCaegory){
        return res.status(401).json({success:false})
      }
   
findCaegory.product.push(product._id as Types.ObjectId);

    await findCaegory.save()

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getProduts = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 15;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }).select("name slug shortDescription  images category variants isFeatured").populate("category"),

      Product.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      page:{
      page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      
      },
      products,
      
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

 
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // 2️⃣ Remove images associated with the product
    // Use Promise.all so all images are deleted before proceeding
    if (product.images && product.images.length > 0) {
      await Promise.all(product.images.map(img => removeImage({ imgpath: img })));
    }

    // 3️⃣ Find the category
    const category = await Category.findById(product.category);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

   
    category.product = category.product.filter(
      item => item.toString() !== product._id.toString()
    );
    await Promise.all(
        product.images.map((item) => removeImage({ imgpath: item }))
    )
    
    await category.save();

   
    await product.deleteOne();

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const GetSingleProduct = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
    }
    const {cat} = req.query;

    let product ;
    if(cat){
product = await Product.findOne({ slug })
    }else{
      product = await Product.findOne({ slug }).populate("category")
    }

     
    

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });

  } catch (error: any) {
    console.error("GetSingleProduct Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const updateProduct = async(req: Request, res: Response)=>{
try {
  const slug = req.params.slug
  const product = await Product.findOne({slug});

  if(!product){
       return res.status(404).json({ message: "Product not found" });

  }

  const {name,description,shortDescription,category,tags,isFeatured,isActive,seo,deleteImg,details,variants} = req.body;

    const parsedSeo = seo ? JSON.parse(seo) : {};
    const parsedTags = tags ? JSON.parse(tags) : [];
    const deletimgArry: string[] = deleteImg ? JSON.parse(deleteImg) : [];
    const parseddetails = details? JSON.parse(details) : {};
product.name = name;
product.description = description;
product.shortDescription = shortDescription;

  product.seo = parsedSeo;
    product.isFeatured = isFeatured ?? product.isFeatured;
    product.isActive = isActive ?? product.isActive;
    product.tags = parsedTags;
    product.details = parseddetails;
// let deletimgArry = JSON.parse(deleteImg) as string[];
product.variants= JSON.parse(variants) 
   if (Array.isArray(deletimgArry) && deletimgArry.length > 0) {
      await Promise.all(
        deletimgArry.map((item) => removeImage({ imgpath: item }))
      ); 
    product.images = product.images.filter(
        (img) => !deletimgArry.includes(img)
      );
    }

   const newImages = (req.files as Express.Multer.File[])?.map(
        (file) => `/uploads/product/${file.filename}`
      ) || [];

    if (newImages.length > 0) {
      product.images = [...product.images, ...newImages];
    }


if(category && category.toString() !== product.category.toString()){

  const oldCat = await Category.findById(product.category);
if (!oldCat) {
    return res.status(404).json({ message: "Old category not found" });
  }


 oldCat.product = oldCat.product.filter(
  (item) => item.toString() !== product._id.toString()
);
  const newCat = await Category.findById(category);
   if (!newCat) {
    return res.status(404).json({ message: "New category not found" });
  }
 if (!newCat.product.includes(product._id)) {
    newCat.product.push(product._id);
  }
  await Promise.all([oldCat.save(), newCat.save()]);

product.category= category;



}


    await product.save();

    return res.status(200).json({
      message: "Product updated successfully",
      product,
    });

} catch (error : any) {
  console.log(error.message)
      return res.status(500).json({ message: "Server Error" });
}
}

