import type { Request, Response } from "express";
import Product from "../model/productSchema";
import Category from "../model/categoryModel";
import { PipelineStage } from "mongoose";

import { Types } from "mongoose";
import { removeImage } from "../helper/removeImage";
import redisClient from "../helper/redisServer";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      shortDescription,
      category,
      slug,
     isBestSaller,
      isFeatured,
      isNewArrived,
      isTop,
      variants,
      tags,
      seo,
      isTopImage,
      details
    } = req.body;
   let parsedCategory: string[] =[ ]
   if (category) parsedCategory = JSON.parse(category);
    if (!name || !description || !parsedCategory.length ) {
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
   const files = req.files as {
  thumbnail?: Express.Multer.File[];
  images?: Express.Multer.File[];
};


    const images = files?.images?.map(
      (file) => `/uploads/product/${file.filename}`
    );
    const thumbnail = files?.thumbnail?.[0] ?`/uploads/product/${files.thumbnail[0].filename}`: "";

    const getdetails =  details ? JSON.parse(details) :{}
  
    const product = await Product.create({
      name,
      slug: productSlug,
      description,
      shortDescription,
      thumbnail,
      category:parsedCategory,
      tags: parsedTags,
      seo: parsedSeo,
      images,
      isFeatured,
      isBestSaller,
      isNewArrived,
      isTop,
      isTopImage:Number(isTopImage)  || null  ,
      variants:JSON.parse(variants),
      details:getdetails
    });


       await Category.updateMany(
      {
        _id: {
          $in: parsedCategory,
        },
      },
      {
        $addToSet: {
          product: product._id,
        },
      }
    );

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

    const search = String(req.query.search || "").trim();

    // Search filter
    const filter: any = {};

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          slug: {
            $regex: search,
            $options: "i",
          },
        }, 
        {
          shortDescription: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select(
          "name slug shortDescription thumbnail category variants isFeatured"
        )
        .populate("category"),

     
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      page: {
        page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
      },
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
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
   await removeImage({ imgpath: product.thumbnail })



 if (product.category?.length > 0) {
      await Category.updateMany(
        {
          _id: {
            $in: product.category,
          },
        },
        {
          $pull: {
            product: product._id,
          },
        }
      );
    }


   
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

export const updateProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      name,
      isTop,
      isTopImage,
      description,
      shortDescription,
      category,
      tags,
      isFeatured,
      isNewArrived,
      isBestSaller,
      isActive,
      seo,
      deleteImg,
      details,
      variants,
    } = req.body;

    // ==========================================
    // Parse JSON fields
    // ==========================================

    let parsedSeo: any = {};
    let parsedTags: string[] = [];
    let deleteImgArray: string[] = [];
    let parsedDetails: any = {};
    let parsedCategory: string[] = [];
    let parsedVariants: any[] = [];

    try {
      if (seo) {
        parsedSeo =
          typeof seo === "string"
            ? JSON.parse(seo)
            : seo;
      }

      if (tags) {
        parsedTags =
          typeof tags === "string"
            ? JSON.parse(tags)
            : tags;
      }

      if (deleteImg) {
        deleteImgArray =
          typeof deleteImg === "string"
            ? JSON.parse(deleteImg)
            : deleteImg;
      }

      if (details) {
        parsedDetails =
          typeof details === "string"
            ? JSON.parse(details)
            : details;
      }

      if (category) {
        parsedCategory =
          typeof category === "string"
            ? JSON.parse(category)
            : category;
      }

      if (variants) {
        parsedVariants =
          typeof variants === "string"
            ? JSON.parse(variants)
            : variants;
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid JSON in category, tags, seo, details, variants or deleteImg",
      });
    }

    // ==========================================
    // Validate category
    // ==========================================

    if (
      !Array.isArray(parsedCategory) ||
      parsedCategory.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one category is required",
      });
    }

    // Remove duplicate category IDs
    parsedCategory = [...new Set(parsedCategory)];

    // ==========================================
    // Validate categories exist
    // ==========================================

    const categories = await Category.find({
      _id: {
        $in: parsedCategory,
      },
    });

    if (categories.length !== parsedCategory.length) {
      return res.status(404).json({
        success: false,
        message: "One or more categories not found",
      });
    }

    // ==========================================
    // Update product basic information
    // ==========================================

    if (typeof name === "string") {
      product.name = name.trim();
    }

    if (description !== undefined) {
      product.description = description;
    }

    if (shortDescription !== undefined) {
      product.shortDescription = shortDescription;
    }

    product.seo = parsedSeo;

    product.tags = parsedTags;

    product.details = parsedDetails;

    product.variants = parsedVariants;

    product.isFeatured =
      isFeatured ?? product.isFeatured;

    product.isNewArrived =
      isNewArrived ?? product.isNewArrived;

    product.isBestSaller =
      isBestSaller ?? product.isBestSaller;

    product.isTop =
      isTop ?? product.isTop;

    product.isTopImage =
      isTopImage !== undefined
        ? Number(isTopImage) || null
        : product.isTopImage;

    product.isActive =
      isActive ?? product.isActive;

    // ==========================================
    // Delete selected old images
    // ==========================================

    if (
      Array.isArray(deleteImgArray) &&
      deleteImgArray.length > 0
    ) {
      await Promise.all(
        deleteImgArray.map((img) =>
          removeImage({
            imgpath: img,
          })
        )
      );

      product.images = product.images.filter(
        (img) => !deleteImgArray.includes(img)
      );
    }

    // ==========================================
    // Files
    // ==========================================

    const files = req.files as {
      newthumbnail?: Express.Multer.File[];
      newimage?: Express.Multer.File[];
    };

    // ==========================================
    // Replace thumbnail
    // ==========================================

    if (files?.newthumbnail?.[0]) {
      // Delete old thumbnail
      if (product.thumbnail) {
        await removeImage({
          imgpath: product.thumbnail,
        });
      }

      // Save new thumbnail
      product.thumbnail =
        `/uploads/product/${files.newthumbnail[0].filename}`;
    }

    // ==========================================
    // Add new product images
    // ==========================================

    const newImages =
      files?.newimage?.map(
        (file) =>
          `/uploads/product/${file.filename}`
      ) || [];

    if (newImages.length > 0) {
      product.images = [
        ...product.images,
        ...newImages,
      ];
    }

    // ==========================================
    // CATEGORY SYNCHRONIZATION
    // ==========================================

    const oldCategories =
      product.category?.map((id) =>
        id.toString()
      ) || [];

    const newCategories =
      parsedCategory.map((id) =>
        id.toString()
      );

    // Categories that were removed
    const removedCategories =
      oldCategories.filter(
        (id) => !newCategories.includes(id)
      );

    // Categories that were newly added
    const addedCategories =
      newCategories.filter(
        (id) => !oldCategories.includes(id)
      );

    // ------------------------------------------
    // Remove product from removed categories
    // ------------------------------------------

    if (removedCategories.length > 0) {
      await Category.updateMany(
        {
          _id: {
            $in: removedCategories,
          },
        },
        {
          $pull: {
            product: product._id,
          },
        }
      );
    }

    // ------------------------------------------
    // Add product to newly added categories
    // ------------------------------------------

    if (addedCategories.length > 0) {
      await Category.updateMany(
        {
          _id: {
            $in: addedCategories,
          },
        },
        {
          $addToSet: {
            product: product._id,
          },
        }
      );
    }

    // ------------------------------------------
    // Make sure product exists in ALL new categories
    // ------------------------------------------

    await Category.updateMany(
      {
        _id: {
          $in: newCategories,
        },
      },
      {
        $addToSet: {
          product: product._id,
        },
      }
    );

    // Update product category array
    product.category = parsedCategory as any;

    // ==========================================
    // Save product
    // ==========================================

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error: any) {
    console.error(
      "Update Product Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const SearchProduct = async(req: Request, res: Response)=>{
try {  
  const search = String(req.params.search).trim();

if (!search) {
      return res.status(400).json({
        success: false,
        message: "Search value is required",
      });
    }

    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


//  if (search) {
//       filter.$or = [
//         {
//           name: {
//             $regex: search,
//             $options: "i",
//           },
//         },
//         {
//           slug: {
//             $regex: search,
//             $options: "i",
//           },
//         },
//         {
//           shortDescription: {
//             $regex: search,
//             $options: "i",
//           },
//         },
//       ];
//     }

const products = await Product.find({
  isActive: true,
  name: {
    $regex: safeSearch,
    $options: "i",
  },
   shortDescription: {
            $regex: safeSearch,
            $options: "i",  
          },
   slug: {
            $regex: safeSearch,
            $options: "i",
          },
}).select("name slug thumbnail").sort({ createdAt: -1 })
      .limit(10)
      .lean();;

return res.status(200).json({
      success: true,
      total: products.length,
      products,
    });
} catch (error) {
    console.error("Search product error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search products",
    });
}
}

