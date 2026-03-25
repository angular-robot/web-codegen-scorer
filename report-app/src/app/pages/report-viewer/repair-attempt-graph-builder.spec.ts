import {labelByRepairCount, createRepairAttemptGraphData} from './repair-attempt-graph-builder';
import {RunInfoFromReportServer} from '../../../../../runner/shared-interfaces';
import {BuildResultStatus} from '../../../../../runner/workers/builder/builder-types';

interface MockAssessmentResult {
  finalAttempt: {
    buildResult: {
      status: BuildResultStatus;
    };
  };
  repairAttempts: number;
}

interface MockRunInfo {
  results: MockAssessmentResult[];
}

describe('repair-attempt-graph-builder', () => {
  describe('labelByRepairCount', () => {
    it('should return "1 repair" for 1', () => {
      expect(labelByRepairCount(1)).toBe('1 repair');
    });

    it('should return "2 repairs" for 2', () => {
      expect(labelByRepairCount(2)).toBe('2 repairs');
    });

    it('should return "8 repairs" for 8', () => {
      expect(labelByRepairCount(8)).toBe('8 repairs');
    });

    it('should return "9 repairs" for 9', () => {
      expect(labelByRepairCount(9)).toBe('9 repairs');
    });
  });

  describe('createRepairAttemptGraphData', () => {
    it('should group repair attempt labels beyond 8', () => {
      const mockReport: MockRunInfo = {
        results: [
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 1},
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 2},
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 3},
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 4},
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 5},
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 6},
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 7},
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 8},
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 9},
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 10},
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 11},
        ],
      };

      const data = createRepairAttemptGraphData(mockReport as unknown as RunInfoFromReportServer);

      expect(data.length).toBe(9);
      expect(data[0].label).toBe('1 repair');
      expect(data[1].label).toBe('2 repairs');
      expect(data[7].label).toBe('8 repairs');
      expect(data[8].label).toBe('9+ repairs');
    });

    it('should not group if distinct counts <= 8', () => {
      const mockReport: MockRunInfo = {
        results: [
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 1},
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 3},
          {finalAttempt: {buildResult: {status: BuildResultStatus.SUCCESS}}, repairAttempts: 5},
        ],
      };

      const data = createRepairAttemptGraphData(mockReport as unknown as RunInfoFromReportServer);

      expect(data.length).toBe(3);
      expect(data[0].label).toBe('1 repair');
      expect(data[1].label).toBe('3 repairs');
      expect(data[2].label).toBe('5 repairs');
    });
  });
});
