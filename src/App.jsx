import React, { useRef, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './App.css';

/* ───────────────────────────────────────────────
   i18n — English & Chinese
   ─────────────────────────────────────────────── */
const I18N = {
  en: {
    navHowItWorks: 'How it works',
    navToolkit: 'Research Toolkit',
    navTry: 'Try it',
    heroSlogan: 'Think deeper. Move faster.',
    heroSubcopy: 'Upload interviews, get structured insights. AI drafts, you decide.',
    heroCta: 'Start Researching',
    howTitle: 'How it works',
    howSubtitle: 'From raw interviews to decisions in three steps',
    howStep1Title: 'Upload',
    howStep1Desc: 'Drop in your interview recordings or transcripts.',
    howStep2Title: 'Analyze',
    howStep2Desc: 'AI extracts themes, quotes, and patterns into structured insights.',
    howStep3Title: 'Decide',
    howStep3Desc: 'Review, edit, and export. You stay in control of every conclusion.',
    toolkitTitle: 'Research Toolkit',
    toolkitSubtitle: 'Common methods and tools for user researchers',
    toolkitLearnMore: '+ Learn more',
    cardInterview: 'In-depth Interview',
    cardInterviewDesc: 'One-on-one conversations to uncover motivations and experiences.',
    cardInterviewDetail: 'Best for exploring why users behave a certain way. Typically 30–60 minutes, semi-structured. Ideal early in the research process.',
    cardInterviewTag1: 'Qualitative',
    cardInterviewTag2: 'Discovery',
    cardSurvey: 'Survey',
    cardSurveyDesc: 'Collect quantitative data from a large number of users at once.',
    cardSurveyDetail: 'Use when you need to validate patterns across a broad audience. Keep questions concise and unbiased.',
    cardSurveyTag1: 'Quantitative',
    cardSurveyTag2: 'Validation',
    cardObservation: 'Contextual Observation',
    cardObservationDesc: 'Watch users in their natural environment without interrupting.',
    cardObservationDetail: 'Reveals behaviors users can\'t articulate. Combine with interviews for richer insights.',
    cardObservationTag1: 'Qualitative',
    cardObservationTag2: 'Discovery',
    cardSorting: 'Card Sorting',
    cardSortingDesc: 'Ask users to organize topics into categories that make sense to them.',
    cardSortingDetail: 'Used to design or evaluate information architecture. Can be open or closed sorting.',
    cardSortingTag1: 'Mixed',
    cardSortingTag2: 'IA',
    cardUsability: 'Usability Testing',
    cardUsabilityDesc: 'Observe users completing tasks on your product to find friction points.',
    cardUsabilityDetail: 'Can be moderated or unmoderated. Even 5 users can reveal major issues.',
    cardUsabilityTag1: 'Qualitative',
    cardUsabilityTag2: 'Evaluation',
    cardFocusGroup: 'Focus Group',
    cardFocusGroupDesc: 'Facilitate group discussions to surface shared attitudes and reactions.',
    cardFocusGroupDetail: 'Useful for concept testing and understanding group dynamics. Watch for groupthink.',
    cardFocusGroupTag1: 'Qualitative',
    cardFocusGroupTag2: 'Discovery',
    cardDiary: 'Diary Study',
    cardDiaryDesc: 'Participants log their experiences over time in their own words.',
    cardDiaryDetail: 'Captures longitudinal behavior and emotions. Best for products used daily or weekly.',
    cardDiaryTag1: 'Qualitative',
    cardDiaryTag2: 'Longitudinal',
    cardAB: 'A/B Testing',
    cardABDesc: 'Compare two versions of a design to see which performs better.',
    cardABDetail: 'Requires sufficient traffic to be statistically valid. Best for optimizing existing features.',
    cardABTag1: 'Quantitative',
    cardABTag2: 'Evaluation',
    cardJourney: 'Journey Mapping',
    cardJourneyDesc: 'Visualize the end-to-end experience of a user achieving a goal.',
    cardJourneyDetail: 'Synthesizes research into a shared artifact for the team. Highlights pain points and opportunities across touchpoints.',
    cardJourneyTag1: 'Synthesis',
    cardJourneyTag2: 'Strategy',
    ctaTitle: 'Stop drowning in transcripts.',
    ctaSubtitle: 'Turn hours of interviews into clear insights — today.',
    ctaBtn: 'Start Researching',
    uploadTitle: 'Upload Interview',
    uploadPlaceholder: 'Paste one or more interview transcripts…',
    uploadZoneText: 'Drag transcript files here, or ',
    uploadZoneLink: 'click to upload',
    uploadZoneHint: 'Supports TXT / DOCX / PDF, multiple files',
    uploadAnalyze: 'Start Analysis',
    uploadAnalyzing: 'Analyzing…',
    uploadVoice: 'Upload Recording',
    uploadVoiceHint: 'Speech-to-text coming soon',
    uploadError: 'Please enter some text',
    resultsTitle: 'Analysis Results',
    resultsSubtitle: 'Three dimensions to help you build a cognitive framework',
    resultsExport: 'Export Report',
    emptyTitle: 'No analysis to display yet',
    emptyText: 'Paste an interview transcript and click "Start Analysis" — AI will extract themes, pain points, personas, and key insights as a draft for you to review, adjust, and finalize.',
    colThemes: 'Themes',
    colPainPoints: 'Pain Points',
    colPersonas: 'Personas',
    overviewTitle: 'Data Overview',
    overviewChart1: 'Pain Points per Theme',
    overviewChart2: 'Severity Distribution',
    severityHigh: 'High',
    severityMedium: 'Medium',
    severityLow: 'Low',
    insightsTitle: 'Key Insights',
    insightNext: 'Next Step',
    progressStep1: 'Reading interview…',
    progressStep2: 'Clustering themes…',
    progressStep3: 'Generating insights…',
    exportFilename: 'Research Analysis Report.txt',
    exportHeader: 'AI User Research Analysis Report',
    exportThemes: 'Themes',
    exportPainPoints: 'Pain Points',
    exportFrequency: 'Frequency',
    exportSeverity: 'Severity',
    exportPersonas: 'Personas',
    exportBackground: 'Background',
    exportNeeds: 'Core Needs',
    exportInsights: 'Key Insights',
    exportNextStep: 'Next Step',
    footerTagline: 'Think deeper. Move faster.',
    footerProduct: 'Product',
    footerFeatures: 'Features',
    footerHow: 'How it works',
    footerPricing: 'Pricing',
    footerResources: 'Resources',
    footerDocs: 'Docs',
    footerBlog: 'Blog',
    footerSupport: 'Support',
    footerAbout: 'About',
    footerTeam: 'Team',
    footerContact: 'Contact',
    footerPrivacy: 'Privacy',
    footerCopyright: '\u00a9 2026 InsightLens. A PolyU School of Design project.',
    langToggle: '\u4e2d / EN',
  },
  zh: {
    navHowItWorks: '\u8fd0\u4f5c\u65b9\u5f0f',
    navToolkit: '\u7814\u7a76\u5de5\u5177\u7bb1',
    navTry: '\u5c1d\u8bd5\u4f7f\u7528',
    navStart: '\u5f00\u59cb\u7814\u7a76',
    heroSlogan: '\u601d\u8003\u66f4\u6df1\uff0c\u884c\u52a8\u66f4\u5feb\u3002',

    heroSubcopy: '\u4e0a\u4f20\u8bbf\u8c08\uff0c\u83b7\u53d6\u7ed3\u6784\u5316\u6d1e\u5bdf\u3002AI \u8d77\u8349\uff0c\u4f60\u6765\u51b3\u7b56\u3002',
    heroCta: '\u5f00\u59cb\u7814\u7a76',
    howTitle: '\u8fd0\u4f5c\u65b9\u5f0f',
    howSubtitle: '\u4ece\u539f\u59cb\u8bbf\u8c08\u5230\u51b3\u7b56\uff0c\u53ea\u9700\u4e09\u6b65',
    howStep1Title: '\u4e0a\u4f20',
    howStep1Desc: '\u62d6\u5165\u8bbf\u8c08\u5f55\u97f3\u6216\u6587\u5b57\u7a3f\u3002',
    howStep2Title: '\u5206\u6790',
    howStep2Desc: 'AI \u63d0\u53d6\u4e3b\u9898\u3001\u5f15\u6587\u548c\u6a21\u5f0f\uff0c\u5f62\u6210\u7ed3\u6784\u5316\u6d1e\u5bdf\u3002',
    howStep3Title: '\u51b3\u7b56',
    howStep3Desc: '\u5ba1\u9605\u3001\u7f16\u8f91\u3001\u5bfc\u51fa\u3002\u6bcf\u4e2a\u7ed3\u8bba\u90fd\u7531\u4f60\u638c\u63a7\u3002',
    toolkitTitle: '\u7814\u7a76\u5de5\u5177\u7bb1',
    toolkitSubtitle: '\u7528\u6237\u7814\u7a76\u8005\u5e38\u7528\u7684\u65b9\u6cd5\u4e0e\u5de5\u5177',
    toolkitLearnMore: '+ \u4e86\u89e3\u66f4\u591a',
    cardInterview: '\u6df1\u5ea6\u8bbf\u8c08',
    cardInterviewDesc: '\u901a\u8fc7\u4e00\u5bf9\u4e00\u5bf9\u8bdd\u63ed\u793a\u52a8\u673a\u4e0e\u4f53\u9a8c\u3002',
    cardInterviewDetail: '\u9002\u5408\u63a2\u7a76\u7528\u6237\u884c\u4e3a\u80cc\u540e\u7684\u539f\u56e0\u3002\u901a\u5e38 30\u201360 \u5206\u949f\uff0c\u534a\u7ed3\u6784\u5316\u5f62\u5f0f\uff0c\u5b9c\u5728\u7814\u7a76\u524d\u671f\u5f00\u5c55\u3002',
    cardInterviewTag1: '\u5b9a\u6027',
    cardInterviewTag2: '\u53d1\u73b0',
    cardSurvey: '\u95ee\u5377\u8c03\u67e5',
    cardSurveyDesc: '\u4ece\u5927\u91cf\u7528\u6237\u4e2d\u5feb\u901f\u6536\u96c6\u5b9a\u91cf\u6570\u636e\u3002',
    cardSurveyDetail: '\u5f53\u4f60\u9700\u8981\u5728\u5e7f\u6cdb\u53d7\u4f17\u4e2d\u9a8c\u8bc1\u6a21\u5f0f\u65f6\u4f7f\u7528\u3002\u95ee\u9898\u8bbe\u8ba1\u5e94\u7b80\u6d01\u4e14\u4e0d\u5e26\u504f\u8bef\u3002',
    cardSurveyTag1: '\u5b9a\u91cf',
    cardSurveyTag2: '\u9a8c\u8bc1',
    cardObservation: '\u60c5\u5883\u89c2\u5bdf',
    cardObservationDesc: '\u5728\u81ea\u7136\u73af\u5883\u4e2d\u89c2\u5bdf\u7528\u6237\uff0c\u4e0d\u6253\u6270\u4ed6\u4eec\u3002',
    cardObservationDetail: '\u63ed\u793a\u7528\u6237\u65e0\u6cd5\u7528\u8bed\u8a00\u8868\u8fbe\u7684\u884c\u4e3a\u3002\u4e0e\u8bbf\u8c08\u7ed3\u5408\u53ef\u83b7\u5f97\u66f4\u4e30\u5bcc\u7684\u6d1e\u5bdf\u3002',
    cardObservationTag1: '\u5b9a\u6027',
    cardObservationTag2: '\u53d1\u73b0',
    cardSorting: '\u5361\u7247\u5206\u7c7b',
    cardSortingDesc: '\u8bf7\u7528\u6237\u5c06\u4e3b\u9898\u7ec4\u7ec7\u6210\u5bf9\u4ed6\u4eec\u6709\u610f\u4e49\u7684\u7c7b\u522b\u3002',
    cardSortingDetail: '\u7528\u4e8e\u8bbe\u8ba1\u6216\u8bc4\u4f30\u4fe1\u606f\u67b6\u6784\u3002\u53ef\u5206\u4e3a\u5f00\u653e\u5f0f\u548c\u5173\u95ed\u5f0f\u4e24\u79cd\u3002',
    cardSortingTag1: '\u6df7\u5408',
    cardSortingTag2: 'IA',
    cardUsability: '\u53ef\u7528\u6027\u6d4b\u8bd5',
    cardUsabilityDesc: '\u89c2\u5bdf\u7528\u6237\u5728\u4f60\u7684\u4ea7\u54c1\u4e0a\u5b8c\u6210\u4efb\u52a1\uff0c\u53d1\u73b0\u6469\u64e6\u70b9\u3002',
    cardUsabilityDetail: '\u53ef\u5206\u4e3a\u4e3b\u6301\u578b\u548c\u975e\u4e3b\u6301\u578b\u3002\u5373\u4f7f\u53ea\u6709 5 \u4f4d\u7528\u6237\u4e5f\u80fd\u53d1\u73b0\u4e3b\u8981\u95ee\u9898\u3002',
    cardUsabilityTag1: '\u5b9a\u6027',
    cardUsabilityTag2: '\u8bc4\u4f30',
    cardFocusGroup: '\u7126\u70b9\u5c0f\u7ec4',
    cardFocusGroupDesc: '\u7ec4\u7ec7\u5c0f\u7ec4\u8ba8\u8bba\u4ee5\u63a2\u7d22\u5171\u540c\u6001\u5ea6\u4e0e\u53cd\u5e94\u3002',
    cardFocusGroupDetail: '\u9002\u5408\u6982\u5ff5\u6d4b\u8bd5\u548c\u7406\u89e3\u7fa4\u4f53\u52a8\u6001\u3002\u9700\u6ce8\u610f\u7fa4\u4f53\u601d\u7ef4\u6548\u5e94\u3002',
    cardFocusGroupTag1: '\u5b9a\u6027',
    cardFocusGroupTag2: '\u53d1\u73b0',
    cardDiary: '\u65e5\u8bb0\u7814\u7a76',
    cardDiaryDesc: '\u53c2\u4e0e\u8005\u7528\u81ea\u5df1\u7684\u8bdd\u8bb0\u5f55\u4e00\u6bb5\u65f6\u95f4\u5185\u7684\u4f53\u9a8c\u3002',
    cardDiaryDetail: '\u6355\u6349\u7eb5\u5411\u884c\u4e3a\u548c\u60c5\u7eea\u53d8\u5316\u3002\u9002\u5408\u6bcf\u65e5\u6216\u6bcf\u5468\u4f7f\u7528\u7684\u4ea7\u54c1\u3002',
    cardDiaryTag1: '\u5b9a\u6027',
    cardDiaryTag2: '\u7eb5\u5411',
    cardAB: 'A/B \u6d4b\u8bd5',
    cardABDesc: '\u6bd4\u8f83\u4e24\u4e2a\u8bbe\u8ba1\u7248\u672c\uff0c\u770b\u54ea\u4e2a\u8868\u73b0\u66f4\u597d\u3002',
    cardABDetail: '\u9700\u8981\u8db3\u591f\u7684\u6d41\u91cf\u624d\u80fd\u4fdd\u8bc1\u7edf\u8ba1\u6709\u6548\u6027\u3002\u9002\u5408\u4f18\u5316\u73b0\u6709\u529f\u80fd\u3002',
    cardABTag1: '\u5b9a\u91cf',
    cardABTag2: '\u8bc4\u4f30',
    cardJourney: '\u7528\u6237\u65c5\u7a0b\u5730\u56fe',
    cardJourneyDesc: '\u53ef\u89c6\u5316\u7528\u6237\u5b9e\u73b0\u76ee\u6807\u7684\u7aef\u5230\u7aef\u4f53\u9a8c\u3002',
    cardJourneyDetail: '\u5c06\u7814\u7a76\u6210\u679c\u6c47\u603b\u4e3a\u56e2\u961f\u5171\u4eab\u7684\u53ef\u89c6\u5316\u6587\u6863\u3002\u7a81\u51fa\u63d0\u793a\u5404\u89e6\u70b9\u7684\u75db\u70b9\u4e0e\u673a\u4f1a\u3002',
    cardJourneyTag1: '\u7efc\u5408',
    cardJourneyTag2: '\u7b56\u7565',
    ctaTitle: '\u522b\u518d\u6df9\u6ca1\u5728\u6587\u5b57\u7a3f\u91cc\u3002',
    ctaSubtitle: '\u5c06\u6570\u5c0f\u65f6\u7684\u8bbf\u8c08\u8f6c\u5316\u4e3a\u6e05\u6670\u7684\u6d1e\u5bdf\u2014\u2014\u5c31\u5728\u4eca\u5929\u3002',
    ctaBtn: '\u5f00\u59cb\u7814\u7a76',
    uploadTitle: '\u4e0a\u4f20\u8bbf\u8c08',
    uploadPlaceholder: '\u7c98\u8d34\u4e00\u6bb5\u6216\u591a\u6bb5\u8bbf\u8c08\u8bb0\u5f55\u2026',
    uploadZoneText: '\u5c06\u8bbf\u8c08\u7a3f\u62d6\u62fd\u5230\u6b64\u5904\uff0c\u6216',
    uploadZoneLink: '\u70b9\u51fb\u4e0a\u4f20',
    uploadZoneHint: '\u652f\u6301 TXT / DOCX / PDF\uff0c\u53ef\u591a\u6587\u4ef6\u4e0a\u4f20',
    uploadAnalyze: '\u5f00\u59cb\u5206\u6790',
    uploadAnalyzing: '\u5206\u6790\u4e2d\u2026',
    uploadVoice: '\u5f55\u97f3\u4e0a\u4f20',
    uploadVoiceHint: '\u8bed\u97f3\u8f6c\u5199\u529f\u80fd\u5373\u5c06\u4e0a\u7ebf',
    uploadError: '\u8bf7\u8f93\u5165\u4e00\u4e9b\u6587\u672c',
    resultsTitle: '\u5206\u6790\u7ed3\u679c',
    resultsSubtitle: '\u4e09\u4e2a\u7ef4\u5ea6\uff0c\u5e2e\u4f60\u5feb\u901f\u5efa\u7acb\u8ba4\u77e5\u6846\u67b6',
    resultsExport: '\u5bfc\u51fa\u62a5\u544a',
    emptyTitle: '\u8fd8\u6ca1\u6709\u53ef\u5c55\u793a\u7684\u5206\u6790',
    emptyText: '\u7c98\u8d34\u4e00\u6bb5\u8bbf\u8c08\u8bb0\u5f55\u5e76\u70b9\u51fb\u300c\u5f00\u59cb\u5206\u6790\u300d\uff0cAI \u4f1a\u4ece\u4e2d\u68b3\u7406\u51fa\u4e3b\u9898\u3001\u75db\u70b9\u3001\u7528\u6237\u753b\u50cf\u4e0e\u5173\u952e\u6d1e\u5bdf\u2014\u2014\u4f5c\u4e3a\u8349\u7a3f\u4f9b\u4f60\u5ba1\u9605\u3001\u8c03\u6574\u4e0e\u5b9a\u7a3f\u3002',
    colThemes: '\u4e3b\u9898\u805a\u7c7b',
    colPainPoints: '\u75db\u70b9\u5217\u8868',
    colPersonas: '\u7528\u6237\u753b\u50cf',
    overviewTitle: '\u6570\u636e\u6982\u89c8',
    overviewChart1: '\u5404\u4e3b\u9898\u75db\u70b9\u6570\u91cf',
    overviewChart2: '\u75db\u70b9\u4e25\u91cd\u5ea6\u5206\u5e03',
    severityHigh: '\u9ad8',
    severityMedium: '\u4e2d',
    severityLow: '\u4f4e',
    insightsTitle: '\u5173\u952e\u6d1e\u5bdf',
    insightNext: '\u4e0b\u4e00\u6b65\u5efa\u8bae',
    progressStep1: '\u6b63\u5728\u8bfb\u53d6\u8bbf\u8c08\u2026',
    progressStep2: '\u6b63\u5728\u805a\u7c7b\u4e3b\u9898\u2026',
    progressStep3: '\u6b63\u5728\u751f\u6210\u6d1e\u5bdf\u2026',
    exportFilename: '\u7528\u6237\u7814\u7a76\u5206\u6790\u62a5\u544a.txt',
    exportHeader: 'AI \u7528\u6237\u7814\u7a76\u5206\u6790\u62a5\u544a',
    exportThemes: '\u4e3b\u9898\u805a\u7c7b',
    exportPainPoints: '\u75db\u70b9\u5217\u8868',
    exportFrequency: '\u9891\u6b21',
    exportSeverity: '\u4e25\u91cd\u5ea6',
    exportPersonas: '\u7528\u6237\u753b\u50cf',
    exportBackground: '\u80cc\u666f',
    exportNeeds: '\u6838\u5fc3\u8bc9\u6c42',
    exportInsights: '\u5173\u952e\u6d1e\u5bdf',
    exportNextStep: '\u4e0b\u4e00\u6b65\u5efa\u8bae',
    footerTagline: '\u601d\u8003\u66f4\u6df1\uff0c\u884c\u52a8\u66f4\u5feb\u3002',
    footerProduct: '\u4ea7\u54c1',
    footerFeatures: '\u529f\u80fd',
    footerHow: '\u8fd0\u4f5c\u65b9\u5f0f',
    footerPricing: '\u5b9a\u4ef7',
    footerResources: '\u8d44\u6e90',
    footerDocs: '\u6587\u6863',
    footerBlog: '\u535a\u5ba2',
    footerSupport: '\u652f\u6301',
    footerAbout: '\u5173\u4e8e',
    footerTeam: '\u56e2\u961f',
    footerContact: '\u8054\u7cfb',
    footerPrivacy: '\u9690\u79c1',
    footerCopyright: '\u00a9 2026 InsightLens. \u9999\u6e2f\u7406\u5de5\u5927\u5b66\u8bbe\u8ba1\u5b66\u9662\u9879\u76ee\u3002',
    langToggle: '\u4e2d / EN',
  },
};

const SEVERITY_TONE = {
  高: 'var(--color-severity-high)',
  中: 'var(--color-severity-medium)',
  低: 'var(--color-severity-low)',
};

const SEVERITY_CHART_COLORS = { 高: '#E8409A', 中: '#FF6B35', 低: '#2ECC71' };
const THEME_BAR_COLOR = '#FF6B35';
const CHART_FONT = "'DM Sans', sans-serif";

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const SYSTEM_PROMPT = `你是一名专业的用户研究分析师。请仔细阅读用户提供的访谈内容，分析后仅以 JSON 格式输出结果，不要包含任何 JSON 之外的说明文字。

JSON 结构如下，请严格遵守字段名和取值范围：
{
  "themes": [ { "title": "主题标题", "summary": "对该主题的概括，1-2句话" } ],
  "painPoints": [ { "description": "痛点描述", "frequency": "高 | 中 | 低", "severity": "高 | 中 | 低", "theme": "该痛点所属主题的标题，必须与 themes 数组中某一项的 title 完全一致" } ],
  "personas": [ { "name": "用户画像名称", "background": "背景描述", "needs": "核心诉求" } ],
  "insights": [ { "title": "洞察标题", "description": "对该洞察的解释，1-2句话", "nextStep": "建议的下一步行动" } ]
}

要求：
- themes 数组包含 3-5 个主题聚类
- painPoints 中每条的 frequency 和 severity 字段只能是 "高"、"中"、"低" 三者之一
- painPoints 中每条的 theme 字段必须引用 themes 数组中已存在的某个 title，建立痛点与主题的关联
- personas 数组包含 1-2 个用户画像
- insights 数组包含 3-5 条深刻洞察，每条需同时给出标题、解释和建议的下一步行动`;

function TopNav({ onHowItWorks, onToolkit, onTry, onToggleLang, t }) {
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <span className="topnav-logo">InsightLens</span>
        <nav className="topnav-links">
          <button type="button" className="topnav-link" onClick={onHowItWorks}>{t.navHowItWorks}</button>
          <button type="button" className="topnav-link" onClick={onToolkit}>{t.navToolkit}</button>
          <button type="button" className="topnav-link" onClick={onTry}>{t.navTry}</button>
          <button type="button" className="topnav-lang-toggle" onClick={onToggleLang}>
            {t.langToggle}
          </button>
        </nav>
      </div>
    </header>
  );
}


