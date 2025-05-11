// src/components/VolunteerForm.jsx
import { useState, useEffect } from 'react';
import { MONTH_NAMES } from '../utils/dateUtils';

const INITIAL_FORM_STATE = {
  name: '',
  preferredFrequency: 'monthly',
  unavailableMonths: [],
  ministryIds: [], // NEW: For storing selected ministry IDs
};

// MODIFIED: Add ministries prop
function VolunteerForm({ onSubmit, existingVolunteer, ministries }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  useEffect(() => {
    if (existingVolunteer) {
      setFormData({
        name: existingVolunteer.name || '',
        preferredFrequency: existingVolunteer.preferredFrequency || 'monthly',
        unavailableMonths: (existingVolunteer.unavailableMonths || []).map(String),
        ministryIds: existingVolunteer.ministryIds || [], // NEW
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
  }, [existingVolunteer]);

  const handleChange = (e) => {/* ... same ... */
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleMonthChange = (e) => {/* ... same ... */
    const { value, checked } = e.target;
    const monthIndex = parseInt(value);
    setFormData(prev => {
      const newUnavailableMonths = checked
        ? [...prev.unavailableMonths, monthIndex.toString()]
        : prev.unavailableMonths.filter(m => m !== monthIndex.toString());
      return { ...prev, unavailableMonths: newUnavailableMonths };
    });
  };

  // NEW: Handler for ministry selection
  const handleMinistryChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newMinistryIds = checked
        ? [...prev.ministryIds, value]
        : prev.ministryIds.filter(id => id !== value);
      return { ...prev, ministryIds: newMinistryIds };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter a volunteer name.');
      return;
    }
    // NEW: Ensure at least one ministry is selected (optional, based on requirements)
    // if (formData.ministryIds.length === 0) {
    //   alert('Please select at least one ministry for the volunteer.');
    //   return;
    // }
    onSubmit({
      ...formData,
      unavailableMonths: formData.unavailableMonths.map(Number),
      // ministryIds are already in correct format (array of strings)
    });
    if (!existingVolunteer) {
      setFormData(INITIAL_FORM_STATE);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="volunteer-form card">
      <h3>{existingVolunteer ? 'Edit Volunteer' : 'Add New Volunteer'}</h3>
      {/* Name and Frequency inputs ... same ... */}
      <div>
        <label htmlFor="name">Name:</label>
        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <label htmlFor="preferredFrequency">Preferred Frequency:</label>
        <select id="preferredFrequency" name="preferredFrequency" value={formData.preferredFrequency} onChange={handleChange}>
          <option value="weekly">Once a week</option>
          <option value="fortnightly">Once every two weeks</option>
          <option value="monthly">Once a month (approx. every 4 weeks)</option>
          <option value="bimonthly">Once every two months (approx. every 8 weeks)</option>
        </select>
      </div>

      {/* Unavailable Months input ... same ... */}
       <div>
        <label>Unavailable Months:</label>
        <div className="months-checkbox-group">
          {MONTH_NAMES.map((month, index) => (
            <div key={index} className="month-checkbox-item">
              <input type="checkbox" id={`month-${index}`} value={index.toString()} checked={formData.unavailableMonths.includes(index.toString())} onChange={handleMonthChange} />
              <label htmlFor={`month-${index}`}>{month}</label>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Ministry Selection */}
      <div>
        <label>Can Serve In Ministries:</label>
        {ministries.length === 0 ? <p><small>No ministries defined yet. Please add ministries first.</small></p> : (
            <div className="ministries-checkbox-group">
            {ministries.map(ministry => (
                <div key={ministry.id} className="ministry-checkbox-item">
                <input
                    type="checkbox"
                    id={`ministry-${ministry.id}`}
                    value={ministry.id}
                    checked={formData.ministryIds.includes(ministry.id)}
                    onChange={handleMinistryChange}
                />
                <label htmlFor={`ministry-${ministry.id}`}>{ministry.name}</label>
                </div>
            ))}
            </div>
        )}
      </div>

      <button type="submit">{existingVolunteer ? 'Save Changes' : 'Add Volunteer'}</button>
      {existingVolunteer && <button type="button" onClick={() => onSubmit(null, true)}>Cancel Edit</button>}
    </form>
  );
}

export default VolunteerForm;