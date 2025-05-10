// src/utils/dateUtils.js

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getAllSundaysInYear = (year) => {
  const sundays = [];
  const date = new Date(year, 0, 1); // Start from Jan 1st of the year

  // Find the first Sunday
  while (date.getDay() !== 0) { // 0 is Sunday
    date.setDate(date.getDate() + 1);
  }

  // Iterate through the year, adding each Sunday
  while (date.getFullYear() === year) {
    sundays.push(new Date(date.getTime())); // Store a copy of the date
    date.setDate(date.getDate() + 7);
  }
  return sundays;
};

export const formatDate = (date) => {
  if (!date) return '';
  // Get YYYY-MM-DD format
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};