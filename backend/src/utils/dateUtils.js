/**
 * Generates a YYYY-MM-DD date string for a given date in a specific timezone.
 * Defaults to Asia/Kolkata if no timezone is provided in environment variables.
 * @param {Date} date 
 * @returns {string} YYYY-MM-DD
 */
function getLocalDateString(date = new Date()) {
  const tz = process.env.APP_TIMEZONE || 'Asia/Kolkata';
  
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const day = parts.find((p) => p.type === 'day').value;
  const month = parts.find((p) => p.type === 'month').value;
  const year = parts.find((p) => p.type === 'year').value;

  return `${year}-${month}-${day}`;
}

module.exports = {
  getLocalDateString
};