function handleDecoClick(e) {
  const el = e.currentTarget;
  if (el.classList.contains('is-bouncing')) return;
  el.classList.add('is-bouncing');
  const randomAngle = (Math.random() - 0.5) * 20;
  el.style.setProperty('--rot', `rotate(${randomAngle}deg)`);
  el.addEventListener('animationend', () => {
    el.classList.remove('is-bouncing');
  }, { once: true });
}

function Landing({ onStart, landingRef, t }) {
  return (
    <section className="landing" ref={landingRef}>
      <div className="landing-inner">
        <div className="landing-content">
          <div className="landing-stage">
            <svg className="deco-svg deco-note" width="52" height="52" viewBox="0 0 48 48" fill="none" aria-hidden="true" onClick={handleDecoClick}>
              <rect x="2" y="2" width="44" height="44" rx="4" fill="#f59e0b" />
              <rect x="2" y="2" width="44" height="44" rx="4" stroke="#d97706" strokeWidth="1.5" />
              <line x1="12" y1="18" x2="36" y2="18" stroke="rgba(0,0,0,0.15)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="12" y1="26" x2="30" y2="26" stroke="rgba(0,0,0,0.15)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="12" y1="34" x2="24" y2="34" stroke="rgba(0,0,0,0.15)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <svg className="deco-svg deco-star" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true" onClick={handleDecoClick}>
              <path d="M20 2L24.5 14.5L38 16L28 25.5L30.5 39L20 32.5L9.5 39L12 25.5L2 16L15.5 14.5L20 2Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
            </svg>
            <svg className="deco-svg deco-lightbulb" width="44" height="52" viewBox="0 0 32 44" fill="none" aria-hidden="true" onClick={handleDecoClick}>
              <path d="M16 2C9.5 2 4 7.5 4 14C4 18.5 6.5 22.5 10 25V30H22V25C25.5 22.5 28 18.5 28 14C28 7.5 22.5 2 16 2Z" fill="#eab308" stroke="#d97706" strokeWidth="1.5" />
              <rect x="12" y="32" width="8" height="3" rx="1" fill="#d97706" />
              <rect x="13" y="37" width="6" height="2" rx="1" fill="#d97706" />
              <rect x="14" y="41" width="4" height="2" rx="1" fill="#d97706" />
              <line x1="16" y1="14" x2="16" y2="22" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="18" x2="20" y2="18" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <svg className="deco-svg deco-magnifier" width="46" height="46" viewBox="0 0 44 44" fill="none" aria-hidden="true" onClick={handleDecoClick}>
              <circle cx="18" cy="18" r="14" fill="#ec4899" stroke="#db2777" strokeWidth="2" />
              <circle cx="18" cy="18" r="6" fill="rgba(255,255,255,0.3)" />
              <line x1="28" y1="28" x2="40" y2="40" stroke="#db2777" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            <svg className="deco-svg deco-barchart" width="50" height="46" viewBox="0 0 48 44" fill="none" aria-hidden="true" onClick={handleDecoClick}>
              <rect x="4" y="24" width="8" height="16" rx="2" fill="#10b981" />
              <rect x="16" y="14" width="8" height="26" rx="2" fill="#10b981" />
              <rect x="28" y="20" width="8" height="20" rx="2" fill="#10b981" />
              <rect x="40" y="8" width="8" height="32" rx="2" fill="#10b981" />
            </svg>
            <h1 className="landing-title">InsightLens</h1>
          </div>
          <p className="landing-slogan">{t.heroSlogan}</p>
          <p className="landing-subcopy">{t.heroSubcopy}</p>
          <button className="landing-cta" onClick={onStart}>{t.heroCta}</button>
        </div>
        <div className="landing-image-wrap">
          <img className="landing-image" src="/research-bg.jpg" alt="Research background" />
        </div>
      </div>
      <div className="landing-deco-bottom-left" aria-hidden="true">
        <span>📋</span>
        <span>💬</span>
      </div>
      <div className="landing-deco-bottom-right" aria-hidden="true">
        <span>🔍</span>
        <span>📊</span>
      </div>
        <div className="landing-scroll-indicator" aria-hidden="true">
        <span className="landing-scroll-text">Scroll to explore</span>
        <div className="landing-scroll-indicator-arrow" />
      </div>

    </section>

  );
}

