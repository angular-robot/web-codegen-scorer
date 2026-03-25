import {RunInfoFromReportServer} from '../../../../../runner/shared-interfaces';
import {BuildResultStatus} from '../../../../../runner/workers/builder/builder-types';
import {ScoreCssVariable} from '../../shared/scoring';
import {StackedBarChartData} from '../../shared/visualization/stacked-bar-chart/stacked-bar-chart';

const MAX_VISIBLE_REPAIR_COUNT = 8;

/**
 * Calculates the average number of repair attempts performed in a run.
 */
export function calculateAverageRepairAttempts(report: RunInfoFromReportServer) {
  let totalRepairs = 0;
  let count = 0;

  for (const result of report.results) {
    // Only consider successful builds that required repairs.
    if (
      result.finalAttempt.buildResult.status === BuildResultStatus.SUCCESS &&
      result.repairAttempts > 0
    ) {
      totalRepairs += result.repairAttempts;
      count++;
    }
  }

  return count > 0 ? totalRepairs / count : null;
}

/**
 * Creates graph data for the "repair attempt" graph, from a given run report.
 */
export function createRepairAttemptGraphData(report: RunInfoFromReportServer) {
  const repairsToAppCount = new Map<number | 'failed', number>();

  // Map repair count to how many applications shared that count.
  let maxRepairCount = 0;
  for (const result of report.results) {
    if (result.finalAttempt.buildResult.status === BuildResultStatus.ERROR) {
      repairsToAppCount.set('failed', (repairsToAppCount.get('failed') || 0) + 1);
    } else {
      const repairs = result.repairAttempts;
      // For this graph, we ignore applications that required no repair.
      if (repairs > 0) {
        repairsToAppCount.set(repairs, (repairsToAppCount.get(repairs) || 0) + 1);
        maxRepairCount = Math.max(maxRepairCount, repairs);
      }
    }
  }

  const data: StackedBarChartData = [];

  // All the numeric keys, sorted by value.
  const intermediateRepairKeys = Array.from(repairsToAppCount.keys())
    .filter((k): k is number => typeof k === 'number')
    .sort((a, b) => a - b);

  if (intermediateRepairKeys.length <= MAX_VISIBLE_REPAIR_COUNT) {
    for (const repairCount of intermediateRepairKeys) {
      const applicationCount = repairsToAppCount.get(repairCount);
      if (!applicationCount) continue;

      data.push({
        label: labelByRepairCount(repairCount),
        color: colorByRepairCount(repairCount),
        value: applicationCount,
      });
    }
  } else {
    const visibleKeys = intermediateRepairKeys.slice(0, MAX_VISIBLE_REPAIR_COUNT);
    const hiddenKeys = intermediateRepairKeys.slice(MAX_VISIBLE_REPAIR_COUNT);
    const maxVisible = visibleKeys[visibleKeys.length - 1];

    for (const repairCount of visibleKeys) {
      const applicationCount = repairsToAppCount.get(repairCount);
      if (!applicationCount) continue;

      data.push({
        label: labelByRepairCount(repairCount),
        color: colorByRepairCount(repairCount),
        value: applicationCount,
      });
    }

    const groupValue = hiddenKeys.reduce((acc, k) => acc + (repairsToAppCount.get(k) ?? 0), 0);
    if (groupValue > 0) {
      data.push({
        label: `${maxVisible + 1}+ repairs`,
        color: colorByRepairCount(maxVisible + 1),
        value: groupValue,
      });
    }
  }

  // Handle 'Build failed even after all retries' - always maps to the "failure" grade.
  const failedCount = repairsToAppCount.get('failed') || 0;
  if (failedCount > 0) {
    data.push({
      label: 'Build failed even after all retries',
      color: ScoreCssVariable.poor,
      value: failedCount,
    });
  }
  return data;
}

export function labelByRepairCount(repairCount: number): string {
  if (repairCount === 1) {
    return '1 repair';
  }
  return `${repairCount} repairs`;
}

function colorByRepairCount(repairCount: number): string {
  // We're using mediocre1-5 since these are essentially *all* bad so we don't want green in this
  // graph.
  switch (repairCount) {
    case 1:
      return ScoreCssVariable.mediocre1;
    case 2:
      return ScoreCssVariable.mediocre2;
    case 3:
      return ScoreCssVariable.mediocre3;
    case 4:
      return ScoreCssVariable.mediocre4;
    default:
      return ScoreCssVariable.mediocre5;
  }
}
