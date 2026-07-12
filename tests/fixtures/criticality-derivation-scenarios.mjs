/**
 * Deterministic boundary fixtures for the M5/M7 design-validity stream.
 *
 * Passing these scenarios establishes registry/engine agreement only. Future
 * expert studies should adjudicate the necessity and proportionality of every
 * mapping and floor, including counterexamples for the named study questions.
 */
export const CRITICALITY_DERIVATION_SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'm5-score5-direct-vs-life-safety-floor',
    metricId: 'M5',
    boundaryScore: 4,
    triggerScore: 5,
    directComprehensiveProcesses: Object.freeze([12, 16, 18, 19, 20, 21, 22, 24, 25, 27, 28, 29]),
    namedFloorProcesses: Object.freeze([12, 16, 19, 20, 25, 27]),
    namedFloorLevel: 'comprehensive',
    studyQuestions: Object.freeze([
      'Does severe human-harm consequence independently justify Comprehensive for each mapped process outside the named floor family?',
      'Is each six-process life-safety floor necessary and sufficient across lifecycle and organizational boundaries?'
    ])
  }),
  Object.freeze({
    id: 'm7-score5-direct-vs-environmental-floor',
    metricId: 'M7',
    boundaryScore: 4,
    triggerScore: 5,
    directComprehensiveProcesses: Object.freeze([28, 29, 30]),
    namedFloorProcesses: Object.freeze([13, 14, 21, 28, 29, 30]),
    namedFloorLevel: 'standard',
    studyQuestions: Object.freeze([
      'Does major environmental consequence independently justify Comprehensive for Operation, Maintenance, and Disposal?',
      'Are the Configuration, Information, and Design floor-only relationships proportionate in supportive and counterexample cases?'
    ])
  })
]);
