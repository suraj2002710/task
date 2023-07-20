const router=require("express").Router()

const multer=require('multer')
const uuid=require('uuid')
const path = require('path')
const storage=multer.diskStorage({
    destination:function(req,file,cb) {
                cb(null,'./upload')
    },
    filename:function(req,file,cb) {
        cb(null,uuid.v4()+path.extname(file.originalname))
    }
})

const upload=multer({storage:storage})
module.exports=router