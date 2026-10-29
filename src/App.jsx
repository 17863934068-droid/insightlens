import { useRef, useState, useEffect, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import './App.css';
import ResultsReview from './research/ResultsReview.jsx';
import { analysisBundle, analysisSources, reviewPrompt } from './research/result-adapter.js';
import { demoInput, demoReview } from './data/web-demo.js';
import { extractPdfText } from './research/pdf-text.js';
import { parseAiResponse, validateAnalysis } from './research/ai-response.js';
import { groundClaims } from './research/grounding.js';
import ProjectLibrary from './research/ProjectLibrary.jsx';
import './research/workspace-polish.css';
import { LIBRARY_KEY, newInterview, newResearchProject, loadProjectLibrary, patchResearchProject, projectBackup, restoreResearchProject, projectFromReview, analysisIsOutdated, trashResearchProject, recoverResearchProject, resetWorkspace } from './research/project-library.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href;

/* ───────────────────────────────────────────────
   i18n — English & Chinese
   ─────────────────────────────────────────────── */
const I18N = {
  en: {
    navHowItWorks: 'How it works',
    navToolkit: 'Research Toolkit',
    navTry: 'My projects',
    heroSlogan: 'Think deeper. Move faster.',
    heroSubcopy: 'An AI-powered user research tool that transforms messy interview transcripts into structured insights.',
    heroCta: 'Start Researching',
    skillDownload: 'Download Skill',
    skillGuide: 'GitHub & setup ↗',
    skillDescription: 'The Skill provides a reusable interview analysis workflow. The web workspace lets you trace sources, review conclusions and save research projects.',
    howTitle: 'How it works',
    howSubtitle: 'From raw interviews to decisions in three steps',
    howStep1Title: 'Upload',
    howStep1Desc: 'Add your interview transcripts. Recording transcription is not yet available.',
    howStep2Title: 'Analyze',
    howStep2Desc: 'AI extracts themes, quotes, and patterns into structured insights.',
    howStep3Title: 'Review',
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
    uploadZoneHint: 'Supports TXT / PDF, multiple files',
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
    heroEyebrow: 'AI User Research',
    doubtBadge: 'Verify',
    confirmedBadge: 'Verified',
    viewSource: 'View Source',
    sourceTitle: 'Original Transcript',
    sourceClose: 'Close',
    evidenceBtn: '↩ Source',
    evidenceNotFound: 'Passage not found — please verify manually.',
    addTranscript: '+ Add Interview',
    transcriptDefault: 'Interview',
    uploadAnalyzeMulti: 'Synthesize',
    progressAnalyzing: 'analyzed',
    progressSynthesizing: 'Synthesizing across interviews…',
    sourceCountLabel: 'across {n} interviews',
    synthesisNote: 'Synthesis of {n} interviews',
  },
  zh: {
    navHowItWorks: '\u8fd0\u4f5c\u65b9\u5f0f',
    navToolkit: '\u7814\u7a76\u5de5\u5177\u7bb1',
    navTry: '我的项目',
    navStart: '\u5f00\u59cb\u7814\u7a76',
    heroSlogan: '\u601d\u8003\u66f4\u6df1\uff0c\u884c\u52a8\u66f4\u5feb\u3002',

    heroSubcopy: 'AI \u9a71\u52a8\u7684\u7528\u6237\u7814\u7a76\u5de5\u5177\uff0c\u5c06\u6742\u4e71\u7684\u8bbf\u8c08\u8bb0\u5f55\u8f6c\u5316\u4e3a\u7ed3\u6784\u5316\u6d1e\u5bdf\u3002',
    heroCta: '\u5f00\u59cb\u7814\u7a76',
    skillDownload: '下载 Skill',
    skillGuide: 'GitHub 与安装说明 ↗',
    skillDescription: 'Skill 提供可复用的访谈分析流程；网页工作区支持原文溯源、结论审阅与研究项目保存。',
    howTitle: '\u8fd0\u4f5c\u65b9\u5f0f',
    howSubtitle: '\u4ece\u539f\u59cb\u8bbf\u8c08\u5230\u51b3\u7b56\uff0c\u53ea\u9700\u4e09\u6b65',
    howStep1Title: '\u4e0a\u4f20',
    howStep1Desc: '添加访谈文字稿；录音转写暂未开放。',
    howStep2Title: '\u5206\u6790',
    howStep2Desc: 'AI \u63d0\u53d6\u4e3b\u9898\u3001\u5f15\u6587\u548c\u6a21\u5f0f\uff0c\u5f62\u6210\u7ed3\u6784\u5316\u6d1e\u5bdf\u3002',
    howStep3Title: '核对与修订',
    howStep3Desc: '对照原文检查疑点、修订结论，并记录判断依据。',
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
    uploadZoneHint: '\u652f\u6301 TXT / PDF\uff0c\u53ef\u591a\u6587\u4ef6\u4e0a\u4f20',
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
    heroEyebrow: 'AI \u7528\u6237\u7814\u7a76\u5de5\u5177',
    doubtBadge: '\u5efa\u8bae\u6838\u5bf9',
    confirmedBadge: '\u5df2\u6838\u5bf9',
    viewSource: '\u67e5\u770b\u539f\u6587',
    sourceTitle: '\u539f\u59cb\u8bbf\u8c08\u8bb0\u5f55',
    sourceClose: '\u5173\u95ed',
    evidenceBtn: '\u21a9 \u67e5\u770b\u539f\u6587',
    evidenceNotFound: '\u672a\u80fd\u5b9a\u4f4d\u5230\u539f\u6587\u7247\u6bb5\uff0c\u8bf7\u624b\u52a8\u6838\u5bf9\u3002',
    addTranscript: '+ \u6dfb\u52a0\u8bbf\u8c08',
    transcriptDefault: '\u8bbf\u8c08',
    uploadAnalyzeMulti: '\u7efc\u5408\u5206\u6790',
    progressAnalyzing: '\u5df2\u5206\u6790',
    progressSynthesizing: '\u6b63\u5728\u8de8\u6587\u6863\u7efc\u5408\u5206\u6790\u2026',
    sourceCountLabel: '{n} \u4efd\u8bbf\u8c08\u5747\u63d0\u53ca',
    synthesisNote: '\u7efc\u5408 {n} \u4efd\u8bbf\u8c08',
  },
};


const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_TEXT_TYPES = ['application/pdf', 'text/plain'];

const API_URL = '/api/analyze';

const SYSTEM_PROMPT = `你是一名专业的用户研究分析师。请仔细阅读用户提供的访谈内容，分析后仅以 JSON 格式输出结果，不要包含任何 JSON 之外的说明文字。

JSON 结构如下，请严格遵守字段名和取值范围：
{
  "themes": [ { "title": "主题标题", "summary": "对该主题的概括，1-2句话", "evidence": "直接从原文中截取的支撑句，必须逐字引用原文，不得改写" } ],
  "painPoints": [ { "title": "简短的痛点标题", "description": "痛点描述", "frequency": "高 | 中 | 低", "severity": "高 | 中 | 低", "theme": "该痛点所属主题的标题，必须与 themes 数组中某一项的 title 完全一致", "evidence": "直接从原文中截取的体现该痛点的句子，必须逐字引用原文，不得改写" } ],
  "personas": [ { "name": "用户画像名称", "background": "背景描述", "needs": "核心诉求", "evidence": "直接从原文中截取的支撑该画像的句子，必须逐字引用原文，不得改写" } ],
  "insights": [ { "title": "洞察标题", "description": "对该洞察的解释，1-2句话", "nextStep": "建议的下一步行动", "evidence": "直接从原文中截取的引发该洞察的句子，必须逐字引用原文，不得改写" } ]
}

要求：
- 按材料支持的内容生成主题，不设最低条数；证据不足的分类可返回空数组
- painPoints 中每条的 frequency 和 severity 字段只能是 "高"、"中"、"低" 三者之一
- painPoints 中每条的 theme 字段必须引用 themes 数组中已存在的某个 title，建立痛点与主题的关联
- 仅在原文有充分背景、行为与诉求信息时生成画像，不得补写未知信息
- 洞察保留原文中的条件、否定与不确定性，区分受访者陈述、推断和建议
- 每条重要结论必须有直接支撑的 evidence；缺少支撑时不生成该条结论，不得为凑数扩写或重复
- nextStep 明确为待验证建议，不得将建议当作已证实需求或效果
- 所有 evidence 字段必须是原文的原话，逐字截取，不得改写、总结或意译`;

const SYNTHESIS_PROMPT = `你是一名专业的用户研究分析师。以下是同一研究项目的原稿与补充资料的分段分析结果（JSON数组），每个元素包含访谈名称（interviewName）和该份访谈的结构化分析（analysis）。

资料分段不代表不同受访者或独立访谈，不得按分段数量推断人数或普遍性。请综合所有分析结果，保持原稿上下文，合并相似条目，并在每条内容中添加 sourceCount 字段（整数，表示该条内容在几份资料中有所体现，不表示人数）。

JSON 结构如下：
{
  "themes": [ { "title": "...", "summary": "...", "evidence": "最具代表性的原文引用", "sourceCount": N } ],
  "painPoints": [ { "title": "简短的痛点标题", "description": "...", "frequency": "高|中|低", "severity": "高|中|低", "theme": "...", "evidence": "最具代表性的原文引用", "sourceCount": N } ],
  "personas": [ { "name": "...", "background": "...", "needs": "...", "evidence": "最具代表性的原文引用", "sourceCount": N } ],
  "insights": [ { "title": "...", "description": "...", "nextStep": "...", "evidence": "最具代表性的原文引用", "sourceCount": N } ]
}

要求：
- 合并相似或重叠的主题、痛点，不得重复列举
- sourceCount 仅表示包含该内容的资料段数，不能作为独立用户支持数，按从高到低排序
- 条数由材料支持程度决定，各分类允许为空，不得为凑数增加结论
- 保留原文条件与不确定性，不能把相关性改成因果，或把建议当作受访者需求
- evidence 必须是某份访谈原文的原话，逐字引用`;

function TopNav({ onTry, onToggleLang, t }) {
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <span className="topnav-logo">InsightLens</span>
        <nav className="topnav-links">
          <button type="button" className="topnav-link" onClick={onTry}>{t.navTry}</button>
          <button type="button" className="topnav-lang-toggle" onClick={onToggleLang}>
            {t.langToggle}
          </button>
        </nav>
      </div>
    </header>
  );
}


