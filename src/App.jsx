// src/App.jsx
import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import VolunteerForm from './components/VolunteerForm';
import VolunteerList from './components/VolunteerList';
import RosterDisplay from './components/RosterDisplay';
import { getScheduledDatesForPeriod, DAYS_OF_WEEK, MONTH_NAMES } from './utils/dateUtils';
import './App.css';

const OCCURRENCE_OPTIONS = ['every', '1st', '2nd', '3rd', '4th', '5th', 'last'];

const currentSystemDate = new Date();
const currentSystemYear = currentSystemDate.getFullYear();
const currentSystemMonth = currentSystemDate.getMonth(); // 0-11

function App() {
  const [volunteers, setVolunteers] = useState(() => JSON.parse(localStorage.getItem('volunteers') || '[]'));
  const [roster, setRoster] = useState(() => {
     const saved = localStorage.getItem('roster');
     return saved ? JSON.parse(saved).map(entry => ({ ...entry, date: new Date(entry.date) })) : [];
  });
  const [editingVolunteer, setEditingVolunteer] = useState(null);

  // MODIFIED: Date configuration states
  const [startYear, setStartYear] = useState(() => parseInt(localStorage.getItem('startYear') || currentSystemYear.toString(), 10));
  const [startMonth, setStartMonth] = useState(() => parseInt(localStorage.getItem('startMonth') || currentSystemMonth.toString(), 10));
  const [endYear, setEndYear] = useState(() => parseInt(localStorage.getItem('endYear') || currentSystemYear.toString(), 10));
  const [endMonth, setEndMonth] = useState(() => parseInt(localStorage.getItem('endMonth') || '11', 10)); // Default to Dec of startYear

  const [scheduleRule, setScheduleRule] = useState(() => JSON.parse(localStorage.getItem('scheduleRule') || JSON.stringify({
      dayOfWeek: '0',
      occurrences: ['every'],
  })));

  useEffect(() => localStorage.setItem('volunteers', JSON.stringify(volunteers)), [volunteers]);
  useEffect(() => localStorage.setItem('roster', JSON.stringify(roster)), [roster]);
  useEffect(() => localStorage.setItem('scheduleRule', JSON.stringify(scheduleRule)), [scheduleRule]);

  useEffect(() => localStorage.setItem('startYear', startYear.toString()), [startYear]);
  useEffect(() => localStorage.setItem('startMonth', startMonth.toString()), [startMonth]);
  useEffect(() => localStorage.setItem('endYear', endYear.toString()), [endYear]);
  useEffect(() => localStorage.setItem('endMonth', endMonth.toString()), [endMonth]);

  const handleDateConfigChange = (setter, value) => {
    setter(parseInt(value, 10));
    // setRoster([]); // Optionally clear roster when period changes
  };
  
  const handleScheduleRuleChange = (e) => {/* ... (same as before) ... */
    const { name, value } = e.target;
    setScheduleRule(prev => ({ ...prev, [name]: value }));
  };
  const handleOccurrenceChange = (e) => {/* ... (same as before, using corrected version) ... */
    const { value, checked } = e.target;
    setScheduleRule(prev => {
      let updatedOccurrences;
      if (value === 'every') {
        updatedOccurrences = checked ? ['every'] : [];
      } else {
        let currentSpecifics = prev.occurrences.filter(o => o !== 'every');
        if (checked) {
          if (!currentSpecifics.includes(value)) currentSpecifics.push(value);
          updatedOccurrences = currentSpecifics;
        } else {
          updatedOccurrences = currentSpecifics.filter(o => o !== value);
        }
      }
      return { ...prev, occurrences: updatedOccurrences };
    });
  };
  const handleAddOrUpdateVolunteer = (volunteerData, cancelEdit = false) => {/* ... (same as before) ... */
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
  };
  const handleEditVolunteer = (volunteer) => setEditingVolunteer(volunteer);
  const handleDeleteVolunteer = (volunteerId) => {/* ... (same as before) ... */
    if (window.confirm("Are you sure you want to delete this volunteer? This will clear the current roster.")) {
        setVolunteers(prev => prev.filter(v => v.id !== volunteerId));
        setRoster([]);
    }
  };

  const generateRoster = () => {
        // ... (initial validations for period, volunteers, scheduleRule occurrences remain the same) ...
        if (endYear < startYear || (endYear === startYear && endMonth < startMonth)) {
          alert("End date cannot be before start date. Please adjust the period.");
          return;
        }
        if (volunteers.length === 0) { /* ... */ }
        if (scheduleRule.occurrences.length === 0) { /* ... */ }
        if (scheduleRule.occurrences.includes('every') && scheduleRule.occurrences.length > 1) { /* ... */ }


        const scheduledDates = getScheduledDatesForPeriod(startYear, startMonth, endYear, endMonth, scheduleRule);

        if (scheduledDates.length === 0) { /* ... */ }

        let newRoster = scheduledDates.map(date => ({ date, assignedVolunteers: [] }));
        let schedulableVolunteers = volunteers.map(v => ({
            ...v,
            assignmentsThisPeriod: 0,
            lastServedRosterDate: null,
        }));

        newRoster.forEach(entry => {
            const currentScheduledDate = entry.date;
            const currentMonthValue = currentScheduledDate.getMonth();

            let potentialCandidates = schedulableVolunteers.filter(vol => {
                if (vol.unavailableMonths.includes(currentMonthValue)) return false;

                if (vol.lastServedRosterDate) {
                    const weeksSinceLastServed = (currentScheduledDate.getTime() - vol.lastServedRosterDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
                    
                    if (vol.preferredFrequency === 'weekly' && weeksSinceLastServed < 0.8) return false;
                    if (vol.preferredFrequency === 'fortnightly' && weeksSinceLastServed < 1.8) return false;
                    if (vol.preferredFrequency === 'monthly' && weeksSinceLastServed < 3.8) return false;
                    // --- NEW CONDITION FOR BI-MONTHLY ---
                    if (vol.preferredFrequency === 'bimonthly' && weeksSinceLastServed < 7.8) return false; // Approx. 8 weeks (just under)
                }
                return true;
            });
            
            // ... (sorting logic for potentialCandidates remains the same) ...
            potentialCandidates.sort((a, b) => {
              if (a.lastServedRosterDate && b.lastServedRosterDate) {
                if (a.lastServedRosterDate.getTime() !== b.lastServedRosterDate.getTime()) {
                  return a.lastServedRosterDate.getTime() - b.lastServedRosterDate.getTime();
                }
              } else if (a.lastServedRosterDate) return 1;
              else if (b.lastServedRosterDate) return -1;
              return a.assignmentsThisPeriod - b.assignmentsThisPeriod;
            });

            // ... (assignment logic remains the same) ...
            if (potentialCandidates.length > 0) {
              const chosenVolunteer = potentialCandidates[0];
              entry.assignedVolunteers.push(chosenVolunteer.id);
              const volunteerInPool = schedulableVolunteers.find(v => v.id === chosenVolunteer.id);
              if (volunteerInPool) {
                volunteerInPool.lastServedRosterDate = currentScheduledDate;
                volunteerInPool.assignmentsThisPeriod += 1;
              }
            } else {
              entry.assignedVolunteers.push('UNASSIGNED');
            }
        });

        setRoster(newRoster);
        alert(`Roster generated for ${MONTH_NAMES[startMonth]} ${startYear} - ${MONTH_NAMES[endMonth]} ${endYear}!`);
    };

    const rosterPeriodDescription = `for ${MONTH_NAMES[startMonth]} ${startYear} - ${MONTH_NAMES[endMonth]} ${endYear}`;

    // ... (return JSX remains the same, ensure VolunteerForm is rendered)
    return (
        <div className="app-container">
          <header>
            <h1>AutoRoster <span className="header-period-info">{rosterPeriodDescription}</span></h1>
          </header>
          <main>
            <div className="period-config card"> {/* ... Period config UI ... */}
                <h3>Configure Roster Period</h3>
                <div className="period-config-grid">
                    <div>
                        <label htmlFor="startYear">Start Year:</label>
                        <input type="number" id="startYear" value={startYear} onChange={(e) => handleDateConfigChange(setStartYear, e.target.value)} min="2000" max="2050"/>
                    </div>
                    <div>
                        <label htmlFor="startMonth">Start Month:</label>
                        <select id="startMonth" value={startMonth} onChange={(e) => handleDateConfigChange(setStartMonth, e.target.value)}>
                            {MONTH_NAMES.map((month, index) => (<option key={`start-${index}`} value={index}>{month}</option>))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="endYear">End Year:</label>
                        <input type="number" id="endYear" value={endYear} onChange={(e) => handleDateConfigChange(setEndYear, e.target.value)} min="2000" max="2050"/>
                    </div>
                    <div>
                        <label htmlFor="endMonth">End Month:</label>
                        <select id="endMonth" value={endMonth} onChange={(e) => handleDateConfigChange(setEndMonth, e.target.value)}>
                            {MONTH_NAMES.map((month, index) => (<option key={`end-${index}`} value={index}>{month}</option>))}
                        </select>
                    </div>
                </div>
            </div>
    
            <div className="schedule-rule-config card"> {/* ... Schedule rule UI ... */}
                <h3>Configure Schedule Rule</h3>
                <div> 
                    <label htmlFor="dayOfWeek">Day of the Week:</label>
                    <select name="dayOfWeek" id="dayOfWeek" value={scheduleRule.dayOfWeek} onChange={handleScheduleRuleChange}>
                        {DAYS_OF_WEEK.map((day, index) => (<option key={index} value={index}>{day}</option>))}
                    </select>
                </div>
                <div> 
                    <label>Occurrences in Month:</label>
                    <div className="occurrences-checkbox-group">
                        {OCCURRENCE_OPTIONS.map(opt => (
                            <div key={opt}>
                            <input type="checkbox" id={`occurrence-${opt}`} value={opt} checked={scheduleRule.occurrences.includes(opt)} onChange={handleOccurrenceChange}
                                disabled={(opt !== 'every' && scheduleRule.occurrences.includes('every')) || (opt === 'every' && scheduleRule.occurrences.some(o => o !== 'every'))}/>
                            <label htmlFor={`occurrence-${opt}`}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</label>
                            </div>
                        ))}
                    </div>
                    <small>Select 'every' OR one or more specific occurrences.</small>
                </div>
            </div>
    
            <div className="controls-section">
              <VolunteerForm onSubmit={handleAddOrUpdateVolunteer} existingVolunteer={editingVolunteer} />
              <button onClick={generateRoster} className="generate-roster-btn card">
                Generate/Re-generate Roster {rosterPeriodDescription}
              </button>
            </div>
            <VolunteerList volunteers={volunteers} onEdit={handleEditVolunteer} onDelete={handleDeleteVolunteer} />
            <RosterDisplay roster={roster} volunteers={volunteers} startYear={startYear} startMonth={startMonth} endYear={endYear} endMonth={endMonth} />
          </main>
        </div>
      );
}

export default App;