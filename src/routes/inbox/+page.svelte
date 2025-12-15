<!-- Inbox View - Email-style layout with wider list panel -->
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

  // Filter state
  let stageFilter = 'all';
  let thingFilter = 'all';
  let projectFilter = 'all';
  let formData = {};

  // Navigation state
  let selectedIndex = 0;
  let queueListEl;
  let detailPanelEl;

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

  // Fuzzy match function
  function fuzzyMatch(query, text) {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();
    let queryIndex = 0;
    for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
      if (lowerText[i] === lowerQuery[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === lowerQuery.length;
  }

  $: filteredProjects = allProjects.filter(p => fuzzyMatch(projectSearchQuery, p));
  $: filteredSpeakers = knownSpeakers.filter(s => fuzzyMatch(speakersSearchQuery, s));

  // Reactive filtered decisions
  $: pendingDecisions = mockDecisions.filter(d => d.status === 'pending');

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
  };

  // Reactive selection
  $: selectedDecision = filteredDecisions.length > 0
    ? filteredDecisions[Math.min(selectedIndex, filteredDecisions.length - 1)]
    : null;

  $: if (filteredDecisions) {
    selectedIndex = Math.min(selectedIndex, Math.max(0, filteredDecisions.length - 1));
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

  function showToast(message, type = 'success') {
    const id = toastId++;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 3000);
  }

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

  // Keyboard handler
  function handleKeydown(event) {
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);

    if (event.key === 'Escape') {
      if (isTyping) {
        event.target.blur();
        return;
      }
      goto('/');
      return;
    }

    if (isTyping) {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        handleFormSubmit();
      }
      return;
    }

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
      case '1': case '2': case '3': case '4':
        event.preventDefault();
        handleQuickOption(parseInt(event.key));
        break;
      case 's':
        event.preventDefault();
        handleSkip();
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

  function selectProject(project) {
    formData.project = project;
    projectSearchQuery = project;
    projectSearchOpen = false;
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
      event.preventDefault();
      if (speakersSearchQuery.trim()) {
        addSpeaker(speakersSearchQuery.trim());
      }
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-zinc-900 text-zinc-100">
  <!-- Compact Header -->
  <div class="border-b border-zinc-800">
    <div class="px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/" class="text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
          ← Queue
        </a>
        <h1 class="text-lg font-semibold">Inbox</h1>
      </div>
      <div class="flex items-center gap-4">
        <!-- Compact filters -->
        <div class="flex items-center gap-1">
          <button
            on:click={() => stageFilter = 'all'}
            class="px-2 py-1 rounded text-xs transition-colors {stageFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}"
          >
            All
          </button>
          <button
            on:click={() => stageFilter = 'urgent'}
            class="px-2 py-1 rounded text-xs transition-colors {stageFilter === 'urgent' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}"
          >
            Urgent
          </button>
          {#each Object.entries(decisionTypeConfig) as [key, config]}
            <button
              on:click={() => stageFilter = key}
              class="px-2 py-1 rounded text-xs transition-colors {stageFilter === key ? 'bg-zinc-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}"
            >
              {config.icon}
            </button>
          {/each}
        </div>
        <div class="text-amber-400 font-bold text-lg">{filteredDecisions.length}</div>
      </div>
    </div>
  </div>

  <!-- Two-panel layout with wider list -->
  <div class="flex h-[calc(100vh-57px)]">
    <!-- Left Panel - Email-style list (40% width) -->
    <div class="w-2/5 border-r border-zinc-800 flex flex-col">
      <div class="flex-1 overflow-y-auto" bind:this={queueListEl}>
        {#if filteredDecisions.length === 0}
          <div class="p-6 text-center text-zinc-500">
            <div class="text-4xl mb-2">Inbox Zero!</div>
            <div>No decisions match your filters</div>
          </div>
        {:else}
          {#each filteredDecisions as decision, index}
            {@const config = decisionTypeConfig[decision.decisionType]}
            {@const thingConfig = thingTypeConfig[decision.subject.type]}
            <button
              on:click={() => selectDecision(decision)}
              data-index={index}
              class="w-full text-left p-4 border-b border-zinc-800 cursor-pointer transition-colors border-l-2
                     {config.bgClass} {config.hoverBgClass}
                     {selectedIndex === index ? 'ring-1 ring-inset ring-zinc-600 ' + config.borderClass : 'border-l-transparent'}"
            >
              <div class="flex items-start gap-3">
                <!-- Type icon -->
                <div class="flex-shrink-0 mt-0.5">
                  <span class="text-lg">{config.icon}</span>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    {#if decision.priority === 'urgent'}
                      <span class="text-red-400 text-sm">URGENT</span>
                    {/if}
                    <span class="font-medium text-zinc-200 truncate">{decision.subject.title}</span>
                    <span class="text-xs text-zinc-500 ml-auto flex-shrink-0">{decision.created}</span>
                  </div>
                  <div class="text-sm text-zinc-400 truncate">{decision.question}</div>
                  {#if decision.preview}
                    <div class="text-xs text-zinc-500 truncate mt-1">{decision.preview}</div>
                  {/if}
                  <div class="flex items-center gap-2 mt-2">
                    <span class="text-xs px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-400">
                      {thingConfig.icon} {thingConfig.label.slice(0, -1)}
                    </span>
                    {#if decision.project}
                      <span class="text-xs text-blue-400">{decision.project}</span>
                    {/if}
                  </div>
                </div>
              </div>
            </button>
          {/each}
        {/if}
      </div>

      <!-- Footer hints -->
      <div class="p-2 border-t border-zinc-800 bg-zinc-800/30 text-xs text-zinc-500 flex items-center gap-3">
        <span><kbd class="bg-zinc-700 px-1 py-0.5 rounded text-zinc-300">j/k</kbd> nav</span>
        <span><kbd class="bg-zinc-700 px-1 py-0.5 rounded text-zinc-300">1-4</kbd> action</span>
        <span><kbd class="bg-zinc-700 px-1 py-0.5 rounded text-zinc-300">Esc</kbd> back</span>
      </div>
    </div>

    <!-- Right Panel - Expanded detail view -->
    <div class="flex-1 bg-zinc-900/50 overflow-y-auto" bind:this={detailPanelEl}>
      {#if selectedDecision}
        {@const config = decisionTypeConfig[selectedDecision.decisionType]}
        {@const thingConfig = thingTypeConfig[selectedDecision.subject.type]}

        <div class="p-8 max-w-3xl mx-auto">
          <!-- Decision header -->
          <div class="flex items-center gap-3 mb-4 flex-wrap">
            <span class="text-sm px-3 py-1.5 rounded {config.bgClass} text-zinc-200 font-medium border border-zinc-700">
              {config.icon} {config.label}
            </span>
            <span class="text-sm px-3 py-1.5 rounded bg-zinc-800 text-zinc-400">
              {thingConfig.icon} {thingConfig.label.slice(0, -1)}
            </span>
            {#if selectedDecision.priority === 'urgent'}
              <span class="text-sm px-3 py-1.5 rounded bg-red-900/30 text-red-400 font-medium">
                URGENT
              </span>
            {/if}
            {#if selectedDecision.project}
              <span class="text-sm px-3 py-1.5 rounded bg-blue-900/30 text-blue-400">
                {selectedDecision.project}
              </span>
            {/if}
            <a
              href="/entity/{selectedDecision.subject.id}"
              class="text-sm px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors ml-auto"
            >
              View Timeline →
            </a>
          </div>

          <!-- Subject title -->
          <h2 class="text-2xl font-semibold text-zinc-100 mb-2">
            {selectedDecision.subject.title}
          </h2>

          <div class="flex items-center gap-3 text-sm text-zinc-400 mb-6">
            <span class="capitalize">{selectedDecision.subject.type}</span>
            {#if selectedDecision.subject.source}
              <span>•</span>
              <span>from {selectedDecision.subject.source}</span>
            {/if}
            {#if selectedDecision.subject.from}
              <span>•</span>
              <span>{selectedDecision.subject.from}</span>
            {/if}
            <span class="text-zinc-500">{selectedDecision.created}</span>
          </div>

          <!-- The question -->
          <div class="bg-zinc-800/50 rounded-lg p-5 mb-8 border-l-4 {config.borderClass}">
            <p class="text-lg text-zinc-200 font-medium">{selectedDecision.question}</p>
          </div>

          <!-- Preview if available -->
          {#if selectedDecision.preview}
            <div class="mb-8 p-5 bg-zinc-800 rounded-lg">
              <p class="text-zinc-300">{selectedDecision.preview}</p>
              <button class="text-sm text-blue-400 mt-3 hover:underline">View full output →</button>
            </div>
          {/if}

          <!-- Options-based decisions -->
          {#if selectedDecision.options}
            <div class="space-y-3 mb-8">
              {#each selectedDecision.options as option, i}
                <button
                  class="option-btn w-full text-left px-5 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-all group focus:outline-none focus:ring-2 focus:ring-amber-500"
                  on:click={() => handleQuickOption(i + 1)}
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-zinc-200 group-hover:text-white text-lg">
                        <span class="text-zinc-500 mr-2">{i + 1}.</span>
                        {option.label}
                      </div>
                      <div class="text-sm text-zinc-400 mt-1">{option.description}</div>
                    </div>
                    <span class="text-zinc-600 group-hover:text-zinc-400 text-2xl">→</span>
                  </div>
                </button>
              {/each}
            </div>
          {/if}

          <!-- Field-based decisions -->
          {#if selectedDecision.fields}
            <div class="space-y-5 mb-8">
              {#each selectedDecision.fields as field}
                <div>
                  <label class="block text-sm text-zinc-300 mb-2 font-medium" for={field.key}>{field.label}</label>

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
                        placeholder="Type to search speakers..."
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

                  {:else if field.type === 'textarea'}
                    <textarea
                      id={field.key}
                      class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-200 focus:border-amber-500 focus:outline-none h-32"
                      placeholder={field.placeholder}
                      bind:value={formData[field.key]}
                    />

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
                class="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-lg font-medium transition-colors mt-4 text-lg"
              >
                Submit
              </button>
            </div>
          {/if}

          <!-- Skip -->
          <div class="flex justify-center pt-6 border-t border-zinc-800">
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
    </div>
  {/each}
</div>

<style>
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
</style>
