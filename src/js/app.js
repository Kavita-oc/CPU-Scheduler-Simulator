/**
 * CPU Scheduling Simulator UI Application Logic
 * Binds UI inputs, calls CPUScheduler engine, renders Gantt charts, tables, comparison, & stepper.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Element References
  const processTableBody = document.getElementById('processTableBody');
  const addProcessBtn = document.getElementById('addProcessBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const sampleDataSelect = document.getElementById('sampleDataSelect');
  const timeQuantumInput = document.getElementById('timeQuantumInput');
  const runSimulationBtn = document.getElementById('runSimulationBtn');
  const resetSimulationBtn = document.getElementById('resetSimulationBtn');
  const errorAlert = document.getElementById('errorAlert');
  const errorList = document.getElementById('errorList');
  const closeErrorBtn = document.getElementById('closeErrorBtn');
  const resultsWrapper = document.getElementById('resultsWrapper');
  const comparisonTableBody = document.getElementById('comparisonTableBody');
  const visualComparisonChart = document.getElementById('visualComparisonChart');
  const recommendationBanner = document.getElementById('recommendationBanner');
  const tabContentContainer = document.getElementById('tabContentContainer');
  const algorithmTabs = document.getElementById('algorithmTabs');

  // Stepper Elements
  const stepperAlgSelect = document.getElementById('stepperAlgSelect');
  const timeStepSlider = document.getElementById('timeStepSlider');
  const timeStepLabel = document.getElementById('timeStepLabel');
  const prevTimeStepBtn = document.getElementById('prevTimeStepBtn');
  const nextTimeStepBtn = document.getElementById('nextTimeStepBtn');
  const playTimeStepBtn = document.getElementById('playTimeStepBtn');
  const readyQueueBox = document.getElementById('readyQueueBox');
  const runningCPUBox = document.getElementById('runningCPUBox');
  const completedQueueBox = document.getElementById('completedQueueBox');

  // State Variables
  let processCounter = 0;
  let currentSimulationData = null;
  let animationInterval = null;

  // Preset Datasets
  const presets = {
    tc1: [
      { id: 'P1', arrivalTime: 0, burstTime: 24, priority: 3 },
      { id: 'P2', arrivalTime: 0, burstTime: 3, priority: 1 },
      { id: 'P3', arrivalTime: 0, burstTime: 3, priority: 2 }
    ],
    tc2: [
      { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 2 },
      { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 9, priority: 3 },
      { id: 'P4', arrivalTime: 3, burstTime: 5, priority: 4 }
    ],
    tc3: [
      { id: 'P1', arrivalTime: 2, burstTime: 3, priority: 1 },
      { id: 'P2', arrivalTime: 8, burstTime: 4, priority: 2 }
    ],
    tc4: [
      { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 1 },
      { id: 'P2', arrivalTime: 0, burstTime: 5, priority: 1 }
    ],
    tc6: [
      { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 1 },
      { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 1, priority: 1 }
    ],
    tc7: [
      { id: 'P1', arrivalTime: 0, burstTime: 7, priority: 1 },
      { id: 'P2', arrivalTime: 3, burstTime: 2, priority: 1 }
    ],
    tc8: [
      { id: 'P1', arrivalTime: 5, burstTime: 10, priority: 1 }
    ]
  };

  /**
   * Color Mapping Helper for Process IDs
   */
  const processColorClasses = ['p-color-1', 'p-color-2', 'p-color-3', 'p-color-4', 'p-color-5', 'p-color-6', 'p-color-7', 'p-color-8'];
  const processColorMap = {};

  function getProcessColorClass(pid) {
    if (pid === 'IDLE') return 'p-color-idle';
    if (!processColorMap[pid]) {
      const idx = Object.keys(processColorMap).length % processColorClasses.length;
      processColorMap[pid] = processColorClasses[idx];
    }
    return processColorMap[pid];
  }

  /**
   * Helper: Add a row to the input process table
   */
  function addProcessRow(data = {}) {
    processCounter++;
    const pid = data.id || `P${processCounter}`;
    const at = data.arrivalTime !== undefined ? data.arrivalTime : 0;
    const bt = data.burstTime !== undefined ? data.burstTime : 5;
    const prio = data.priority !== undefined ? data.priority : 1;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="form-control p-id-input" value="${pid}"></td>
      <td><input type="number" class="form-control p-at-input" value="${at}" min="0" step="1"></td>
      <td><input type="number" class="form-control p-bt-input" value="${bt}" min="1" step="1"></td>
      <td><input type="number" class="form-control p-prio-input" value="${prio}" min="0" step="1"></td>
      <td><button class="btn btn-danger-sm delete-row-btn">&times; Delete</button></td>
    `;

    tr.querySelector('.delete-row-btn').addEventListener('click', () => {
      tr.remove();
    });

    processTableBody.appendChild(tr);
  }

  /**
   * Load Default Sample Data (TC2)
   */
  function loadPreset(key) {
    processTableBody.innerHTML = '';
    processCounter = 0;
    const list = presets[key] || presets.tc2;
    list.forEach(p => addProcessRow(p));
    if (key === 'tc6') {
      timeQuantumInput.value = 2;
    } else if (key === 'tc7') {
      timeQuantumInput.value = 3;
    }
  }

  /**
   * Read processes from input table
   */
  function getProcessesFromTable() {
    const rows = processTableBody.querySelectorAll('tr');
    const processes = [];
    rows.forEach(row => {
      const id = row.querySelector('.p-id-input').value;
      const arrivalTime = row.querySelector('.p-at-input').value;
      const burstTime = row.querySelector('.p-bt-input').value;
      const priority = row.querySelector('.p-prio-input').value;
      processes.push({ id, arrivalTime, burstTime, priority });
    });
    return processes;
  }

  /**
   * Error Display Helper
   */
  function showErrorAlert(errors) {
    errorList.innerHTML = '';
    errors.forEach(err => {
      const li = document.createElement('li');
      li.textContent = err;
      errorList.appendChild(li);
    });
    errorAlert.classList.remove('hidden');
    resultsWrapper.classList.add('hidden');
  }

  function hideErrorAlert() {
    errorAlert.classList.add('hidden');
    errorList.innerHTML = '';
  }

  /**
   * Main Simulation Execution Trigger
   */
  function handleRunSimulation() {
    hideErrorAlert();
    const processes = getProcessesFromTable();
    const tq = timeQuantumInput.value;

    const simResult = CPUScheduler.runAllSimulations(processes, tq);

    if (!simResult.success) {
      showErrorAlert(simResult.errors);
      return;
    }

    currentSimulationData = simResult;
    resultsWrapper.classList.remove('hidden');

    renderComparisonSection(simResult);
    renderAlgorithmPanes(simResult.results);
    initStepper(simResult.results);

    // Scroll smoothly to results
    resultsWrapper.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Render Comparison Section & Recommendation
   */
  function renderComparisonSection(simResult) {
    const { results, comparison } = simResult;
    const algKeys = ['FCFS', 'SJF', 'Priority', 'RoundRobin'];
    
    // Populate Comparison Table
    comparisonTableBody.innerHTML = '';
    algKeys.forEach(key => {
      const res = results[key];
      const tr = document.createElement('tr');
      const isBestWT = comparison.bestWTAlgorithms.includes(res.algorithmName);
      const isBestTAT = comparison.bestTATAlgorithms.includes(res.algorithmName);

      let statusBadge = '';
      if (isBestWT && isBestTAT) {
        statusBadge = '<span class="badge badge-offline">🏆 Best Overall</span>';
      } else if (isBestWT) {
        statusBadge = '<span class="badge badge-tech">⚡ Min Waiting Time</span>';
      } else if (isBestTAT) {
        statusBadge = '<span class="badge badge-status">⚡ Min Turnaround Time</span>';
      } else {
        statusBadge = '<span style="color: var(--text-muted); font-size:12px;">Standard</span>';
      }

      const execModel = key === 'RoundRobin' ? 'Preemptive' : 'Non-Preemptive';

      tr.innerHTML = `
        <td><strong>${res.algorithmName}</strong></td>
        <td>${execModel}</td>
        <td><strong>${res.avgWaitingTime}</strong> units</td>
        <td><strong>${res.avgTurnaroundTime}</strong> units</td>
        <td>${statusBadge}</td>
      `;
      comparisonTableBody.appendChild(tr);
    });

    // Populate Visual Comparison Bar Chart
    visualComparisonChart.innerHTML = '';

    // Find max value for scaling chart bars
    let maxVal = 0;
    algKeys.forEach(k => {
      maxVal = Math.max(maxVal, results[k].avgWaitingTime, results[k].avgTurnaroundTime);
    });
    if (maxVal === 0) maxVal = 1;

    algKeys.forEach(key => {
      const res = results[key];
      const wtHeight = Math.max((res.avgWaitingTime / maxVal) * 120, 10);
      const tatHeight = Math.max((res.avgTurnaroundTime / maxVal) * 120, 10);

      const group = document.createElement('div');
      group.className = 'bar-group';
      group.innerHTML = `
        <div class="bars-pair">
          <div class="bar bar-wt" style="height: ${wtHeight}px;">
            <span class="bar-val">${res.avgWaitingTime}</span>
          </div>
          <div class="bar bar-tat" style="height: ${tatHeight}px;">
            <span class="bar-val">${res.avgTurnaroundTime}</span>
          </div>
        </div>
        <span class="bar-label">${key}</span>
      `;
      visualComparisonChart.appendChild(group);
    });

    // Append Chart Legend
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    legend.style.gridColumn = '1 / -1';
    legend.innerHTML = `
      <div class="legend-item"><div class="legend-box" style="background: var(--secondary-color)"></div> Avg Waiting Time (WT)</div>
      <div class="legend-item"><div class="legend-box" style="background: var(--primary-color)"></div> Avg Turnaround Time (TAT)</div>
    `;
    visualComparisonChart.appendChild(legend);

    const bestWTStr = comparison.bestWTAlgorithms.join(', ');
const bestTATStr = comparison.bestTATAlgorithms.join(', ');

const recommendationText = bestWTStr === bestTATStr
  ? `<strong>${bestWTStr}</strong> achieved the lowest Average Waiting Time (<strong>${comparison.minAvgWT} units</strong>) and Average Turnaround Time (<strong>${comparison.minAvgTAT} units</strong>) for this workload.`
  : `<strong>${bestWTStr}</strong> achieved the lowest Average Waiting Time (<strong>${comparison.minAvgWT} units</strong>), while <strong>${bestTATStr}</strong> achieved the lowest Average Turnaround Time (<strong>${comparison.minAvgTAT} units</strong>).`;

recommendationBanner.innerHTML = `
  <h3>💡 Performance Recommendation & Analysis</h3>
  <p>
    ${recommendationText}
  </p>
  <p style="font-size: 13px; margin-top: 6px; opacity: 0.9;">
    <em>Note: Operating System theory dictates that no single scheduling algorithm is universally "best". 
    SJF minimizes average waiting time for batch jobs, Round Robin provides fair CPU access for interactive environments, 
    and Priority Scheduling favors critical processes.</em>
  </p>
`;
  }

  /**
   * Render Detailed Tabs for FCFS, SJF, Priority, Round Robin
   */
  function renderAlgorithmPanes(results) {
    const algKeys = ['FCFS', 'SJF', 'Priority', 'RoundRobin'];

    algKeys.forEach(key => {
      const pane = document.getElementById(`pane-${key}`);
      const data = results[key];

      pane.innerHTML = `
        <div class="gantt-container">
          <div class="gantt-title">📍 Gantt Chart Execution Timeline (${data.algorithmName})</div>
          <div class="gantt-bar-wrapper">
            ${createGanttChartHTML(data.ganttChart)}
          </div>
        </div>

        <div class="table-wrapper" style="margin-top: 20px;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Process ID</th>
                <th>Arrival Time</th>
                <th>Burst Time</th>
                <th>Priority</th>
                <th>Completion Time (CT)</th>
                <th>Turnaround Time (TAT)</th>
                <th>Waiting Time (WT)</th>
              </tr>
            </thead>
            <tbody>
              ${data.processResults.map(p => `
                <tr>
                  <td><strong style="color: #cbd5e1;">${p.id}</strong></td>
                  <td>${p.arrivalTime}</td>
                  <td>${p.burstTime}</td>
                  <td>${p.priority}</td>
                  <td><strong>${p.completionTime}</strong></td>
                  <td>${p.turnaroundTime}</td>
                  <td>${p.waitingTime}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-title">Average Waiting Time</span>
            <span class="metric-value">${data.avgWaitingTime} <small style="font-size:14px;">units</small></span>
          </div>
          <div class="metric-card">
            <span class="metric-title">Average Turnaround Time</span>
            <span class="metric-value">${data.avgTurnaroundTime} <small style="font-size:14px;">units</small></span>
          </div>
          <div class="metric-card">
            <span class="metric-title">Total Makespan / Completion</span>
            <span class="metric-value">${data.ganttChart.length > 0 ? data.ganttChart[data.ganttChart.length - 1].endTime : 0} <small style="font-size:14px;">units</small></span>
          </div>
        </div>
      `;
    });
  }

  /**
   * Helper: Generate HTML for Gantt Chart Timeline
   */
  function createGanttChartHTML(ganttBlocks) {
    if (!ganttBlocks || ganttBlocks.length === 0) return '<p>No timeline data.</p>';

    const totalDuration = ganttBlocks[ganttBlocks.length - 1].endTime;
    if (totalDuration === 0) return '<p>Total duration is 0.</p>';

    let blocksHTML = '<div class="gantt-timeline">';
    let ticksHTML = '<div class="gantt-ticks">';

    ganttBlocks.forEach((block, index) => {
      const widthPct = Math.max((block.duration / totalDuration) * 100, 3);
      const colorClass = getProcessColorClass(block.processId);

      blocksHTML += `
        <div class="gantt-block ${colorClass}" style="flex-grow: ${block.duration}; flex-basis: 0%; min-width: 40px;" title="${block.processId}: ${block.startTime} ➔ ${block.endTime} (Duration: ${block.duration})">
          <span class="pid">${block.processId}</span>
          <span class="duration">${block.duration}u</span>
        </div>
      `;
    });
    blocksHTML += '</div>';

    // Ticks calculation
    ganttBlocks.forEach((block, index) => {
      const leftPct = (block.startTime / totalDuration) * 100;
      ticksHTML += `<span class="gantt-tick" style="left: ${leftPct}%;">${block.startTime}</span>`;

      if (index === ganttBlocks.length - 1) {
        ticksHTML += `<span class="gantt-tick" style="left: 100%;">${block.endTime}</span>`;
      }
    });
    ticksHTML += '</div>';

    return blocksHTML + ticksHTML;
  }

  /**
   * Tab Switching Logic
   */
  algorithmTabs.addEventListener('click', (e) => {
    if (!e.target.classList.contains('tab-btn')) return;

    const tabKey = e.target.getAttribute('data-tab');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    e.target.classList.add('active');
    document.getElementById(`pane-${tabKey}`).classList.add('active');
  });

  /**
   * INNOVATION FEATURE: Process State & Timeline Stepper Logic
   */
  function initStepper(simResults) {
    const selectedAlg = stepperAlgSelect.value;
    const simData = simResults[selectedAlg];
    if (!simData || !simData.ganttChart.length) return;

    const maxTime = simData.ganttChart[simData.ganttChart.length - 1].endTime;
    timeStepSlider.max = maxTime;
    timeStepSlider.value = 0;

    updateTimeStepView(simData, 0);
  }

  function updateTimeStepView(simData, t) {
    timeStepLabel.textContent = `t = ${t}`;

    const gantt = simData.ganttChart;
    const processResults = simData.processResults;

    // Find currently running block at time t
    let runningBlock = null;
    gantt.forEach(b => {
      if (t >= b.startTime && t < b.endTime) {
        runningBlock = b;
      }
    });

    // Special case for end time t == maxTime
    if (!runningBlock && t === gantt[gantt.length - 1].endTime) {
      runningBlock = null;
    }

    const readyPids = [];
    const completedPids = [];
    let runningPid = runningBlock ? runningBlock.processId : (t === gantt[gantt.length - 1].endTime ? 'None' : 'IDLE');

    processResults.forEach(p => {
      if (t >= p.completionTime) {
        completedPids.push(p.id);
      } else if (p.arrivalTime <= t && p.id !== runningPid) {
        readyPids.push(p.id);
      }
    });

    // Update UI Elements
    readyQueueBox.innerHTML = readyPids.length > 0
      ? readyPids.map(pid => `<span class="p-chip ${getProcessColorClass(pid)}">${pid}</span>`).join('')
      : '<span class="empty-badge">Queue Empty</span>';

    runningCPUBox.innerHTML = (runningPid && runningPid !== 'IDLE' && runningPid !== 'None')
      ? `<span class="p-chip ${getProcessColorClass(runningPid)}" style="font-size:14px; padding: 8px 16px;">${runningPid} (Executing)</span>`
      : `<span class="empty-badge">${runningPid === 'IDLE' ? '⚡ CPU Idle' : 'Finished'}</span>`;

    completedQueueBox.innerHTML = completedPids.length > 0
      ? completedPids.map(pid => `<span class="p-chip ${getProcessColorClass(pid)}">${pid}</span>`).join('')
      : '<span class="empty-badge">None Completed Yet</span>';
  }

  // Stepper Event Listeners
  timeStepSlider.addEventListener('input', () => {
    if (!currentSimulationData) return;
    const simData = currentSimulationData.results[stepperAlgSelect.value];
    updateTimeStepView(simData, Number(timeStepSlider.value));
  });

  stepperAlgSelect.addEventListener('change', () => {
    if (!currentSimulationData) return;
    initStepper(currentSimulationData.results);
  });

  prevTimeStepBtn.addEventListener('click', () => {
    if (!currentSimulationData) return;
    let val = Math.max(Number(timeStepSlider.value) - 1, 0);
    timeStepSlider.value = val;
    updateTimeStepView(currentSimulationData.results[stepperAlgSelect.value], val);
  });

  nextTimeStepBtn.addEventListener('click', () => {
    if (!currentSimulationData) return;
    let max = Number(timeStepSlider.max);
    let val = Math.min(Number(timeStepSlider.value) + 1, max);
    timeStepSlider.value = val;
    updateTimeStepView(currentSimulationData.results[stepperAlgSelect.value], val);
  });

  playTimeStepBtn.addEventListener('click', () => {
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = null;
      playTimeStepBtn.textContent = '▶ Play Animation';
      return;
    }

    if (!currentSimulationData) return;
    playTimeStepBtn.textContent = '⏸ Pause';

    animationInterval = setInterval(() => {
      let max = Number(timeStepSlider.max);
      let val = Number(timeStepSlider.value);
      if (val >= max) {
        clearInterval(animationInterval);
        animationInterval = null;
        playTimeStepBtn.textContent = '▶ Play Animation';
        return;
      }
      val++;
      timeStepSlider.value = val;
      updateTimeStepView(currentSimulationData.results[stepperAlgSelect.value], val);
    }, 400);
  });

  // Event Listeners for Controls
  addProcessBtn.addEventListener('click', () => addProcessRow());
  clearAllBtn.addEventListener('click', () => {
    processTableBody.innerHTML = '';
    processCounter = 0;
  });
  sampleDataSelect.addEventListener('change', (e) => {
    if (e.target.value) loadPreset(e.target.value);
  });
  runSimulationBtn.addEventListener('click', handleRunSimulation);
  resetSimulationBtn.addEventListener('click', () => {
    loadPreset('tc2');
    timeQuantumInput.value = 2;
    hideErrorAlert();
    resultsWrapper.classList.add('hidden');
  });
  closeErrorBtn.addEventListener('click', hideErrorAlert);

  // Initialize Default Workload (TC2) on load
  loadPreset('tc2');
});