export const getWishlistProduct = async(req: Request, res: Response)=>{
try {
  
  const {wishlist}=  req.body;
 if (!Array.isArray(wishlist)) {
      return res.status(400).json({
        success: false,
        message: "Wishlist must be an array",
      });
    }
     if (wishlist.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Wishlist is empty",
        products: [],
      });
    }
  const product = await  Product.find({  _id: { $in: wishlist }}).select(" variants name  thumbnail slug")

return res.status(200).json({
      success: true,
      message: "Wishlist products fetched successfully",
      count: product.length,
      product,
    });
} catch (error : any) {
     return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
}
}




////////////cash ///////////

export const getBestSellerProduct = async(req: Request, res: Response)=>{
try {
  const key = "bestseller";

    // Check cached products
    const cachedProducts = await redisClient.get(key);

    if (cachedProducts) {
      return res.status(200).json({
        success: true,
       
        products: JSON.parse(cachedProducts),
      });
    }

    // Fetch from database
    const products = await Product.find({
      isActive: true,
      isBestSaller: true,
    }).select(" variants name  thumbnail slug")
      .sort({ createdAt: -1 })
      .lean();

    // Cache for 5 minutes
    await redisClient.set(key, JSON.stringify(products), {
      EX: 300,
    });

    return res.status(200).json({
      success: true,
   
      products,
    });
  } catch (error) {
    console.error("Get bestseller products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bestseller products",
    });
  }
}
export const getFeaturedProduct = async(req: Request, res: Response)=>{
try {
  const key = "featured";

    // Check cached products
    const cachedProducts = await redisClient.get(key);

    if (cachedProducts) {
      return res.status(200).json({
        success: true,
       
        products: JSON.parse(cachedProducts),
      });
    }

    // Fetch from database
    const products = await Product.find({
      isActive: true,
      isFeatured: true,
    }).select(" variants name  thumbnail slug")
      .sort({ createdAt: -1 })
      .lean();

    // Cache for 5 minutes
    await redisClient.set(key, JSON.stringify(products), {
      EX: 300,
    });

    return res.status(200).json({
      success: true,
   
      products,
    });
  } catch (error) {
    console.error("Get Featured products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Featured products",
    });
  }
}

