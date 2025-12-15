// Shared decision data and configuration
// Used by all views: main queue, inbox, focus, and entity timeline

export const mockDecisions = [
  // Urgent items
  {
    id: 'd1',
    decisionType: 'triage',
    status: 'pending',
    subject: { type: 'task', id: 'task1', title: '[URGENT] Fix production auth bug', source: 'email' },
    project: 'Backend API',
    question: 'What should happen with this task?',
    options: [
      { key: 'specify', label: 'Specify for AI', description: 'Needs more detail before Claude can execute' },
      { key: 'execute', label: 'Execute directly', description: 'Ready for AI to work on' },
      { key: 'manual', label: 'Do manually', description: "I'll handle this myself" },
      { key: 'defer', label: 'Defer', description: 'Not right now' }
    ],
    created: '15m ago',
    priority: 'urgent'
  },
  {
    id: 'd2',
    decisionType: 'review',
    status: 'pending',
    subject: { type: 'task', id: 'task2', title: 'Database migration script', source: 'manual' },
    project: 'Backend API',
    question: 'Review Claude\'s work',
    preview: 'Claude has prepared a migration script that adds user_preferences table with 3 columns. Includes rollback logic.',
    options: [
      { key: 'approve', label: 'Approve', description: 'Looks good, proceed' },
      { key: 'revise', label: 'Request changes', description: 'Needs modifications' },
      { key: 'reject', label: 'Reject', description: 'Start over' }
    ],
    created: '1h ago',
    priority: 'urgent'
  },

  // Transcript enrichments
  {
    id: 'd3',
    decisionType: 'enrich',
    status: 'pending',
    subject: { type: 'transcript', id: 't1', title: 'Product Meeting Dec 12' },
    project: null,
    question: 'Help me understand this transcript',
    fields: [
      { key: 'project', label: 'Which project is this for?', type: 'select', options: ['Q1 Planning', 'Backend API', 'Mobile App', 'Marketing Site', 'Other'] },
      { key: 'speakers', label: 'Who are the speakers?', type: 'text', placeholder: 'e.g., John (PM), Sarah (Eng), Mike (Design)' },
      { key: 'context', label: 'Any additional context?', type: 'textarea', placeholder: 'Optional notes about this meeting...' }
    ],
    created: '2h ago',
    priority: 'normal'
  },
  {
    id: 'd4',
    decisionType: 'enrich',
    status: 'pending',
    subject: { type: 'transcript', id: 't2', title: 'Customer Call - Acme Corp' },
    project: null,
    question: 'Help me understand this transcript',
    fields: [
      { key: 'project', label: 'Which project is this for?', type: 'select', options: ['Q1 Planning', 'Backend API', 'Mobile App', 'Marketing Site', 'Acme Onboarding', 'Other'] },
      { key: 'speakers', label: 'Who are the speakers?', type: 'text', placeholder: 'e.g., John (PM), Sarah (Eng), Mike (Design)' },
      { key: 'context', label: 'Any additional context?', type: 'textarea', placeholder: 'Optional notes about this meeting...' }
    ],
    created: '3h ago',
    priority: 'normal'
  },
  {
    id: 'd5',
    decisionType: 'enrich',
    status: 'pending',
    subject: { type: 'transcript', id: 't3', title: 'Weekly Standup Recording' },
    project: null,
    question: 'Help me understand this transcript',
    fields: [
      { key: 'project', label: 'Which project is this for?', type: 'select', options: ['Q1 Planning', 'Backend API', 'Mobile App', 'Marketing Site', 'Internal', 'Other'] },
      { key: 'speakers', label: 'Who are the speakers?', type: 'text', placeholder: 'e.g., John (PM), Sarah (Eng), Mike (Design)' },
      { key: 'context', label: 'Any additional context?', type: 'textarea', placeholder: 'Optional notes about this meeting...' }
    ],
    created: '5h ago',
    priority: 'normal'
  },

  // Task triages
  {
    id: 'd6',
    decisionType: 'triage',
    status: 'pending',
    subject: { type: 'task', id: 'task3', title: 'Write API documentation for /users endpoint', source: 'todoist' },
    project: 'Backend API',
    question: 'What should happen with this task?',
    options: [
      { key: 'specify', label: 'Specify for AI', description: 'Needs more detail before Claude can execute' },
      { key: 'execute', label: 'Execute directly', description: 'Ready for AI to work on' },
      { key: 'manual', label: 'Do manually', description: "I'll handle this myself" },
      { key: 'defer', label: 'Defer', description: 'Not right now' }
    ],
    created: '1h ago',
    priority: 'normal'
  },
  {
    id: 'd7',
    decisionType: 'triage',
    status: 'pending',
    subject: { type: 'task', id: 'task4', title: 'Update landing page hero section', source: 'todoist' },
    project: 'Marketing Site',
    question: 'What should happen with this task?',
    options: [
      { key: 'specify', label: 'Specify for AI', description: 'Needs more detail before Claude can execute' },
      { key: 'execute', label: 'Execute directly', description: 'Ready for AI to work on' },
      { key: 'manual', label: 'Do manually', description: "I'll handle this myself" },
      { key: 'defer', label: 'Defer', description: 'Not right now' }
    ],
    created: '2h ago',
    priority: 'normal'
  },
  {
    id: 'd8',
    decisionType: 'triage',
    status: 'pending',
    subject: { type: 'task', id: 'task5', title: 'Prepare Q1 roadmap presentation', source: 'calendar' },
    project: 'Q1 Planning',
    question: 'What should happen with this task?',
    options: [
      { key: 'specify', label: 'Specify for AI', description: 'Needs more detail before Claude can execute' },
      { key: 'execute', label: 'Execute directly', description: 'Ready for AI to work on' },
      { key: 'manual', label: 'Do manually', description: "I'll handle this myself" },
      { key: 'defer', label: 'Defer', description: 'Not right now' }
    ],
    created: '4h ago',
    priority: 'normal'
  },
  {
    id: 'd9',
    decisionType: 'triage',
    status: 'pending',
    subject: { type: 'task', id: 'task6', title: 'Review competitor pricing pages', source: 'manual' },
    project: 'Marketing Site',
    question: 'What should happen with this task?',
    options: [
      { key: 'specify', label: 'Specify for AI', description: 'Needs more detail before Claude can execute' },
      { key: 'execute', label: 'Execute directly', description: 'Ready for AI to work on' },
      { key: 'manual', label: 'Do manually', description: "I'll handle this myself" },
      { key: 'defer', label: 'Defer', description: 'Not right now' }
    ],
    created: '1d ago',
    priority: 'normal'
  },

  // Specifications
  {
    id: 'd10',
    decisionType: 'specify',
    status: 'pending',
    subject: { type: 'task', id: 'task7', title: 'Implement user settings page', source: 'transcript', parentTitle: 'Product Meeting Dec 12' },
    project: 'Mobile App',
    question: 'Give Claude the details needed to work on this',
    fields: [
      { key: 'outcome', label: 'What specific outcome do you want?', type: 'textarea', placeholder: 'Describe the desired result...' },
      { key: 'files', label: 'Relevant files or context', type: 'text', placeholder: 'Link files or add notes...' },
      { key: 'constraints', label: 'Any constraints or requirements?', type: 'text', placeholder: 'e.g., must match existing design system' }
    ],
    created: '3h ago',
    priority: 'normal'
  },
  {
    id: 'd11',
    decisionType: 'specify',
    status: 'pending',
    subject: { type: 'task', id: 'task8', title: 'Create onboarding email sequence', source: 'todoist' },
    project: 'Marketing Site',
    question: 'Give Claude the details needed to work on this',
    fields: [
      { key: 'outcome', label: 'What specific outcome do you want?', type: 'textarea', placeholder: 'Describe the desired result...' },
      { key: 'files', label: 'Relevant files or context', type: 'text', placeholder: 'Link files or add notes...' },
      { key: 'constraints', label: 'Any constraints or requirements?', type: 'text', placeholder: 'e.g., tone should be friendly but professional' }
    ],
    created: '6h ago',
    priority: 'normal'
  },
  {
    id: 'd12',
    decisionType: 'specify',
    status: 'pending',
    subject: { type: 'task', id: 'task9', title: 'Write unit tests for auth module', source: 'manual' },
    project: 'Backend API',
    question: 'Give Claude the details needed to work on this',
    fields: [
      { key: 'outcome', label: 'What specific outcome do you want?', type: 'textarea', placeholder: 'Describe the desired result...' },
      { key: 'files', label: 'Relevant files or context', type: 'text', placeholder: 'Link files or add notes...' },
      { key: 'constraints', label: 'Any constraints or requirements?', type: 'text', placeholder: 'e.g., use pytest, aim for 80% coverage' }
    ],
    created: '1d ago',
    priority: 'normal'
  },

  // Reviews
  {
    id: 'd13',
    decisionType: 'review',
    status: 'pending',
    subject: { type: 'task', id: 'task10', title: 'Refactor notification service', source: 'todoist' },
    project: 'Backend API',
    question: 'Review Claude\'s work',
    preview: 'Claude refactored the notification service into 3 separate modules: email, push, and SMS. Added retry logic and rate limiting.',
    options: [
      { key: 'approve', label: 'Approve', description: 'Looks good, proceed' },
      { key: 'revise', label: 'Request changes', description: 'Needs modifications' },
      { key: 'reject', label: 'Reject', description: 'Start over' }
    ],
    created: '2h ago',
    priority: 'normal'
  },
  {
    id: 'd14',
    decisionType: 'review',
    status: 'pending',
    subject: { type: 'task', id: 'task11', title: 'Design system color tokens', source: 'manual' },
    project: 'Mobile App',
    question: 'Review Claude\'s work',
    preview: 'Claude created a comprehensive color token system with light/dark mode variants. Includes semantic naming and accessibility notes.',
    options: [
      { key: 'approve', label: 'Approve', description: 'Looks good, proceed' },
      { key: 'revise', label: 'Request changes', description: 'Needs modifications' },
      { key: 'reject', label: 'Reject', description: 'Start over' }
    ],
    created: '5h ago',
    priority: 'normal'
  },

  // Email categorizations
  {
    id: 'd15',
    decisionType: 'categorize',
    status: 'pending',
    subject: { type: 'email', id: 'e1', title: 'Re: Partnership proposal', from: 'partner@example.com' },
    project: null,
    question: 'What kind of input is this?',
    options: [
      { key: 'task_source', label: 'Contains tasks', description: 'Extract action items from this' },
      { key: 'reference', label: 'Reference material', description: 'Save for context but no tasks' },
      { key: 'ignore', label: 'Ignore', description: 'Not relevant' }
    ],
    created: '30m ago',
    priority: 'normal'
  },
  {
    id: 'd16',
    decisionType: 'categorize',
    status: 'pending',
    subject: { type: 'email', id: 'e2', title: 'Bug report: Login issues on Safari', from: 'user@customer.com' },
    project: null,
    question: 'What kind of input is this?',
    options: [
      { key: 'task_source', label: 'Contains tasks', description: 'Extract action items from this' },
      { key: 'reference', label: 'Reference material', description: 'Save for context but no tasks' },
      { key: 'ignore', label: 'Ignore', description: 'Not relevant' }
    ],
    created: '1h ago',
    priority: 'normal'
  },
  {
    id: 'd17',
    decisionType: 'categorize',
    status: 'pending',
    subject: { type: 'email', id: 'e3', title: 'Invoice #4521 - December', from: 'billing@vendor.com' },
    project: null,
    question: 'What kind of input is this?',
    options: [
      { key: 'task_source', label: 'Contains tasks', description: 'Extract action items from this' },
      { key: 'reference', label: 'Reference material', description: 'Save for context but no tasks' },
      { key: 'ignore', label: 'Ignore', description: 'Not relevant' }
    ],
    created: '3h ago',
    priority: 'normal'
  },
  {
    id: 'd18',
    decisionType: 'categorize',
    status: 'pending',
    subject: { type: 'email', id: 'e4', title: 'Meeting notes: Acme sync', from: 'colleague@company.com' },
    project: null,
    question: 'What kind of input is this?',
    options: [
      { key: 'task_source', label: 'Contains tasks', description: 'Extract action items from this' },
      { key: 'reference', label: 'Reference material', description: 'Save for context but no tasks' },
      { key: 'ignore', label: 'Ignore', description: 'Not relevant' }
    ],
    created: '4h ago',
    priority: 'normal'
  },

  // Meeting task extractions (enriched transcripts ready for task selection)
  {
    id: 'd_mt1',
    decisionType: 'meeting_triage',
    status: 'pending',
    subject: {
      type: 'transcript',
      id: 'mt1',
      title: 'Q1 Planning Kickoff',
      date: 'Dec 10, 2024',
      duration: '52 min'
    },
    project: 'Q1 Planning',
    question: 'Which tasks from this meeting should be added to your queue?',
    extractedTasks: [
      { id: 'mt1_t1', title: 'Draft Q1 OKRs document', assignee: 'You', priority: 'high' },
      { id: 'mt1_t2', title: 'Schedule 1:1s with team leads', assignee: 'You', priority: 'normal' },
      { id: 'mt1_t3', title: 'Review budget allocation spreadsheet', assignee: 'Team', priority: 'normal' },
      { id: 'mt1_t4', title: 'Set up Q1 project tracking board', assignee: 'You', priority: 'normal' },
      { id: 'mt1_t5', title: 'Send recap email to stakeholders', assignee: 'You', priority: 'high' }
    ],
    created: '2h ago',
    priority: 'normal'
  },
  {
    id: 'd_mt2',
    decisionType: 'meeting_triage',
    status: 'pending',
    subject: {
      type: 'transcript',
      id: 'mt2',
      title: 'Backend API Sprint Review',
      date: 'Dec 12, 2024',
      duration: '38 min'
    },
    project: 'Backend API',
    question: 'Which tasks from this meeting should be added to your queue?',
    extractedTasks: [
      { id: 'mt2_t1', title: 'Fix rate limiting bug in /users endpoint', assignee: 'You', priority: 'high' },
      { id: 'mt2_t2', title: 'Add pagination to search results', assignee: 'Team', priority: 'normal' },
      { id: 'mt2_t3', title: 'Update API documentation for v2 changes', assignee: 'You', priority: 'normal' },
      { id: 'mt2_t4', title: 'Review PR #423 for auth improvements', assignee: 'You', priority: 'normal' }
    ],
    created: '45m ago',
    priority: 'normal'
  },
  {
    id: 'd_mt3',
    decisionType: 'meeting_triage',
    status: 'pending',
    subject: {
      type: 'transcript',
      id: 'mt3',
      title: 'Design Review - Mobile App Redesign',
      date: 'Dec 13, 2024',
      duration: '1h 15min'
    },
    project: 'Mobile App',
    question: 'Which tasks from this meeting should be added to your queue?',
    extractedTasks: [
      { id: 'mt3_t1', title: 'Create high-fidelity mockups for onboarding flow', assignee: 'Team', priority: 'high' },
      { id: 'mt3_t2', title: 'Audit current color palette for accessibility', assignee: 'You', priority: 'normal' },
      { id: 'mt3_t3', title: 'Prototype new navigation pattern', assignee: 'You', priority: 'high' },
      { id: 'mt3_t4', title: 'Write design system documentation', assignee: 'Team', priority: 'normal' },
      { id: 'mt3_t5', title: 'Schedule user testing sessions', assignee: 'You', priority: 'normal' },
      { id: 'mt3_t6', title: 'Review competitor app UX patterns', assignee: 'You', priority: 'normal' }
    ],
    created: '20m ago',
    priority: 'urgent'
  },
];

