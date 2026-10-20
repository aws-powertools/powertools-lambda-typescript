/**
 * Resolve the workflow run id used to scope Lambda Managed Instances (LMI)
 * e2e stack names.
 *
 * The run id is embedded in both the shared capacity provider stack names
 * (`LmiShared-<runId>-<arch>`) and the per-suite function stack names (via
 * {@link lmiFunctionStackTestName}), so the teardown job can find and delete
 * every LMI stack belonging to a run — including function stacks orphaned by
 * a cell that was cancelled or timed out before its own teardown.
 *
 * It is restricted to the characters CloudFormation allows in a stack name
 * (alphanumerics and hyphens); `GITHUB_RUN_ID` is numeric and the local
 * default is safe.
 */
const getRunId = (): string => {
  const runId = process.env.GITHUB_RUN_ID ?? 'local';
  if (!/^[A-Za-z0-9-]+$/.test(runId)) {
    throw new Error(
      `Invalid run id "${runId}": only alphanumerics and hyphens are allowed`
    );
  }
  return runId;
};

/**
 * The `testName` for a per-suite LMI function stack: an `Lmi` marker joined to
 * the run id. `generateTestUniqueName` appends it last, so the resulting stack
 * name ends with `-Lmi-<runId>`.
 *
 * This same string is the token the teardown sweep matches on: it lists stacks
 * and deletes those whose name contains it, catching function stacks orphaned
 * by a cell that never ran its own teardown. It does not match the shared
 * provider stacks (`LmiShared-<runId>-...`) — `Lmi-` is not a substring of
 * `LmiShared-` — which teardown deletes explicitly by name afterwards.
 */
const lmiFunctionStackTestName = (): string => `Lmi-${getRunId()}`;

export { getRunId, lmiFunctionStackTestName };
