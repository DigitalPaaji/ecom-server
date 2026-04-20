import { Document, model, Schema } from "mongoose";


interface IAddress {
pincode:string;
city:string;
state:string;
country:string;
addressLine:string;
}



interface IUser extends Document{
    name:string;
    email:string;
    password:string;

  role:string;
phone:string;
address:IAddress;
    status:Boolean;
}


const userSchema = new Schema<IUser>({
    name:{
        type:String,
   
        trim:true
    },
     email:{
        type:String,
        required:true,
        trim:true,
        unique:true,
    },
      password:{
    type:String
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user", 
  },
   phone: { type: String, default: "" },

  address: {
    pincode: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    addressLine: { type: String, default: "" },
  },
    
     status:{
        type:Boolean,
       default:true
    },
  
},{
    timestamps:true
})

const User = model<IUser>("user",userSchema);

export default User;

