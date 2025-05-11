// src/App.jsx
import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import MinistryManager from './components/MinistryManager'; // NEW
import VolunteerForm from './components/VolunteerForm';
import VolunteerList from './components/VolunteerList';
import RosterDisplay from './components/RosterDisplay';
import { getScheduledDatesForPeriod, DAYS_OF_WEEK, MONTH_NAMES } from './utils/dateUtils';
import './App.css';

const OCCURRENCE_OPTIONS = ['every', '1st', '2nd', '3rd', '4th', '5th', 'last'];
const currentSystemDate = new Date();
const currentSystemYear = currentSystemDate.getFullYear();
const currentSystemMonth = currentSystemDate.getMonth();

function App() {
  // EXISTING STATES for volunteers, roster, period, scheduleRule
  const [volunteers, setVolunteers] = useState(() => JSON.parse(localStorage.getItem('volunteers') || '[]'));
  const [roster, setRoster] = useState(() => {
     const saved = localStorage.getItem('roster_v2'); // Use new key for new structure
     return saved ? JSON.parse(saved).map(entry => ({ ...entry, date: new Date(entry.date) })) : [];
  });
  const [editingVolunteer, setEditingVolunteer] = useState(null);
  const [startYear, setStartYear] = useState(() => parseInt(localStorage.getItem('startYear') || currentSystemYear.toString(), 10));
  const [startMonth, setStartMonth] = useState(() => parseInt(localStorage.getItem('startMonth') || currentSystemMonth.toString(), 10));
  const [endYear, setEndYear] = useState(() => parseInt(localStorage.getItem('endYear') || currentSystemYear.toString(), 10));
  const [endMonth, setEndMonth] = useState(() => parseInt(localStorage.getItem('endMonth') || '11', 10));
  const [scheduleRule, setScheduleRule] = useState(() => JSON.parse(localStorage.getItem('scheduleRule') || JSON.stringify({ dayOfWeek: '0', occurrences: ['every'] })));

  // NEW STATE for ministries
  const [ministries, setMinistries] = useState(() => JSON.parse(localStorage.getItem('ministries') || '[]'));

  // useEffect hooks for persistence (add one for ministries)
  useEffect(() => localStorage.setItem('volunteers', JSON.stringify(volunteers)), [volunteers]);
  useEffect(() => localStorage.setItem('roster_v2', JSON.stringify(roster)), [roster]); // Use new key
  useEffect(() => localStorage.setItem('scheduleRule', JSON.stringify(scheduleRule)), [scheduleRule]);
  useEffect(() => localStorage.setItem('startYear', startYear.toString()), [startYear]);
  useEffect(() => localStorage.setItem('startMonth', startMonth.toString()), [startMonth]);
  useEffect(() => localStorage.setItem('endYear', endYear.toString()), [endYear]);
  useEffect(() => localStorage.setItem('endMonth', endMonth.toString()), [endMonth]);
  useEffect(() => localStorage.setItem('ministries', JSON.stringify(ministries)), [ministries]); // NEW

  // Ministry Management Handlers
  const handleAddMinistry = (newMinistry) => {
    if (ministries.find(m => m.name.toLowerCase() === newMinistry.name.toLowerCase())) {
        alert("A ministry with this name already exists.");
        return;
    }
    setMinistries(prev => [...prev, newMinistry]);
  };

  const handleDeleteMinistry = (ministryId) => {
    if (window.confirm("Are you sure you want to delete this ministry? This will also remove it from all volunteers and clear the current roster.")) {
        setMinistries(prev => prev.filter(m => m.id !== ministryId));
        // Also remove this ministryId from all volunteers
        setVolunteers(prevVols => prevVols.map(v => ({
            ...v,
            ministryIds: v.ministryIds ? v.ministryIds.filter(mid => mid !== ministryId) : []
        })));
        setRoster([]); // Roster invalid
    }
  };
  
  const handleDateConfigChange = (setter, value) => {/* ... same ... */
    setter(parseInt(value, 10));
  };
  const handleScheduleRuleChange = (e) => {/* ... same ... */
    const { name, value } = e.target;
    setScheduleRule(prev => ({ ...prev, [name]: value }));
  };
  const handleOccurrenceChange = (e) => {/* ... same ... */
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
  const handleAddOrUpdateVolunteer = (volunteerData, cancelEdit = false) => {/* ... same ... */
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
      setVolunteers(prev => [...prev, { id: `v_${nanoid()}`, ...volunteerData, assignmentsCount: 0, lastServedDate: null }]);
    }
  };
  const handleEditVolunteer = (volunteer) => setEditingVolunteer(volunteer);
  const handleDeleteVolunteer = (volunteerId) => {/* ... (same as before) ... */
     if (window.confirm("Are you sure you want to delete this volunteer? This will clear the current roster.")) {
        setVolunteers(prev => prev.filter(v => v.id !== volunteerId));
        setRoster([]);
    }
  };


  // --- HEAVILY MODIFIED generateRoster FUNCTION ---
  const generateRoster = () => {
    // Validations
    if (endYear < startYear || (endYear === startYear && endMonth < startMonth)) { /* ... */ }
    if (volunteers.length === 0) { alert("Add volunteers."); return; }
    if (ministries.length === 0) { alert("Define ministries first."); return; }
    if (scheduleRule.occurrences.length === 0) { /* ... */ }
    if (scheduleRule.occurrences.includes('every') && scheduleRule.occurrences.length > 1) { /* ... */ }

    const scheduledDates = getScheduledDatesForPeriod(startYear, startMonth, endYear, endMonth, scheduleRule);
    if (scheduledDates.length === 0) { /* ... */ }

    // Initialize roster with new structure
    let newRoster = scheduledDates.map(date => ({
      date,
      assignmentsByMinistry: ministries.reduce((acc, ministry) => {
        acc[ministry.id] = []; // Initialize empty array for each ministry's assignments
        return acc;
      }, {})
    }));

    let schedulableVolunteers = volunteers.map(v => ({
      ...v,
      assignmentsThisPeriod: 0,
      lastServedRosterDate: null,
    }));

    newRoster.forEach(rosterEntry => { // For each scheduled DATE
      const currentScheduledDate = rosterEntry.date;
      const currentMonthValue = currentScheduledDate.getMonth();
      let volunteersAssignedOnThisDate = new Set(); // Track volunteers assigned on THIS specific date to any ministry

      ministries.forEach(ministry => { // For each MINISTRY on this date
        let spotsFilledForThisMinistry = rosterEntry.assignmentsByMinistry[ministry.id]?.length || 0;
        let spotsToFill = ministry.minVolunteers - spotsFilledForThisMinistry;

        while (spotsToFill > 0) {
          let potentialCandidatesForMinistry = schedulableVolunteers.filter(vol => {
            if (volunteersAssignedOnThisDate.has(vol.id)) return false; // Already assigned to A ministry on this date
            if (vol.unavailableMonths.includes(currentMonthValue)) return false;
            if (!vol.ministryIds || !vol.ministryIds.includes(ministry.id)) return false; // Can't serve this ministry

            if (vol.lastServedRosterDate) {
              const weeksSinceLastServed = (currentScheduledDate.getTime() - vol.lastServedRosterDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
              if (vol.preferredFrequency === 'weekly' && weeksSinceLastServed < 0.8) return false;
              if (vol.preferredFrequency === 'fortnightly' && weeksSinceLastServed < 1.8) return false;
              if (vol.preferredFrequency === 'monthly' && weeksSinceLastServed < 3.8) return false;
              if (vol.preferredFrequency === 'bimonthly' && weeksSinceLastServed < 7.8) return false;
            }
            return true;
          });

          potentialCandidatesForMinistry.sort((a, b) => { // Sort remaining candidates
            if (a.lastServedRosterDate && b.lastServedRosterDate) {
              if (a.lastServedRosterDate.getTime() !== b.lastServedRosterDate.getTime()) return a.lastServedRosterDate.getTime() - b.lastServedRosterDate.getTime();
            } else if (a.lastServedRosterDate) return 1;
            else if (b.lastServedRosterDate) return -1;
            return a.assignmentsThisPeriod - b.assignmentsThisPeriod;
          });

          if (potentialCandidatesForMinistry.length === 0) break; // No more eligible volunteers for this ministry slot

          const chosenVolunteer = potentialCandidatesForMinistry[0];
          rosterEntry.assignmentsByMinistry[ministry.id].push(chosenVolunteer.id);
          volunteersAssignedOnThisDate.add(chosenVolunteer.id);

          // Update overall service tracking for the volunteer
          const volunteerInPool = schedulableVolunteers.find(v => v.id === chosenVolunteer.id);
          if (volunteerInPool) {
            volunteerInPool.lastServedRosterDate = currentScheduledDate;
            volunteerInPool.assignmentsThisPeriod += 1;
          }
          spotsToFill--;
        } // End while spotsToFill for this ministry
      }); // End of ministries loop for this date
    }); // End of dates loop

    setRoster(newRoster);
    alert(`Roster generated for ${MONTH_NAMES[startMonth]} ${startYear} - ${MONTH_NAMES[endMonth]} ${endYear}!`);
  };
  // --- END OF HEAVILY MODIFIED generateRoster FUNCTION ---

  const rosterPeriodDescription = `for ${MONTH_NAMES[startMonth]} ${startYear} - ${MONTH_NAMES[endMonth]} ${endYear}`;

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

        {/* NEW: Ministry Manager */}
        <MinistryManager
          ministries={ministries}
          onAddMinistry={handleAddMinistry}
          onDeleteMinistry={handleDeleteMinistry}
        />

        <div className="controls-section">
          {/* MODIFIED: Pass ministries to VolunteerForm */}
          <VolunteerForm
            onSubmit={handleAddOrUpdateVolunteer}
            existingVolunteer={editingVolunteer}
            ministries={ministries}
          />
          <button onClick={generateRoster} className="generate-roster-btn card">
            Generate/Re-generate Roster {rosterPeriodDescription}
          </button>
        </div>
        {/* MODIFIED: Pass ministries to VolunteerList to display them */}
        <VolunteerList volunteers={volunteers} onEdit={handleEditVolunteer} onDelete={handleDeleteVolunteer} ministries={ministries} />
        {/* MODIFIED: Pass ministries to RosterDisplay */}
        <RosterDisplay roster={roster} volunteers={volunteers} ministries={ministries} startYear={startYear} startMonth={startMonth} endYear={endYear} endMonth={endMonth} />
      </main>
    </div>
  );
}

export default App;