function Landing({ onStart, landingRef, t }) {
  return (
    <section className="landing" ref={landingRef}>
      <img className="landing-bg-img" src={`${import.meta.env.BASE_URL}research-bg.jpg`} alt="" aria-hidden="true" />
      <div className="landing-overlay" aria-hidden="true" />
      <div className="landing-inner">
        <div className="landing-hero-text">
          <h1 className="landing-title">InsightLens</h1>
          <p className="landing-subcopy">{t.heroSubcopy}</p>
          <div className="landing-actions">
            <button className="landing-cta" onClick={onStart}>{t.heroCta}</button>
            <a className="landing-skill-download" href="https://github.com/17863934068-droid/insightlens-skill/archive/refs/heads/main.zip">{t.skillDownload}<span aria-hidden="true"> ↓</span></a>
          </div>
          <div className="landing-skill-info">
            <p>{t.skillDescription}</p>
            <a href="https://github.com/17863934068-droid/insightlens-skill#readme" target="_blank" rel="noopener noreferrer">{t.skillGuide}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

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

function App() {

  const [lang, setLang] = useState('zh');
  const t = I18N[lang];

  const toggleLang = () => {
    setLang((prev) => (prev === 'en' ? 'zh' : 'en'));
  };

  const [initialLibrary] = useState(() => {
    try { return { library: loadProjectLibrary(localStorage), error: '' }; }
    catch { const p = newResearchProject(); return { library: { format: 'insightlens-project-library', version: 1, activeId: p.id, projects: [p] }, error: '读取本地项目失败，原存储未被覆盖。请先保留原数据再恢复。' }; }
  });
  const [library, setLibrary] = useState(initialLibrary.library);
  const [saveStatus, setSaveStatus] = useState('saving');
  const [demoProject, setDemoProject] = useState(null);
  const [clearedTranscripts, setClearedTranscripts] = useState({});
  const isDemo = demoProject !== null;
  const active = demoProject || library.projects.find(p => p.id === library.activeId) || library.projects[0];
  const transcripts = active.transcripts;
  const reviewBundle = active.reviewBundle;
  const updateProject = patch => {
    if (isDemo) { setDemoProject(current => ({ ...current, ...patch })); return; }
    setLibrary(current => patchResearchProject(current, active.id, patch));
  };
  const setTranscripts = value => {
    if (isDemo) { setDemoProject(current => ({ ...current, transcripts: typeof value === 'function' ? value(current.transcripts) : value })); return; }
    setLibrary(current => {
    const p = current.projects.find(p => p.id === active.id);
    return patchResearchProject(current, active.id, { transcripts: typeof value === 'function' ? value(p.transcripts) : value });
    });
  };
  const setReviewBundle = bundle => {
    if (isDemo) { setDemoProject(current => ({ ...current, reviewBundle: bundle, reviewVersion: current.reviewVersion + 1 })); return; }
    setLibrary(current => {
    const p = current.projects.find(p => p.id === active.id);
    return patchResearchProject(current, active.id, { reviewBundle: bundle, reviewVersion: p.reviewVersion + 1 });
    });
  };
  const saveReview = useCallback(backup => {
    if (isDemo) {
      setDemoProject(current => {
        if (!current || current.id !== active.id || JSON.stringify(current.reviewBundle?.backup?.project) === JSON.stringify(backup.project)) return current;
        return { ...current, reviewBundle: { ...current.reviewBundle, backup } };
      });
      return;
    }
    setLibrary(current => {
      const p = current.projects.find(p => p.id === current.activeId);
      if (!p || p.id !== active.id || JSON.stringify(p.reviewBundle?.backup?.project) === JSON.stringify(backup.project)) return current;
      return patchResearchProject(current, p.id, { reviewBundle: { ...p.reviewBundle, backup } });
    });
  }, [active.id, isDemo]);
  useEffect(() => {
    if (initialLibrary.error) return;
    const flush = () => {
      try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(library)); setSaveStatus('saved'); }
      catch { setSaveStatus('failed'); }
    };
    const timer = setTimeout(flush, 300);
    window.addEventListener('pagehide', flush);
    return () => { clearTimeout(timer); window.removeEventListener('pagehide', flush); };
  }, [library, initialLibrary.error]);
  const [result, setResult] = useState(null);
  const [reviewVisible, setReviewVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const flowStage = loading ? 2 : reviewBundle && !analysisIsOutdated(active) ? 3 : transcripts.some(tr => tr.content.trim()) ? 2 : active.topic.trim() ? 1 : 0;
  const [progressStep, setProgressStep] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [voiceHintVisible, setVoiceHintVisible] = useState(false);
  
  const progressTimer = useRef(null);
  const voiceHintTimer = useRef(null);
  const fileInputRef = useRef(null);
  const uploadTargetRef = useRef(null);
  const landingRef = useRef(null);
  const toolRef = useRef(null);

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

  const addFiles = async (fileList, targetId) => {
    setError('');
    const files = Array.from(fileList);

    // Images → supplementary preview
    files.filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type)).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [...prev, { id: crypto.randomUUID(), name: file.name, base64: reader.result }]);
      };
      reader.readAsDataURL(file);
    });

    // PDFs and TXT → extract text → fill transcript slots
    const textFiles = files.filter((f) => ACCEPTED_TEXT_TYPES.includes(f.type) || f.name.endsWith('.txt'));
    for (const file of textFiles) {
      try {
        let text;
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          text = await extractPdfText(file, pdfjsLib);
        } else {
          text = await file.text();
        }
        const name = file.name.replace(/\.(pdf|txt)$/i, '');
        setTranscripts((prev) => {
          // Imported files belong to the selected material; append without replacing existing text.
          const target = prev.find(tr => tr.id === targetId) || (prev.length === 1 ? prev[0] : null);
          if (target) {
            return prev.map(tr => tr.id === target.id ? { ...tr, name: tr.name || name, content: [tr.content, text].filter(value => value.trim()).join('\n\n') } : tr);
          }
          return [...prev, { ...newInterview(), name, content: text }];
        });
      } catch (err) {
        setError(`${file.name}：${lang === 'zh' ? '文稿读取失败，请尝试粘贴文字。' : 'Unable to read the transcript. Try pasting text.'} ${err.message}`);
      }
    }
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files, uploadTargetRef.current);
    e.target.value = '';
  };

  const handleDragOver = (e, id) => {
    if (!Array.from(e.dataTransfer.types).includes('Files') || loading) return;
    e.preventDefault();
    setDragActive(id);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragActive(false);
  };

  const handleDrop = (e, id) => {
    if (!e.dataTransfer.files?.length) return;
    e.preventDefault();
    setDragActive(false);
    if (!loading) addFiles(e.dataTransfer.files, id);
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const buildImageNote = () => {
    if (images.length === 0) return '';
    const names = images.map((img) => img.name).join('、');
    return `\n\n[补充材料]\n用户额外上传了 ${images.length} 张图片（${names}），可能是产品截图、访谈现场照片或手写笔记等辅助材料。当前模型不能读取图片内容，不得将图片作为证据或推断其内容。仅分析已提供的文字。`;
  };

  const addTranscript = () => {
    setTranscripts((prev) => [...prev, newInterview()]);
  };

  const removeTranscript = (id) => {
    setTranscripts((prev) => prev.filter((tr) => tr.id !== id));
  };

  const updateTranscript = (id, field, value) => {
    setTranscripts((prev) => prev.map((tr) => tr.id === id ? { ...tr, [field]: value } : tr));
  };

  const callApi = async (systemPrompt, userContent, maxTokens = 6000) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: `${systemPrompt}\n输出必须是完整的 JSON 对象，不要 Markdown 代码围栏或额外解释。各条描述简洁，引文仅截取必要的原文片段，避免重复；确保所有数组和对象完整闭合。` },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        max_tokens: maxTokens,
      }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `API error: ${response.status}`);
    }
    const data = await response.json();
    return parseAiResponse(data);
  };

  const handleVoiceUploadClick = () => {
    setVoiceHintVisible(true);
    if (voiceHintTimer.current) clearTimeout(voiceHintTimer.current);
    voiceHintTimer.current = setTimeout(() => setVoiceHintVisible(false), 2600);
  };

  const switchProject = id => {
    if (loading) return;
    setDemoProject(null);
    setLibrary(current => ({ ...current, activeId: id }));
    setResult(null); setReviewVisible(true); setError(''); setImages([]);
  };
  const addProject = project => {
    setDemoProject(null);
    setLibrary(current => ({ ...current, projects: [...current.projects, project], activeId: project.id }));
    setResult(null); setReviewVisible(true); setError(''); setImages([]);
  };
  const saveProject = () => {
    if (initialLibrary.error) return;
    try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(library)); setSaveStatus('saved'); }
    catch { setSaveStatus('failed'); }
  };
  const exportCurrentProject = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(projectBackup(active), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `${active.name || '访谈项目'}-项目备份.json`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  const importProject = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('项目备份超过 10 MB。');
      const value = JSON.parse(await file.text());
      addProject(value.format === 'insightlens-interview-project' ? restoreResearchProject(value) : projectFromReview(value));
    } catch (err) { setError(`项目导入失败：${err.message}`); }
  };
  const loadReviewDemo = () => {
    const project = newResearchProject({ name: demoInput.name, topic: demoInput.topic, question: demoInput.researchQuestion, transcripts: demoInput.sources.map(source => ({ ...newInterview(), name: source.name || source.sourceId, role: source.role || '', method: source.method || '', content: source.paragraphs.map(p => p.text).join('\n\n') })), reviewBundle: { input: demoInput, review: demoReview, synthetic: true }, reviewVersion: 1 });
    setDemoProject(project);
    setReviewVisible(true);
  };
  const returnToReviewStart = () => {
    if (loading) return;
    setLibrary(current => resetWorkspace(current));
    setDemoProject(null);
    setResult(null);
    setError('');
    setImages([]);
    setVoiceHintVisible(false);
    setReviewVisible(false);
  };

  const handleSubmit = async () => {
    const valid = transcripts.filter((tr) => tr.content.trim());
    if (valid.length === 0) { setError(t.uploadError); return; }

    setLoading(true);
    setReviewVisible(true);
    setError('');
    setResult(null);

    const researchContext = { topic: active.topic, question: active.question };
    const sources = analysisSources(valid);
    const evidenceInstruction = '\n每条分析增加 evidenceRefs 数组：[{"sourceId":"输入来源编号","paragraphId":"输入段落 id","quote":"该段中逐字摘取的连续原话"}]。仅引用输入中实际存在的编号和原话，不能改写引文，不能用省略号拼接不同位置。每条至少关联一段支持它的原文；证据不足则不生成该条。';
    const interviewContent = index => `研究背景与访谈信息：${JSON.stringify({ ...researchContext, role: transcripts[0].role, date: transcripts[0].date, method: transcripts[0].method })}\n\n带编号的访谈原稿：\n${JSON.stringify(sources[index])}`;
    let completed;
    try {
      if (valid.length === 1) {
        startProgress();
        const parsed = validateAnalysis(await callApi(SYSTEM_PROMPT + evidenceInstruction, interviewContent(0) + buildImageNote()));
        completed = parsed;
        setResult(parsed);
      } else {
        const namedResults = [];
        for (let i = 0; i < valid.length; i++) {
          setProgressMsg(`${i + 1} / ${valid.length} ${t.progressAnalyzing}`);
          const parsed = validateAnalysis(await callApi(SYSTEM_PROMPT + evidenceInstruction, interviewContent(i)));
          namedResults.push({ interviewName: valid[i].name.trim() || `${lang === 'zh' ? '资料' : 'Material'} ${i + 1}`, analysis: parsed });
        }
        setProgressMsg(t.progressSynthesizing);
        const synthesis = validateAnalysis(await callApi(SYNTHESIS_PROMPT + evidenceInstruction, JSON.stringify({ analyses: namedResults, sources }), 6000));
        completed = synthesis;
        setResult(synthesis);
      }
      setProgressMsg(lang === 'zh' ? '正在检查疑点与证据位置…' : 'Checking doubts and evidence…');
      let input = analysisBundle(completed, valid, { name: active.name, topic: active.topic, question: active.question });
      setProgressMsg(lang === 'zh' ? '正在关联结论与原文…' : 'Linking conclusions to sources…');
      try { input = await groundClaims(input, callApi); }
      catch { /* Keep the analysis and allow retrying source linking in the review panel. */ }
      const snapshot = { transcriptSnapshot: JSON.parse(JSON.stringify(valid)), topicSnapshot: active.topic, questionSnapshot: active.question, generatedAt: new Date().toISOString() };
      try {
        const review = await callApi(reviewPrompt, JSON.stringify(input), 6000);
        setReviewBundle({ input, review, ...snapshot });
      } catch {
        setReviewBundle({ input, review: {}, reviewUnavailable: true, ...snapshot });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      stopProgress();
      setProgressMsg('');
    }
  };


  return (
    <div className={`app-shell lang-${lang}`}>
      <TopNav onTry={scrollToTool} onToggleLang={toggleLang} t={t} />

      <Landing onStart={scrollToTool} landingRef={landingRef} t={t} />


      {/* Main work area — Upload & Analyze */}
      <div className="layout-section">
      <main className="layout" ref={toolRef}>
        <h2 className="workspace-title">{lang === 'zh' ? '工作区' : 'Workspace'}</h2>
        <nav className="research-flow" aria-label={lang === 'zh' ? '访谈研究流程' : 'Interview workflow'}>{[
          ['research-project-details', '新建访谈', 'Set up', '填写研究主题'],
          ['interview-materials', '上传文稿', 'Add transcripts', '补充受访者信息'],
          ['analysis-action', '结构化分析', 'Analyze', '生成分析草稿'],
          ['analysis-results', '查证与修改', 'Review & revise', '对照原稿判断'],
        ].map(([id, cn, en], i) => {
          return <a key={id} href={`#${id}`} className={flowStage === i ? 'is-current' : ''} aria-current={flowStage === i ? 'step' : undefined}><span className="research-flow-index">{String(i + 1).padStart(2, '0')}</span><span><strong>{lang === 'zh' ? cn : en}</strong></span></a>;
        })}</nav>
        <ProjectLibrary preview={isDemo} onExitPreview={returnToReviewStart} library={library} active={active} onDelete={id => { setLibrary(current => trashResearchProject(current, id)); setResult(null); setReviewVisible(true); setError(''); setImages([]); }} onRestore={id => { setLibrary(current => recoverResearchProject(current, id)); setResult(null); setReviewVisible(true); setError(''); setImages([]); }} onSelect={switchProject} onCreate={fields => addProject(newResearchProject(fields))} onUpdate={updateProject} onSave={saveProject} onExport={exportCurrentProject} onImport={importProject} disabled={loading} saveStatus={saveStatus} loadError={initialLibrary.error} lang={lang} />
        <section className="input-panel" id="interview-materials">
          <SectionHeading>{lang === 'zh' ? '访谈材料' : 'Interview materials'}</SectionHeading>

                <fieldset className="interview-details" disabled={loading}>
                  <label>{lang === 'zh' ? '角色' : 'Role'}<input aria-label={`${lang === 'zh' ? '角色' : 'Role'} 1`} placeholder={lang === 'zh' ? '例如：项目经理、设计师（可填写多个）' : 'e.g. Project manager, designer (multiple roles allowed)'} value={transcripts[0].role || ''} onChange={e => updateTranscript(transcripts[0].id, 'role', e.target.value)} /></label>
                  <label>{lang === 'zh' ? '访谈日期' : 'Interview date'}<input type="date" className={!transcripts[0].date ? 'is-placeholder' : undefined} aria-label={`${lang === 'zh' ? '访谈日期' : 'Interview date'} 1`} value={transcripts[0].date || ''} onChange={e => updateTranscript(transcripts[0].id, 'date', e.target.value)} /></label>
                  <label>{lang === 'zh' ? '访谈方式' : 'Interview method'}<select className={!transcripts[0].method ? 'is-placeholder' : undefined} aria-label={`${lang === 'zh' ? '访谈方式' : 'Interview method'} 1`} value={transcripts[0].method || ''} onChange={e => updateTranscript(transcripts[0].id, 'method', e.target.value)}><option value="">{lang === 'zh' ? '未填写' : 'Not specified'}</option><option value="线上视频">{lang === 'zh' ? '线上视频' : 'Video call'}</option><option value="电话">{lang === 'zh' ? '电话' : 'Phone'}</option><option value="线下面谈">{lang === 'zh' ? '线下面谈' : 'In person'}</option><option value="文字访谈">{lang === 'zh' ? '文字访谈' : 'Text interview'}</option></select></label>
                </fieldset>
          <div className="transcript-list">
            {transcripts.map((tr, i) => (
              <div className="transcript-slot" key={tr.id}>
                {i > 0 && <div className="transcript-remove-row"><button type="button" className="transcript-remove" disabled={loading} aria-label={`${lang === 'zh' ? '移除补充资料' : 'Remove supplementary material'} ${i + 1}`} onClick={() => removeTranscript(tr.id)}>{lang === 'zh' ? '移除补充资料 ×' : 'Remove supplementary material ×'}</button></div>}

                <div className={`transcript-entry${dragActive === tr.id ? ' is-dragging' : ''}`} onDragOver={e => handleDragOver(e, tr.id)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, tr.id)}>
                  <div className="transcript-entry-toolbar"><span>{lang === 'zh' ? (i === 0 ? '访谈原稿' : `补充资料 ${i}`) : (i === 0 ? 'Transcript' : `Supplementary material ${i}`)}</span><div className="transcript-entry-actions">
                    {tr.content ? <button type="button" className="transcript-clear-button" disabled={loading} aria-label={`${lang === 'zh' ? '清空文稿' : 'Clear transcript'} ${i + 1}`} onClick={() => { setClearedTranscripts(current => ({ ...current, [tr.id]: tr.content })); updateTranscript(tr.id, 'content', ''); }}>{lang === 'zh' ? '清空内容' : 'Clear content'}</button> : clearedTranscripts[tr.id] && <button type="button" className="transcript-clear-button" disabled={loading} onClick={() => { updateTranscript(tr.id, 'content', clearedTranscripts[tr.id]); setClearedTranscripts(current => { const next = { ...current }; delete next[tr.id]; return next; }); }}>{lang === 'zh' ? '撤销清空' : 'Undo clear'}</button>}
                    <button type="button" disabled={loading} className="transcript-upload-button" onClick={() => { uploadTargetRef.current = tr.id; fileInputRef.current?.click(); }} aria-label={`${lang === 'zh' ? '上传文稿' : 'Upload transcript'} ${i + 1}`}>↥ {lang === 'zh' ? '上传 TXT / PDF' : 'Upload TXT / PDF'}</button>
                  </div></div>
                  <textarea
                    aria-label={`${lang === 'zh' ? '访谈原稿' : 'Transcript'} ${i + 1}`}
                    className="textarea-field"
                    value={tr.content}
                    disabled={loading}
                    onChange={(e) => updateTranscript(tr.id, 'content', e.target.value)}
                    placeholder={lang === 'zh' ? '在这里粘贴访谈文字，或将 TXT / PDF 文件拖入此框…' : 'Paste your transcript here, or drop a TXT / PDF file into this box…'}
                  />
                  <div className="transcript-entry-footer"><span>{dragActive === tr.id ? (lang === 'zh' ? '松开以导入' : 'Drop to import') : ''}</span><span>{tr.content.length.toLocaleString()} {lang === 'zh' ? '字' : 'characters'}</span></div>
                </div>
              </div>
            ))}
          </div>

          <button className="rr-text-button transcript-add-supplement" disabled={loading} onClick={addTranscript}>{lang === 'zh' ? '＋ 添加补充资料' : '+ Add supplementary material'}</button>

          <>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt" multiple hidden onChange={handleFileChange} />
              {images.length > 0 && (
                <div className="image-preview-grid">
                  {images.map((img) => (
                    <div className="image-preview" key={img.id}>
                      <img src={img.base64} alt={img.name} />
                      <button type="button" className="image-preview-remove" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }} aria-label={`Delete ${img.name}`}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </>

          <div className="analysis-action-heading" id="analysis-action"><h3>{lang === 'zh' ? '结构化分析' : 'Structured analysis'}</h3>{reviewBundle && <p className="analysis-rerun-note">{lang === 'zh' ? '重新分析会替换当前结果与审阅记录。' : 'A new analysis replaces the current results and review.'}</p>}</div>
          <div className="input-actions">
            <button className="btn-primary" onClick={handleSubmit} disabled={loading || !transcripts.some(tr => tr.content.trim())}>
              {loading ? t.uploadAnalyzing : lang === 'zh' ? (reviewBundle ? '重新生成分析草稿' : '生成分析草稿 →') : (reviewBundle ? 'Regenerate draft' : 'Generate draft →')}
            </button>
            <div className="voice-upload-wrap"><button type="button" className="rr-text-button" onClick={handleVoiceUploadClick}>{lang === 'zh' ? '只有录音文件？' : 'Only have a recording?'}</button>{voiceHintVisible && <span className="voice-hint" role="status">{t.uploadVoiceHint}</span>}</div>
            {loading && (
              progressMsg
                ? <span className="progress-msg">{progressMsg}</span>
                : <ProgressIndicator step={progressStep} t={t} />
            )}
          </div>
          {error && <div className="error-banner">{error}</div>}
        </section>

        <section className="results-panel" id="analysis-results">
          <div className="review-section-heading">
            <SectionHeading>{lang === 'zh' ? '查证与修改' : 'Review & revise'}</SectionHeading>
            {(result || reviewBundle) && reviewVisible && <button className="rr-text-button" onClick={returnToReviewStart}>{lang === 'zh' ? '返回初始页' : 'Back to start'}</button>}
          </div>
          {reviewVisible && analysisIsOutdated(active) && <p className="project-stale-notice">{lang === 'zh' ? '材料已更新，下方为上次分析。' : 'Your inputs changed. The results below retain the previous analysis and its original source snapshot.'}</p>}
          {(!result && !reviewBundle || !reviewVisible) && (
            <><div className="workflow-empty"><p>{lang === 'zh' ? '分析完成后，在这里核对与修改结论。' : 'Review and revise conclusions here after analysis.'}</p></div><div className="review-entry-actions">
              {(result || reviewBundle) && <button className="btn-primary" onClick={() => setReviewVisible(true)}>{lang === 'zh' ? '继续查证' : 'Continue review'}</button>}
              <button className="btn-ghost" onClick={loadReviewDemo}>{lang === 'zh' ? '查看展示案例' : 'View demo case'}</button>
            </div></>
          )}
          {(result || reviewBundle) && <div hidden={!reviewVisible}>
            <ResultsReview key={`${active.id}-${active.reviewVersion}`} bundle={reviewBundle} lang={lang} onProjectChange={saveReview} onFindEvidence={input => groundClaims(input, callApi)} projectName={active.name} onExportProject={exportCurrentProject} researchQuestion={[active.topic, active.question].filter(Boolean).join(' · ')} />
          </div>}
        </section>
      </main>
      </div>

      <CTA onStart={scrollToTool} t={t} />
      <Footer t={t} />
    </div>
  );
}

export default App;
