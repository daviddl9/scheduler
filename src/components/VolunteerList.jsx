// src/components/VolunteerList.jsx
import { MONTH_NAMES } from '../utils/dateUtils';

function VolunteerList({ volunteers, onEdit, onDelete }) {
  if (!volunteers.length) {
    return <p>No volunteers added yet.</p>;
  }

  return (
    <div className="volunteer-list card">
      <h3>Current Volunteers</h3>
      <ul>
        {volunteers.map(volunteer => (
          <li key={volunteer.id}>
            <strong>{volunteer.name}</strong>
            <p>Frequency: {volunteer.preferredFrequency}</p>
            <p>Unavailable Months: {volunteer.unavailableMonths.length > 0 ? volunteer.unavailableMonths.map(mIdx => MONTH_NAMES[mIdx]).join(', ') : 'None'}</p>
            <button onClick={() => onEdit(volunteer)}>Edit</button>
            <button onClick={() => onDelete(volunteer.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VolunteerList;