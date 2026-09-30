import type { Request, Response } from "express";
import slugify from "slugify";
import Category from "../model/categoryModel";
import { removeImage } from "../helper/removeImage";
import redisClient from "../helper/redisServer";



export const createCategory = async (req:Request,res:Response) => {
  const files = req.files as {
  [fieldname: string]: Express.Multer.File[];
};

const image = `/uploads/category/${files?.image?.[0]?.filename}`;
const desktop =  `/uploads/category/${files?.desktop?.[0]?.filename}`;
const mobile =  `/uploads/category/${files?.mobile?.[0]?.filename}`;
  try {
    const {name} = await req.body;
  

   

    if (!name) {
      image && await removeImage({imgpath:image})
    desktop && await removeImage({imgpath:desktop})
    mobile && await removeImage({imgpath:mobile})
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    if (!image) {
    
    desktop && await removeImage({imgpath:desktop})
    mobile && await removeImage({imgpath:mobile})
      return res.status(400).json({ success: false, message: "Category image is required" });
    }

    const slug = slugify(name, { lower: true });

  
    const alreadyCategory = await Category.findOne({ name });
    if (alreadyCategory) {
      image && await removeImage({imgpath:image})
    desktop && await removeImage({imgpath:desktop})
    mobile && await removeImage({imgpath:mobile})
      return res.status(409).json(
        { success: false, message: "Category already exists" } );
    }


   ;

    const category = await Category.create({
      name,
      image:image,
      desktop:desktop,
      mobile:mobile,
      slug,
   
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });

  } catch (error: any) {
    image && await removeImage({imgpath:image})
    desktop && await removeImage({imgpath:desktop})
    mobile && await removeImage({imgpath:mobile})


    return res.status(500).json(
      { success: false, message: "Internal server error" });
  }
};

export const getCategory = async (req:Request,res:Response) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: categories,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json(
      { success: false, message: "Failed to fetch categories" }
    );
  }
};

export const deleteCategory= async(req:Request,res:Response)=>{
    try {
       const  id  = req.params.id;
        if (!id) {
      return res.status(400).json(
        { success: false, message: "Category ID is required" });
    } 
        const category = await Category.findById(id);
        if (!category) {
      return res.status(404).json(
        { success: false, message: "Category not found" });
    } 
           if (category.product?.length > 0) {
      return res.status(409).json(
        {
          success: false,
          message: "Cannot delete category with linked products",
        });
    }

        if(category.image){
            await removeImage({imgpath:category.image})
        }
        if(category.desktop){
            await removeImage({imgpath:category.desktop})
        }
        if(category.mobile){
            await removeImage({imgpath:category.mobile})
        }
        await category.deleteOne()
   return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });


    } catch (error) {
          return  res.json(500).json(
      { success: false, message: "Failed to delete category" } );
    }
}


export const getCacheCat = async (
  req: Request,
  res: Response
)=> {
  try {
    const cacheKey = "categories";

    
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return res.status(200).json({
        success: true,
        cached: true,
        categories: JSON.parse(cachedData),
      });
    }

    // Fetch from MongoDB
    const categories = await Category.find()
      .sort({ createdAt: -1 })
      .lean();

    // Cache for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(categories), {
      EX: 300,
    });

    return res.status(200).json({
      success: true,
      cached: false,
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

export const EditCategory = async (req: Request, res: Response) => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findById(id);

    // If category doesn't exist, remove all newly uploaded files
    if (!category) {
      if (files?.newimage?.[0]?.filename) {
        await removeImage({
          imgpath: `/uploads/category/${files.newimage[0].filename}`,
        });
      }

      if (files?.newdesktop?.[0]?.filename) {
        await removeImage({
          imgpath: `/uploads/category/${files.newdesktop[0].filename}`,
        });
      }

      if (files?.newmobile?.[0]?.filename) {
        await removeImage({
          imgpath: `/uploads/category/${files.newmobile[0].filename}`,
        });
      }

      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // -------------------------
    // Update name
    // -------------------------

    if (typeof name === "string" && name.trim()) {
      category.name = name.trim();
    }

    // -------------------------
    // New category image
    // -------------------------

    if (files?.newimage?.[0]?.filename) {
      const newImage = `/uploads/category/${files.newimage[0].filename}`;

      // Delete old image
      if (category.image) {
        await removeImage({
          imgpath: category.image,
        });
      }

      // Save new image
      category.image = newImage;
    }

    // -------------------------
    // New desktop image
    // -------------------------

    if (files?.newdesktop?.[0]?.filename) {
      const newDesktop = `/uploads/category/${files.newdesktop[0].filename}`;

      // Delete old desktop image
      if (category.desktop) {
        await removeImage({
          imgpath: category.desktop,
        });
      }

      // Save new desktop image
      category.desktop = newDesktop;
    }

    // -------------------------
    // New mobile image
    // -------------------------

    if (files?.newmobile?.[0]?.filename) {
      const newMobile = `/uploads/category/${files.newmobile[0].filename}`;

      // Delete old mobile image
      if (category.mobile) {
        await removeImage({
          imgpath: category.mobile,
        });
      }

      // Save new mobile image
      category.mobile = newMobile;
    }

    // Save category
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Edit Category Error:", error);

    // If DB update fails, remove newly uploaded files
    if (files?.newimage?.[0]?.filename) {
      await removeImage({
        imgpath: `/uploads/category/${files.newimage[0].filename}`,
      });
    }

    if (files?.newdesktop?.[0]?.filename) {
      await removeImage({
        imgpath: `/uploads/category/${files.newdesktop[0].filename}`,
      });
    }

    if (files?.newmobile?.[0]?.filename) {
      await removeImage({
        imgpath: `/uploads/category/${files.newmobile[0].filename}`,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update category",
    });
  }
};