<!-- Focus Mode - Full-screen single decision interface with auto-advance -->
<script>
  import { goto } from '$app/navigation';
  import DecisionCard from '$lib/components/DecisionCard.svelte';
  import { mockDecisions } from '$lib/data/decisions.js';

  // State
  let decisions = [...mockDecisions];
  let currentIndex = 0;

  // Toast notifications
  let toastId = 0;
  let toasts = [];

  // Reactive derived state
  $: pendingDecisions = decisions.filter(d => d.status === 'pending');
  $: totalCount = pendingDecisions.length;
  $: currentDecision = pendingDecisions[currentIndex] || null;

  function showToast(message, type = 'success') {
    const id = toastId++;
    toasts = [...toasts, { id, message, type }];
    setTimeout(() => { toasts = toasts.filter(t => t.id !== id); }, 2000);
  }

  function advanceToNext() {
    if (currentIndex < pendingDecisions.length - 1) {
      currentIndex++;
    } else {
      showToast('All decisions completed!', 'success');
      setTimeout(() => goto('/'), 1500);
    }
  }

  function handleCardAction(event) {
    const { name, decision } = event.detail;
    showToast(`${name}`, 'success');
    
    // Mark as completed in local state
    const idx = decisions.findIndex(d => d.id === decision.id);
    if (idx !== -1) {
       decisions[idx] = { ...decisions[idx], status: 'completed' };
       // Re-trigger reactivity
       decisions = [...decisions];
    }
    
    // Check if we need to adjust index (since list of pending might shrink or shift)
    // Actually, if we filter pendingDecisions reactively, removing one will shift the array.
    // If we mark as completed, it disappears from pendingDecisions.
    // So we don't strictly need to increment index, the next one will fall into slot 0 or current slot.
    // But let's stick to a simple flow:
    // If we filter, the array changes length. currentIndex might point to the next one automatically.
    // If we keep the index, we might go out of bounds.
    if (currentIndex >= pendingDecisions.length) {
       currentIndex = Math.max(0, pendingDecisions.length - 1);
    }
  }

  function handleSkip() {
    showToast('Skipped', 'info');
    if (currentIndex < pendingDecisions.length - 1) {
       currentIndex++;
    } else {
       // Loop back to start if at end
       currentIndex = 0;
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') { goto('/'); return; }
    
    // Most keyboard shortcuts are handled inside DecisionCard or native inputs
    // But we can add global navigation
    if (event.target.tagName === 'BODY') {
       if (event.key === 'ArrowRight') handleSkip();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col">
  <!-- Minimal header -->
  <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900 z-10">
    <button
      on:click={() => goto('/')}
      class="text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-2"
    >
      <span>← Exit Focus Mode</span>
    </button>

    <div class="flex items-center gap-4">
      <!-- Progress bar -->
      <div class="flex items-center gap-3">
        <div class="w-48 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-amber-500 transition-all duration-300"
            style="width: {totalCount > 0 ? ((totalCount - pendingDecisions.length + (currentDecision ? 0 : 1)) / mockDecisions.length) * 100 : 100}%"
          ></div>
        </div>
        <span class="text-zinc-400 text-sm font-medium">
          {pendingDecisions.length} remaining
        </span>
      </div>
    </div>

    <div class="text-zinc-500 text-sm">
      <kbd class="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">Esc</kbd> to exit
    </div>
  </div>

  <!-- Main content area -->
  <div class="flex-1 overflow-y-auto flex items-center justify-center p-4">
    {#if currentDecision}
      <div class="w-full max-w-4xl animate-fade-in">
         <DecisionCard 
            decision={currentDecision} 
            on:action={handleCardAction} 
            on:skip={handleSkip} 
         />
      </div>
    {:else}
      <div class="text-center animate-fade-in">
        <div class="text-6xl mb-4">🎉</div>
        <div class="text-2xl font-bold text-white mb-2">All Clear!</div>
        <p class="text-zinc-400 text-lg mb-8">You've processed all pending decisions.</p>
        <a
          href="/"
          class="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-white font-medium transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    {/if}
  </div>
</div>

<!-- Toast Notifications -->
<div class="fixed top-20 left-1/2 -translate-x-1/2 z-50 space-y-2">
  {#each toasts as toast (toast.id)}
    <div
      class="px-6 py-3 rounded-xl shadow-lg text-base font-medium animate-slide-down
             {toast.type === 'success' ? 'bg-green-600 text-white' : 
              toast.type === 'info' ? 'bg-zinc-700 text-white' : 'bg-red-600 text-white'}"
    >
      {toast.message}
    </div>
  {/each}
</div>

<style>
  @keyframes slide-down {
    from { opacity: 0; transform: translate(-50%, -20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
  
  @keyframes fade-in {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }

  :global(.animate-slide-down) {
    animation: slide-down 0.2s ease-out forwards;
  }
  
  :global(.animate-fade-in) {
    animation: fade-in 0.3s ease-out forwards;
  }
</style>