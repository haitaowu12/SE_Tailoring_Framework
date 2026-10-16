export function debounce(func, wait) {
  let timeout;
  function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  }
  executedFunction.cancel = () => clearTimeout(timeout);
  return executedFunction;
}