export const getSingleProduct = async(req:Request,res:Response)=>{
  try {
     const { slug } = req.params;
      if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
    }

       const product = await Product.findOne({
      slug,
      isActive: true,
    }).populate("category");

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



  } catch (error) {
    
       return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
}

export const getProductbycat=async(req:Request,res:Response)=>{
  try {
       const {categoryid} = req.params
 
       const products = await Product.find({ isActive: true,category:categoryid}).select(" variants name  thumbnail slug")
      .sort({ createdAt: -1 })
      .lean();
       return res.status(200).json({
      success: true,
  
      products,
    });
  } catch (error) {
     return res.status(500).json({
      success: false,
      message: "Failed to fetch products by category.",
    });
  }
}

export const getProductTop=async(req:Request,res:Response)=>{
 try {
  const key = "istop";

    // Check cached products
    const cachedProducts = await redisClient.get(key);

    if (cachedProducts) {
      return res.status(200).json({
        success: true,
       
        products: JSON.parse(cachedProducts),
      });
    }

    // Fetch from database
    const products = await Product.find({
      isActive: true,
      isTop: true,
    }).select(" variants name  thumbnail slug shortDescription  images isTopImage")
      .sort({ createdAt: -1 })
      .lean();

    // Cache for 5 minutes
    await redisClient.set(key, JSON.stringify(products), {
      EX: 300,
    });

    return res.status(200).json({
      success: true,
   
      products,
    });
  } catch (error) {
    console.error("Get Featured products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Featured products",
    });
  }
}


type ProductSort =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "price-low"
  | "price-high"
  |"bestseller"

const getQueryString = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim();
  }

  return "";
};

