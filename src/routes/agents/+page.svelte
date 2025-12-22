<script>
  import { onMount } from 'svelte';
  
  // Mock Agent Data
  let agents = [
    { 
      id: 'a1', 
      name: 'TriageWorker', 
      role: 'In-Basket Processor', 
      status: 'idle', 
      currentTask: 'Waiting for new items...', 
      lastActive: '2m ago',
      logs: ['Checked inbox (0 new)', 'Processed "Invoice.pdf"', 'Sleeping...']
    },
    { 
      id: 'a2', 
      name: 'ContextEnricher', 
      role: 'Knowledge Graph Linker', 
      status: 'running', 
      currentTask: 'Analyzing "Q1 Report" context', 
      lastActive: 'Now',
      progress: 45,
      logs: ['Found related project "Q1 Planning"', 'Retrieving meeting notes...', 'Linking entities...']
    },
    { 
      id: 'a3', 
      name: 'MetricExtractor', 
      role: 'Data Miner', 
      status: 'error', 
      currentTask: 'Failed to parse CSV', 
      lastActive: '5m ago',
      logs: ['Reading "sales_data.csv"', 'Error: Malformed header row', 'Retrying...', 'Failed.']
    },
    { 
      id: 'a4', 
      name: 'Scribe', 
      role: 'Documentation Agent', 
      status: 'running', 
      currentTask: 'Updating API docs', 
      lastActive: 'Now',
      progress: 78,
      logs: ['Parsed source code', 'Generating markdown...', 'Diffing changes...']
    }
  ];

  // Simulate live updates
  onMount(() => {
    const interval = setInterval(() => {
      agents = agents.map(agent => {
        if (agent.status === 'running') {
          // Update progress
          const newProgress = (agent.progress || 0) + Math.floor(Math.random() * 5);
          if (newProgress >= 100) {
             return { ...agent, status: 'idle', progress: 0, currentTask: 'Waiting...' };
          }
          return { ...agent, progress: newProgress };
        }
        // Randomly start idle agents
        if (agent.status === 'idle' && Math.random() > 0.9) {
           return { ...agent, status: 'running', progress: 0, currentTask: 'Processing new job...' };
        }
        return agent;
      });
    }, 1000);

    return () => clearInterval(interval);
  });

  function getStatusColor(status) {
    switch (status) {
      case 'running': return 'text-green-400 border-green-500/50 bg-green-900/20';
      case 'idle': return 'text-zinc-400 border-zinc-700 bg-zinc-800/50';
      case 'error': return 'text-red-400 border-red-500/50 bg-red-900/20';
      default: return 'text-zinc-400';
    }
  }
</script>

<div class="min-h-screen bg-zinc-900 text-zinc-100 p-8 font-sans">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">System Agents</h1>
        <p class="text-zinc-400 mt-1">Real-time status of background workers</p>
      </div>
      <a href="/" class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors">
        Back to Queue
      </a>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each agents as agent (agent.id)}
        <div class="rounded-xl border p-5 flex flex-col h-64 transition-all {getStatusColor(agent.status)} border-opacity-50">
          
          <!-- Header -->
          <div class="flex justify-between items-start mb-4">
            <div>
              <div class="font-bold text-lg">{agent.name}</div>
              <div class="text-xs opacity-70 uppercase tracking-wide">{agent.role}</div>
            </div>
            <div class="flex items-center gap-2">
              {#if agent.status === 'running'}
                <span class="relative flex h-3 w-3">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              {/if}
              <span class="text-xs font-mono uppercase px-2 py-0.5 rounded bg-black/20 border border-black/10">
                {agent.status}
              </span>
            </div>
          </div>

          <!-- Current Task -->
          <div class="mb-auto">
            <div class="text-sm opacity-90 truncate font-medium">{agent.currentTask}</div>
            <div class="text-xs opacity-60 mt-1">Last active: {agent.lastActive}</div>
            
            {#if agent.status === 'running'}
              <div class="mt-3 h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-current transition-all duration-500" 
                  style="width: {agent.progress}%"
                ></div>
              </div>
            {/if}
          </div>

          <!-- Logs Preview -->
          <div class="mt-4 pt-4 border-t border-black/10 text-xs font-mono opacity-80 space-y-1">
            {#each agent.logs.slice(-2) as log}
              <div class="truncate">> {log}</div>
            {/each}
          </div>

        </div>
      {/each}
    </div>
  </div>
</div>
