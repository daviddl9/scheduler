// src/App.jsx
import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import VolunteerForm from './components/VolunteerForm';
import VolunteerList from './components/VolunteerList';
import RosterDisplay from './components/RosterDisplay';
// MODIFIED: Import getScheduledDatesInYear instead of getAllSundaysInYear
import { getScheduledDatesInYear, DAYS_OF_WEEK } from './utils/dateUtils';
import './App.css';

const ROSTER_YEAR = 2025;

// NEW: Define options for schedule rule configuration
const OCCURRENCE_OPTIONS = ['every', '1st', '2nd', '3rd', '4th', '5th', 'last'];

function App() {
  const [volunteers, setVolunteers] = useState(() => {
    const savedVolunteers = localStorage.getItem('volunteers');
    return savedVolunteers ? JSON.parse(savedVolunteers) : [];
  });
  const [roster, setRoster] = useState(() => {
     const savedRoster = localStorage.getItem('roster');
     if (savedRoster) {
        const parsedRoster = JSON.parse(savedRoster);
        return parsedRoster.map(entry => ({ ...entry, date: new Date(entry.date) }));
     }
     return [];
  });
  const [editingVolunteer, setEditingVolunteer] = useState(null);

  // NEW: State for schedule rule
  const [scheduleRule, setScheduleRule] = useState(() => {
    const savedRule = localStorage.getItem('scheduleRule');
    return savedRule ? JSON.parse(savedRule) : {
      dayOfWeek: '0', // Sunday by default, stored as string for select compatibility
      occurrences: ['every'], // Default to every occurrence of the selected day
    };
  });

  useEffect(() => {
    localStorage.setItem('volunteers', JSON.stringify(volunteers));
  }, [volunteers]);

  useEffect(() => {
    localStorage.setItem('roster', JSON.stringify(roster));
  }, [roster]);

  // NEW: Effect to save schedule rule
  useEffect(() => {
    localStorage.setItem('scheduleRule', JSON.stringify(scheduleRule));
    // If rule changes, it's good practice to clear the old roster
    // as it might no longer be valid for the new rule.
    // setRoster([]); // Optional: Uncomment to clear roster on rule change
  }, [scheduleRule]);

  const handleScheduleRuleChange = (e) => {
    const { name, value } = e.target;
    setScheduleRule(prev => ({ ...prev, [name]: value }));
  };

 const handleOccurrenceChange = (e) => {
    const { value, checked } = e.target; // 'value' is the option being changed, 'checked' is its new state.
    setScheduleRule(prev => {
      let updatedOccurrences;

      if (value === 'every') {
        // If 'every' checkbox is interacted with
        if (checked) {
          updatedOccurrences = ['every']; // Check 'every', this becomes the sole selection.
        } else {
          updatedOccurrences = []; // Uncheck 'every'. Array becomes empty, allowing user to pick specifics.
        }
      } else {
        // If a specific occurrence (1st, 2nd, etc.) is interacted with
        // Start with current specifics, or an empty array if 'every' was previously the selection.
        let currentSpecifics = prev.occurrences.includes('every') ? [] : prev.occurrences.filter(o => o !== 'every');

        if (checked) {
          // Add the specific occurrence if not already present
          if (!currentSpecifics.includes(value)) {
            currentSpecifics.push(value);
          }
          updatedOccurrences = currentSpecifics; // Now only specifics are selected
        } else {
          // Remove the specific occurrence
          updatedOccurrences = currentSpecifics.filter(o => o !== value);
        }
      }
      
      // No automatic defaulting back to ['every'] if the array becomes empty here.
      // An empty array is a valid intermediate state if the user unchecks 'every'
      // or unchecks the last specific day.
      // Validation for an empty/invalid selection will happen in generateRosterForYear.
      return { ...prev, occurrences: updatedOccurrences };
    });
  };


  const handleAddOrUpdateVolunteer = (volunteerData, cancelEdit = false) => {
    if (cancelEdit) {
        setEditingVolunteer(null);
        return;
    }
    if (editingVolunteer) {
      setVolunteers(prev =>
        prev.map(v => (v.id === editingVolunteer.id ? { ...v, ...volunteerData } : v))
      );
      setEditingVolunteer(null);
    } else {
      setVolunteers(prev => [...prev, { id: nanoid(), ...volunteerData, assignmentsCount: 0, lastServedDate: null }]);
    }
    // setRoster([]); // Clear roster as volunteer data might affect it
  };

  const handleEditVolunteer = (volunteer) => {
    setEditingVolunteer(volunteer);
  };

  const handleDeleteVolunteer = (volunteerId) => {
    if (window.confirm("Are you sure you want to delete this volunteer? This will clear the current roster.")) {
        setVolunteers(prev => prev.filter(v => v.id !== volunteerId));
        setRoster([]);
    }
  };

  const generateRosterForYear = () => {
    if (volunteers.length === 0) {
      alert("Please add volunteers before generating a roster.");
      return;
    }
    if (scheduleRule.occurrences.length === 0 || (scheduleRule.occurrences.length > 1 && scheduleRule.occurrences.includes('every'))) {
      alert("Please select valid occurrences for the schedule rule (e.g., 'every' or specific ones like '1st', '3rd'). 'Every' cannot be mixed with specific occurrences.");
      // Fix rule if 'every' is mixed
      if (scheduleRule.occurrences.includes('every') && scheduleRule.occurrences.length > 1) {
        setScheduleRule(prev => ({...prev, occurrences: ['every']}));
        alert("Rule corrected to 'every'. Please generate again if this was not intended.");
      }
      return;
    }


    // MODIFIED: Use getScheduledDatesInYear with the current scheduleRule
    const scheduledDates = getScheduledDatesInYear(ROSTER_YEAR, scheduleRule);

    if (scheduledDates.length === 0) {
        alert(`No dates found for the year ${ROSTER_YEAR} with the current schedule rule. Please adjust the rule.`);
        setRoster([]);
        return;
    }

    let newRoster = scheduledDates.map(date => ({ date, assignedVolunteers: [] }));
    let schedulableVolunteers = volunteers.map(v => ({
      ...v,
      assignmentsThisYear: 0,
      lastServedRosterDate: null,
    }));

    newRoster.forEach(entry => {
      const currentScheduledDate = entry.date;
      const currentMonth = currentScheduledDate.getMonth();

      let potentialCandidates = schedulableVolunteers.filter(vol => {
        if (vol.unavailableMonths.includes(currentMonth)) return false;
        if (vol.lastServedRosterDate) {
          const weeksSinceLastServed = (currentScheduledDate.getTime() - vol.lastServedRosterDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
          if (vol.preferredFrequency === 'weekly' && weeksSinceLastServed < 0.8) return false;
          if (vol.preferredFrequency === 'fortnightly' && weeksSinceLastServed < 1.8) return false;
          if (vol.preferredFrequency === 'monthly' && weeksSinceLastServed < 3.8) return false;
        }
        return true;
      });
      
      potentialCandidates.sort((a, b) => {
        if (a.lastServedRosterDate && b.lastServedRosterDate) {
          if (a.lastServedRosterDate.getTime() !== b.lastServedRosterDate.getTime()) {
            return a.lastServedRosterDate.getTime() - b.lastServedRosterDate.getTime();
          }
        } else if (a.lastServedRosterDate) {
          return 1;
        } else if (b.lastServedRosterDate) {
          return -1;
        }
        return a.assignmentsThisYear - b.assignmentsThisYear;
      });

      if (potentialCandidates.length > 0) {
        const chosenVolunteer = potentialCandidates[0];
        entry.assignedVolunteers.push(chosenVolunteer.id);
        const volunteerInPool = schedulableVolunteers.find(v => v.id === chosenVolunteer.id);
        if (volunteerInPool) {
          volunteerInPool.lastServedRosterDate = currentScheduledDate;
          volunteerInPool.assignmentsThisYear += 1;
        }
      } else {
        entry.assignedVolunteers.push('UNASSIGNED');
      }
    });

    setRoster(newRoster);
    alert(`Roster generated for ${ROSTER_YEAR} based on the new rule!`);
  };

  return (
    <div className="app-container">
      <header>
        <h1>AutoRoster - {ROSTER_YEAR}</h1>
      </header>
      <main>
        {/* NEW: Schedule Rule Configuration UI */}
        <div className="schedule-rule-config card">
          <h3>Configure Schedule Rule</h3>
          <div>
            <label htmlFor="dayOfWeek">Day of the Week:</label>
            <select
              name="dayOfWeek"
              id="dayOfWeek"
              value={scheduleRule.dayOfWeek}
              onChange={handleScheduleRuleChange}
            >
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Occurrences in Month:</label>
            <div className="occurrences-checkbox-group">
              {OCCURRENCE_OPTIONS.map(opt => (
                <div key={opt}>
                  <input
                    type="checkbox"
                    id={`occurrence-${opt}`}
                    value={opt}
                    checked={scheduleRule.occurrences.includes(opt)}
                    onChange={handleOccurrenceChange}
                    // Disable specific options if 'every' is checked, and vice-versa
                    disabled={(opt !== 'every' && scheduleRule.occurrences.includes('every')) || 
                               (opt === 'every' && scheduleRule.occurrences.length > 1 && !scheduleRule.occurrences.includes('every'))}
                  />
                  <label htmlFor={`occurrence-${opt}`}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</label>
                </div>
              ))}
            </div>
             <small>Select 'every' OR one or more specific occurrences (e.g., 1st, 3rd). </small>
          </div>
        </div>

        <div className="controls-section">
          <VolunteerForm onSubmit={handleAddOrUpdateVolunteer} existingVolunteer={editingVolunteer} />
          <button onClick={generateRosterForYear} className="generate-roster-btn card">
            Generate/Re-generate Roster for {ROSTER_YEAR}
          </button>
        </div>
        <VolunteerList volunteers={volunteers} onEdit={handleEditVolunteer} onDelete={handleDeleteVolunteer} />
        <RosterDisplay roster={roster} volunteers={volunteers} />
      </main>
    </div>
  );
}

export default App;