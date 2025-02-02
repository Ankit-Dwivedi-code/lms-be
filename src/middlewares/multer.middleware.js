import multer from "multer";
import crypto from "crypto";
import path from "path";
const storage = multer.diskStorage({
    destination: function (req, file, cb) { //cb means callback
      cb(null, "./public/temp") //null for error and second arguement is the file path
    },
    filename: function (req, file, cb) { //It will return the file name
      crypto.randomBytes(12,function(err,bytes){//it will avoid overwriting and generate unique name of file 
        const fn=bytes.toString("hex")+path.extname(file.originalname)
        cb(null, fn) //by which name you want to upload your file
      })
    }
  })
  
   export const upload = multer({ 
    storage: storage
 })