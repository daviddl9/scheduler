// src/components/RosterDisplay.jsx
import { formatDate, MONTH_NAMES } from '../utils/dateUtils';

// MODIFIED: Accept full period props
function RosterDisplay({ roster, volunteers, ministries, startYear, startMonth, endYear, endMonth }) {
  if (ministries.length === 0) {
    return <p className="card">Please define ministries first to see the roster display.</p>;
  }
  if (!roster.length) {
    return <p className="card">No roster generated yet. Configure period/rule, add volunteers, and click "Generate Roster".</p>;
  }

  const getVolunteerName = (id) => { /* ... (same) ... */
    if (id === 'UNASSIGNED') return <span style={{ color: 'orange' }}>UNASSIGNED</span>;
    const volunteer = volunteers.find(v => v.id === id);
    return volunteer ? volunteer.name : 'Unknown Volunteer';
  };

  const rosterPeriodTitle = `Generated Roster for ${MONTH_NAMES[startMonth]} ${startYear} - ${MONTH_NAMES[endMonth]} ${endYear}`;

  // Group by Year then Month for display
  const groupedByYearMonth = roster.reduce((acc, entry) => {
    const year = entry.date.getFullYear();
    const month = entry.date.getMonth();
    const key = `${year}-${month}`;
    if (!acc[key]) acc[key] = { year, month, dateEntries: [] };
    acc[key].dateEntries.push(entry);
    return acc;
  }, {});

  const sortedYearMonthKeys = Object.keys(groupedByYearMonth).sort((a, b) => {
    const [yA, mA] = a.split('-').map(Number);
    const [yB, mB] = b.split('-').map(Number);
    if (yA !== yB) return yA - yB;
    return mA - mB;
  });

  return (
    <div className="roster-display card">
      <h3>{rosterPeriodTitle}</h3>
      {sortedYearMonthKeys.map(ymKey => {
        const group = groupedByYearMonth[ymKey];
        return (
          <div key={ymKey} className="roster-month-year-group">
            <h4>{MONTH_NAMES[group.month]} {group.year}</h4>
            {group.dateEntries.map(entry => (
              <div key={formatDate(entry.date)} className="roster-date-entry">
                <strong>{formatDate(entry.date)}</strong>
                <div className="ministry-assignments-grid">
                  {ministries.map(ministry => {
                    const assignedToThisMinistry = entry.assignmentsByMinistry[ministry.id] || [];
                    const needed = ministry.minVolunteers;
                    const isShort = assignedToThisMinistry.length < needed;
                    return (
                      <div key={ministry.id} className="ministry-assignment-item">
                        <h5>{ministry.name} ({assignedToThisMinistry.length}/{needed})
                          {isShort && <span style={{color: 'orange', marginLeft: '5px'}}>(Short!)</span>}
                        </h5>
                        {assignedToThisMinistry.length > 0 ? (
                          <ul>{assignedToThisMinistry.map(volId => <li key={volId}>{getVolunteerName(volId)}</li>)}</ul>
                        ) : (
                          <p><small>No volunteers assigned.</small></p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default RosterDisplay;