<!-- +page.svelte -->
<script>
  import { tick } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    mockDecisions,
    decisionTypeConfig,
    thingTypeConfig,
    knownSpeakers,
    allProjects
  } from '$lib/data/decisions.js';

  // Local decisions state (allows adding new decisions dynamically)
  let decisions = [...mockDecisions];

  // Filter state
  let stageFilter = 'all';
  let thingFilter = 'all';
  let projectFilter = 'all';
  let formData = {};

  // Keyboard navigation state
  let selectedIndex = 0;
  let queueListEl;
  let detailPanelEl;
  let showCommandPalette = false;
  let commandSearch = '';
  let commandIndex = 0;
  let showSettings = false;

  // Toast notifications
  let toastId = 0;
  let toasts = [];
  let lastAction = null;

  // Fuzzy search state
  let projectSearchOpen = false;
  let projectSearchQuery = '';
  let projectSearchIndex = 0;
  let speakersSearchOpen = false;
  let speakersSearchQuery = '';
  let speakersSearchIndex = 0;

  // Meeting task selection state
  let selectedTasks = {};
  let isConfirmingTasks = false;
  let newTriageDecisions = [];
  let showingNewCards = false;

  // Fuzzy match function
  function fuzzyMatch(query, text) {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();

    // Simple fuzzy: check if all chars appear in order
    let queryIndex = 0;
    for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
      if (lowerText[i] === lowerQuery[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === lowerQuery.length;
  }

  // Get fuzzy-filtered projects
  $: filteredProjects = allProjects.filter(p => fuzzyMatch(projectSearchQuery, p));

  // Get fuzzy-filtered speakers
  $: filteredSpeakers = knownSpeakers.filter(s => fuzzyMatch(speakersSearchQuery, s));

  // Fuzzy search handlers
  function handleProjectSearchKeydown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      projectSearchIndex = Math.min(projectSearchIndex + 1, filteredProjects.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      projectSearchIndex = Math.max(projectSearchIndex - 1, 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filteredProjects[projectSearchIndex]) {
        selectProject(filteredProjects[projectSearchIndex]);
      }
    } else if (event.key === 'Escape') {
      projectSearchOpen = false;
      event.target.blur();
    }
  }

  function selectProject(project) {
    formData.project = project;
    projectSearchQuery = project;
    projectSearchOpen = false;
  }

  function handleSpeakersSearchKeydown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      speakersSearchIndex = Math.min(speakersSearchIndex + 1, filteredSpeakers.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      speakersSearchIndex = Math.max(speakersSearchIndex - 1, 0);
    } else if (event.key === 'Enter' && speakersSearchOpen && filteredSpeakers[speakersSearchIndex]) {
      event.preventDefault();
      addSpeaker(filteredSpeakers[speakersSearchIndex]);
    } else if (event.key === 'Escape') {
      speakersSearchOpen = false;
    } else if (event.key === ',') {
      // Allow comma-separated entry
      event.preventDefault();
      if (speakersSearchQuery.trim()) {
        addSpeaker(speakersSearchQuery.trim());
      }
    }
  }

  function addSpeaker(speaker) {
    const current = formData.speakers || '';
    const speakers = current ? current.split(', ').filter(Boolean) : [];
    if (!speakers.includes(speaker)) {
      speakers.push(speaker);
      formData.speakers = speakers.join(', ');
    }
    speakersSearchQuery = '';
    speakersSearchOpen = false;
  }

  // Reset fuzzy search when selection changes
  $: if (selectedDecision) {
    projectSearchQuery = '';
    projectSearchIndex = 0;
    projectSearchOpen = false;
    speakersSearchQuery = '';
    speakersSearchIndex = 0;
    speakersSearchOpen = false;
  }

  // Reactive filtered decisions
  $: pendingDecisions = decisions.filter(d => d.status === 'pending');
  
  $: filteredDecisions = pendingDecisions.filter(d => {
    if (stageFilter !== 'all' && stageFilter !== 'urgent' && d.decisionType !== stageFilter) return false;
    if (stageFilter === 'urgent' && d.priority !== 'urgent') return false;
    if (thingFilter !== 'all' && d.subject.type !== thingFilter) return false;
    if (projectFilter !== 'all' && d.project !== projectFilter) return false;
    return true;
  });

  // Counts
  $: counts = {
    all: pendingDecisions.length,
    urgent: pendingDecisions.filter(d => d.priority === 'urgent').length,
    byStage: Object.keys(decisionTypeConfig).reduce((acc, key) => {
      acc[key] = pendingDecisions.filter(d => d.decisionType === key).length;
      return acc;
    }, {}),
    byThing: Object.keys(thingTypeConfig).reduce((acc, key) => {
      acc[key] = pendingDecisions.filter(d => d.subject.type === key).length;
      return acc;
    }, {}),
    byProject: allProjects.reduce((acc, proj) => {
      acc[proj] = pendingDecisions.filter(d => d.project === proj).length;
      return acc;
    }, {}),
  };

  // Reactive selection based on selectedIndex
  $: selectedDecision = filteredDecisions.length > 0
    ? filteredDecisions[Math.min(selectedIndex, filteredDecisions.length - 1)]
    : null;

  // Reset selection when filters change
  $: if (filteredDecisions) {
    selectedIndex = Math.min(selectedIndex, Math.max(0, filteredDecisions.length - 1));
  }

  // Scroll selected item into view
  function scrollToSelected() {
    tick().then(() => {
      const selectedEl = queueListEl?.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  function selectDecision(decision) {
    const idx = filteredDecisions.findIndex(d => d.id === decision.id);
    if (idx !== -1) {
      selectedIndex = idx;
    }
    formData = {};
  }

  function clearFilters() {
    stageFilter = 'all';
    thingFilter = 'all';
    projectFilter = 'all';
  }

  $: hasActiveFilters = stageFilter !== 'all' || thingFilter !== 'all' || projectFilter !== 'all';

  // ============ TOAST NOTIFICATION SYSTEM ============
  function showToast(message, type = 'success') {
    const id = toastId++;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 3000);
  }

  // ============ KEYBOARD HANDLERS ============
  function handleKeydown(event) {
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);

    // Undo: Ctrl+Z (always available)
    if (event.ctrlKey && event.key === 'z') {
      event.preventDefault();
      handleUndo();
      return;
    }

    // Command palette: o (or Ctrl+o when typing)
    if (event.key === 'o' && (!isTyping || event.ctrlKey)) {
      event.preventDefault();
      showCommandPalette = !showCommandPalette;
      commandSearch = '';
      commandIndex = 0;
      return;
    }

    // Close command palette or settings with Escape
    if (event.key === 'Escape') {
      if (showCommandPalette) {
        showCommandPalette = false;
        return;
      }
      if (showSettings) {
        showSettings = false;
        return;
      }
      // Blur focused input
      if (isTyping) {
        event.target.blur();
        return;
      }
    }

    // Handle command palette navigation when open
    if (showCommandPalette) {
      handleCommandPaletteKeydown(event);
      return;
    }

    // Form shortcuts when typing
    if (isTyping) {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        handleFormSubmit();
      }
      return;
    }

    // Alt+key filter shortcuts
    if (event.altKey) {
      handleAltShortcut(event);
      return;
    }

    // Navigation and action shortcuts
    handleNavigationShortcut(event);
  }

  function handleNavigationShortcut(event) {
    switch (event.key) {
      case 'ArrowUp':
      case 'k':
        event.preventDefault();
        if (selectedIndex > 0) {
          selectedIndex--;
          scrollToSelected();
        }
        break;

      case 'ArrowDown':
      case 'j':
        event.preventDefault();
        if (selectedIndex < filteredDecisions.length - 1) {
          selectedIndex++;
          scrollToSelected();
        }
        break;

      case 'Home':
        event.preventDefault();
        selectedIndex = 0;
        scrollToSelected();
        break;

      case 'End':
        event.preventDefault();
        selectedIndex = Math.max(0, filteredDecisions.length - 1);
        scrollToSelected();
        break;

      case '1': case '2': case '3': case '4':
        event.preventDefault();
        handleQuickOption(parseInt(event.key));
        break;

      case 's':
        event.preventDefault();
        handleSkip();
        break;

      case 'c':
        event.preventDefault();
        clearFilters();
        showToast('Filters cleared', 'info');
        break;

      case '?':
        event.preventDefault();
        showCommandPalette = true;
        commandSearch = '';
        commandIndex = 0;
        break;

      case 'l':
      case 'ArrowRight':
        event.preventDefault();
        focusFirstField();
        break;

      case 'i':
        event.preventDefault();
        goto('/inbox');
        break;

      case 'f':
        event.preventDefault();
        goto('/focus');
        break;

      case 'e':
        event.preventDefault();
        if (selectedDecision) {
          goto(`/entity/${selectedDecision.subject.id}`);
        }
        break;
    }
  }

  function focusFirstField() {
    if (!detailPanelEl) return;

    // Find the first focusable element in the detail panel (input, textarea, select, or button)
    const firstField = detailPanelEl.querySelector('input, textarea, select, button.option-btn');
    if (firstField) {
      firstField.focus();
      showToast('Focused right panel', 'info');
    }
  }

  function handleAltShortcut(event) {
    const key = event.key.toLowerCase();

    const stageShortcuts = {
      '0': 'all',
      'u': 'urgent',
      'e': 'enrich',
      't': 'triage',
      's': 'specify',
      'r': 'review',
      'c': 'categorize',
      'm': 'meeting_triage'
    };

    const thingShortcuts = {
      '0': 'all',
      't': 'task',
      'r': 'transcript',
      'e': 'email'
    };

    if (event.shiftKey && thingShortcuts[key]) {
      event.preventDefault();
      thingFilter = thingShortcuts[key];
      const label = thingFilter === 'all' ? 'All' : thingTypeConfig[thingFilter]?.label;
      showToast(`Filter: ${label}`, 'info');
      return;
    }

    if (stageShortcuts[key]) {
      event.preventDefault();
      stageFilter = stageShortcuts[key];
      const label = stageFilter === 'all' ? 'All' :
                    stageFilter === 'urgent' ? 'Urgent' :
                    decisionTypeConfig[stageFilter]?.label;
      showToast(`Filter: ${label}`, 'info');
    }
  }

  // ============ QUICK ACTIONS ============
  function handleQuickOption(num) {
    if (!selectedDecision?.options) return;

    const option = selectedDecision.options[num - 1];
    if (!option) return;

    lastAction = {
      type: 'option',
      decision: selectedDecision,
      option: option,
      previousIndex: selectedIndex,
      timestamp: Date.now()
    };

    showToast(`${option.label}: ${selectedDecision.subject.title}`, 'success');
    moveToNextDecision();
  }

  function handleSkip() {
    if (!selectedDecision) return;

    lastAction = {
      type: 'skip',
      decision: selectedDecision,
      previousIndex: selectedIndex,
      timestamp: Date.now()
    };

    showToast(`Skipped: ${selectedDecision.subject.title}`, 'success');
    moveToNextDecision();
  }

  function handleUndo() {
    if (!lastAction) {
      showToast('Nothing to undo', 'info');
      return;
    }

    if (Date.now() - lastAction.timestamp > 5000) {
      showToast('Too late to undo', 'info');
      lastAction = null;
      return;
    }

    const actionLabel = lastAction.type === 'skip' ? 'Skip' : lastAction.option?.label;
    showToast(`Undone: ${actionLabel}`, 'success');

    const idx = filteredDecisions.findIndex(d => d.id === lastAction.decision.id);
    if (idx !== -1) {
      selectedIndex = idx;
      scrollToSelected();
    }

    lastAction = null;
  }

  function moveToNextDecision() {
    if (selectedIndex >= filteredDecisions.length - 1) {
      selectedIndex = Math.max(0, filteredDecisions.length - 2);
    }
    scrollToSelected();
  }

  function handleFormSubmit() {
    if (!selectedDecision?.fields) return;

    const hasData = selectedDecision.fields.some(f => formData[f.key]);
    if (!hasData) {
      showToast('Please fill in at least one field', 'info');
      return;
    }

    lastAction = {
      type: 'form',
      decision: selectedDecision,
      formData: { ...formData },
      previousIndex: selectedIndex,
      timestamp: Date.now()
    };

    showToast(`Submitted: ${selectedDecision.subject.title}`, 'success');
    formData = {};
    moveToNextDecision();
  }

  // ============ MEETING TASK SELECTION ============
  function toggleTask(taskId) {
    selectedTasks = {
      ...selectedTasks,
      [taskId]: !selectedTasks[taskId]
    };
  }

  function selectAllTasks() {
    if (!selectedDecision?.extractedTasks) return;
    const newSelected = {};
    selectedDecision.extractedTasks.forEach(task => {
      newSelected[task.id] = true;
    });
    selectedTasks = newSelected;
  }

  function deselectAllTasks() {
    selectedTasks = {};
  }

  function getSelectedTaskCount() {
    return Object.values(selectedTasks).filter(Boolean).length;
  }

  async function handleMeetingTasksConfirm() {
    if (!selectedDecision?.extractedTasks) return;

    const selectedTasksList = selectedDecision.extractedTasks.filter(t => selectedTasks[t.id]);
    if (selectedTasksList.length === 0) {
      showToast('Select at least one task', 'info');
      return;
    }

    // Start confirmation animation
    isConfirmingTasks = true;

    // Wait for pulse animation
    await new Promise(r => setTimeout(r, 600));

    // Create new triage decisions for selected tasks
    const meetingTitle = selectedDecision.subject.title;
    const meetingProject = selectedDecision.project;

    newTriageDecisions = selectedTasksList.map((task, index) => ({
      id: `d_new_${Date.now()}_${index}`,
      decisionType: 'triage',
      status: 'pending',
      subject: {
        type: 'task',
        id: `task_${Date.now()}_${index}`,
        title: task.title,
        source: 'transcript',
        parentTitle: meetingTitle
      },
      project: meetingProject,
      question: 'What should happen with this task?',
      options: [
        { key: 'specify', label: 'Specify for AI', description: 'Needs more detail before Claude can execute' },
        { key: 'execute', label: 'Execute directly', description: 'Ready for AI to work on' },
        { key: 'manual', label: 'Do manually', description: "I'll handle this myself" },
        { key: 'defer', label: 'Defer', description: 'Not right now' }
      ],
      created: 'just now',
      priority: task.priority === 'high' ? 'urgent' : 'normal',
      _isNew: true,
      _animationDelay: index * 100
    }));

    // Mark current meeting_triage decision as completed
    const meetingDecisionIndex = decisions.findIndex(d => d.id === selectedDecision.id);
    if (meetingDecisionIndex !== -1) {
      decisions[meetingDecisionIndex] = { ...decisions[meetingDecisionIndex], status: 'completed' };
    }

    // Add new decisions and trigger reactivity
    decisions = [...decisions, ...newTriageDecisions];

    // Show new cards animation
    showingNewCards = true;

    // Reset state after animation
    await new Promise(r => setTimeout(r, 300 + (selectedTasksList.length * 100)));

    showToast(`Added ${selectedTasksList.length} tasks to queue`, 'success');

    // Clean up animation state
    isConfirmingTasks = false;
    showingNewCards = false;
    selectedTasks = {};
    newTriageDecisions = [];

    // Clear the _isNew flag after animation completes
    await tick();
    decisions = decisions.map(d => {
      if (d._isNew) {
        const { _isNew, _animationDelay, ...rest } = d;
        return rest;
      }
      return d;
    });
  }

  // Reset selected tasks when switching decisions
  $: if (selectedDecision?.decisionType !== 'meeting_triage') {
    selectedTasks = {};
  }

  // ============ COMMAND PALETTE ============
  // Note: Using a function to get commands to avoid reactive cycle with filteredDecisions/stageFilter
  function getCommands() {
    return [
      { id: 'nav-up', label: 'Previous item', shortcut: '↑ / k', action: () => { if (selectedIndex > 0) { selectedIndex--; scrollToSelected(); } }, category: 'Navigation' },
      { id: 'nav-down', label: 'Next item', shortcut: '↓ / j', action: () => { if (selectedIndex < filteredDecisions.length - 1) { selectedIndex++; scrollToSelected(); } }, category: 'Navigation' },
      { id: 'nav-first', label: 'First item', shortcut: 'Home', action: () => { selectedIndex = 0; scrollToSelected(); }, category: 'Navigation' },
      { id: 'nav-last', label: 'Last item', shortcut: 'End', action: () => { selectedIndex = Math.max(0, filteredDecisions.length - 1); scrollToSelected(); }, category: 'Navigation' },
      { id: 'focus-detail', label: 'Focus right panel', shortcut: 'l / →', action: focusFirstField, category: 'Navigation' },

      { id: 'filter-all', label: 'Show all decisions', shortcut: 'Alt+0', action: () => { stageFilter = 'all'; showToast('Filter: All', 'info'); }, category: 'Filters' },
      { id: 'filter-urgent', label: 'Show urgent only', shortcut: 'Alt+U', action: () => { stageFilter = 'urgent'; showToast('Filter: Urgent', 'info'); }, category: 'Filters' },
      { id: 'filter-enrich', label: 'Show Enrich', shortcut: 'Alt+E', action: () => { stageFilter = 'enrich'; showToast('Filter: Enrich', 'info'); }, category: 'Filters' },
      { id: 'filter-triage', label: 'Show Triage', shortcut: 'Alt+T', action: () => { stageFilter = 'triage'; showToast('Filter: Triage', 'info'); }, category: 'Filters' },
      { id: 'filter-specify', label: 'Show Specify', shortcut: 'Alt+S', action: () => { stageFilter = 'specify'; showToast('Filter: Specify', 'info'); }, category: 'Filters' },
      { id: 'filter-review', label: 'Show Review', shortcut: 'Alt+R', action: () => { stageFilter = 'review'; showToast('Filter: Review', 'info'); }, category: 'Filters' },
      { id: 'filter-categorize', label: 'Show Categorize', shortcut: 'Alt+C', action: () => { stageFilter = 'categorize'; showToast('Filter: Categorize', 'info'); }, category: 'Filters' },
      { id: 'filter-meeting-triage', label: 'Show Meeting Tasks', shortcut: 'Alt+M', action: () => { stageFilter = 'meeting_triage'; showToast('Filter: Meeting Tasks', 'info'); }, category: 'Filters' },
      { id: 'filter-tasks', label: 'Show Tasks only', shortcut: 'Alt+Shift+T', action: () => { thingFilter = 'task'; showToast('Filter: Tasks', 'info'); }, category: 'Filters' },
      { id: 'filter-transcripts', label: 'Show Transcripts only', shortcut: 'Alt+Shift+R', action: () => { thingFilter = 'transcript'; showToast('Filter: Transcripts', 'info'); }, category: 'Filters' },
      { id: 'filter-emails', label: 'Show Emails only', shortcut: 'Alt+Shift+E', action: () => { thingFilter = 'email'; showToast('Filter: Emails', 'info'); }, category: 'Filters' },
      { id: 'filter-clear', label: 'Clear all filters', shortcut: 'C', action: () => { clearFilters(); showToast('Filters cleared', 'info'); }, category: 'Filters' },

      { id: 'action-skip', label: 'Skip current decision', shortcut: 'S', action: handleSkip, category: 'Actions' },
      { id: 'action-undo', label: 'Undo last action', shortcut: 'Ctrl+Z', action: handleUndo, category: 'Actions' },

      { id: 'view-inbox', label: 'Go to Inbox view', shortcut: 'i', action: () => { goto('/inbox'); }, category: 'Views' },
      { id: 'view-focus', label: 'Go to Focus mode', shortcut: 'f', action: () => { goto('/focus'); }, category: 'Views' },
      { id: 'view-entity', label: 'View entity timeline', shortcut: 'e', action: () => { if (selectedDecision) goto(`/entity/${selectedDecision.subject.id}`); }, category: 'Views' },

      { id: 'open-settings', label: 'Open keyboard settings', shortcut: '', action: () => { showSettings = true; }, category: 'Settings' },
    ];
  }

  $: commands = getCommands();

  $: filteredCommands = commandSearch
    ? commands.filter(c => c.label.toLowerCase().includes(commandSearch.toLowerCase()))
    : commands;

  function handleCommandPaletteKeydown(event) {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        commandIndex = Math.max(0, commandIndex - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        commandIndex = Math.min(filteredCommands.length - 1, commandIndex + 1);
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCommands[commandIndex]) {
          executeCommand(filteredCommands[commandIndex]);
        }
        break;
    }
  }

  function executeCommand(command) {
    showCommandPalette = false;
    command.action();
  }

  // Reset command index when search changes
  $: commandSearch, commandIndex = 0;
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-zinc-900 text-zinc-100">
  <!-- Header with Filters -->
  <div class="border-b border-zinc-800">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-xl font-semibold">Decision Queue</h1>
          <p class="text-sm text-zinc-400 mt-1">What needs your attention right now?</p>
        </div>
        <div class="flex items-center gap-4">
          <!-- View switcher -->
          <div class="flex items-center gap-2">
            <a
              href="/inbox"
              class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm transition-colors flex items-center gap-2"
            >
              <span>Inbox</span>
            </a>
            <a
              href="/focus"
              class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 text-sm transition-colors flex items-center gap-2"
            >
              <span>Focus</span>
            </a>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold text-amber-400">{filteredDecisions.length}</div>
            <div class="text-sm text-zinc-400">
              {#if hasActiveFilters}
                of {counts.all} decisions
              {:else}
                decisions waiting
              {/if}
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Rows -->
      <div class="space-y-3">
        <!-- Stage Filters -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-zinc-500 w-16">Stage:</span>
          <button
            on:click={() => stageFilter = 'all'}
            class="px-3 py-1.5 rounded text-sm transition-colors {stageFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}"
          >
            All
          </button>
          <button
            on:click={() => stageFilter = 'urgent'}
            class="px-3 py-1.5 rounded text-sm transition-colors {stageFilter === 'urgent' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}"
          >
            🔥 Urgent ({counts.urgent})
          </button>
          {#each Object.entries(decisionTypeConfig) as [key, config]}
            <button
              on:click={() => stageFilter = key}
              class="px-3 py-1.5 rounded text-sm transition-colors {stageFilter === key ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}"
            >
              {config.icon} {config.label}
              <span class="text-zinc-500 ml-1">({counts.byStage[key]})</span>
            </button>
          {/each}
        </div>

        <!-- Thing Type Filters -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-zinc-500 w-16">Thing:</span>
          <button
            on:click={() => thingFilter = 'all'}
            class="px-3 py-1.5 rounded text-sm transition-colors {thingFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}"
          >
            All
          </button>
          {#each Object.entries(thingTypeConfig) as [key, config]}
            <button
              on:click={() => thingFilter = key}
              class="px-3 py-1.5 rounded text-sm transition-colors {thingFilter === key ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}"
            >
              {config.icon} {config.label}
              <span class="text-zinc-500 ml-1">({counts.byThing[key]})</span>
            </button>
          {/each}
        </div>

        <!-- Project Filters -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-zinc-500 w-16">Project:</span>
          <button
            on:click={() => projectFilter = 'all'}
            class="px-3 py-1.5 rounded text-sm transition-colors {projectFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}"
          >
            All
          </button>
          {#each allProjects as project}
            <button
              on:click={() => projectFilter = project}
              class="px-3 py-1.5 rounded text-sm transition-colors {projectFilter === project ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}"
            >
              {project}
              <span class="text-zinc-500 ml-1">({counts.byProject[project]})</span>
            </button>
          {/each}
          <button
            on:click={() => projectFilter = 'none'}
            class="px-3 py-1.5 rounded text-sm transition-colors {projectFilter === 'none' ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}"
          >
            No Project
          </button>
        </div>

        <!-- Clear filters -->
        {#if hasActiveFilters}
          <button 
            on:click={clearFilters}
            class="text-sm text-amber-400 hover:text-amber-300"
          >
            ✕ Clear all filters
          </button>
        {/if}
      </div>
    </div>
  </div>

  <div class="flex h-[calc(100vh-220px)]">
    <!-- Left Panel - Decision Queue -->
    <div class="w-96 border-r border-zinc-800 flex flex-col">
      <!-- Decision List -->
      <div class="flex-1 overflow-y-auto" bind:this={queueListEl}>
        {#if filteredDecisions.length === 0}
          <div class="p-6 text-center text-zinc-500">
            <div class="text-4xl mb-2">✨</div>
            <div>No decisions match your filters</div>
            {#if hasActiveFilters}
              <button on:click={clearFilters} class="text-amber-400 text-sm mt-2 hover:underline">
                Clear filters
              </button>
            {/if}
          </div>
        {:else}
          {#each filteredDecisions as decision, index}
            {@const config = decisionTypeConfig[decision.decisionType]}
            {@const thingConfig = thingTypeConfig[decision.subject.type]}
            <button
              on:click={() => selectDecision(decision)}
              data-index={index}
              class="w-full text-left px-4 py-3 border-b border-zinc-800 cursor-pointer transition-colors border-l-2
                     {config.bgClass} {config.hoverBgClass}
                     {selectedIndex === index ? 'ring-1 ring-inset ring-zinc-600 ' + config.borderClass : 'border-l-transparent'}
                     {decision._isNew ? 'animate-card-enter' : ''}"
              style={decision._animationDelay ? `animation-delay: ${decision._animationDelay}ms` : ''}
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">
                  {config.icon}
                </span>
                <span class="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {thingConfig.icon}
                </span>
                {#if decision.priority === 'urgent'}
                  <span class="text-xs text-red-400">🔥</span>
                {/if}
                {#if decision.project}
                  <span class="text-xs text-blue-400 truncate">{decision.project}</span>
                {/if}
                <span class="text-xs text-zinc-500 ml-auto">{decision.created}</span>
              </div>
              <div class="font-medium text-zinc-200 truncate">
                {decision.subject.title}
              </div>
              <div class="text-sm text-zinc-500 truncate">
                {decision.question}
              </div>
            </button>
          {/each}
        {/if}
      </div>

      <!-- Keyboard hints -->
      <div class="p-3 border-t border-zinc-800 bg-zinc-800/30 text-xs text-zinc-500 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span><kbd class="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300">↑↓</kbd> nav</span>
          <span><kbd class="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300">l</kbd> focus</span>
          <span><kbd class="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300">1-4</kbd> select</span>
          <span><kbd class="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300">s</kbd> skip</span>
        </div>
        <button
          on:click={() => showCommandPalette = true}
          class="flex items-center gap-1 text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <kbd class="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-300">o</kbd> commands
        </button>
      </div>
    </div>

    <!-- Right Panel - Active Decision -->
    <div class="flex-1 bg-zinc-900/50 overflow-y-auto" bind:this={detailPanelEl}>
      {#if selectedDecision}
        {@const config = decisionTypeConfig[selectedDecision.decisionType]}
        {@const thingConfig = thingTypeConfig[selectedDecision.subject.type]}
        
        <div class="p-6">
          <!-- Decision header -->
          <div class="flex items-center gap-3 mb-2 flex-wrap">
            <span class="text-xs px-2 py-1 rounded bg-zinc-700 text-zinc-300 font-medium">
              {config.icon} {config.label}
            </span>
            <span class="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
              {thingConfig.icon} {thingConfig.label.slice(0, -1)}
            </span>
            {#if selectedDecision.priority === 'urgent'}
              <span class="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400 font-medium">
                🔥 URGENT
              </span>
            {/if}
            {#if selectedDecision.project}
              <span class="text-xs px-2 py-1 rounded bg-blue-900/30 text-blue-400">
                {selectedDecision.project}
              </span>
            {/if}
            <span class="text-xs text-zinc-500">{selectedDecision.created}</span>
          </div>

          <!-- Subject context -->
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-zinc-100 mb-1">
              {selectedDecision.subject.title}
            </h2>
            <div class="flex items-center gap-2 text-sm text-zinc-400">
              <span class="capitalize">{selectedDecision.subject.type}</span>
              {#if selectedDecision.subject.source}
                <span>•</span>
                <span>from {selectedDecision.subject.source}</span>
              {/if}
              {#if selectedDecision.subject.parentTitle}
                <span>•</span>
                <span class="text-blue-400 cursor-pointer hover:underline">
                  ↑ {selectedDecision.subject.parentTitle}
                </span>
              {/if}
              {#if selectedDecision.subject.from}
                <span>•</span>
                <span>{selectedDecision.subject.from}</span>
              {/if}
            </div>
          </div>

          <!-- The question -->
          <div class="bg-zinc-800/50 rounded-lg p-4 mb-6 border-l-4 border-amber-500">
            <p class="text-zinc-200 font-medium">{selectedDecision.question}</p>
          </div>

          <!-- Preview if available -->
          {#if selectedDecision.preview}
            <div class="mb-6 p-4 bg-zinc-800 rounded-lg">
              <p class="text-sm text-zinc-300">{selectedDecision.preview}</p>
              <button class="text-sm text-blue-400 mt-2 hover:underline">View full output →</button>
            </div>
          {/if}

          <!-- Options-based decisions -->
          {#if selectedDecision.options}
            <div class="space-y-3 mb-6">
              {#each selectedDecision.options as option, i}
                <button
                  class="option-btn w-full text-left px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-all group focus:outline-none focus:ring-2 focus:ring-amber-500"
                  on:click={() => handleQuickOption(i + 1)}
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-zinc-200 group-hover:text-white">
                        <span class="text-zinc-500 mr-2">{i + 1}.</span>
                        {option.label}
                      </div>
                      <div class="text-sm text-zinc-400">{option.description}</div>
                    </div>
                    <span class="text-zinc-600 group-hover:text-zinc-400 text-xl">→</span>
                  </div>
                </button>
              {/each}
            </div>
          {/if}

          <!-- Field-based decisions -->
          {#if selectedDecision.fields}
            <div class="space-y-4 mb-6">
              {#each selectedDecision.fields as field}
                <div>
                  <label class="block text-sm text-zinc-300 mb-2" for={field.key}>{field.label}</label>

                  <!-- Project field with fuzzy search -->
                  {#if field.key === 'project'}
                    <div class="relative">
                      <input
                        id={field.key}
                        type="text"
                        class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                        placeholder="Type to search projects..."
                        bind:value={projectSearchQuery}
                        on:focus={() => projectSearchOpen = true}
                        on:blur={() => setTimeout(() => projectSearchOpen = false, 150)}
                        on:keydown={handleProjectSearchKeydown}
                        on:input={() => { projectSearchOpen = true; projectSearchIndex = 0; }}
                      />
                      {#if formData.project && projectSearchQuery !== formData.project}
                        <div class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-400">
                          Selected: {formData.project}
                        </div>
                      {/if}
                      {#if projectSearchOpen && filteredProjects.length > 0}
                        <div class="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {#each filteredProjects as project, i}
                            <button
                              type="button"
                              class="w-full text-left px-4 py-2 text-zinc-200 hover:bg-zinc-700 transition-colors
                                     {i === projectSearchIndex ? 'bg-amber-600/20 text-amber-100' : ''}"
                              on:click={() => selectProject(project)}
                              on:mouseenter={() => projectSearchIndex = i}
                            >
                              {project}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>

                  <!-- Speakers field with fuzzy search -->
                  {:else if field.key === 'speakers'}
                    <div class="relative">
                      {#if formData.speakers}
                        <div class="flex flex-wrap gap-1 mb-2">
                          {#each (formData.speakers || '').split(', ').filter(Boolean) as speaker}
                            <span class="inline-flex items-center gap-1 px-2 py-1 bg-zinc-700 rounded text-sm text-zinc-200">
                              {speaker}
                              <button
                                type="button"
                                class="text-zinc-400 hover:text-zinc-200"
                                on:click={() => {
                                  const speakers = formData.speakers.split(', ').filter(s => s !== speaker);
                                  formData.speakers = speakers.join(', ');
                                }}
                              >×</button>
                            </span>
                          {/each}
                        </div>
                      {/if}
                      <input
                        id={field.key}
                        type="text"
                        class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                        placeholder="Type to search speakers... (comma to add)"
                        bind:value={speakersSearchQuery}
                        on:focus={() => speakersSearchOpen = true}
                        on:blur={() => setTimeout(() => speakersSearchOpen = false, 150)}
                        on:keydown={handleSpeakersSearchKeydown}
                        on:input={() => { speakersSearchOpen = true; speakersSearchIndex = 0; }}
                      />
                      {#if speakersSearchOpen && filteredSpeakers.length > 0}
                        <div class="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {#each filteredSpeakers as speaker, i}
                            <button
                              type="button"
                              class="w-full text-left px-4 py-2 text-zinc-200 hover:bg-zinc-700 transition-colors
                                     {i === speakersSearchIndex ? 'bg-amber-600/20 text-amber-100' : ''}"
                              on:click={() => addSpeaker(speaker)}
                              on:mouseenter={() => speakersSearchIndex = i}
                            >
                              {speaker}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>

                  <!-- Textarea fields -->
                  {:else if field.type === 'textarea'}
                    <textarea
                      id={field.key}
                      class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 focus:border-amber-500 focus:outline-none h-24"
                      placeholder={field.placeholder}
                      bind:value={formData[field.key]}
                    />

                  <!-- Default text input -->
                  {:else}
                    <input
                      id={field.key}
                      type="text"
                      class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 focus:border-amber-500 focus:outline-none"
                      placeholder={field.placeholder}
                      bind:value={formData[field.key]}
                    />
                  {/if}
                </div>
              {/each}
              <button
                on:click={handleFormSubmit}
                class="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg font-medium transition-colors mt-4"
              >
                Submit
              </button>
            </div>
          {/if}

          <!-- Meeting task extraction decisions -->
          {#if selectedDecision.extractedTasks}
            <div class="space-y-4 mb-6">
              <!-- Meeting metadata -->
              {#if selectedDecision.subject.date || selectedDecision.subject.duration}
                <div class="flex items-center gap-4 text-sm text-zinc-400 mb-4">
                  {#if selectedDecision.subject.date}
                    <span class="flex items-center gap-1">
                      <span>📅</span> {selectedDecision.subject.date}
                    </span>
                  {/if}
                  {#if selectedDecision.subject.duration}
                    <span class="flex items-center gap-1">
                      <span>⏱️</span> {selectedDecision.subject.duration}
                    </span>
                  {/if}
                </div>
              {/if}

              <!-- Select All / Deselect All buttons -->
              <div class="flex items-center gap-2 mb-3">
                <button
                  on:click={selectAllTasks}
                  class="text-sm px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
                >
                  Select All
                </button>
                <button
                  on:click={deselectAllTasks}
                  class="text-sm px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-colors"
                >
                  Deselect All
                </button>
                <span class="text-sm text-zinc-500 ml-auto">
                  {getSelectedTaskCount()} of {selectedDecision.extractedTasks.length} selected
                </span>
              </div>

              <!-- Task list with checkboxes -->
              <div class="space-y-2">
                {#each selectedDecision.extractedTasks as task (task.id)}
                  <button
                    on:click={() => toggleTask(task.id)}
                    class="w-full text-left px-4 py-3 rounded-lg border transition-all duration-200
                           {selectedTasks[task.id]
                             ? 'bg-emerald-900/30 border-emerald-500/50 ring-1 ring-emerald-500/30'
                             : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'}
                           {isConfirmingTasks && selectedTasks[task.id] ? 'animate-task-pulse' : ''}"
                  >
                    <div class="flex items-start gap-3">
                      <!-- Custom checkbox -->
                      <div class="flex-shrink-0 mt-0.5">
                        <div class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                                    {selectedTasks[task.id]
                                      ? 'bg-emerald-500 border-emerald-500'
                                      : 'border-zinc-600'}">
                          {#if selectedTasks[task.id]}
                            <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          {/if}
                        </div>
                      </div>

                      <!-- Task content -->
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-zinc-200 mb-1">
                          {task.title}
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                          {#if task.assignee}
                            <span class="text-xs px-2 py-0.5 rounded-full
                                        {task.assignee === 'You'
                                          ? 'bg-blue-900/40 text-blue-300'
                                          : 'bg-zinc-700 text-zinc-400'}">
                              {task.assignee}
                            </span>
                          {/if}
                          {#if task.priority === 'high'}
                            <span class="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-300">
                              High priority
                            </span>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </button>
                {/each}
              </div>

              <!-- Confirm button -->
              <button
                on:click={handleMeetingTasksConfirm}
                disabled={isConfirmingTasks}
                class="w-full py-3 rounded-lg font-medium transition-all mt-4
                       {getSelectedTaskCount() > 0
                         ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                         : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}
                       {isConfirmingTasks ? 'opacity-75' : ''}"
              >
                {#if isConfirmingTasks}
                  <span class="flex items-center justify-center gap-2">
                    <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                    </svg>
                    Adding to queue...
                  </span>
                {:else}
                  Confirm Selection ({getSelectedTaskCount()} task{getSelectedTaskCount() !== 1 ? 's' : ''})
                {/if}
              </button>
            </div>
          {/if}

          <!-- Skip / Defer -->
          <div class="flex justify-center pt-4 border-t border-zinc-800">
            <button
              on:click={handleSkip}
              class="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Skip for now →
            </button>
          </div>
        </div>
      {:else}
        <div class="flex items-center justify-center h-full text-zinc-500">
          Select a decision to view details
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Toast Notifications -->
<div class="fixed bottom-4 right-4 z-50 space-y-2">
  {#each toasts as toast (toast.id)}
    <div
      class="px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-slide-in
             {toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-zinc-700 text-zinc-200'}"
    >
      {toast.message}
      {#if toast.type === 'success'}
        <span class="text-green-200 text-xs ml-2 opacity-75">Ctrl+Z to undo</span>
      {/if}
    </div>
  {/each}
</div>

<!-- Command Palette -->
{#if showCommandPalette}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    class="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-[15vh]"
    on:click={() => showCommandPalette = false}
    on:keydown={(e) => e.key === 'Escape' && (showCommandPalette = false)}
    role="dialog"
    aria-modal="true"
    aria-label="Command palette"
  >
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="bg-zinc-800 rounded-xl w-full max-w-lg shadow-2xl border border-zinc-700 overflow-hidden"
      on:click|stopPropagation
    >
      <!-- Search input -->
      <div class="p-4 border-b border-zinc-700 flex items-center gap-3">
        <span class="text-zinc-500">🔍</span>
        <input
          type="text"
          placeholder="Type a command..."
          class="w-full bg-transparent text-zinc-100 text-lg outline-none placeholder-zinc-500"
          bind:value={commandSearch}
          autofocus
        />
        <kbd class="text-xs bg-zinc-700 px-2 py-1 rounded text-zinc-400">Esc</kbd>
      </div>

      <!-- Command list -->
      <div class="max-h-80 overflow-y-auto p-2">
        {#each filteredCommands as command, i}
          <button
            class="w-full text-left px-3 py-2 rounded flex items-center justify-between transition-colors
                   {commandIndex === i ? 'bg-amber-600/20 text-amber-100' : 'hover:bg-zinc-700 text-zinc-200'}"
            on:click={() => executeCommand(command)}
            on:mouseenter={() => commandIndex = i}
          >
            <div class="flex items-center gap-3">
              {#if command.category === 'Navigation'}
                <span class="text-zinc-500">↕️</span>
              {:else if command.category === 'Filters'}
                <span class="text-zinc-500">🔍</span>
              {:else if command.category === 'Actions'}
                <span class="text-zinc-500">⚡</span>
              {:else}
                <span class="text-zinc-500">⚙️</span>
              {/if}
              <span>{command.label}</span>
            </div>
            {#if command.shortcut}
              <kbd class="text-xs bg-zinc-700 px-2 py-0.5 rounded text-zinc-400">{command.shortcut}</kbd>
            {/if}
          </button>
        {/each}

        {#if filteredCommands.length === 0}
          <div class="text-center py-4 text-zinc-500">
            No commands found
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="p-3 border-t border-zinc-700 text-xs text-zinc-500 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span><kbd class="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-400">↑↓</kbd> navigate</span>
          <span><kbd class="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-400">Enter</kbd> select</span>
        </div>
        <span>Press <kbd class="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-400">o</kbd> to toggle</span>
      </div>
    </div>
  </div>
{/if}

<!-- Settings Modal -->
{#if showSettings}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
    on:click={() => showSettings = false}
    on:keydown={(e) => e.key === 'Escape' && (showSettings = false)}
    role="dialog"
    aria-modal="true"
    aria-label="Keyboard settings"
  >
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="bg-zinc-800 rounded-xl w-full max-w-md p-6 shadow-2xl border border-zinc-700"
      on:click|stopPropagation
    >
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-zinc-100">Keyboard Shortcuts</h2>
        <button
          on:click={() => showSettings = false}
          class="text-zinc-500 hover:text-zinc-300 text-xl"
        >
          ×
        </button>
      </div>

      <div class="space-y-1 text-sm max-h-80 overflow-y-auto">
        <div class="text-xs text-amber-400 uppercase tracking-wide mb-2 mt-4">Navigation</div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>Move up</span>
          <span class="text-zinc-500">↑ or k</span>
        </div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>Move down</span>
          <span class="text-zinc-500">↓ or j</span>
        </div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>First item</span>
          <span class="text-zinc-500">Home</span>
        </div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>Last item</span>
          <span class="text-zinc-500">End</span>
        </div>

        <div class="text-xs text-amber-400 uppercase tracking-wide mb-2 mt-4">Actions</div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>Quick select option</span>
          <span class="text-zinc-500">1-4</span>
        </div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>Skip decision</span>
          <span class="text-zinc-500">s</span>
        </div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>Undo last action</span>
          <span class="text-zinc-500">Ctrl+Z</span>
        </div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>Submit form</span>
          <span class="text-zinc-500">Ctrl+Enter</span>
        </div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>Command palette</span>
          <span class="text-zinc-500">o</span>
        </div>

        <div class="text-xs text-amber-400 uppercase tracking-wide mb-2 mt-4">Filters (Alt + key)</div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>All stages</span>
          <span class="text-zinc-500">Alt+0</span>
        </div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>Urgent</span>
          <span class="text-zinc-500">Alt+U</span>
        </div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>Enrich / Triage / Specify / Review</span>
          <span class="text-zinc-500">Alt+E/T/S/R</span>
        </div>
        <div class="flex justify-between py-2 text-zinc-300">
          <span>Clear all filters</span>
          <span class="text-zinc-500">c</span>
        </div>
      </div>

      <div class="flex justify-end mt-6 pt-4 border-t border-zinc-700">
        <button
          on:click={() => showSettings = false}
          class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  }

  /* Toast slide-in animation */
  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  :global(.animate-slide-in) {
    animation: slide-in 0.2s ease-out;
  }

  /* Task pulse animation for meeting task confirmation */
  @keyframes task-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
      transform: scale(1.02);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      transform: scale(1);
    }
  }

  :global(.animate-task-pulse) {
    animation: task-pulse 0.6s ease-out;
  }

  /* New card entrance animation */
  @keyframes card-enter {
    0% {
      opacity: 0;
      transform: translateX(20px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }

  :global(.animate-card-enter) {
    animation: card-enter 0.3s ease-out forwards;
  }
</style>
