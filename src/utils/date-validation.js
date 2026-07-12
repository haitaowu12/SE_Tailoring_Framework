/** Return true only for a real calendar date in canonical YYYY-MM-DD form. */
export function isValidIsoCalendarDate(value) {
    const text = String(value || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
    const parsed = new Date(`${text}T00:00:00.000Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === text;
}
