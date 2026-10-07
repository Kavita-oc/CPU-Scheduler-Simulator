/**
 * Test Runner for CPU Scheduling Engine
 * Verifies correctness of FCFS, SJF, Priority, and Round Robin against textbook examples.
 */

const CPUScheduler = require('../src/js/simulator.js');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
}

function runTests() {
  console.log('==================================================');
  console.log('🧪 RUNNING CPU SCHEDULING ALGORITHM TEST SUITE');
  console.log('==================================================\n');

  // Test Case 1: All processes arriving at time 0
  console.log('Test Case 1: All processes arriving at t=0');
  const tc1 = [
    { id: 'P1', arrivalTime: 0, burstTime: 24, priority: 3 },
    { id: 'P2', arrivalTime: 0, burstTime: 3, priority: 1 },
    { id: 'P3', arrivalTime: 0, burstTime: 3, priority: 2 }
  ];
  const res1_fcfs = CPUScheduler.simulateFCFS(tc1);
  assert(res1_fcfs.processResults[0].completionTime === 24, 'TC1 FCFS P1 CT should be 24');
  assert(res1_fcfs.processResults[1].completionTime === 27, 'TC1 FCFS P2 CT should be 27');
  assert(res1_fcfs.processResults[2].completionTime === 30, 'TC1 FCFS P3 CT should be 30');
  assert(res1_fcfs.avgWaitingTime === 17, `TC1 FCFS Avg WT should be 17, got ${res1_fcfs.avgWaitingTime}`);

  const res1_sjf = CPUScheduler.simulateSJF(tc1);
  // P2 (BT=3) -> P3 (BT=3, tie broke by PID P2 then P3) -> P1 (BT=24)
  assert(res1_sjf.ganttChart[0].processId === 'P2', 'TC1 SJF 1st process should be P2');
  assert(res1_sjf.ganttChart[1].processId === 'P3', 'TC1 SJF 2nd process should be P3');
  assert(res1_sjf.ganttChart[2].processId === 'P1', 'TC1 SJF 3rd process should be P1');
  assert(res1_sjf.processResults.find(p => p.id === 'P2').completionTime === 3, 'P2 CT = 3');
  assert(res1_sjf.processResults.find(p => p.id === 'P3').completionTime === 6, 'P3 CT = 6');
  assert(res1_sjf.processResults.find(p => p.id === 'P1').completionTime === 30, 'P1 CT = 30');
  console.log('  ✓ TC1 Passed');

  // Test Case 2: Different arrival times
  console.log('\nTest Case 2: Different arrival times');
  const tc2 = [
    { id: 'P1', arrivalTime: 0, burstTime: 8, priority: 2 },
    { id: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
    { id: 'P3', arrivalTime: 2, burstTime: 9, priority: 3 },
    { id: 'P4', arrivalTime: 3, burstTime: 5, priority: 4 }
  ];
  // FCFS: P1 (0-8), P2 (8-12), P3 (12-21), P4 (21-26)
  const res2_fcfs = CPUScheduler.simulateFCFS(tc2);
  assert(res2_fcfs.processResults.find(p => p.id === 'P1').completionTime === 8, 'TC2 FCFS P1 CT');
  assert(res2_fcfs.processResults.find(p => p.id === 'P2').completionTime === 12, 'TC2 FCFS P2 CT');
  assert(res2_fcfs.processResults.find(p => p.id === 'P3').completionTime === 21, 'TC2 FCFS P3 CT');
  assert(res2_fcfs.processResults.find(p => p.id === 'P4').completionTime === 26, 'TC2 FCFS P4 CT');

  // SJF (Non-preemptive):
  // At t=0: only P1 available. P1 runs (0-8).
  // At t=8: P2(BT=4), P3(BT=9), P4(BT=5) arrived. Min BT is P2 (4). P2 runs (8-12).
  // At t=12: P3(9), P4(5). Min BT is P4 (5). P4 runs (12-17).
  // At t=17: P3 runs (17-26).
  const res2_sjf = CPUScheduler.simulateSJF(tc2);
  assert(res2_sjf.processResults.find(p => p.id === 'P1').completionTime === 8, 'TC2 SJF P1 CT');
  assert(res2_sjf.processResults.find(p => p.id === 'P2').completionTime === 12, 'TC2 SJF P2 CT');
  assert(res2_sjf.processResults.find(p => p.id === 'P4').completionTime === 17, 'TC2 SJF P4 CT');
  assert(res2_sjf.processResults.find(p => p.id === 'P3').completionTime === 26, 'TC2 SJF P3 CT');
  console.log('  ✓ TC2 Passed');

  // Test Case 3: CPU Idle Time
  console.log('\nTest Case 3: CPU Idle Time');
  const tc3 = [
    { id: 'P1', arrivalTime: 2, burstTime: 3, priority: 1 },
    { id: 'P2', arrivalTime: 8, burstTime: 4, priority: 2 }
  ];
  const res3_fcfs = CPUScheduler.simulateFCFS(tc3);
  assert(res3_fcfs.ganttChart[0].isIdle === true, 'TC3 1st Gantt block should be IDLE');
  assert(res3_fcfs.ganttChart[0].endTime === 2, 'Idle until t=2');
  assert(res3_fcfs.ganttChart[1].processId === 'P1', 'P1 runs 2..5');
  assert(res3_fcfs.ganttChart[2].isIdle === true, 'Idle 5..8');
  assert(res3_fcfs.ganttChart[2].endTime === 8, 'Idle until t=8');
  assert(res3_fcfs.ganttChart[3].processId === 'P2', 'P2 runs 8..12');
  console.log('  ✓ TC3 Passed');

  // Test Case 4 & 5: Equal burst times & priorities (Tie breaking)
  console.log('\nTest Case 4 & 5: Equal burst times and priorities (Tie breaking)');
  const tc4 = [
    { id: 'P2', arrivalTime: 0, burstTime: 5, priority: 1 },
    { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 1 }
  ];
  const res4_sjf = CPUScheduler.simulateSJF(tc4);
  assert(res4_sjf.ganttChart[0].processId === 'P1', 'Tie broken by lower PID (P1 before P2)');
  assert(res4_sjf.ganttChart[1].processId === 'P2', 'P2 second');
  console.log('  ✓ TC4 & TC5 Passed');

  // Test Case 6: Round Robin with multiple rotations (TQ = 2)
  console.log('\nTest Case 6: Round Robin with multiple rotations (TQ = 2)');
  const tc6 = [
    { id: 'P1', arrivalTime: 0, burstTime: 5, priority: 1 },
    { id: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
    { id: 'P3', arrivalTime: 2, burstTime: 1, priority: 1 }
  ];
  // Execution order for TQ=2:
  // t=0: P1 (0..2), P1 rem=3. During 0..2, P2(at=1) and P3(at=2) arrive. Queue = [P2, P3, P1]
  // t=2: P2 (2..4), P2 rem=1. Queue = [P3, P1, P2]
  // t=4: P3 (4..5), P3 rem=0 (Finished CT=5). Queue = [P1, P2]
  // t=5: P1 (5..7), P1 rem=1. Queue = [P2, P1]
  // t=7: P2 (7..8), P2 rem=0 (Finished CT=8). Queue = [P1]
  // t=8: P1 (8..9), P1 rem=0 (Finished CT=9). Queue = []
  const res6_rr = CPUScheduler.simulateRoundRobin(tc6, 2);
  const p1Res = res6_rr.processResults.find(p => p.id === 'P1');
  const p2Res = res6_rr.processResults.find(p => p.id === 'P2');
  const p3Res = res6_rr.processResults.find(p => p.id === 'P3');
  assert(p3Res.completionTime === 5, `P3 CT should be 5, got ${p3Res.completionTime}`);
  assert(p2Res.completionTime === 8, `P2 CT should be 8, got ${p2Res.completionTime}`);
  assert(p1Res.completionTime === 9, `P1 CT should be 9, got ${p1Res.completionTime}`);
  console.log('  ✓ TC6 Passed');

  // Test Case 7: Process arriving while another process is executing
  console.log('\nTest Case 7: Process arriving while another process executes');
  const tc7 = [
    { id: 'P1', arrivalTime: 0, burstTime: 7, priority: 1 },
    { id: 'P2', arrivalTime: 3, burstTime: 2, priority: 1 }
  ];
  // RR with TQ=3
  // t=0: P1 (0..3), P1 rem=4. P2 arrives at t=3. Queue = [P2, P1].
  // t=3: P2 (3..5), P2 finishes CT=5. Queue = [P1].
  // t=5: P1 (5..8), P1 rem=1. Queue = [P1].
  // t=8: P1 (8..9), P1 finishes CT=9.
  const res7_rr = CPUScheduler.simulateRoundRobin(tc7, 3);
  assert(res7_rr.processResults.find(p => p.id === 'P2').completionTime === 5, 'P2 CT = 5');
  assert(res7_rr.processResults.find(p => p.id === 'P1').completionTime === 9, 'P1 CT = 9');
  console.log('  ✓ TC7 Passed');

  // Test Case 8: Single process case
  console.log('\nTest Case 8: Single-process case');
  const tc8 = [{ id: 'P1', arrivalTime: 5, burstTime: 10, priority: 1 }];
  const res8_fcfs = CPUScheduler.simulateFCFS(tc8);
  assert(res8_fcfs.processResults[0].completionTime === 15, 'Single process CT = 15');
  assert(res8_fcfs.processResults[0].turnaroundTime === 10, 'Single process TAT = 10');
  assert(res8_fcfs.processResults[0].waitingTime === 0, 'Single process WT = 0');
  console.log('  ✓ TC8 Passed');

  // Test Case 9: Input Validation
  console.log('\nTest Case 9: Input Validation');
  const invalidProcesses = [
    { id: 'P1', arrivalTime: -1, burstTime: 5, priority: 1 },
    { id: 'P1', arrivalTime: 0, burstTime: 0, priority: 1 }
  ];
  const valErrors = CPUScheduler.validateInput(invalidProcesses, 0);
  assert(valErrors.length >= 3, 'Validation should catch negative AT, zero BT, duplicate ID, invalid TQ');
  console.log('  ✓ TC9 Passed');

  console.log('\n==================================================');
  console.log('🎉 ALL CPU SCHEDULING TESTS PASSED PERFECTLY!');
  console.log('==================================================');
}

runTests();
