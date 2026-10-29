// Preset analysis of the synthetic interview selected for the product walkthrough.
const paragraphs = [
  '访谈员：你平时怎么整理会议纪要？',
  '受访者：我们项目组每周开两三次会，通常由我整理纪要。现在会先用 AI 生成草稿，再由我修改，最后发到项目群。',
  '访谈员：AI 生成之后，你主要检查什么？',
  '受访者：负责人、截止时间，还有到底答应了什么。有一次，同事说“周五应该可以给初稿”，纪要却写成“周五提交最终版”。',
  '访谈员：你怎么核对这些内容？',
  '受访者：先在转录稿里搜“周五”，找到那一段，再读前后几句话。有时候搜索结果很多，就得来回翻。如果文字还是看不明白，就回去听录音。',
  '访谈员：你会把每句话都核对一遍吗？',
  '受访者：不会。一般讨论内容我会快速看，涉及任务分工和承诺的地方会认真检查。如果会议只是同步进度，没有新增任务，我就不会逐句核对。',
  '访谈员：使用 AI 之后，整理时间有变化吗？',
  '受访者：感觉写草稿快了，以前要自己组织语言，现在主要是改。不过核对还是要花时间。我没专门计时，说不准总体省了多少。',
  '访谈员：你希望工具提供什么帮助？',
  '受访者：我点一下某条结论，就能看到它对应的原话，最好还能看到前后文。这样我能直接判断有没有理解错，不用自己再去搜索。',
  '访谈员：如果工具给结论标了“可信度高”，你还会检查吗？',
  '受访者：负责人和截止时间我还是会看。“可信度高”是工具的判断，最后纪要是我发出去的，同事有问题还是会来找我。',
  '访谈员：你希望纪要生成后自动发到群里吗？',
  '受访者：不希望直接发。可以先生成草稿，但要等我检查、修改，再点发送。有些讨论还没定下来，不能让大家以为已经决定了。',
].map((text, index) => ({ id: `M01-P${String(index + 1).padStart(3, '0')}`, text }))
const ref = (index, relation = 'reference') => ({ sourceId: 'M01', paragraphId: paragraphs[index].id, quote: paragraphs[index].text, relation })

export const demoInput = {
  synthetic: true,
  name: 'AI 会议纪要使用体验',
  topic: '会议纪要的核对与分享',
  researchQuestion: '用户如何判断 AI 纪要能否发送给同事？',
  sources: [{ sourceId: 'M01', name: 'AI 会议纪要使用体验访谈（合成）', role: '项目经理', method: '线上视频', paragraphs }],
  claims: [
    { id: 'themes-01', text: '核对任务分工与承诺\n受访者重点检查负责人、截止时间和承诺内容，一般讨论快速浏览；仅同步进度且没有新增任务时，不逐句核对。', citations: [ref(3), ref(7)] },
    { id: 'themes-02', text: 'AI 起草，人工确认后分享\n受访者使用 AI 生成草稿，由自己检查、修改后再发送到项目群，不希望将尚未确定的讨论直接发布。', citations: [ref(1), ref(15)] },
    { id: 'painPoints-01', text: '纪要可能改变承诺的含义\n“周五应该可以给初稿”曾被写成“周五提交最终版”，不确定的初稿计划被表述成了确定的最终交付。', citations: [ref(3)] },
    { id: 'painPoints-02', text: '查找原话需要反复翻阅\n受访者需搜索关键词、阅读前后文，搜索结果多时来回翻阅；文字无法帮助判断时，还要返回录音。', citations: [ref(5)] },
    { id: 'personas-01', text: '负责整理与发送纪要的项目经理\n这位受访者每周整理两三次会议纪要，使用 AI 起草，但仍承担发送后的解释责任。\n核心诉求是快速找到原话与上下文，判断纪要是否准确保留了任务和承诺。此画像仅描述本次合成访谈中的角色。', citations: [ref(1), ref(11), ref(13)] },
    { id: 'insights-01', text: '原文与上下文有助于人工核对\n受访者明确希望点击结论即可看到原话和前后文；即使工具标注“可信度高”，仍会检查负责人和截止时间。\n待验证建议：将结论与原文段落直接关联，观察是否减少查找操作。', citations: [ref(11), ref(13)] },
    { id: 'insights-02', text: '起草变快不等于整体效率已提升\n受访者感觉写草稿更快，但核对仍然耗时，且没有计时，现有材料不足以判断总体节省了多少时间。\n待验证建议：分别记录起草、核对和修改用时，再评估完整流程。', citations: [ref(9)] },
  ],
}
export const demoReview = {
  reviewScope: { limitations: ['本例使用合成访谈与预置分析，供演示溯源、修改及确认流程，不是真实用户研究或实时 AI 分析；结论仅限这位合成受访者。'] },
  reviewedTargets: demoInput.claims.map(c => ({ targetId: c.id, targetText: c.text, reviewOutcome: 'reviewed' })),
  issues: [],
}
