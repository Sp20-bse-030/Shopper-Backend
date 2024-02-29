const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
    id:{
        type: Number,
        required: true
    },
    name:{
        type: String,
    },
    img:{
        type: String,
        reqiured : true
    },
    category:{
        type: String,
        reqiured : true
    },
    newprice:{
        type: Number,
        reqiured : true
    },
    oldprice:{
        type: Number,
        reqiured : true
    },
    date:{
        type: String,
        default: Date.now
    },
    available:{
        type: Boolean,
        default: true
    }
    
    
    

})

const Product = mongoose.model('Product', ProductSchema)

module.exports = Product