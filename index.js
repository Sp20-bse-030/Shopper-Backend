const port = 4000;
const express = require("express")
const app = express()
const mongoose = require("mongoose")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const path = require("path")
const User = require('./Models/UserModel')
const Product = require('./Models/ProductModel')
app.use(express.json())
app.use(cors())


//database connection 
mongoose.connect("mongodb://127.0.0.1:27017/Ecommerce")
.then(()=>{
    console.log(`Connected successfully `)
})



//Api creation
app.get("/", async (req, res)=>{
    try{
        const users = await User.find()
        if(!users){
            console.log("no user found ")
        }
    res.json({
        success: "sucess",
        users

    })

    }
    catch(err){
        res.json({err: err})

    }
    
    
})


//craeting image url using multer 
const storage = multer.diskStorage({
    destination: './Upload/Images', 
    filename:(req, file, cb)=>{
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }

})
const upload = multer({storage: storage})

// craeting image upload endpoint 
app.use("/Images", express.static('Upload/Images'))
app.post("/upload", upload.single('product'), (req, res)=>{
    res.json({
        success: "success",
        url: `http://localhost:${port}/Images/${req.file.filename}`
    })
})
// addproduct api 
app.post('/addproduct', async (req, res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0){
    let lastproductarray = products.slice(-1);
     let lastproduct = lastproductarray[0];
    
     id = lastproduct.id +1;

    }
    else{
         id = 1;
    }


    const product = new Product({
        id: id,
        name: req.body.name,
        category: req.body.category,
        newprice: req.body.newprice,
        oldprice: req.body.oldprice,
        img: req.body.img,
        // date:req.body.date,
        // available: req.body.available,
    })

    console.log(product)
    await product.save()
    res.status(200).json({
        success : "true",
        name: req.body.name
    })
    
})
// creating api for remove product //ambighuous API Code if condition
app.post("/deleteproduct", async (req, res)=>{
    try{
        
    console.log(req.body.id);
    let deletedproduct = await Product.findOneAndDelete({id:req.body.id})
    if(!deletedproduct){
        console.log("no product exist")
        res.status.json({
            message: "No id exist"
        })
    }
    else{
        console.log(deletedproduct)
    }
    res.status(200).json({
        success: "True",
        Message: "succesfully deteled"
    })
    }
    catch(error){
        res.status(404).json({
            success: "false",
            Message: "Product not found "
        })

    }
})


// Api for  getting all products 
app.get('/allproducts', async (req, res)=>{
    try{

  
    const Allproducts = await Product.find();
    res.status(200).send(
        Allproducts
    )
}
catch(error){
    res.status(404).json({
        success: "fail",
        AllProduct: "No Product FOund"
    })

}
})

//Signup API



app.post('/signup', async (req, res)=>{
    try{
        let cart = {};
        for(let i = 0; i<300; i++){
            cart[i] = 0;
        }

    const signupuser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        cartitmes: cart
    })
    if(!req.body.name || !req.body.email || !req.body.password)  {
        res.status(400).json({
            Message: "all feilds required"
        })
    }
    else{
    await signupuser.save()
    const data = {
        signupuser:{
            id:signupuser.id
        }
    }
    const token = jwt.sign(data, 'secret_ecom')
    console.log(token)
    res.status(200).json({
        success: "true",
        Message : "Successfully Registered",
        token: token
    })
}

}
catch(err){
    res.status(400).json({
        Success: "false",
        Message: "User Already Exist"
    })
    console.log("user already exist")
}
})
//Log in API 
app.post('/login', async (req, res)=>{
    try{
        const loginuser = new User({
            email: req.body.email,
            password: req.body.password
        })
        console.log(loginuser)
        const loggeduser = await User.findOne({email: req.body.email, password: req.body.password})
        if(!loggeduser){
            return res.status(404).json({
                Message:"user not found"
            })
        }
        else{
            const data = {
                loggeduser:{
                    id: loggeduser.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom')
            return res.status(200).json({
                Message:"user found",
                token: token
            })
        }
        res.status(200).json({
            Message: "successfuly login",
        })
    }
    catch(err){
        res.status(404).json({
            success: "false",
            Message: "User not found"
        })
    }

})
// New collection API 
app.get('/newcollection', async (req, res)=>{
    try{
    let product = await Product.find({});
    let newcollection = product.slice(1).slice(-5);
    res.status(200).send(
        newcollection

    )
}
catch(err){
    res.status(404).json({
        Message: "not found"
    })
}

})
// popular in women API
app.get('/populerinwomen', async (req, res)=>{
    try{
    let product = await Product.find({category:'women'});
    let populerwomen = product.slice(1).slice(-5);
    res.status(200).send(
        populerwomen
    )
}
catch(err){
    res.status(404).json({
        Message: "products not found"
    })

}
})
// Middleware to fetch user from the token
const fetchuser = async (req, res, next)=>{
    let token = req.header('auth-token');
    if(!token){
        res.status(401).send({error : "please authenticate a valid token"})
    }
    else{
        try{
            const data = jwt.verify(token, 'secret_ecom')
            req.loggeduser = data.loggeduser;
            next();


        }
        catch(err){
            res.status(401).send({error : "please authenticate a valid token"})

        }
    }


}
//Add to cart API
app.post('/addtocart', fetchuser, async (req, res)=>{
    let userdata = await User.findOne({_id: req.loggeduser.id})
     userdata.cartitmes[req.body.itemId] +=1;
     await User.findOneAndUpdate({_id: req.loggeduser.id}, {cartitmes:userdata.cartitmes})
     console.log("Added")
     res.send("Added")
    

})
// remove from cart API
app.post('/removefromcart', fetchuser, async (req, res)=>{
    let userdata = await User.findOne({_id: req.loggeduser.id})
    if(userdata.cartitmes[req.body.itemId]>0){
    userdata.cartitmes[req.body.itemId] -=1;
    }
    await User.findOneAndUpdate({_id: req.loggeduser.id}, {cartitmes:userdata.cartitmes})
    console.log("Removed")
    res.send("Removed")
   

})
// Getcartitems API
app.post('/getcart', fetchuser, async (req, res)=>{
    let userdata = await User.findOne({_id: req.loggeduser.id})
    console.log(userdata)
    res.json(userdata.cartitmes)
    

})
// setting server
app.listen(port, (error)=>{
    if(!error){
        console.log(`server running on port ${port}`)
    }
})

