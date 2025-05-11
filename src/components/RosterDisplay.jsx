// src/components/RosterDisplay.jsx
import { formatDate, MONTH_NAMES } from '../utils/dateUtils';

// MODIFIED: Accept full period props
function RosterDisplay({ roster, volunteers, startYear, startMonth, endYear, endMonth }) {
  if (!roster.length) {
    return <p className="card">No roster generated yet. Configure period/rule, add volunteers, and click "Generate Roster".</p>;
  }

  const getVolunteerName = (id) => { /* ... (same) ... */
    if (id === 'UNASSIGNED') return <span style={{ color: 'orange' }}>UNASSIGNED</span>;
    const volunteer = volunteers.find(v => v.id === id);
    return volunteer ? volunteer.name : 'Unknown Volunteer';
  };

  const rosterByMonthAndYear = roster.reduce((acc, entry) => {
    const year = entry.date.getFullYear();
    const month = entry.date.getMonth();
    const key = `${year}-${month}`; // Group by year and month
    if (!acc[key]) {
      acc[key] = { year, month, entries: [] };
    }
    acc[key].entries.push(entry);
    return acc;
  }, {});

  // Sort the groups chronologically
  const sortedGroupKeys = Object.keys(rosterByMonthAndYear).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    if (yearA !== yearB) return yearA - yearB;
    return monthA - monthB;
  });

  const rosterPeriodTitle = `Generated Roster for ${MONTH_NAMES[startMonth]} ${startYear} - ${MONTH_NAMES[endMonth]} ${endYear}`;

  return (
    <div className="roster-display card">
      <h3>{rosterPeriodTitle}</h3>
      {sortedGroupKeys.map(groupKey => {
        const group = rosterByMonthAndYear[groupKey];
        return (
          <div key={groupKey} className="roster-month">
            <h4>{MONTH_NAMES[group.month]} {group.year}</h4>
            <table>
              <thead><tr><th>Scheduled Date</th><th>Assigned Volunteer(s)</th></tr></thead>
              <tbody>
                {group.entries.map(entry => (
                  <tr key={formatDate(entry.date)}>
                    <td>{formatDate(entry.date)}</td>
                    <td>
                      {entry.assignedVolunteers.length > 0
                        ? entry.assignedVolunteers.map(id => getVolunteerName(id)).join(', ')
                        : <span style={{ color: 'orange' }}>UNASSIGNED</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export default RosterDisplay;