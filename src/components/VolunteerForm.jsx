// src/components/VolunteerForm.jsx
import { useState, useEffect } from 'react';
import { MONTH_NAMES } from '../utils/dateUtils';

const INITIAL_FORM_STATE = {
  name: '',
  preferredFrequency: 'monthly', // Default or an existing option
  unavailableMonths: [],
};

function VolunteerForm({ onSubmit, existingVolunteer }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  useEffect(() => {
    if (existingVolunteer) {
      setFormData({
        name: existingVolunteer.name,
        preferredFrequency: existingVolunteer.preferredFrequency,
        unavailableMonths: existingVolunteer.unavailableMonths.map(String),
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
  }, [existingVolunteer]);

  const handleChange = (e) => { /* ... (same as before) ... */
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMonthChange = (e) => { /* ... (same as before) ... */
    const { value, checked } = e.target;
    const monthIndex = parseInt(value);
    setFormData(prev => {
      const newUnavailableMonths = checked
        ? [...prev.unavailableMonths, monthIndex.toString()]
        : prev.unavailableMonths.filter(m => m !== monthIndex.toString());
      return { ...prev, unavailableMonths: newUnavailableMonths };
    });
  };

  const handleSubmit = (e) => { /* ... (same as before) ... */
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter a volunteer name.');
      return;
    }
    onSubmit({
      ...formData,
      unavailableMonths: formData.unavailableMonths.map(Number),
    });
    if (!existingVolunteer) {
      setFormData(INITIAL_FORM_STATE);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="volunteer-form card">
      <h3>{existingVolunteer ? 'Edit Volunteer' : 'Add New Volunteer'}</h3>
      <div>
        <label htmlFor="name">Name:</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label htmlFor="preferredFrequency">Preferred Frequency:</label>
        <select
          id="preferredFrequency"
          name="preferredFrequency"
          value={formData.preferredFrequency}
          onChange={handleChange}
        >
          <option value="weekly">Once a week</option>
          <option value="fortnightly">Once every two weeks</option>
          <option value="monthly">Once a month (approx. every 4 weeks)</option>
          {/* --- NEW OPTION ADDED --- */}
          <option value="bimonthly">Once every two months (approx. every 8 weeks)</option>
        </select>
      </div>
      <div>
        <label>Unavailable Months:</label>
        <div className="months-checkbox-group">
          {MONTH_NAMES.map((month, index) => (
            <div key={index} className="month-checkbox-item">
              <input
                type="checkbox"
                id={`month-${index}`}
                value={index}
                checked={formData.unavailableMonths.includes(index.toString())}
                onChange={handleMonthChange}
              />
              <label htmlFor={`month-${index}`}>{month}</label>
            </div>
          ))}
        </div>
      </div>
      <button type="submit">{existingVolunteer ? 'Save Changes' : 'Add Volunteer'}</button>
      {existingVolunteer && <button type="button" onClick={() => onSubmit(null, true)}>Cancel Edit</button>}
    </form>
  );
}

export default VolunteerForm;