export const getProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    /*
     * Pagination
     */
    const pageQuery = Number(getQueryString(req.query.page));
    const limitQuery = Number(getQueryString(req.query.limit));

    const page =
      Number.isInteger(pageQuery) && pageQuery > 0
        ? pageQuery
        : 1;

    const limit =
      Number.isInteger(limitQuery) && limitQuery > 0
        ? Math.min(limitQuery, 50)
        : 16;

    const skip = (page - 1) * limit;

    /*
     * Query parameters
     */
    const categorySlug = getQueryString(req.query.category);
    const sortValue = getQueryString(req.query.sort) || "newest";

    const allowedSorts: ProductSort[] = [
      "newest",
      "oldest",
      "name-asc",
      "name-desc",
      "price-low",
      "price-high",
      "bestseller",
    ];

    const sort: ProductSort = allowedSorts.includes(
      sortValue as ProductSort
    )
      ? (sortValue as ProductSort)
      : "newest";

    /*
     * Price validation
     */
    const minPriceQuery = getQueryString(req.query.min);
    const maxPriceQuery = getQueryString(req.query.max);

    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    if (minPriceQuery !== "") {
      minPrice = Number(minPriceQuery);

      if (!Number.isFinite(minPrice) || minPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Minimum price must be a valid positive number",
        });
      }
    }

    if (maxPriceQuery !== "") {
      maxPrice = Number(maxPriceQuery);

      if (!Number.isFinite(maxPrice) || maxPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Maximum price must be a valid positive number",
        });
      }
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum price cannot be greater than maximum price",
      });
    }

    /*
     * Main product filter
     */
    const productMatch: Record<string, unknown> = {
      isActive: true,
    };

  
    if (categorySlug) {
      const category = await Category.findOne({
        slug: categorySlug,
      })
        .select("_id")
        .lean();

      if (!category) {
        return res.status(200).json({
          success: true,
          products: [],
          pagination: {
            totalProducts: 0,
            totalPages: 0,
            currentPage: page,
            limit,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }

      productMatch.category = category._id;
    }

    /*
     
     */
    const priceConditions: Record<string, unknown>[] = [
      {
        $eq: ["$$variant.isActive", true],
      },
      {
        $isNumber: "$$variant.mrp",
      },
    ];

    if (minPrice !== undefined) {
      priceConditions.push({
        $gte: ["$$variant.mrp", minPrice],
      });
    }

    if (maxPrice !== undefined) {
      priceConditions.push({
        $lte: ["$$variant.mrp", maxPrice],
      });
    }

    /*
     * Product sorting
     */
    let sortQuery: Record<string, 1 | -1> = {
      createdAt: -1,
      _id: -1,
    };
  

    switch (sort) {
      case "oldest":
        sortQuery = {
          createdAt: 1,
          _id: 1,
        };
        break;

      case "name-asc":
        sortQuery = {
          name: 1,
          _id: 1,
        };
        break;

      case "name-desc":
        sortQuery = {
          name: -1,
          _id: -1,
        };
        break;

      case "price-low":
        sortQuery = {
          sortPrice: 1,
          createdAt: -1,
        };
        break;

      case "price-high":
        sortQuery = {
          sortPrice: -1,
          createdAt: -1,
        };
        break;
         case "bestseller":
       productMatch.isBestSaller=true
        break;

      case "newest":
      default:
        sortQuery = {
          createdAt: -1,
          _id: -1,
        };
        break;
    }
// isBestSaller
    /*
     * Aggregation pipeline
     */
    const pipeline: PipelineStage[] = [
      {
        $match: productMatch,
      },

      /*
       * Keep only active variants in the returned product.
       */
      {
        $set: {
          variants: {
            $filter: {
              input: {
                $ifNull: ["$variants", []],
              },
              as: "variant",
              cond: {
                $eq: ["$$variant.isActive", true],
              },
            },
          },
        },
      },

      /*
       * Remove products without active variants.
       */
      {
        $match: {
          "variants.0": {
            $exists: true,
          },
        },
      },

      /*
       * Find variants matching the selected price range.
       */
      {
        $set: {
          priceMatchedVariants: {
            $filter: {
              input: "$variants",
              as: "variant",
              cond: {
                $and: priceConditions,
              },
            },
          },
        },
      },

      /*
       * Remove products that do not have any variant
       * matching the price range.
       */
      {
        $match: {
          "priceMatchedVariants.0": {
            $exists: true,
          },
        },
      },

      /*
       * Calculate the lowest matching active variant price.
       * This is used for low-to-high and high-to-low sorting.
       */
      {
        $set: {
          sortPrice: {
            $min: {
              $map: {
                input: "$priceMatchedVariants",
                as: "variant",
                in: "$$variant.mrp",
              },
            },
          },
        },
      },

      /*
       * Return products and total count in one database query.
       */
      {
        $facet: {
          products: [
            {
              $sort: sortQuery,
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
            {
              $project: {
                name: 1,
                slug: 1,
                thumbnail: 1,
                variants: 1,
                sortPrice: 1,
              },
            },
          ],

          pagination: [
            {
              $count: "totalProducts",
            },
          ],
        },
      },
    ];

    const [result] = await Product.aggregate(pipeline).collation({
      locale: "en",
      strength: 2,
    });

    const products = result?.products ?? [];

    const totalProducts =
      result?.pagination?.[0]?.totalProducts ?? 0;

    const totalPages = Math.ceil(totalProducts / limit);

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        totalProducts,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        category: categorySlug || null,
        minPrice: minPrice ?? null,
        maxPrice: maxPrice ?? null,
        sort,
      },
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};



export const getRandomProduct = async ( req: Request,res: Response)=>{
try{

const key = "randomproducts";

    // Check Redis cache
    const cacheProduct = await redisClient.get(key);

    if (cacheProduct) {
      return res.status(200).json({
        success: true,
        products: JSON.parse(cacheProduct),
      });
    }
   const products = await Product.aggregate([
      { $sample: { size: 20 } },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
        },
      },
    ]);
 await redisClient.setEx(
      key,
      600,
      JSON.stringify(products)
    );


  return res.status(200).json({
      success: true,
      products,
    });

}
catch(error){
 return res.status(500).json({
      success: false,
      message: "Failed to get random products",
    });
}
} 