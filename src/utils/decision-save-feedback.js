/** Describe storage and decision application separately; neither is approval. */
export function describeDecisionSave({ hasDraft = false, recorded = false, imported = false, needsReview = false, storageFailed = false, errors = [] } = {}) {
  const storage = storageFailed
    ? 'Local save failed. Keep this tab open and download a private backup before closing.'
    : hasDraft ? 'Draft saved locally; this edit is not a recorded decision.' : '';
  if (hasDraft && errors.length) {
    const minimum = errors.some(error => /minimum is protected/.test(error));
    return {
      label: minimum ? 'Change blocked by minimum' : 'Change needs review',
      message: `${storage} ${errors.join(' ')} The existing applied level is unchanged.`,
      blocked: true
    };
  }
  if (hasDraft) return { label: storageFailed ? 'Draft held in this tab' : 'Draft saved locally', message: storage, blocked: false };
  if (recorded) return {
    label: needsReview ? 'Decision needs review' : storageFailed ? 'Recorded in this tab only' : 'Decision recorded',
    message: storageFailed ? storage : needsReview ? 'Earlier rationale is retained. Review and recalculate before reconfirming this choice.' : 'Decision recorded locally. External approval is not verified.',
    blocked: false
  };
  if (imported) return { label: 'Imported adjustment', message: 'An imported choice is present; its original approval and timestamp are not inferred.', blocked: false };
  return { label: 'Not recorded', message: '', blocked: false };
}
