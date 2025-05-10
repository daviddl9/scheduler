// src/components/RosterDisplay.jsx
import { formatDate, MONTH_NAMES } from '../utils/dateUtils';

function RosterDisplay({ roster, volunteers }) {
  if (!roster.length) {
    return <p className="card">No roster generated yet. Add volunteers and click "Generate Roster".</p>;
  }

  const getVolunteerName = (id) => {
    if (id === 'UNASSIGNED') return <span style={{ color: 'orange' }}>UNASSIGNED</span>;
    const volunteer = volunteers.find(v => v.id === id);
    return volunteer ? volunteer.name : 'Unknown Volunteer';
  };

  // Group roster by month
  const rosterByMonth = roster.reduce((acc, entry) => {
    const month = entry.date.getMonth();
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(entry);
    return acc;
  }, {});

  return (
    <div className="roster-display card">
      <h3>Generated Roster for {roster[0]?.date.getFullYear()}</h3>
      {Object.keys(rosterByMonth).map(monthIndex => (
        <div key={monthIndex} className="roster-month">
          <h4>{MONTH_NAMES[parseInt(monthIndex)]}</h4>
          <table>
            <thead>
              <tr>
                {/* MODIFIED: More generic header */}
                <th>Scheduled Date</th>
                <th>Assigned Volunteer(s)</th>
              </tr>
            </thead>
            <tbody>
              {rosterByMonth[monthIndex].map(entry => (
                <tr key={formatDate(entry.date)}>
                  {/* formatDate now includes day of week */}
                  <td>{formatDate(entry.date)}</td>
                  <td>
                    {entry.assignedVolunteers.length > 0
                      ? entry.assignedVolunteers.map(id => getVolunteerName(id)).join(', ')
                      : <span style={{ color: 'orange' }}>UNASSIGNED</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default RosterDisplay;