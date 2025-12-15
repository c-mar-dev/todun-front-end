<!-- Entity Timeline View - Shows state progression with clickable I/O -->
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import {
    mockDecisions,
    entityHistory,
    getEntityById,
    getDecisionByEntityId
  } from '$lib/data/decisions.js';

  // Get entity ID from URL
  $: entityId = $page.params.id;

  // Get entity info
  $: entity = getEntityById(entityId);
  $: decision = getDecisionByEntityId(entityId);
  $: history = entityHistory[entityId] || [];

  // State for expanded items
  let expandedItems = {};

  function toggleExpand(index, field) {
    const key = `${index}-${field}`;
    expandedItems[key] = !expandedItems[key];
    expandedItems = expandedItems; // trigger reactivity
  }

  function isExpanded(index, field) {
    return expandedItems[`${index}-${field}`] || false;
  }

  // Format JSON for display
  function formatJson(obj) {
    if (!obj) return 'null';
    return JSON.stringify(obj, null, 2);
  }

  // Get state color
  function getStateColor(state) {
    const colors = {
      'created': 'bg-zinc-600',
      'received': 'bg-zinc-600',
      'recorded': 'bg-zinc-600',
      'transcribed': 'bg-blue-600',
      'categorized': 'bg-pink-600',
      'triaged': 'bg-purple-600',
      'specified': 'bg-orange-600',
      'executed': 'bg-cyan-600',
      'pending_review': 'bg-amber-600',
      'pending_enrichment': 'bg-amber-600',
      'pending_categorization': 'bg-amber-600',
      'approved': 'bg-green-600',
      'rejected': 'bg-red-600',
    };
    return colors[state] || 'bg-zinc-600';
  }

  // Get state icon
  function getStateIcon(state) {
    const icons = {
      'created': '+',
      'received': '?',
      'recorded': '?',
      'transcribed': '?',
      'categorized': '?',
      'triaged': '?',
      'specified': '?',
      'executed': '?',
      'pending_review': '?',
      'pending_enrichment': '?',
      'pending_categorization': '?',
      'approved': '?',
      'rejected': '?',
    };
    return icons[state] || '?';
  }

  // Keyboard handler
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      goto('/');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-zinc-900 text-zinc-100">
  <!-- Header -->
  <div class="border-b border-zinc-800">
    <div class="px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/" class="text-zinc-400 hover:text-zinc-200 transition-colors">
          ← Back
        </a>
        <div class="h-6 w-px bg-zinc-700"></div>
        <h1 class="text-lg font-semibold">Entity Timeline</h1>
      </div>
      <div class="text-zinc-500 text-sm">
        <kbd class="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">Esc</kbd> to go back
      </div>
    </div>
  </div>

  {#if entity}
    <div class="max-w-4xl mx-auto p-6">
      <!-- Entity Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-sm px-3 py-1 rounded bg-zinc-800 text-zinc-300 capitalize">
            {entity.type}
          </span>
          {#if decision?.priority === 'urgent'}
            <span class="text-sm px-3 py-1 rounded bg-red-900/30 text-red-400">
              URGENT
            </span>
          {/if}
          {#if decision?.project}
            <span class="text-sm px-3 py-1 rounded bg-blue-900/30 text-blue-400">
              {decision.project}
            </span>
          {/if}
        </div>
        <h2 class="text-2xl font-bold text-zinc-100">{entity.title}</h2>
        <p class="text-zinc-500 mt-1">ID: {entityId}</p>
      </div>

      <!-- Timeline visualization -->
      {#if history.length > 0}
        <div class="mb-8">
          <div class="flex items-center gap-1">
            {#each history as event, i}
              <div class="flex items-center">
                <div class="w-8 h-8 rounded-full {getStateColor(event.state)} flex items-center justify-center text-white text-sm font-medium">
                  {i + 1}
                </div>
                {#if i < history.length - 1}
                  <div class="w-12 h-0.5 bg-zinc-700"></div>
                {/if}
              </div>
            {/each}
            <!-- Pending indicator if there's a current decision -->
            {#if decision?.status === 'pending'}
              <div class="flex items-center">
                <div class="w-12 h-0.5 bg-zinc-700"></div>
                <div class="w-8 h-8 rounded-full bg-zinc-800 border-2 border-dashed border-amber-500 flex items-center justify-center text-amber-400 text-sm">
                  ?
                </div>
              </div>
            {/if}
          </div>
          <div class="flex items-center gap-1 mt-2">
            {#each history as event, i}
              <div class="flex items-center">
                <div class="w-8 text-center text-xs text-zinc-500 truncate" title={event.state}>
                  {event.state.split('_')[0]}
                </div>
                {#if i < history.length - 1}
                  <div class="w-12"></div>
                {/if}
              </div>
            {/each}
            {#if decision?.status === 'pending'}
              <div class="flex items-center">
                <div class="w-12"></div>
                <div class="w-8 text-center text-xs text-amber-400">
                  now
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Timeline events -->
        <div class="space-y-4">
          {#each history as event, index}
            <div class="bg-zinc-800/50 rounded-lg border border-zinc-700 overflow-hidden">
              <!-- Event header -->
              <div class="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 rounded-full {getStateColor(event.state)} flex items-center justify-center text-white text-xs font-bold">
                    {index + 1}
                  </div>
                  <span class="font-semibold text-zinc-200 uppercase tracking-wide text-sm">
                    {event.state.replace(/_/g, ' ')}
                  </span>
                </div>
                <span class="text-sm text-zinc-500">{event.timestamp}</span>
              </div>

              <!-- Event content -->
              <div class="p-4 space-y-4">
                <!-- Input -->
                {#if event.input !== null}
                  <div>
                    <button
                      class="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-2"
                      on:click={() => toggleExpand(index, 'input')}
                    >
                      <span class="text-xs">{isExpanded(index, 'input') ? '?' : '?'}</span>
                      <span class="font-medium">Input</span>
                      <span class="text-xs text-zinc-600">
                        {Object.keys(event.input).length} fields
                      </span>
                    </button>
                    {#if isExpanded(index, 'input')}
                      <pre class="bg-zinc-900 rounded-lg p-4 text-sm text-zinc-300 overflow-x-auto font-mono">{formatJson(event.input)}</pre>
                    {:else}
                      <div class="flex flex-wrap gap-2">
                        {#each Object.entries(event.input) as [key, value]}
                          <button
                            class="text-sm px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
                            on:click={() => toggleExpand(index, 'input')}
                          >
                            <span class="text-zinc-500">{key}:</span>
                            <span class="ml-1 text-amber-400">
                              {typeof value === 'object' ? '{...}' : String(value).slice(0, 20)}
                            </span>
                          </button>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/if}

                <!-- Output -->
                {#if event.output}
                  <div>
                    <button
                      class="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-2"
                      on:click={() => toggleExpand(index, 'output')}
                    >
                      <span class="text-xs">{isExpanded(index, 'output') ? '?' : '?'}</span>
                      <span class="font-medium">Output</span>
                      <span class="text-xs text-zinc-600">
                        {Object.keys(event.output).length} fields
                      </span>
                    </button>
                    {#if isExpanded(index, 'output')}
                      <pre class="bg-zinc-900 rounded-lg p-4 text-sm text-zinc-300 overflow-x-auto font-mono">{formatJson(event.output)}</pre>
                    {:else}
                      <div class="flex flex-wrap gap-2">
                        {#each Object.entries(event.output) as [key, value]}
                          <button
                            class="text-sm px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
                            on:click={() => toggleExpand(index, 'output')}
                          >
                            <span class="text-zinc-500">{key}:</span>
                            <span class="ml-1 text-cyan-400">
                              {typeof value === 'object' ? (Array.isArray(value) ? '[...]' : '{...}') : String(value).slice(0, 20)}
                            </span>
                          </button>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          {/each}

          <!-- Current pending decision -->
          {#if decision?.status === 'pending'}
            <div class="bg-amber-900/20 rounded-lg border border-amber-700/50 overflow-hidden">
              <div class="px-4 py-3 border-b border-amber-700/50 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold animate-pulse">
                    ?
                  </div>
                  <span class="font-semibold text-amber-200 uppercase tracking-wide text-sm">
                    AWAITING DECISION
                  </span>
                </div>
                <span class="text-sm text-amber-400">Now</span>
              </div>

              <div class="p-4">
                <p class="text-amber-100 mb-4">{decision.question}</p>

                <div class="flex items-center gap-3">
                  <a
                    href="/"
                    class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Make Decision →
                  </a>
                  <a
                    href="/focus"
                    class="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-colors"
                  >
                    Focus Mode
                  </a>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <!-- No history yet -->
        <div class="bg-zinc-800/50 rounded-lg p-8 text-center">
          <p class="text-zinc-400 mb-4">No history available for this entity yet.</p>
          {#if decision?.status === 'pending'}
            <a
              href="/"
              class="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
            >
              Make Decision →
            </a>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <!-- Entity not found -->
    <div class="max-w-4xl mx-auto p-6">
      <div class="bg-zinc-800/50 rounded-lg p-8 text-center">
        <div class="text-4xl mb-4">Entity not found</div>
        <p class="text-zinc-400 mb-6">No entity with ID "{entityId}" exists.</p>
        <a
          href="/"
          class="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
        >
          Back to Queue
        </a>
      </div>
    </div>
  {/if}
</div>
