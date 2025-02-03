import mongoose from 'mongoose'

const scrapedDataSchema = new mongoose.Schema({
    url: {
         type: String,
          required: true,
           unique: true
     },
    content: {
         type: String,
          required: true
     },
    timestamp: { 
        type: Date,
         default: Date.now
     }
});


export const ScrapedData = mongoose.model("ScrapedData", scrapedDataSchema)
