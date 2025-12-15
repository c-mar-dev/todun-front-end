<!-- Focus Mode - Full-screen single decision interface with auto-advance -->
<script>
  import { goto } from '$app/navigation';
  import {
    mockDecisions,
    decisionTypeConfig,
    thingTypeConfig,
    knownSpeakers,
    allProjects
  } from '$lib/data/decisions.js';

  // Current decision index
  let currentIndex = 0;
  let formData = {};

  // Toast notifications
  let toastId = 0;
  let toasts = [];

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

  // Get pending decisions
  $: pendingDecisions = mockDecisions.filter(d => d.status === 'pending');
  $: totalCount = pendingDecisions.length;

  // Current decision
  $: currentDecision = pendingDecisions[currentIndex] || null;

  // Reset form when decision changes
  $: if (currentDecision) {
    formData = {};
    projectSearchQuery = '';
    projectSearchIndex = 0;
    projectSearchOpen = false;
    speakersSearchQuery = '';
    speakersSearchIndex = 0;
    speakersSearchOpen = false;
  }

  function showToast(message, type = 'success') {
    const id = toastId++;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
    }, 2000);
  }

  function advanceToNext() {
    if (currentIndex < pendingDecisions.length - 1) {
      currentIndex++;
    } else {
      // All done!
      showToast('All decisions completed!', 'success');
      setTimeout(() => goto('/'), 1500);
    }
  }

  function handleQuickOption(num) {
    if (!currentDecision?.options) return;
    const option = currentDecision.options[num - 1];
    if (!option) return;

    showToast(`${option.label}`, 'success');
    advanceToNext();
  }

  function handleSkip() {
    if (!currentDecision) return;
    showToast('Skipped', 'info');
    advanceToNext();
  }

  function handleFormSubmit() {
    if (!currentDecision?.fields) return;
    const hasData = currentDecision.fields.some(f => formData[f.key]);
    if (!hasData) {
      showToast('Please fill in at least one field', 'info');
      return;
    }

    showToast('Submitted', 'success');
    formData = {};
    advanceToNext();
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
      case '1': case '2': case '3': case '4':
        event.preventDefault();
        handleQuickOption(parseInt(event.key));
        break;
      case 's':
      case 'ArrowRight':
        event.preventDefault();
        handleSkip();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (currentIndex > 0) {
          currentIndex--;
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (currentDecision?.options && currentDecision.options.length > 0) {
          handleQuickOption(1);
        } else if (currentDecision?.fields) {
          handleFormSubmit();
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

<div class="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col">
  <!-- Minimal header -->
  <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
    <button
      on:click={() => goto('/')}
      class="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-2"
    >
      <span>← Exit</span>
    </button>

    <div class="flex items-center gap-4">
      <!-- Progress bar -->
      <div class="flex items-center gap-3">
        <div class="w-48 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-amber-500 transition-all duration-300"
            style="width: {totalCount > 0 ? ((currentIndex + 1) / totalCount) * 100 : 0}%"
          ></div>
        </div>
        <span class="text-zinc-400 text-sm font-medium">
          {currentIndex + 1} of {totalCount}
        </span>
      </div>
    </div>

    <div class="text-zinc-500 text-sm">
      <kbd class="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">Esc</kbd> to exit
    </div>
  </div>

  <!-- Main content area -->
  <div class="flex-1 flex items-center justify-center p-8">
    {#if currentDecision}
      {@const config = decisionTypeConfig[currentDecision.decisionType]}
      {@const thingConfig = thingTypeConfig[currentDecision.subject.type]}

      <div class="w-full max-w-2xl">
        <!-- Decision type badge -->
        <div class="flex items-center justify-center gap-3 mb-6">
          <span class="text-lg px-4 py-2 rounded-lg {config.bgClass} border border-zinc-700 font-medium">
            {config.icon} {config.label}
          </span>
          {#if currentDecision.priority === 'urgent'}
            <span class="text-lg px-4 py-2 rounded-lg bg-red-900/30 text-red-400 font-medium">
              URGENT
            </span>
          {/if}
        </div>

        <!-- Title -->
        <h1 class="text-3xl font-bold text-center text-zinc-100 mb-3">
          {currentDecision.subject.title}
        </h1>

        <div class="flex items-center justify-center gap-3 text-zinc-400 mb-8">
          <span class="text-sm px-2 py-1 rounded bg-zinc-800">
            {thingConfig.icon} {thingConfig.label.slice(0, -1)}
          </span>
          {#if currentDecision.project}
            <span class="text-sm text-blue-400">{currentDecision.project}</span>
          {/if}
        </div>

        <!-- Question -->
        <div class="bg-zinc-800/50 rounded-xl p-6 mb-8 border-l-4 {config.borderClass} text-center">
          <p class="text-xl text-zinc-200">{currentDecision.question}</p>
        </div>

        <!-- Preview if available -->
        {#if currentDecision.preview}
          <div class="mb-8 p-5 bg-zinc-800 rounded-xl text-center">
            <p class="text-zinc-300">{currentDecision.preview}</p>
          </div>
        {/if}

        <!-- Options-based decisions -->
        {#if currentDecision.options}
          <div class="grid grid-cols-2 gap-4 mb-8">
            {#each currentDecision.options as option, i}
              <button
                class="text-left p-5 bg-zinc-800 hover:bg-zinc-700 rounded-xl border border-zinc-700 hover:border-zinc-500 transition-all group focus:outline-none focus:ring-2 focus:ring-amber-500"
                on:click={() => handleQuickOption(i + 1)}
              >
                <div class="flex items-start gap-3">
                  <span class="text-2xl font-bold text-zinc-500 group-hover:text-amber-400">{i + 1}</span>
                  <div>
                    <div class="font-semibold text-zinc-200 group-hover:text-white text-lg">
                      {option.label}
                    </div>
                    <div class="text-sm text-zinc-400 mt-1">{option.description}</div>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}

        <!-- Field-based decisions -->
        {#if currentDecision.fields}
          <div class="space-y-5 mb-8">
            {#each currentDecision.fields as field}
              <div>
                <label class="block text-sm text-zinc-300 mb-2 font-medium" for={field.key}>{field.label}</label>

                {#if field.key === 'project'}
                  <div class="relative">
                    <input
                      id={field.key}
                      type="text"
                      class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-4 text-zinc-200 focus:border-amber-500 focus:outline-none text-lg"
                      placeholder="Type to search projects..."
                      bind:value={projectSearchQuery}
                      on:focus={() => projectSearchOpen = true}
                      on:blur={() => setTimeout(() => projectSearchOpen = false, 150)}
                      on:keydown={handleProjectSearchKeydown}
                      on:input={() => { projectSearchOpen = true; projectSearchIndex = 0; }}
                    />
                    {#if formData.project && projectSearchQuery !== formData.project}
                      <div class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-amber-400">
                        Selected: {formData.project}
                      </div>
                    {/if}
                    {#if projectSearchOpen && filteredProjects.length > 0}
                      <div class="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                        {#each filteredProjects as project, i}
                          <button
                            type="button"
                            class="w-full text-left px-4 py-3 text-zinc-200 hover:bg-zinc-700 transition-colors
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
                      <div class="flex flex-wrap gap-2 mb-2">
                        {#each (formData.speakers || '').split(', ').filter(Boolean) as speaker}
                          <span class="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-700 rounded-lg text-zinc-200">
                            {speaker}
                            <button
                              type="button"
                              class="text-zinc-400 hover:text-zinc-200 ml-1"
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
                      class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-4 text-zinc-200 focus:border-amber-500 focus:outline-none text-lg"
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
                            class="w-full text-left px-4 py-3 text-zinc-200 hover:bg-zinc-700 transition-colors
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
                    class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-4 text-zinc-200 focus:border-amber-500 focus:outline-none h-32 text-lg"
                    placeholder={field.placeholder}
                    bind:value={formData[field.key]}
                  />

                {:else}
                  <input
                    id={field.key}
                    type="text"
                    class="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-4 text-zinc-200 focus:border-amber-500 focus:outline-none text-lg"
                    placeholder={field.placeholder}
                    bind:value={formData[field.key]}
                  />
                {/if}
              </div>
            {/each}
            <button
              on:click={handleFormSubmit}
              class="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-xl font-semibold transition-colors text-lg"
            >
              Submit & Next →
            </button>
          </div>
        {/if}

        <!-- Skip button -->
        <div class="flex justify-center">
          <button
            on:click={handleSkip}
            class="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2"
          >
            Skip for now
            <span class="text-xs bg-zinc-800 px-2 py-1 rounded">s</span>
          </button>
        </div>
      </div>
    {:else}
      <div class="text-center">
        <div class="text-6xl mb-4">All done!</div>
        <p class="text-zinc-400 text-xl mb-8">No more decisions to make</p>
        <a
          href="/"
          class="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-white font-medium transition-colors"
        >
          Back to Queue
        </a>
      </div>
    {/if}
  </div>

  <!-- Keyboard hints footer -->
  <div class="px-6 py-3 border-t border-zinc-800 flex items-center justify-center gap-6 text-xs text-zinc-500">
    <span><kbd class="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">1-4</kbd> select option</span>
    <span><kbd class="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">s</kbd> skip</span>
    <span><kbd class="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">←</kbd> previous</span>
    <span><kbd class="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">Enter</kbd> confirm</span>
  </div>
</div>

<!-- Toast Notifications -->
<div class="fixed top-20 left-1/2 -translate-x-1/2 z-50 space-y-2">
  {#each toasts as toast (toast.id)}
    <div
      class="px-6 py-3 rounded-xl shadow-lg text-base font-medium animate-slide-down
             {toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-zinc-700 text-zinc-200'}"
    >
      {toast.message}
    </div>
  {/each}
</div>

<style>
  @keyframes slide-down {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  :global(.animate-slide-down) {
    animation: slide-down 0.2s ease-out;
  }
</style>