function HowItWorks({ t }) {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="how-it-works-inner">
        <h2 className="how-it-works-title">{t.howTitle}</h2>
        <p className="how-it-works-subtitle">{t.howSubtitle}</p>
        <div className="how-it-works-steps">
          <div className="how-it-works-step">
            <div className="how-it-works-step-icon how-it-works-step-icon--orange">01</div>
            <h3 className="how-it-works-step-title">{t.howStep1Title}</h3>
            <p className="how-it-works-step-desc">{t.howStep1Desc}</p>
          </div>
          <div className="how-it-works-step">
            <div className="how-it-works-step-icon how-it-works-step-icon--pink">02</div>
            <h3 className="how-it-works-step-title">{t.howStep2Title}</h3>
            <p className="how-it-works-step-desc">{t.howStep2Desc}</p>
          </div>
          <div className="how-it-works-step">
            <div className="how-it-works-step-icon how-it-works-step-icon--green">03</div>
            <h3 className="how-it-works-step-title">{t.howStep3Title}</h3>
            <p className="how-it-works-step-desc">{t.howStep3Desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}


const TOOLKIT_CARDS = [
  {
    emoji: '🎙️',
    nameKey: 'cardInterview',
    descKey: 'cardInterviewDesc',
    detailKey: 'cardInterviewDetail',
    tag1Key: 'cardInterviewTag1',
    tag2Key: 'cardInterviewTag2',
  },
  {
    emoji: '📝',
    nameKey: 'cardSurvey',
    descKey: 'cardSurveyDesc',
    detailKey: 'cardSurveyDetail',
    tag1Key: 'cardSurveyTag1',
    tag2Key: 'cardSurveyTag2',
  },
  {
    emoji: '👁️',
    nameKey: 'cardObservation',
    descKey: 'cardObservationDesc',
    detailKey: 'cardObservationDetail',
    tag1Key: 'cardObservationTag1',
    tag2Key: 'cardObservationTag2',
  },
  {
    emoji: '🗂️',
    nameKey: 'cardSorting',
    descKey: 'cardSortingDesc',
    detailKey: 'cardSortingDetail',
    tag1Key: 'cardSortingTag1',
    tag2Key: 'cardSortingTag2',
  },
  {
    emoji: '🧪',
    nameKey: 'cardUsability',
    descKey: 'cardUsabilityDesc',
    detailKey: 'cardUsabilityDetail',
    tag1Key: 'cardUsabilityTag1',
    tag2Key: 'cardUsabilityTag2',
  },
  {
    emoji: '🗣️',
    nameKey: 'cardFocusGroup',
    descKey: 'cardFocusGroupDesc',
    detailKey: 'cardFocusGroupDetail',
    tag1Key: 'cardFocusGroupTag1',
    tag2Key: 'cardFocusGroupTag2',
  },
  {
    emoji: '📊',
    nameKey: 'cardDiary',
    descKey: 'cardDiaryDesc',
    detailKey: 'cardDiaryDetail',
    tag1Key: 'cardDiaryTag1',
    tag2Key: 'cardDiaryTag2',
  },
  {
    emoji: '⚖️',
    nameKey: 'cardAB',
    descKey: 'cardABDesc',
    detailKey: 'cardABDetail',
    tag1Key: 'cardABTag1',
    tag2Key: 'cardABTag2',
  },
  {
    emoji: '🗺️',
    nameKey: 'cardJourney',
    descKey: 'cardJourneyDesc',
    detailKey: 'cardJourneyDetail',
    tag1Key: 'cardJourneyTag1',
    tag2Key: 'cardJourneyTag2',
  },
];

const TAG_COLORS = ['#FF6B35', '#E8409A', '#2ECC71', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#14B8A6'];

const ResearchToolkit = React.forwardRef(({ t }, ref) => {
  const [expanded, setExpanded] = useState({});

  const toggleCard = (index) => {
    setExpanded((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <section className="research-toolkit" ref={ref}>

      <div className="research-toolkit-inner">
        <h2 className="research-toolkit-title">{t.toolkitTitle}</h2>
        <p className="research-toolkit-subtitle">{t.toolkitSubtitle}</p>
        <div className="research-toolkit-grid">
          {TOOLKIT_CARDS.map((card, i) => {
            const isOpen = expanded[i];
            return (
              <div
                className={`toolkit-card${isOpen ? ' is-expanded' : ''}`}
                key={i}
                onClick={() => toggleCard(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCard(i);
                  }
                }}
              >
                <div className="toolkit-card-header">
                  <span className="toolkit-card-emoji">{card.emoji}</span>
                  <div className="toolkit-card-info">
                    <h3 className="toolkit-card-name">{t[card.nameKey]}</h3>
                    <p className="toolkit-card-desc">{t[card.descKey]}</p>
                  </div>
                </div>
                <div className="toolkit-card-expand">
                  <div className="toolkit-card-detail">
                    <p className="toolkit-card-detail-text">{t[card.detailKey]}</p>
                    <div className="toolkit-card-tags">
                      <span className="toolkit-tag toolkit-tag--first" style={{ background: TAG_COLORS[i % TAG_COLORS.length] }}>
                        {t[card.tag1Key]}
                      </span>
                      <span className="toolkit-tag toolkit-tag--second">
                        {t[card.tag2Key]}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="toolkit-card-hint">{t.toolkitLearnMore}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

function CTA({ onStart, t }) {

  return (
    <section className="cta-section">
      <div className="cta-section-inner">
        <h2 className="cta-section-title">{t.ctaTitle}</h2>
        <p className="cta-section-subtitle">{t.ctaSubtitle}</p>
        <button className="cta-section-btn" onClick={onStart}>{t.ctaBtn}</button>
      </div>
    </section>
  );
}

function Footer({ t }) {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="footer-logo">InsightLens</span>
            <p className="footer-tagline">{t.footerTagline}</p>
          </div>
          <div className="footer-links-group">
            <h4 className="footer-links-title">{t.footerProduct}</h4>
            <ul className="footer-links">
              <li><a>{t.footerFeatures}</a></li>
              <li><a>{t.footerHow}</a></li>
              <li><a>{t.footerPricing}</a></li>
            </ul>
          </div>
          <div className="footer-links-group">
            <h4 className="footer-links-title">{t.footerResources}</h4>
            <ul className="footer-links">
              <li><a>{t.footerDocs}</a></li>
              <li><a>{t.footerBlog}</a></li>
              <li><a>{t.footerSupport}</a></li>
            </ul>
          </div>
          <div className="footer-links-group">
            <h4 className="footer-links-title">{t.footerAbout}</h4>
            <ul className="footer-links">
              <li><a>{t.footerTeam}</a></li>
              <li><a>{t.footerContact}</a></li>
              <li><a>{t.footerPrivacy}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">{t.footerCopyright}</p>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({ children }) {
  return (
    <div className="section-heading">
      <h2 className="section-title">{children}</h2>
    </div>
  );
}

function ProgressIndicator({ step, t }) {
  const steps = [t.progressStep1, t.progressStep2, t.progressStep3];
  return (
    <div className="progress-indicator" role="status" aria-live="polite">
      {steps.map((label, i) => {
        const state = i < step ? 'is-done' : i === step ? 'is-active' : 'is-pending';
        return (
          <div className={`progress-step ${state}`} key={label}>
            <span className="progress-index">{String(i + 1).padStart(2, '0')}</span>
            <span className="progress-dot" />
            <span className="progress-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

const SEVERITY_LABEL_MAP = {
  高: 'severityHigh',
  中: 'severityMedium',
  低: 'severityLow',
};

function Badge({ label, level, t }) {
  const mappedLevel = t ? t[SEVERITY_LABEL_MAP[level]] || level : level;
  return (
    <span className="badge">
      <span className="badge-dot" style={{ background: SEVERITY_TONE[level] || SEVERITY_TONE.中 }} />
      <span className="badge-text">{label} · {mappedLevel}</span>
    </span>
  );
}

function EditableText({ value, onChange, multiline = false, style }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (draft !== value) onChange(draft);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    const Field = multiline ? 'textarea' : 'input';
    return (
      <Field
        autoFocus
        className="editable-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !multiline) {
            e.preventDefault();
            commit();
          }
          if (e.key === 'Escape') cancel();
        }}
        rows={multiline ? 3 : undefined}
        style={style}
      />
    );
  }

  return (
    <span className="editable-field" onClick={startEdit} title="Click to edit" style={style}>
      {value}
    </span>
  );
}

function Card({ children }) {
  return <div className="card">{children}</div>;
}

function Column({ title, children }) {
  return (
    <div className="column">
      <h3 className="column-title">{title}</h3>
      {children}
    </div>
  );
}

function EmptyState({ t }) {
  return (
    <div className="empty-state">
      <div className="empty-state-marks" aria-hidden="true">
        <span /><span /><span />
      </div>
      <h3 className="empty-state-title">{t.emptyTitle}</h3>
      <p className="empty-state-text">{t.emptyText}</p>
    </div>
  );
}

function renderSeverityLabel({ cx, cy, midAngle, outerRadius, name, value, payload }) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const label = payload?.translatedName || name;
  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontFamily={CHART_FONT}
      fill="#5c5650"
    >
      {`${label} · ${value}`}
    </text>
  );
}

function DataOverview({ result, t }) {
  const themes = result.themes || [];
  const painPoints = result.painPoints || [];

  const themeData = themes.map((theme) => ({
    name: theme.title,
    count: painPoints.filter((point) => point.theme === theme.title).length,
  }));

  const severityData = ['高', '中', '低']
    .map((level) => ({
      name: level,
      value: painPoints.filter((point) => point.severity === level).length,
      translatedName: t[SEVERITY_LABEL_MAP[level]] || level,
    }))
    .filter((entry) => entry.value > 0);

  return (
    <section className="overview-section">
      <SectionHeading>{t.overviewTitle}</SectionHeading>
      <div className="overview-charts">
        <div className="overview-chart-card">
          <h4 className="overview-chart-title">{t.overviewChart1}</h4>
          <ResponsiveContainer width="100%" height={Math.max(180, themeData.length * 52)}>
            <BarChart data={themeData} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 4 }}>
              <CartesianGrid horizontal={false} stroke="#e8e5e0" />
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={132}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#5c5650', fontSize: 12, fontFamily: CHART_FONT }}
              />
              <Bar dataKey="count" fill={THEME_BAR_COLOR} radius={[0, 4, 4, 0]} maxBarSize={20}>
                <LabelList dataKey="count" position="right" style={{ fill: '#5c5650', fontSize: 12, fontFamily: CHART_FONT }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="overview-chart-card">
          <h4 className="overview-chart-title">{t.overviewChart2}</h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={severityData}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={3}
                startAngle={90}
                endAngle={-270}
                label={renderSeverityLabel}
                labelLine={false}
              >
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_CHART_COLORS[entry.name]} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

function App() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };
    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, []);

  const [lang, setLang] = useState('en');
  const t = I18N[lang];

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'zh' : 'en'));
  };

  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progressStep, setProgressStep] = useState(0);
  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [voiceHintVisible, setVoiceHintVisible] = useState(false);
  const progressTimer = useRef(null);
  const voiceHintTimer = useRef(null);
  const fileInputRef = useRef(null);
  const landingRef = useRef(null);
  const toolkitRef = useRef(null);
  const toolRef = useRef(null);

  const scrollToLanding = () => {
    landingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToToolkit = () => {
    toolkitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTool = () => {
    toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  const startProgress = () => {
    setProgressStep(0);
    progressTimer.current = setInterval(() => {
      setProgressStep((step) => (step < 2 ? step + 1 : step));
    }, 1200);
  };

  const stopProgress = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  const addImageFiles = (fileList) => {
    Array.from(fileList)
      .filter((file) => ACCEPTED_IMAGE_TYPES.includes(file.type))
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setImages((prev) => [...prev, { id: crypto.randomUUID(), name: file.name, base64: reader.result }]);
        };
        reader.readAsDataURL(file);
      });
  };

  const handleFileChange = (e) => {
    addImageFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addImageFiles(e.dataTransfer.files);
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const buildImageNote = () => {
    if (images.length === 0) return '';
    const names = images.map((img) => img.name).join('、');
    return `\n\n[补充材料]\n用户额外上传了 ${images.length} 张图片（${names}），可能是产品截图、访谈现场照片或手写笔记等辅助材料。当前模型暂不支持直接解析图片内容，请将这些图片视为佐证材料纳入分析背景，结合文字内容综合判断。`;
  };

  const handleVoiceUploadClick = () => {
    setVoiceHintVisible(true);
    if (voiceHintTimer.current) clearTimeout(voiceHintTimer.current);
    voiceHintTimer.current = setTimeout(() => setVoiceHintVisible(false), 2600);
  };

  const updateField = (section, index, field, newValue) => {
    setResult((prev) => {
      const list = [...prev[section]];
      list[index] = { ...list[index], [field]: newValue };
      return { ...prev, [section]: list };
    });
  };

  const handleSubmit = async () => {
    if (!input.trim()) {
      setError(t.uploadError);
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    startProgress();
    try {
      const apiKey = `sk-361e92a453c44324b376f5385f21057b`;
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: input + buildImageNote() },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 2048,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `API error: ${response.status}`);
      }
      const data = await response.json();
      const content = data.choices[0].message.content;
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error('AI response is not valid JSON, please retry');
      }
      setResult(parsed);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      stopProgress();
    }
  };

  const handleExport = () => {
    if (!result) return;
    const lines = [];
    lines.push(t.exportHeader);
    lines.push('='.repeat(24));
    lines.push('');
    lines.push(`【${t.exportThemes}】`);
    (result.themes || []).forEach((theme, i) => {
      lines.push(`${i + 1}. ${theme.title}`);
      lines.push(`   ${theme.summary}`);
      lines.push('');
    });
    lines.push(`【${t.exportPainPoints}】`);
    (result.painPoints || []).forEach((point, i) => {
      lines.push(`${i + 1}. ${point.description}`);
      lines.push(`   ${t.exportFrequency}：${point.frequency}  ${t.exportSeverity}：${point.severity}`);
      lines.push('');
    });
    lines.push(`【${t.exportPersonas}】`);
    (result.personas || []).forEach((persona, i) => {
      lines.push(`${i + 1}. ${persona.name}`);
      lines.push(`   ${t.exportBackground}：${persona.background}`);
      lines.push(`   ${t.exportNeeds}：${persona.needs}`);
      lines.push('');
    });
    lines.push(`【${t.exportInsights}】`);
    (result.insights || []).forEach((insight, i) => {
      lines.push(`${i + 1}. ${insight.title}`);
      lines.push(`   ${insight.description}`);
      lines.push(`   ${t.exportNextStep}：${insight.nextStep}`);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = t.exportFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`app-shell lang-${lang}`} style={{ cursor: 'none' }}>
      <div className="custom-cursor" ref={cursorRef} />
      <TopNav onHowItWorks={scrollToLanding} onToolkit={scrollToToolkit} onTry={scrollToTool} onToggleLang={toggleLang} t={t} />

      <Landing onStart={scrollToTool} landingRef={landingRef} t={t} />
      <HowItWorks t={t} />
      <ResearchToolkit ref={toolkitRef} t={t} />


      {/* Main work area — Upload & Analyze */}
      <main className="layout" ref={toolRef}>
        <section className="input-panel">
          <SectionHeading>{t.uploadTitle}</SectionHeading>
          <textarea
            className="textarea-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.uploadPlaceholder}
          />

          <div
            className={`upload-zone${dragActive ? ' is-active' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={handleFileChange}
            />
            <p className="upload-zone-text">
              {t.uploadZoneText}<span className="upload-zone-link">{t.uploadZoneLink}</span>
            </p>
            <p className="upload-zone-hint">{t.uploadZoneHint}</p>
          </div>

          {images.length > 0 && (
            <div className="image-preview-grid">
              {images.map((img) => (
                <div className="image-preview" key={img.id}>
                  <img src={img.base64} alt={img.name} />
                  <button
                    type="button"
                    className="image-preview-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    aria-label={`Delete ${img.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="input-actions">
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? t.uploadAnalyzing : t.uploadAnalyze}
            </button>
            <div className="voice-upload-wrap">
              <button type="button" className="btn-ghost" onClick={handleVoiceUploadClick}>{t.uploadVoice}</button>
              {voiceHintVisible && <span className="voice-hint" role="status">{t.uploadVoiceHint}</span>}
            </div>
            {loading && <ProgressIndicator step={progressStep} t={t} />}
          </div>
          {error && <div className="error-banner">{error}</div>}
        </section>

        <section className="results-panel">
          <SectionHeading>{t.resultsTitle}</SectionHeading>
          {!result ? (
            <EmptyState t={t} />
          ) : (
            <>
              <div className="results-header">
                <p className="results-subtitle">{t.resultsSubtitle}</p>
                <button className="btn-primary" onClick={handleExport}>{t.resultsExport}</button>
              </div>
              <div className="columns">
                <Column title={t.colThemes}>
                  {(result.themes || []).map((theme, i) => (
                    <Card key={i}>
                      <EditableText
                        value={theme.title}
                        onChange={(v) => updateField('themes', i, 'title', v)}
                        style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)' }}
                      />
                      <EditableText
                        value={theme.summary}
                        onChange={(v) => updateField('themes', i, 'summary', v)}
                        multiline
                        style={{ marginTop: '5px', fontSize: '13px', fontWeight: 400, lineHeight: 1.7, color: 'var(--gray-500)' }}
                      />
                    </Card>
                  ))}
                </Column>
                <Column title={t.colPainPoints}>
                  {(result.painPoints || []).map((point, i) => (
                    <Card key={i}>
                      <EditableText
                        value={point.description}
                        onChange={(v) => updateField('painPoints', i, 'description', v)}
                        multiline
                        style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--gray-700)' }}
                      />
                      <div style={{ marginTop: '12px' }}>
                        <Badge label={t.exportFrequency} level={point.frequency} t={t} />
                        <Badge label={t.exportSeverity} level={point.severity} t={t} />
                      </div>
                    </Card>
                  ))}
                </Column>
                <Column title={t.colPersonas}>
                  {(result.personas || []).map((persona, i) => (
                    <Card key={i}>
                      <EditableText
                        value={persona.name}
                        onChange={(v) => updateField('personas', i, 'name', v)}
                        style={{ fontSize: '15px', fontWeight: 600, color: 'var(--gray-800)' }}
                      />
                      <div className="card-field">
                        <span className="card-field-label">{t.exportBackground}</span>
                        <EditableText
                          value={persona.background}
                          onChange={(v) => updateField('personas', i, 'background', v)}
                          multiline
                          style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--gray-500)' }}
                        />
                      </div>
                      <div className="card-field">
                        <span className="card-field-label">{t.exportNeeds}</span>
                        <EditableText
                          value={persona.needs}
                          onChange={(v) => updateField('personas', i, 'needs', v)}
                          multiline
                          style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--gray-500)' }}
                        />
                      </div>
                    </Card>
                  ))}
                </Column>
              </div>

              <DataOverview result={result} t={t} />

              <section className="insights-section">
                <SectionHeading>{t.insightsTitle}</SectionHeading>
                <div className="insights-list">
                  {(result.insights || []).map((insight, i) => (
                    <div className="insight-card" key={i}>
                      <span className="insight-index">{String(i + 1).padStart(2, '0')}</span>
                      <div className="insight-body">
                        <div className="insight-title">
                          <EditableText
                            value={insight.title}
                            onChange={(v) => updateField('insights', i, 'title', v)}
                            style={{ fontSize: '16px', fontWeight: 600, color: '#1B2A4A' }}
                          />
                        </div>
                        <div className="insight-description">
                          <EditableText
                            value={insight.description}
                            onChange={(v) => updateField('insights', i, 'description', v)}
                            multiline
                            style={{ fontSize: '14px', fontWeight: 400, lineHeight: 1.7, color: 'var(--gray-600)' }}
                          />
                        </div>
                        <div className="card-field insight-next-block">
                          <span className="card-field-label insight-next-label">{t.insightNext}</span>
                          <EditableText
                            value={insight.nextStep}
                            onChange={(v) => updateField('insights', i, 'nextStep', v)}
                            multiline
                            style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--gray-500)' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </section>
      </main>

      <CTA onStart={scrollToTool} t={t} />
      <Footer t={t} />
    </div>
  );
}

export default App;