// Decision type configuration with colors and styling
export const decisionTypeConfig = {
  enrich: {
    icon: '🎙️',
    label: 'Enrich',
    color: 'amber',
    bgClass: 'bg-amber-900/20',
    borderClass: 'border-l-amber-500',
    hoverBgClass: 'hover:bg-amber-900/30'
  },
  triage: {
    icon: '📋',
    label: 'Triage',
    color: 'purple',
    bgClass: 'bg-purple-900/20',
    borderClass: 'border-l-purple-500',
    hoverBgClass: 'hover:bg-purple-900/30'
  },
  specify: {
    icon: '✏️',
    label: 'Specify',
    color: 'orange',
    bgClass: 'bg-orange-900/20',
    borderClass: 'border-l-orange-500',
    hoverBgClass: 'hover:bg-orange-900/30'
  },
  review: {
    icon: '👁️',
    label: 'Review',
    color: 'cyan',
    bgClass: 'bg-cyan-900/20',
    borderClass: 'border-l-cyan-500',
    hoverBgClass: 'hover:bg-cyan-900/30'
  },
  categorize: {
    icon: '📁',
    label: 'Categorize',
    color: 'pink',
    bgClass: 'bg-pink-900/20',
    borderClass: 'border-l-pink-500',
    hoverBgClass: 'hover:bg-pink-900/30'
  },
  meeting_triage: {
    icon: '📋🎙️',
    label: 'Meeting Tasks',
    color: 'emerald',
    bgClass: 'bg-emerald-900/20',
    borderClass: 'border-l-emerald-500',
    hoverBgClass: 'hover:bg-emerald-900/30'
  },
};

