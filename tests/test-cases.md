# CPU Scheduling Simulator - Test Cases Documentation

This document contains hand-verified test cases for First-Come First-Served (FCFS), Shortest Job First (SJF Non-Preemptive), Priority Scheduling (Non-Preemptive), and Round Robin (RR) algorithms.

---

## 📌 Scheduling Assumptions & Formulas

- **FCFS**: Non-preemptive. Sorted by Arrival Time ($AT$), then Process ID.
- **SJF**: Non-preemptive. Selects arrived process with smallest Burst Time ($BT$).
- **Priority**: Non-preemptive. Selects arrived process with smallest Priority Number (lower number = higher priority).
- **Round Robin**: Preemptive. Executes in time slices of Time Quantum ($TQ$). Processes arriving during execution are enqueued before re-enqueuing the current process.
- **CPU Idle**: When no process is available, CPU remains idle until the next arrival.
- **Formulas**:
  - $\text{Turnaround Time (TAT)} = \text{Completion Time (CT)} - \text{Arrival Time (AT)}$
  - $\text{Waiting Time (WT)} = \text{Turnaround Time (TAT)} - \text{Burst Time (BT)}$
  - $\text{Average WT} = \frac{\sum WT}{N}$
  - $\text{Average TAT} = \frac{\sum TAT}{N}$

---

## 🧪 Test Case 1: All Processes Arriving at Time 0

### Input Data
| Process ID | Arrival Time | Burst Time | Priority |
| :--- | :--- | :--- | :--- |
| P1 | 0 | 24 | 3 |
| P2 | 0 | 3 | 1 |
| P3 | 0 | 3 | 2 |

### Expected Results

#### 1. FCFS (Execution Order: P1 -> P2 -> P3)
- **P1**: CT = 24, TAT = 24, WT = 0
- **P2**: CT = 27, TAT = 27, WT = 24
- **P3**: CT = 30, TAT = 30, WT = 27
- **Avg WT**: 17.00 | **Avg TAT**: 27.00

#### 2. SJF (Execution Order: P2 -> P3 -> P1)
- **P2**: CT = 3, TAT = 3, WT = 0
- **P3**: CT = 6, TAT = 6, WT = 3
- **P1**: CT = 30, TAT = 30, WT = 6
- **Avg WT**: 3.00 | **Avg TAT**: 13.00

---

## 🧪 Test Case 2: Different Arrival Times

### Input Data
| Process ID | Arrival Time | Burst Time | Priority |
| :--- | :--- | :--- | :--- |
| P1 | 0 | 8 | 2 |
| P2 | 1 | 4 | 1 |
| P3 | 2 | 9 | 3 |
| P4 | 3 | 5 | 4 |

### Expected Results

#### 1. FCFS (Execution Order: P1 -> P2 -> P3 -> P4)
- **P1**: CT = 8, TAT = 8, WT = 0
- **P2**: CT = 12, TAT = 11, WT = 7
- **P3**: CT = 21, TAT = 19, WT = 10
- **P4**: CT = 26, TAT = 23, WT = 18
- **Avg WT**: 8.75 | **Avg TAT**: 15.25

#### 2. SJF Non-Preemptive (Execution Order: P1 -> P2 -> P4 -> P3)
- **t = 0..8**: P1 executes.
- **t = 8**: Available P2(BT=4), P3(BT=9), P4(BT=5). P2 selected.
- **t = 8..12**: P2 executes.
- **t = 12**: Available P4(BT=5), P3(BT=9). P4 selected.
- **t = 12..17**: P4 executes.
- **t = 17..26**: P3 executes.
- **Avg WT**: 6.50 | **Avg TAT**: 13.00

---

## 🧪 Test Case 3: CPU Idle Time Handling

### Input Data
| Process ID | Arrival Time | Burst Time | Priority |
| :--- | :--- | :--- | :--- |
| P1 | 2 | 3 | 1 |
| P2 | 8 | 4 | 2 |

