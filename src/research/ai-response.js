export function parseAiResponse(data) {
  const choice = data?.choices?.[0]
  if (choice?.finish_reason === 'length') {
    throw new Error('分析结果超过输出长度限制，内容未完整返回。请缩小单次分析范围后重试。')
  }
  if (choice?.finish_reason && choice.finish_reason !== 'stop') {
    throw new Error('模型未能完成分析，请稍后重试。')
  }
  const content = choice?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('模型返回了空内容，请重新生成分析。')
  }
  // Accept a complete Markdown JSON fence, but never repair truncated JSON.
  const text = content.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i, '$1').trim()
  let result
  try { result = JSON.parse(text) }
  catch { throw new Error('模型返回的分析格式不完整，请重新生成分析。原稿已保留。') }
  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error('模型返回的分析结构不正确，请重新生成分析。')
  }
  return result
}

export function validateAnalysis(result) {
  for (const category of ['themes', 'painPoints', 'personas', 'insights']) {
    if (!Array.isArray(result[category]) || result[category].some(item => !item || typeof item !== 'object' || Array.isArray(item))) {
      throw new Error('分析结果缺少完整的主题、痛点、画像或洞察结构，请重新生成分析。原稿已保留。')
    }
  }
  return result
}
