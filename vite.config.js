import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleAnalysis } from './api-analysis-handler.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react(), { name: 'local-analysis-api', configureServer(server) { server.middlewares.use('/api/analyze', (req, res) => handleAnalysis(req, res, env.DEEPSEEK_API_KEY)) } }],
    base: process.env.VERCEL ? '/' : '/insightlens/',
  }
})
