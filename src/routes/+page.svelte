<!-- +page.svelte -->
<script>
  import { tick } from 'svelte';
  import { goto } from '$app/navigation';
  import ClarificationModal from '$lib/components/ClarificationModal.svelte';
  import TaskCreationModal from '$lib/components/TaskCreationModal.svelte';
  import DecisionCard from '$lib/components/DecisionCard.svelte';
  
  import {
    mockDecisions,
    decisionTypeConfig,
    thingTypeConfig,
    knownSpeakers,
    allProjects
  } from '$lib/data/decisions.js';

  // Local decisions state
  let decisions = [...mockDecisions];

  // Modal states
  let showClarificationModal = false;
  let showTaskCreationModal = false;
  let clarificationTask = null;
  let clarificationQuestions = [];

  // Filter state
  let stageFilter = 'all';
  let thingFilter = 'all';
  let projectFilter = 'all';
  let searchQuery = '';
  
  // Dropdowns
  let activeDropdown = null;
  let dropdownTimeout;

  function openDropdown(name) {
    clearTimeout(dropdownTimeout);
    activeDropdown = name;
  }

  function closeDropdownWithDelay() {
    dropdownTimeout = setTimeout(() => {
      activeDropdown = null;
    }, 50);
  }

  function toggleDropdown(name, event) {
    event?.stopPropagation();
    if (activeDropdown === name) {
      activeDropdown = null;
    } else {
      activeDropdown = name;
    }
  }

  function closeDropdowns() {
    activeDropdown = null;
  }

  // Session stats
  let completedThisSession = 0;
  let sessionTotal = decisions.filter(d => d.status === 'pending').length;

  // Navigation
  let selectedIndex = 0;
  let queueListEl;
  let detailPanelEl;
  let showCommandPalette = false;
  let commandSearch = '';
  let commandIndex = 0;
  let showSettings = false;

  // Toasts
  let toastId = 0;
  let toasts = [];
  let lastAction = null;

  // Fuzzy Search
  let projectSearchOpen = false;
  let projectSearchQuery = '';
  let projectSearchIndex = 0;

  // Reactive Filters
  $: pendingDecisions = decisions.filter(d => d.status === 'pending');
  $: filteredDecisions = pendingDecisions.filter(d => {
    if (stageFilter !== 'all' && stageFilter !== 'urgent' && d.decisionType !== stageFilter) return false;
    if (stageFilter === 'urgent' && d.priority !== 'urgent') return false;
    if (thingFilter !== 'all' && d.subject.type !== thingFilter) return false;
    if (projectFilter !== 'all' && d.project !== projectFilter) return false;
    if (searchQuery && !d.subject.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  $: selectedDecision = filteredDecisions.length > 0
    ? filteredDecisions[Math.min(selectedIndex, filteredDecisions.length - 1)]
    : null;

  // Reset selection on filter change
  $: if (filteredDecisions) {
    selectedIndex = Math.min(selectedIndex, Math.max(0, filteredDecisions.length - 1));
  }

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

  function scrollToSelected() {
    tick().then(() => {
      const selectedEl = queueListEl?.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  function selectDecision(decision) {
    const idx = filteredDecisions.findIndex(d => d.id === decision.id);
    if (idx !== -1) selectedIndex = idx;
  }

  function clearFilters() {
    stageFilter = 'all';
    thingFilter = 'all';
    projectFilter = 'all';
    searchQuery = '';
  }

  $: hasActiveFilters = stageFilter !== 'all' || thingFilter !== 'all' || projectFilter !== 'all' || searchQuery !== '';

  // --- Actions ---

  function showToast(message, type = 'success') {
    const id = toastId++;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => { toasts = toasts.filter(t => t.id !== id); }, 3000);
  }

  function markAsCompleted(decisionId) {
    const idx = decisions.findIndex(d => d.id === decisionId);
    if (idx !== -1) {
      decisions[idx] = { ...decisions[idx], status: 'completed' };
      decisions = [...decisions];
      completedThisSession++;
    }
  }

  // Handle actions from the DecisionCard component
  function handleCardAction(event) {
    const { name, decision, payload } = event.detail;
    showToast(`${name}: ${decision.subject.title}`, 'success');
    lastAction = { type: 'action', name, decision, previousIndex: selectedIndex, timestamp: Date.now() };
    
    // Special handling for meeting tasks confirmation if needed
    if (name === 'Confirm Meeting Tasks' && payload?.selectedTasks) {
       // Logic to create new tasks could go here
       console.log('Confirmed tasks:', payload.selectedTasks);
    }

    markAsCompleted(decision.id);
    moveToNextDecision();
  }

  function handleSkip() {
    if (!selectedDecision) return;
    lastAction = { type: 'skip', decision: selectedDecision, previousIndex: selectedIndex, timestamp: Date.now() };
    showToast(`Skipped: ${selectedDecision.subject.title}`, 'success');
    moveToNextDecision();
  }

  function handleUndo() {
    if (!lastAction) { showToast('Nothing to undo', 'info'); return; }
    if (Date.now() - lastAction.timestamp > 5000) { showToast('Too late to undo', 'info'); lastAction = null; return; }
    
    showToast(`Undone`, 'success');
    if (lastAction.type !== 'skip') {
      const idx = decisions.findIndex(d => d.id === lastAction.decision.id);
      if (idx !== -1) {
        decisions[idx] = { ...decisions[idx], status: 'pending' };
        decisions = [...decisions];
        completedThisSession--;
      }
    }
    const idx = filteredDecisions.findIndex(d => d.id === lastAction.decision.id);
    if (idx !== -1) { selectedIndex = idx; scrollToSelected(); }
    lastAction = null;
  }

  function moveToNextDecision() {
    if (selectedIndex >= filteredDecisions.length - 1) {
      selectedIndex = Math.max(0, filteredDecisions.length - 2);
    }
    scrollToSelected();
  }

  function handleTaskCreate(event) {
    const { title, project, priority } = event.detail;
    const newDecision = {
      id: `d_new_${Date.now()}`,
      decisionType: 'triage',
      status: 'pending',
      subject: { type: 'task', id: `task_${Date.now()}`, title: title, source: 'manual' },
      project: project || null,
      priority: priority,
      question: 'Route this item',
      created: 'just now',
      data: {
        destination: ['Quick Win', 'Project Task', 'Reference'],
        suggestedDestination: 'Project Task',
        suggestedProject: project || 'Inbox',
        suggestedPriority: priority || 'normal'
      },
      _isNew: true
    };
    decisions = [newDecision, ...decisions];
    showTaskCreationModal = false;
    showToast(`Task created: ${title}`, 'success');
    tick().then(() => { selectDecision(newDecision); scrollToSelected(); });
  }

  // --- Keyboard Shortcuts ---
  function handleKeydown(event) {
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
    if (event.ctrlKey && event.key === 'z') { event.preventDefault(); handleUndo(); return; }
    if (event.key === '/' && !isTyping) { event.preventDefault(); document.getElementById('global-search')?.focus(); return; }
    if (event.key === 'o' && (!isTyping || event.ctrlKey)) { event.preventDefault(); showCommandPalette = !showCommandPalette; commandSearch = ''; commandIndex = 0; return; }
    if (event.key === 'Escape') {
      if (showCommandPalette) { showCommandPalette = false; return; }
      if (showSettings) { showSettings = false; return; }
      if (isTyping) { event.target.blur(); return; }
    }
    if (showCommandPalette) { handleCommandPaletteKeydown(event); return; }
    if (isTyping) return;
    if (event.altKey) { handleAltShortcut(event); return; }
    handleNavigationShortcut(event);
  }

  function handleNavigationShortcut(event) {
    switch (event.key) {
      case 'ArrowUp': case 'k': event.preventDefault(); if (selectedIndex > 0) { selectedIndex--; scrollToSelected(); } break;
      case 'ArrowDown': case 'j': event.preventDefault(); if (selectedIndex < filteredDecisions.length - 1) { selectedIndex++; scrollToSelected(); } break;
      case 'Home': event.preventDefault(); selectedIndex = 0; scrollToSelected(); break;
      case 'End': event.preventDefault(); selectedIndex = Math.max(0, filteredDecisions.length - 1); scrollToSelected(); break;
      case 's': event.preventDefault(); handleSkip(); break;
      case 'c': event.preventDefault(); clearFilters(); showToast('Filters cleared', 'info'); break;
      case '?': event.preventDefault(); showSettings = true; break;
      case 'i': event.preventDefault(); goto('/inbox'); break;
      case 'f': event.preventDefault(); goto('/focus'); break;
    }
  }

  function handleAltShortcut(event) {
    const key = event.key.toLowerCase();
    const map = { '0': 'all', 'u': 'urgent', 't': 'triage', 's': 'specify', 'r': 'review', 'e': 'enrich', 'c': 'conflict', 'm': 'meeting_triage' };
    if (map[key]) {
      event.preventDefault();
      stageFilter = map[key];
      showToast(`Filter: ${stageFilter}`, 'info');
    }
  }

  // --- Command Palette ---
  function getCommands() {
    return [
      { id: 'nav-up', label: 'Previous', action: () => { if (selectedIndex > 0) selectedIndex--; scrollToSelected(); } },
      { id: 'nav-down', label: 'Next', action: () => { if (selectedIndex < filteredDecisions.length - 1) selectedIndex++; scrollToSelected(); } },
      { id: 'filter-all', label: 'All Stages', action: () => { stageFilter = 'all'; } },
      { id: 'action-skip', label: 'Skip', action: handleSkip },
      { id: 'view-inbox', label: 'Inbox', action: () => goto('/inbox') }
    ];
  }
  $: commands = getCommands();
  $: filteredCommands = commandSearch ? commands.filter(c => c.label.toLowerCase().includes(commandSearch.toLowerCase())) : commands;
  
  function handleCommandPaletteKeydown(event) {
    if (event.key === 'ArrowUp') commandIndex = Math.max(0, commandIndex - 1);
    else if (event.key === 'ArrowDown') commandIndex = Math.min(filteredCommands.length - 1, commandIndex + 1);
    else if (event.key === 'Enter' && filteredCommands[commandIndex]) { showCommandPalette = false; filteredCommands[commandIndex].action(); }
  }
</script>

<svelte:window on:keydown={handleKeydown} on:click={closeDropdowns} />

<div class="min-h-screen bg-zinc-900 text-zinc-100 font-sans">
  <!-- Header -->
  <div class="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur z-20 sticky top-0">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between mb-4 gap-6">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Decision Queue</h1>
          <p class="text-xs text-zinc-400 mt-1">Orchestrating {filteredDecisions.length} items</p>
        </div>

        <!-- Search -->
        <div class="relative flex-1 max-w-md hidden md:block">
          <input
            id="global-search" type="text" placeholder="Search... (/)"
            class="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-4 pr-4 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
            bind:value={searchQuery}
          />
        </div>

        <!-- Stats -->
        <div class="flex-1 max-w-xs hidden lg:block">
          <div class="flex justify-between text-[10px] uppercase font-bold text-zinc-500 mb-1">
            <span>Velocity</span><span>{completedThisSession} / {sessionTotal}</span>
          </div>
          <div class="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div class="h-full bg-amber-500 transition-all" style="width: {(completedThisSession / Math.max(1, sessionTotal)) * 100}%"></div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3">
           <button on:click={() => showTaskCreationModal = true} class="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-md text-sm font-medium transition-colors">+ New Task</button>
           <a href="/inbox" class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-sm transition-colors">Inbox</a>
           <a href="/focus" class="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-sm transition-colors">Focus</a>
        </div>
      </div>

      <!-- Filters (Restored Dropdowns) -->
      <div class="flex items-center gap-3 relative z-30">
        
        <!-- Stage Filter -->
        <div class="relative" on:mouseenter={() => openDropdown('stage')} on:mouseleave={closeDropdownWithDelay}>
          <button on:click={(e) => toggleDropdown('stage', e)} class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all {stageFilter !== 'all' ? 'bg-amber-600/20 border-amber-600/50 text-amber-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'}">
            {#if stageFilter === 'all'}<span>Stage</span>{:else if stageFilter === 'urgent'}<span>🔥 Urgent</span>{:else}<span>{decisionTypeConfig[stageFilter]?.icon} {decisionTypeConfig[stageFilter]?.label}</span>{/if}
            <span class="text-[10px] opacity-60">▼</span>
          </button>
          {#if activeDropdown === 'stage'}
            <div class="absolute top-full left-0 mt-1 w-56 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden py-1">
              <button on:click={() => { stageFilter = 'all'; closeDropdowns(); }} class="w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors flex justify-between {stageFilter === 'all' ? 'text-amber-400' : 'text-zinc-300'}">All Stages {#if stageFilter === 'all'}✓{/if}</button>
              <div class="h-px bg-zinc-700/50 my-1 mx-2"></div>
              <button on:click={() => { stageFilter = 'urgent'; closeDropdowns(); }} class="w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors flex justify-between {stageFilter === 'urgent' ? 'text-amber-400' : 'text-zinc-300'}">🔥 Urgent {#if stageFilter === 'urgent'}✓{/if}</button>
              <div class="h-px bg-zinc-700/50 my-1 mx-2"></div>
              {#each Object.entries(decisionTypeConfig) as [key, config]}
                <button on:click={() => { stageFilter = key; closeDropdowns(); }} class="w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors flex justify-between {stageFilter === key ? 'text-amber-400' : 'text-zinc-300'}">
                  <span>{config.icon} {config.label}</span>{#if stageFilter === key}✓{/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Type Filter -->
        <div class="relative" on:mouseenter={() => openDropdown('thing')} on:mouseleave={closeDropdownWithDelay}>
          <button on:click={(e) => toggleDropdown('thing', e)} class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all {thingFilter !== 'all' ? 'bg-amber-600/20 border-amber-600/50 text-amber-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'}">
            {#if thingFilter === 'all'}<span>Type</span>{:else}<span>{thingTypeConfig[thingFilter]?.icon} {thingTypeConfig[thingFilter]?.label}</span>{/if}
            <span class="text-[10px] opacity-60">▼</span>
          </button>
          {#if activeDropdown === 'thing'}
            <div class="absolute top-full left-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden py-1">
              <button on:click={() => { thingFilter = 'all'; closeDropdowns(); }} class="w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors flex justify-between {thingFilter === 'all' ? 'text-amber-400' : 'text-zinc-300'}">All Types {#if thingFilter === 'all'}✓{/if}</button>
              <div class="h-px bg-zinc-700/50 my-1 mx-2"></div>
              {#each Object.entries(thingTypeConfig) as [key, config]}
                <button on:click={() => { thingFilter = key; closeDropdowns(); }} class="w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors flex justify-between {thingFilter === key ? 'text-amber-400' : 'text-zinc-300'}">
                  <span>{config.icon} {config.label}</span>{#if thingFilter === key}✓{/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Project Filter -->
        <div class="relative" on:mouseenter={() => openDropdown('project')} on:mouseleave={closeDropdownWithDelay}>
          <button on:click={(e) => toggleDropdown('project', e)} class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all {projectFilter !== 'all' ? 'bg-amber-600/20 border-amber-600/50 text-amber-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'}">
            {#if projectFilter === 'all'}<span>Project</span>{:else}<span class="truncate max-w-[150px]">{projectFilter}</span>{/if}
            <span class="text-[10px] opacity-60">▼</span>
          </button>
          {#if activeDropdown === 'project'}
            <div class="absolute top-full left-0 mt-1 w-64 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden py-1 max-h-80 overflow-y-auto">
              <button on:click={() => { projectFilter = 'all'; closeDropdowns(); }} class="w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors flex justify-between {projectFilter === 'all' ? 'text-amber-400' : 'text-zinc-300'}">All Projects {#if projectFilter === 'all'}✓{/if}</button>
              <div class="h-px bg-zinc-700/50 my-1 mx-2"></div>
              {#each allProjects as project}
                <button on:click={() => { projectFilter = project; closeDropdowns(); }} class="w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors flex justify-between {projectFilter === project ? 'text-amber-400' : 'text-zinc-300'}">
                  <span class="truncate">{project}</span>{#if projectFilter === project}✓{/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>

        {#if hasActiveFilters}
          <div class="h-6 w-px bg-zinc-800 mx-1"></div>
          <button on:click={clearFilters} class="text-xs text-amber-500 hover:text-amber-400 font-medium px-2 py-1 rounded hover:bg-amber-900/20 transition-colors">Reset</button>
        {/if}
      </div>
    </div>
  </div>

  <div class="flex h-[calc(100vh-140px)]">
    <!-- Queue List -->
    <div class="w-80 border-r border-zinc-800 flex flex-col bg-zinc-900" bind:this={queueListEl}>
       <div class="flex-1 overflow-y-auto">
         {#if filteredDecisions.length === 0}
            <div class="p-8 text-center text-zinc-500">
               <div class="text-2xl mb-2">✨</div>
               <p class="text-sm">Queue empty</p>
            </div>
         {:else}
            {#each filteredDecisions as decision, index}
               {@const config = decisionTypeConfig[decision.decisionType]}
               <button
                  on:click={() => selectDecision(decision)}
                  data-index={index}
                  class="w-full text-left px-4 py-3 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors relative group
                  {selectedIndex === index ? 'bg-zinc-800/80' : ''}"
               >
                  <!-- Active Indicator -->
                  {#if selectedIndex === index}
                    <div class="absolute left-0 top-0 bottom-0 w-1 {config.bgClass.replace('/20','')}"></div>
                  {/if}
                  
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] uppercase font-bold tracking-wider text-zinc-500">{config.label}</span>
                    {#if decision.priority === 'urgent'}<span class="text-[10px] text-red-400 font-bold">URGENT</span>{/if}
                    <span class="text-[10px] text-zinc-600 ml-auto">{decision.created}</span>
                  </div>
                  <div class="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">{decision.subject.title}</div>
                  <div class="text-xs text-zinc-500 truncate mt-0.5">{decision.question}</div>
               </button>
            {/each}
         {/if}
       </div>
    </div>

    <!-- Active Decision Panel -->
    <div class="flex-1 bg-zinc-900/30 overflow-y-auto" bind:this={detailPanelEl}>
       {#if selectedDecision}
         <DecisionCard 
            decision={selectedDecision} 
            on:action={handleCardAction} 
            on:skip={handleSkip} 
         />
       {:else}
         <div class="flex items-center justify-center h-full text-zinc-500">
           <div class="text-center">
              <div class="text-4xl mb-4 opacity-30">⚡</div>
              <p>Select an item to start processing</p>
           </div>
         </div>
       {/if}
    </div>
  </div>
</div>

<!-- Output any modals if they are open -->
{#if showClarificationModal}
  <ClarificationModal
    taskTitle={clarificationTask?.subject?.title}
    questions={clarificationQuestions}
    on:close={() => showClarificationModal = false}
    on:submit={() => {/* Not used here anymore, logic moved/handled differently or pending implementation in DecisionCard */}}
  />
{/if}

{#if showTaskCreationModal}
  <TaskCreationModal
    on:close={() => showTaskCreationModal = false}
    on:submit={handleTaskCreate}
  />
{/if}
