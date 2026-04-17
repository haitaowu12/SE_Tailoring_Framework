import { runFullAssessment } from '../src/utils/assessment-engine.js';

// Base defaults assuming scores=1
const METRIC_IDS = [
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8',
  'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16'
];

function makeScores(overrides) {
  const scores = {};
  METRIC_IDS.forEach(id => scores[id] = 1);
  return { ...scores, ...overrides };
}

const personas = {
  A_RTU_Upgrade: makeScores({ M1: 2, M4: 4, M5: 4, M6: 4, M16: 3 }),
  B_New_Rolling_Stock: makeScores({ M1: 5, M3: 4, M4: 5, M5: 5, M8: 5, M16: 5 }),
  C_Small_Yard_Interlocking: makeScores({ M1: 2, M2: 3, M5: 5, M8: 4, M16: 3 })
};

function getLevelValue(level) {
  return { 'basic': 1, 'standard': 2, 'comprehensive': 3 }[level] || 1;
}

let totalPenalty = 0;

function evaluatePersona(name, scores) {
  const result = runFullAssessment(scores);
  const levels = result.levels;
  let penalty = 0;

  // --- HARD DEFENDABILITY CONSTRAINTS (1000 penalty each) ---
  // 1. Life-Safety Verification Floor (M5=5 -> V&V (25, 27) >= Standard)
  if (scores.M5 === 5) {
    if (getLevelValue(levels[25]) < 2) penalty += 1000;
    if (getLevelValue(levels[27]) < 2) penalty += 1000;
  }
  // 2. Safety-Critical Risk Floor (M5>=4 -> Risk (12) >= Standard)
  if (scores.M5 >= 4) {
    if (getLevelValue(levels[12]) < 2) penalty += 1000;
  }
  // 3. Mission-Critical Cyber Floor (M6=5 -> CM (13), Ver (25) >= Standard)
  if (scores.M6 === 5) {
    if (getLevelValue(levels[13]) < 2) penalty += 1000;
    if (getLevelValue(levels[25]) < 2) penalty += 1000;
  }
  // 4. Integration Baseline (M4>=4 -> Integration (24) >= Standard)
  if (scores.M4 >= 4) {
    if (getLevelValue(levels[24]) < 2) penalty += 1000;
  }

  // --- OVERHEAD MINIMIZATION ---
  const criticalProcesses = [12, 13, 24, 25, 27]; // Risk, CM, Int, Ver, Val

  if (name === 'A_RTU_Upgrade' || name === 'C_Small_Yard_Interlocking') {
    // Penalize any Comprehensive
    for (const [pid, level] of Object.entries(levels)) {
      if (level === 'comprehensive') penalty += 10;
      
      // Penalize Standard on non-critical processes
      if (level === 'standard' && !criticalProcesses.includes(parseInt(pid))) {
        penalty += 2;
      }
    }
  }

  if (name === 'B_New_Rolling_Stock') {
    // Penalize Basic on mega-projects
    for (const [pid, level] of Object.entries(levels)) {
      if (level === 'basic') penalty += 5;
    }
  }

  return penalty;
}

for (const [name, scores] of Object.entries(personas)) {
  totalPenalty += evaluatePersona(name, scores);
}

console.log(`METRIC: ${totalPenalty}`);
