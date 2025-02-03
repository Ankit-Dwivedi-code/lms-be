import { Router } from "express"
import { getAiResponse } from "../controllers/scrapeData.controller.js"


const router = Router()


router.route('/chat').post(getAiResponse)


export default router