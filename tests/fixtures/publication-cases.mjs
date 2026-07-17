export const PUBLICATION_CASE_FIXTURE_VERSION = '3.6.1-legacy-publication-readiness';

export const PUBLICATION_CASES = {
  MAC: {
    definitionSet: 'se-tailoring-m1-m16-v1',
    migrationStatus: 'reassessment-required',
    classification: 'constructed-illustrative-scenario',
    source: '00-MASTER/ARCHIVE/pre-4.1.1/manuscript/07-Case-Studies.md §7.2',
    scores: {
      M1: 3, M2: 3, M3: 2, M4: 3,
      M5: 4, M6: 4, M7: 1, M8: 3,
      M9: 3, M10: 3, M11: 2, M12: 2,
      M13: 2, M14: 2, M15: 1, M16: 3
    },
    expected: {
      basic: [],
      standard: Array.from({ length: 22 }, (_, index) => index + 9),
      comprehensive: []
    }
  },
  WMS: {
    definitionSet: 'se-tailoring-m1-m16-v1',
    migrationStatus: 'reassessment-required',
    classification: 'constructed-illustrative-scenario',
    source: '00-MASTER/ARCHIVE/pre-4.1.1/manuscript/07-Case-Studies.md §7.3',
    scores: {
      M1: 2, M2: 3, M3: 2, M4: 2,
      M5: 1, M6: 2, M7: 1, M8: 2,
      M9: 3, M10: 2, M11: 2, M12: 3,
      M13: 2, M14: 2, M15: 1, M16: 3
    },
    expected: {
      basic: [10, 15, 16, 17, 18, 27, 29, 30],
      standard: [9, 11, 12, 13, 14, 19, 20, 21, 22, 23, 24, 25, 26, 28],
      comprehensive: []
    }
  },
  CBTC: {
    definitionSet: 'se-tailoring-m1-m16-v1',
    migrationStatus: 'reassessment-required',
    classification: 'constructed-illustrative-scenario',
    source: '01-PAPER/10-Appendix-A-Worked-Example.md',
    scores: {
      M1: 4, M2: 4, M3: 3, M4: 5,
      M5: 5, M6: 5, M7: 2, M8: 4,
      M9: 4, M10: 3, M11: 3, M12: 4,
      M13: 4, M14: 3, M15: 4, M16: 3
    },
    expected: {
      basic: [],
      standard: [14, 30],
      comprehensive: [9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]
    }
  }
};
