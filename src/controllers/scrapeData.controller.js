import { ScrapedData } from "../models/scrapedata.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import axios from 'axios'
import puppeteer from 'puppeteer'



async function getWebsiteContent() {
    try {
        let url = "https://www.neuronest.me/"
        // Check if data is already stored in MongoDB 
        const existingData = await ScrapedData.findOne({ url });

        // if (existingData && (Date.now() - existingData.timestamp.getTime()) < 3600000) {  // 1 hour cache
        //     console.log("Using cached data...");
        //     return existingData.content;
        // }
        if (existingData) {  // 1 hour cache
            console.log("Using cached data...");
            return existingData.content;
        }

        console.log("Scraping new data...");
        
        // Scrape new content if not found in cache
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2" });

        const content = await page.evaluate(() => document.body.innerText);
        await browser.close();

        if (!content.trim()) return "No content found.";

        // Store in MongoDB (update if already exists)
        await ScrapedData.findOneAndUpdate(
            { url },
            { content, timestamp: new Date() },
            { upsert: true }
        );

        return content;
    } catch (error) {
        console.error("Scraping error:", error.message);
        return "Failed to scrape website.";
    }
}

const getAiResponse = asyncHandler(async (req, res) =>{
    const { message } = req.body;


    const websiteContent = await getWebsiteContent();

    try {

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama3-8b-8192",
                messages: [
                    { role: "system", content: "You are an AI chatbot using website data. You have to give a minimal answer for the user question like in 50-60 words maximum" },
                    { role: "user", content: `Website content:\n${websiteContent}\n\nUser: ${message}` }
                ]
            },
            {
                headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
            }
        );

        res.status(200)
        .json(new ApiResponse(200, { response: response.data.choices[0].message.content }, "Responsed!"))
        ;
    } catch (error) {
        res.status(500).json({ error: "AI API error", details: error });
    }
})

export {getWebsiteContent, getAiResponse}
