import { handleAnalysis } from '../api-analysis-handler.js'
export default function handler(req, res) { return handleAnalysis(req, res, process.env.DEEPSEEK_API_KEY) }
