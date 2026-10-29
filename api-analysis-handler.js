// Shared by the Vite development server and the Vercel function.
export async function handleAnalysis(req, res, apiKey, { request = fetch } = {}) {
  if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return }
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  if (!apiKey) { res.statusCode = 503; res.end(JSON.stringify({ error: { message: '分析服务尚未配置。你可以先使用合成样本体验审阅。' } })); return }
  try {
    let body = req.body
    if (!body) {
      let raw = ''
      for await (const chunk of req) { raw += chunk; if (raw.length > 2_000_000) { res.statusCode = 413; res.end(JSON.stringify({ error: { message: '材料过大，请拆分后重试。' } })); return } }
      body = JSON.parse(raw)
    }
    if (typeof body === 'string') body = JSON.parse(body)
    if (!Array.isArray(body.messages) || body.messages.length !== 2 || body.messages.some(m => typeof m.content !== 'string') || body.messages[0].role !== 'system' || body.messages[1].role !== 'user') {
      res.statusCode = 400; res.end(JSON.stringify({ error: { message: '请求格式无效。' } })); return
    }
    const response = await request('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: 'deepseek-chat', messages: body.messages, response_format: { type: 'json_object' }, max_tokens: Math.min(6000, Math.max(256, Number(body.max_tokens) || 2048)) }), signal: AbortSignal.timeout(90000) })
    if (!response.ok) {
      const messages = {
        400: 'DeepSeek 拒绝了分析请求（HTTP 400），请检查请求格式。',
        401: 'DeepSeek 认证失败（HTTP 401），请核对服务端使用的 API Key。',
        402: 'DeepSeek 账户余额不足（HTTP 402）。请为当前 API Key 所属账户充值，或更换有余额的 Key 后重试。',
        403: 'DeepSeek 拒绝访问（HTTP 403），请检查服务权限。',
        429: 'DeepSeek 请求受限（HTTP 429），请稍后重试。',
      }
      res.statusCode = 502
      res.end(JSON.stringify({ error: { code: 'UPSTREAM_ERROR', upstreamStatus: response.status, message: messages[response.status] || `DeepSeek 服务返回错误（HTTP ${response.status}），请稍后重试。` } }))
      return
    }
    res.statusCode = 200; res.end(JSON.stringify(await response.json()))
  } catch (error) {
    const timeout = error.name === 'TimeoutError' || error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT'
    res.statusCode = timeout ? 504 : 502
    res.end(JSON.stringify({ error: { code: timeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_CONNECTION_ERROR', message: timeout ? '连接 DeepSeek 超时，请稍后重试。' : '未能完成与 DeepSeek 的连接，请检查网络后重试。' } }))
  }
}