// Thing type configuration
export const thingTypeConfig = {
  task: { icon: '✓', label: 'Tasks' },
  transcript: { icon: '🎙️', label: 'Transcripts' },
  email: { icon: '✉️', label: 'Emails' },
};

// Known speakers for autocomplete
export const knownSpeakers = [
  'John (PM)',
  'Sarah (Eng)',
  'Mike (Design)',
  'Lisa (Marketing)',
  'David (Sales)',
  'Emma (Support)',
  'Alex (DevOps)',
  'Chris (QA)',
  'Rachel (HR)',
  'Tom (Finance)'
];

// Extract unique projects from decisions
export const allProjects = [...new Set(mockDecisions.map(d => d.project).filter(Boolean))].sort();

// Entity history for the timeline view
// Maps entity IDs to their state progression
export const entityHistory = {
  'task1': [
    {
      state: 'created',
      timestamp: '2024-12-14 08:30',
      input: null,
      output: {
        title: '[URGENT] Fix production auth bug',
        source: 'email',
        priority: 'urgent'
      }
    },
    {
      state: 'categorized',
      timestamp: '2024-12-14 08:32',
      input: { action: 'task_source', from: 'support@company.com' },
      output: { extracted: true, taskCreated: true }
    },
    {
      state: 'triaged',
      timestamp: '2024-12-14 08:45',
      input: { action: 'specify', reason: 'Needs reproduction steps' },
      output: { assignedTo: 'AI', nextStep: 'specify' }
    },
  ],
  'task2': [
    {
      state: 'created',
      timestamp: '2024-12-13 14:00',
      input: null,
      output: {
        title: 'Database migration script',
        source: 'manual'
      }
    },
    {
      state: 'triaged',
      timestamp: '2024-12-13 14:15',
      input: { action: 'execute', reason: 'Clear requirements' },
      output: { assignedTo: 'AI', nextStep: 'execute' }
    },
    {
      state: 'executed',
      timestamp: '2024-12-13 15:30',
      input: { prompt: 'Create migration for user_preferences table' },
      output: {
        filesCreated: ['migrations/001_user_preferences.sql'],
        summary: 'Migration script with rollback logic'
      }
    },
    {
      state: 'pending_review',
      timestamp: '2024-12-13 15:31',
      input: null,
      output: {
        preview: 'Claude has prepared a migration script that adds user_preferences table with 3 columns. Includes rollback logic.',
        awaitingAction: 'review'
      }
    },
  ],
  'task3': [
    {
      state: 'created',
      timestamp: '2024-12-14 07:00',
      input: null,
      output: {
        title: 'Write API documentation for /users endpoint',
        source: 'todoist'
      }
    },
  ],
  't1': [
    {
      state: 'recorded',
      timestamp: '2024-12-12 10:00',
      input: null,
      output: {
        title: 'Product Meeting Dec 12',
        duration: '45 minutes',
        participants: 'Unknown'
      }
    },
    {
      state: 'transcribed',
      timestamp: '2024-12-12 10:50',
      input: { audioFile: 'meeting_dec12.mp3' },
      output: {
        wordCount: 4500,
        confidence: 0.94
      }
    },
    {
      state: 'pending_enrichment',
      timestamp: '2024-12-12 10:51',
      input: null,
      output: {
        awaitingAction: 'enrich',
        fieldsNeeded: ['project', 'speakers', 'context']
      }
    },
  ],
  'e1': [
    {
      state: 'received',
      timestamp: '2024-12-14 09:00',
      input: null,
      output: {
        title: 'Re: Partnership proposal',
        from: 'partner@example.com',
        hasAttachments: false
      }
    },
    {
      state: 'pending_categorization',
      timestamp: '2024-12-14 09:01',
      input: null,
      output: {
        awaitingAction: 'categorize',
        suggestedCategory: 'task_source'
      }
    },
  ],
};

// Helper to get entity info by ID
export function getEntityById(entityId) {
  const decision = mockDecisions.find(d => d.subject.id === entityId);
  return decision ? decision.subject : null;
}

// Helper to get decision by entity ID
export function getDecisionByEntityId(entityId) {
  return mockDecisions.find(d => d.subject.id === entityId);
}
