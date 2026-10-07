/**
 * CPU Scheduling Algorithm Simulator Engine
 * Contains textbook implementations of FCFS, SJF, Non-Preemptive Priority, and Round Robin.
 * Fully decoupled from UI logic. Works in Node.js and Browser environments.
 */

(function (exports) {

  /**
   * Deep clones and normalizes an array of process objects.
   * Ensures process attributes are parsed as numbers.
   */
  function sanitizeProcesses(processes) {
    return processes.map(p => ({
      id: String(p.id).trim(),
      arrivalTime: Number(p.arrivalTime),
      burstTime: Number(p.burstTime),
      priority: Number(p.priority)
    }));
  }

  /**
   * Standard tie-breaker for process sorting or selection:
   * 1. Earlier arrival time
   * 2. Smaller process ID (numeric or string)
   */
  function processTieBreaker(a, b) {
    if (a.arrivalTime !== b.arrivalTime) {
      return a.arrivalTime - b.arrivalTime;
    }
    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
  }

  /**
   * 1. First-Come, First-Served (FCFS) Scheduling (Non-Preemptive)
   */
  function simulateFCFS(rawProcesses) {
    const processes = sanitizeProcesses(rawProcesses);
    // Sort processes primarily by Arrival Time, then Process ID
    processes.sort(processTieBreaker);

    let currentTime = 0;
    const ganttChart = [];
    const processResults = [];

    for (let p of processes) {
      if (currentTime < p.arrivalTime) {
        ganttChart.push({
          isIdle: true,
          processId: 'IDLE',
          startTime: currentTime,
          endTime: p.arrivalTime,
          duration: p.arrivalTime - currentTime
        });
        currentTime = p.arrivalTime;
      }

      const startTime = currentTime;
      const completionTime = startTime + p.burstTime;
      const turnaroundTime = completionTime - p.arrivalTime;
      const waitingTime = turnaroundTime - p.burstTime;

      ganttChart.push({
        isIdle: false,
        processId: p.id,
        startTime: startTime,
        endTime: completionTime,
        duration: p.burstTime
      });

      processResults.push({
        id: p.id,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        completionTime: completionTime,
        turnaroundTime: turnaroundTime,
        waitingTime: waitingTime
      });

      currentTime = completionTime;
    }

    return compileResult('FCFS', 'First Come, First Served', ganttChart, processResults);
  }

  /**
   * 2. Shortest Job First (SJF) Scheduling (Non-Preemptive)
   */
  function simulateSJF(rawProcesses) {
    const processes = sanitizeProcesses(rawProcesses);
    const n = processes.length;
    const completed = new Array(n).fill(false);

    let currentTime = 0;
    let completedCount = 0;
    const ganttChart = [];
    const processResultsMap = {};

    while (completedCount < n) {
      // Find all uncompleted processes that have arrived by currentTime
      let availableIndices = [];
      for (let i = 0; i < n; i++) {
        if (!completed[i] && processes[i].arrivalTime <= currentTime) {
          availableIndices.push(i);
        }
      }

      if (availableIndices.length === 0) {
        // CPU is idle. Advance currentTime to the next earliest arrival time.
        let nextArrival = Infinity;
        for (let i = 0; i < n; i++) {
          if (!completed[i] && processes[i].arrivalTime < nextArrival) {
            nextArrival = processes[i].arrivalTime;
          }
        }

        ganttChart.push({
          isIdle: true,
          processId: 'IDLE',
          startTime: currentTime,
          endTime: nextArrival,
          duration: nextArrival - currentTime
        });

        currentTime = nextArrival;
        continue;
      }

      // Pick process with minimum burstTime.
      // Tie-breakers: Earlier arrival time, then smaller process ID.
      availableIndices.sort((i1, i2) => {
        const p1 = processes[i1];
        const p2 = processes[i2];
        if (p1.burstTime !== p2.burstTime) {
          return p1.burstTime - p2.burstTime;
        }
        return processTieBreaker(p1, p2);
      });

      const selectedIdx = availableIndices[0];
      const p = processes[selectedIdx];

      const startTime = currentTime;
      const completionTime = startTime + p.burstTime;
      const turnaroundTime = completionTime - p.arrivalTime;
      const waitingTime = turnaroundTime - p.burstTime;

      ganttChart.push({
        isIdle: false,
        processId: p.id,
        startTime: startTime,
        endTime: completionTime,
        duration: p.burstTime
      });

      processResultsMap[p.id] = {
        id: p.id,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        completionTime: completionTime,
        turnaroundTime: turnaroundTime,
        waitingTime: waitingTime
      };

      completed[selectedIdx] = true;
      completedCount++;
      currentTime = completionTime;
    }

    // Preserve original input order in processResults
    const processResults = processes.map(p => processResultsMap[p.id]);
    return compileResult('SJF', 'Shortest Job First (Non-Preemptive)', ganttChart, processResults);
  }

  /**
   * 3. Priority Scheduling (Non-Preemptive)
   * Assumption: Lower priority number indicates higher priority.
   */
  function simulatePriority(rawProcesses) {
    const processes = sanitizeProcesses(rawProcesses);
    const n = processes.length;
    const completed = new Array(n).fill(false);

    let currentTime = 0;
    let completedCount = 0;
    const ganttChart = [];
    const processResultsMap = {};

    while (completedCount < n) {
      // Find all uncompleted processes that have arrived by currentTime
      let availableIndices = [];
      for (let i = 0; i < n; i++) {
        if (!completed[i] && processes[i].arrivalTime <= currentTime) {
          availableIndices.push(i);
        }
      }

      if (availableIndices.length === 0) {
        // CPU is idle
        let nextArrival = Infinity;
        for (let i = 0; i < n; i++) {
          if (!completed[i] && processes[i].arrivalTime < nextArrival) {
            nextArrival = processes[i].arrivalTime;
          }
        }

        ganttChart.push({
          isIdle: true,
          processId: 'IDLE',
          startTime: currentTime,
          endTime: nextArrival,
          duration: nextArrival - currentTime
        });

        currentTime = nextArrival;
        continue;
      }

      // Pick process with lowest priority number (highest priority).
      // Tie-breakers: Earlier arrival time, then smaller process ID.
      availableIndices.sort((i1, i2) => {
        const p1 = processes[i1];
        const p2 = processes[i2];
        if (p1.priority !== p2.priority) {
          return p1.priority - p2.priority;
        }
        return processTieBreaker(p1, p2);
      });

      const selectedIdx = availableIndices[0];
      const p = processes[selectedIdx];

      const startTime = currentTime;
      const completionTime = startTime + p.burstTime;
      const turnaroundTime = completionTime - p.arrivalTime;
      const waitingTime = turnaroundTime - p.burstTime;

      ganttChart.push({
        isIdle: false,
        processId: p.id,
        startTime: startTime,
        endTime: completionTime,
        duration: p.burstTime
      });

      processResultsMap[p.id] = {
        id: p.id,
        arrivalTime: p.arrivalTime,
        burstTime: p.burstTime,
        priority: p.priority,
        completionTime: completionTime,
        turnaroundTime: turnaroundTime,
        waitingTime: waitingTime
      };

      completed[selectedIdx] = true;
      completedCount++;
      currentTime = completionTime;
    }

    const processResults = processes.map(p => processResultsMap[p.id]);
    return compileResult('Priority', 'Priority Scheduling (Non-Preemptive)', ganttChart, processResults);
  }

  /**
   * 4. Round Robin (RR) Scheduling (Preemptive)
   * Handled with standard FIFO Ready Queue and strict arrival enqueue order.
   */
  function simulateRoundRobin(rawProcesses, timeQuantum) {
    const processes = sanitizeProcesses(rawProcesses);
    const tq = Number(timeQuantum);

    if (isNaN(tq) || tq <= 0) {
      throw new Error('Time Quantum must be a positive number greater than 0.');
    }

    // Sort processes by arrival time initially for predictable arrival queueing
    const sortedList = [...processes].sort(processTieBreaker);
    const n = sortedList.length;

    const remainingTime = {};
    const processMap = {};
    const enqueued = {};

    sortedList.forEach(p => {
      remainingTime[p.id] = p.burstTime;
      processMap[p.id] = p;
      enqueued[p.id] = false;
    });

    let currentTime = 0;
    let completedCount = 0;
    const readyQueue = [];
    const ganttChart = [];
    const processResultsMap = {};

    // Helper: Enqueue processes that arrived at or before currentTime
    function checkNewArrivals(atTime) {
      for (let p of sortedList) {
        if (!enqueued[p.id] && p.arrivalTime <= atTime) {
          readyQueue.push(p.id);
          enqueued[p.id] = true;
        }
      }
    }

    // Initial check for time t = 0 (or start)
    checkNewArrivals(currentTime);

    while (completedCount < n) {
      if (readyQueue.length === 0) {
        // Find next process arrival
        let nextArrival = Infinity;
        for (let p of sortedList) {
          if (!enqueued[p.id] && p.arrivalTime < nextArrival) {
            nextArrival = p.arrivalTime;
          }
        }

        if (nextArrival !== Infinity) {
          ganttChart.push({
            isIdle: true,
            processId: 'IDLE',
            startTime: currentTime,
            endTime: nextArrival,
            duration: nextArrival - currentTime
          });
          currentTime = nextArrival;
          checkNewArrivals(currentTime);
        } else {
          break; // Safety exit
        }
      }

      const pid = readyQueue.shift();
      const p = processMap[pid];
      const execTime = Math.min(remainingTime[pid], tq);
      const startTime = currentTime;
      const endTime = startTime + execTime;

      ganttChart.push({
        isIdle: false,
        processId: pid,
        startTime: startTime,
        endTime: endTime,
        duration: execTime
      });

      remainingTime[pid] -= execTime;
      currentTime = endTime;

      // Crucial: Enqueue new arrivals that occurred up to currentTime BEFORE re-enqueuing pid
      checkNewArrivals(currentTime);

      if (remainingTime[pid] > 0) {
        readyQueue.push(pid);
      } else {
        completedCount++;
        const completionTime = currentTime;
        const turnaroundTime = completionTime - p.arrivalTime;
        const waitingTime = turnaroundTime - p.burstTime;

        processResultsMap[pid] = {
          id: p.id,
          arrivalTime: p.arrivalTime,
          burstTime: p.burstTime,
          priority: p.priority,
          completionTime: completionTime,
          turnaroundTime: turnaroundTime,
          waitingTime: waitingTime
        };
      }
    }

    const processResults = processes.map(p => processResultsMap[p.id]);
    return compileResult('RoundRobin', `Round Robin (Quantum = ${tq})`, ganttChart, processResults);
  }

  /**
   * Helper function to aggregate results and compute average WT and TAT
   */
  function compileResult(algorithmKey, algorithmName, ganttChart, processResults) {
    const totalWT = processResults.reduce((sum, p) => sum + p.waitingTime, 0);
    const totalTAT = processResults.reduce((sum, p) => sum + p.turnaroundTime, 0);
    const count = processResults.length;

    const avgWaitingTime = count > 0 ? Number((totalWT / count).toFixed(2)) : 0;
    const avgTurnaroundTime = count > 0 ? Number((totalTAT / count).toFixed(2)) : 0;

    return {
      algorithmKey: algorithmKey,
      algorithmName: algorithmName,
      ganttChart: ganttChart,
      processResults: processResults,
      avgWaitingTime: avgWaitingTime,
      avgTurnaroundTime: avgTurnaroundTime,
      totalWaitingTime: totalWT,
      totalTurnaroundTime: totalTAT
    };
  }

  /**
   * Performs all 4 algorithm simulations on the process dataset.
   */
  function runAllSimulations(processes, timeQuantum) {
    const errors = validateInput(processes, timeQuantum);
    if (errors.length > 0) {
      return { success: false, errors: errors };
    }

    const fcfs = simulateFCFS(processes);
    const sjf = simulateSJF(processes);
    const priority = simulatePriority(processes);
    const rr = simulateRoundRobin(processes, timeQuantum);

    const results = [fcfs, sjf, priority, rr];

    // Determine best performing algorithms
    let minWT = Infinity;
    let minTAT = Infinity;

    results.forEach(r => {
      if (r.avgWaitingTime < minWT) minWT = r.avgWaitingTime;
      if (r.avgTurnaroundTime < minTAT) minTAT = r.avgTurnaroundTime;
    });

    const bestWTAlgs = results.filter(r => r.avgWaitingTime === minWT).map(r => r.algorithmName);
    const bestTATAlgs = results.filter(r => r.avgTurnaroundTime === minTAT).map(r => r.algorithmName);

    return {
      success: true,
      results: {
        FCFS: fcfs,
        SJF: sjf,
        Priority: priority,
        RoundRobin: rr
      },
      comparison: {
        minAvgWT: minWT,
        minAvgTAT: minTAT,
        bestWTAlgorithms: bestWTAlgs,
        bestTATAlgorithms: bestTATAlgs
      }
    };
  }

  /**
   * Input validation utility
   */
  function validateInput(processes, timeQuantum) {
    const errors = [];

    if (!Array.isArray(processes) || processes.length === 0) {
      errors.push('At least one process is required.');
      return errors;
    }

    const idSet = new Set();

    processes.forEach((p, index) => {
      const rowNum = index + 1;
      const pid = String(p.id || '').trim();

      if (!pid) {
        errors.push(`Row ${rowNum}: Process ID cannot be empty.`);
      } else if (idSet.has(pid)) {
        errors.push(`Row ${rowNum}: Duplicate Process ID '${pid}' detected.`);
      } else {
        idSet.add(pid);
      }

      const at = Number(p.arrivalTime);
      if (isNaN(at) || at < 0) {
        errors.push(`Process '${pid || rowNum}': Arrival Time must be a non-negative number (>= 0).`);
      }

      const bt = Number(p.burstTime);
      if (isNaN(bt) || bt <= 0) {
        errors.push(`Process '${pid || rowNum}': Burst Time must be a positive number (> 0).`);
      }

      const priority = Number(p.priority);
      if (isNaN(priority) || priority < 0) {
        errors.push(`Process '${pid || rowNum}': Priority must be a valid non-negative number.`);
      }
    });

    const tq = Number(timeQuantum);
    if (isNaN(tq) || tq <= 0) {
      errors.push('Round Robin Time Quantum must be a positive number greater than 0.');
    }

    return errors;
  }

  // Export module methods
  exports.simulateFCFS = simulateFCFS;
  exports.simulateSJF = simulateSJF;
  exports.simulatePriority = simulatePriority;
  exports.simulateRoundRobin = simulateRoundRobin;
  exports.runAllSimulations = runAllSimulations;
  exports.validateInput = validateInput;

})(typeof exports === 'undefined' ? (window.CPUScheduler = {}) : exports);
