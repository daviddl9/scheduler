// src/components/VolunteerList.jsx
import { MONTH_NAMES } from '../utils/dateUtils';

// MODIFIED: Add ministries prop
function VolunteerList({ volunteers, onEdit, onDelete, ministries }) {
  if (!volunteers.length) { /* ... same ... */ }

  const getMinistryNames = (ministryIds) => {
    if (!ministryIds || ministryIds.length === 0) return 'None';
    return ministryIds.map(id => {
      const ministry = ministries.find(m => m.id === id);
      return ministry ? ministry.name : 'Unknown Ministry';
    }).join(', ');
  };

  return (
    <div className="volunteer-list card">
      <h3>Current Volunteers</h3>
      <ul>
        {volunteers.map(volunteer => (
          <li key={volunteer.id}>
            <strong>{volunteer.name}</strong>
            <p>Frequency: {volunteer.preferredFrequency}</p>
            <p>Unavailable Months: {volunteer.unavailableMonths.length > 0 ? volunteer.unavailableMonths.map(mIdx => MONTH_NAMES[mIdx]).join(', ') : 'None'}</p>
            {/* NEW: Display ministries */}
            <p>Serves In: {getMinistryNames(volunteer.ministryIds)}</p>
            <button onClick={() => onEdit(volunteer)}>Edit</button>
            <button onClick={() => onDelete(volunteer.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VolunteerList;