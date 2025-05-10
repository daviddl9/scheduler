// src/utils/dateUtils.js

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

// Helper to get all instances of a specific day of the week in a given month and year
const getDaysInMonth = (year, month, dayOfWeek) => {
  const dates = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    if (date.getDay() === dayOfWeek) {
      dates.push(new Date(date.getTime()));
    }
    date.setDate(date.getDate() + 1);
  }
  return dates;
};

export const getScheduledDatesInYear = (year, rule) => {
  const { dayOfWeek, occurrences } = rule; // dayOfWeek is 0-6, occurrences is array like ['1st', '3rd'] or ['every']
  const scheduledDates = [];

  if (!occurrences || occurrences.length === 0) {
    return []; // No valid rule
  }

  for (let month = 0; month < 12; month++) {
    const daysInCurrentMonth = getDaysInMonth(year, month, parseInt(dayOfWeek));

    if (daysInCurrentMonth.length === 0) continue;

    if (occurrences.includes('every')) {
      scheduledDates.push(...daysInCurrentMonth);
    } else {
      const specificDatesThisMonth = [];
      occurrences.forEach(occurrence => {
        switch (occurrence) {
          case '1st':
            if (daysInCurrentMonth[0]) specificDatesThisMonth.push(daysInCurrentMonth[0]);
            break;
          case '2nd':
            if (daysInCurrentMonth[1]) specificDatesThisMonth.push(daysInCurrentMonth[1]);
            break;
          case '3rd':
            if (daysInCurrentMonth[2]) specificDatesThisMonth.push(daysInCurrentMonth[2]);
            break;
          case '4th':
            if (daysInCurrentMonth[3]) specificDatesThisMonth.push(daysInCurrentMonth[3]);
            break;
          case '5th': // Some months might have a 5th occurrence
            if (daysInCurrentMonth[4]) specificDatesThisMonth.push(daysInCurrentMonth[4]);
            break;
          case 'last':
            if (daysInCurrentMonth.length > 0) {
              specificDatesThisMonth.push(daysInCurrentMonth[daysInCurrentMonth.length - 1]);
            }
            break;
          default:
            // Potentially handle specific date numbers later if needed
            break;
        }
      });
      // Add unique dates to scheduledDates
      specificDatesThisMonth.forEach(d => {
        if (!scheduledDates.find(sd => sd.getTime() === d.getTime())) {
          scheduledDates.push(d);
        }
      });
    }
  }
  scheduledDates.sort((a, b) => a.getTime() - b.getTime()); // Ensure chronological order
  return scheduledDates;
};


export const formatDate = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day} (${DAYS_OF_WEEK[date.getDay()]})`; // Add day name
};