### Expected Results (All Algorithms)
- **t = 0..2**: CPU IDLE (Duration = 2)
- **t = 2..5**: P1 executes (CT = 5, TAT = 3, WT = 0)
- **t = 5..8**: CPU IDLE (Duration = 3)
- **t = 8..12**: P2 executes (CT = 12, TAT = 4, WT = 0)
- **Avg WT**: 0.00 | **Avg TAT**: 3.50

---

## 🧪 Test Case 6: Round Robin with Multiple Rotations (Time Quantum = 2)

### Input Data
| Process ID | Arrival Time | Burst Time | Priority |
| :--- | :--- | :--- | :--- |
| P1 | 0 | 5 | 1 |
| P2 | 1 | 3 | 1 |
| P3 | 2 | 1 | 1 |

### Step-by-Step Queue Trace (TQ = 2)
1. **t = 0**: P1 arrives. Queue = `[P1]`.
2. **t = 0..2**: P1 runs for 2s (rem = 3). At t=1 P2 arrives, at t=2 P3 arrives. Queue after arrivals = `[P2, P3]`. Re-enqueue P1: Queue = `[P2, P3, P1]`.
3. **t = 2..4**: P2 runs for 2s (rem = 1). Queue after = `[P3, P1, P2]`.
4. **t = 4..5**: P3 runs for 1s (rem = 0, Completed at t=5). Queue after = `[P1, P2]`.
5. **t = 5..7**: P1 runs for 2s (rem = 1). Queue after = `[P2, P1]`.
6. **t = 7..8**: P2 runs for 1s (rem = 0, Completed at t=8). Queue after = `[P1]`.
7. **t = 8..9**: P1 runs for 1s (rem = 0, Completed at t=9). Queue empty.

### Metrics
- **P1**: CT = 9, TAT = 9, WT = 4
- **P2**: CT = 8, TAT = 7, WT = 4
- **P3**: CT = 5, TAT = 3, WT = 2
- **Avg WT**: 3.33 | **Avg TAT**: 6.33

---

## 🧪 Test Case 7: Process Arriving During Execution

### Input Data (Time Quantum = 3)
| Process ID | Arrival Time | Burst Time | Priority |
| :--- | :--- | :--- | :--- |
| P1 | 0 | 7 | 1 |
| P2 | 3 | 2 | 1 |

### Step-by-Step Queue Trace (TQ = 3)
1. **t = 0..3**: P1 runs (rem = 4). At t=3, P2 arrives. Queue = `[P2]`. Re-enqueue P1: Queue = `[P2, P1]`.
2. **t = 3..5**: P2 runs (rem = 0, Completed at t=5). Queue = `[P1]`.
3. **t = 5..8**: P1 runs (rem = 1). Queue = `[P1]`.
4. **t = 8..9**: P1 runs (rem = 0, Completed at t=9).

### Metrics
- **P1**: CT = 9, TAT = 9, WT = 2
- **P2**: CT = 5, TAT = 2, WT = 0
- **Avg WT**: 1.00 | **Avg TAT**: 5.50

---

## 🧪 Test Case 8: Single-Process Case

### Input Data
| Process ID | Arrival Time | Burst Time | Priority |
| :--- | :--- | :--- | :--- |
| P1 | 5 | 10 | 1 |

### Expected Results
- **t = 0..5**: IDLE (Duration = 5)
- **t = 5..15**: P1 executes
- **Metrics**: CT = 15, TAT = 10, WT = 0
- **Avg WT**: 0.00 | **Avg TAT**: 10.00

---

## 🧪 Test Case 9: Edge Cases & Validation Errors

1. **Negative Arrival Time**: Rejected with error.
2. **Zero or Negative Burst Time**: Rejected with error.
3. **Duplicate Process IDs**: Rejected with error.
4. **Zero or Negative Time Quantum**: Rejected with error.
5. **Out-of-Order Input Sorting**: Engine correctly sorts by arrival time before processing.
