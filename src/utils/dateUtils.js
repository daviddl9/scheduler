// src/utils/dateUtils.js

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const getDaysInMonth = (year, month, dayOfWeek) => {
  const dates = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    if (date.getDay() === parseInt(dayOfWeek)) {
      dates.push(new Date(date.getTime()));
    }
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

export const getScheduledDatesForPeriod = (startYear, startMonthIndex, endYear, endMonthIndex, rule) => {
  // Extract days of week and occurrences from rule, with fallbacks for backward compatibility
  const daysOfWeek = rule.daysOfWeek || (rule.dayOfWeek ? [rule.dayOfWeek] : ['0']);
  const { occurrences } = rule;
  const scheduledDates = [];

  if (!occurrences || occurrences.length === 0) return [];
  if (!daysOfWeek || daysOfWeek.length === 0) return [];
  if (endYear < startYear || (endYear === startYear && endMonthIndex < startMonthIndex)) return []; // Basic validation

  for (let currentYear = startYear; currentYear <= endYear; currentYear++) {
    const monthStartLoop = (currentYear === startYear) ? startMonthIndex : 0;
    const monthEndLoop = (currentYear === endYear) ? endMonthIndex : 11;

    for (let currentMonth = monthStartLoop; currentMonth <= monthEndLoop; currentMonth++) {
      // Process each selected day of the week
      for (const dayOfWeek of daysOfWeek) {
        const daysInCurrentMonthMatchingDayOfWeek = getDaysInMonth(currentYear, currentMonth, dayOfWeek);

        if (daysInCurrentMonthMatchingDayOfWeek.length === 0) continue;

        if (occurrences.includes('every')) {
          scheduledDates.push(...daysInCurrentMonthMatchingDayOfWeek);
        } else {
          const specificDatesThisMonth = [];
        occurrences.forEach(occurrence => {
          switch (occurrence) {
            case '1st': if (daysInCurrentMonthMatchingDayOfWeek[0]) specificDatesThisMonth.push(daysInCurrentMonthMatchingDayOfWeek[0]); break;
            case '2nd': if (daysInCurrentMonthMatchingDayOfWeek[1]) specificDatesThisMonth.push(daysInCurrentMonthMatchingDayOfWeek[1]); break;
            case '3rd': if (daysInCurrentMonthMatchingDayOfWeek[2]) specificDatesThisMonth.push(daysInCurrentMonthMatchingDayOfWeek[2]); break;
            case '4th': if (daysInCurrentMonthMatchingDayOfWeek[3]) specificDatesThisMonth.push(daysInCurrentMonthMatchingDayOfWeek[3]); break;
            case '5th': if (daysInCurrentMonthMatchingDayOfWeek[4]) specificDatesThisMonth.push(daysInCurrentMonthMatchingDayOfWeek[4]); break;
            case 'last':
              if (daysInCurrentMonthMatchingDayOfWeek.length > 0) {
                specificDatesThisMonth.push(daysInCurrentMonthMatchingDayOfWeek[daysInCurrentMonthMatchingDayOfWeek.length - 1]);
              }
              break;
            default: break;
          }
        });
        // Add unique dates to scheduledDates (though usually a date won't be added twice by this logic within a single month)
        specificDatesThisMonth.forEach(d => {
          if (!scheduledDates.find(sd => sd.getTime() === d.getTime())) {
            scheduledDates.push(d);
          }
        });
      }
      }
    }
  }
  scheduledDates.sort((a, b) => a.getTime() - b.getTime());
  return scheduledDates;
};

export const formatDate = (date) => { /* ... (same as before, includes day name) ... */
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day} (${DAYS_OF_WEEK[date.getDay()]})`;
};