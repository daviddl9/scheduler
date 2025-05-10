// src/App.jsx
import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import VolunteerForm from './components/VolunteerForm';
import VolunteerList from './components/VolunteerList';
import RosterDisplay from './components/RosterDisplay';
import { getAllSundaysInYear } from './utils/dateUtils';
import './App.css'; // We'll update this for basic styling

const ROSTER_YEAR = 2025; // Or make this configurable

function App() {
  const [volunteers, setVolunteers] = useState(() => {
    const savedVolunteers = localStorage.getItem('volunteers');
    return savedVolunteers ? JSON.parse(savedVolunteers) : [];
  });
  const [roster, setRoster] = useState(() => {
     const savedRoster = localStorage.getItem('roster');
     // Need to re-hydrate date objects
     if (savedRoster) {
        const parsedRoster = JSON.parse(savedRoster);
        return parsedRoster.map(entry => ({
            ...entry,
            date: new Date(entry.date)
        }));
     }
     return [];
  });
  const [editingVolunteer, setEditingVolunteer] = useState(null);

  useEffect(() => {
    localStorage.setItem('volunteers', JSON.stringify(volunteers));
  }, [volunteers]);

  useEffect(() => {
    localStorage.setItem('roster', JSON.stringify(roster));
  }, [roster]);


  const handleAddOrUpdateVolunteer = (volunteerData, cancelEdit = false) => {
    if (cancelEdit) {
        setEditingVolunteer(null);
        return;
    }

    if (editingVolunteer) {
      // Update existing volunteer
      setVolunteers(prev =>
        prev.map(v => (v.id === editingVolunteer.id ? { ...v, ...volunteerData } : v))
      );
      setEditingVolunteer(null);
    } else {
      // Add new volunteer
      setVolunteers(prev => [...prev, { id: nanoid(), ...volunteerData, assignmentsCount: 0, lastServedDate: null }]);
    }
  };

  const handleEditVolunteer = (volunteer) => {
    setEditingVolunteer(volunteer);
  };

  const handleDeleteVolunteer = (volunteerId) => {
    if (window.confirm("Are you sure you want to delete this volunteer? This will clear the current roster.")) {
        setVolunteers(prev => prev.filter(v => v.id !== volunteerId));
        setRoster([]); // Clear roster as volunteer data changed
    }
  };

  const generateRosterForYear = () => {
    if (volunteers.length === 0) {
      alert("Please add volunteers before generating a roster.");
      return;
    }

    const sundays = getAllSundaysInYear(ROSTER_YEAR);
    let newRoster = sundays.map(date => ({ date, assignedVolunteers: [] }));

    // Create a working copy of volunteers to track assignments and last served dates for this generation
    let schedulableVolunteers = volunteers.map(v => ({
      ...v,
      assignmentsThisYear: 0,
      lastServedRosterDate: null, // Using Date objects for comparison
    }));

    newRoster.forEach(sundayEntry => {
      const currentSundayDate = sundayEntry.date;
      const currentMonth = currentSundayDate.getMonth();

      let potentialCandidates = schedulableVolunteers.filter(vol => {
        if (vol.unavailableMonths.includes(currentMonth)) return false;

        if (vol.lastServedRosterDate) {
          const weeksSinceLastServed = (currentSundayDate.getTime() - vol.lastServedRosterDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
          
          // Basic frequency check (can be made more robust)
          // Allow some buffer, e.g., 0.8 for weekly, 1.8 for fortnightly, 3.8 for monthly
          if (vol.preferredFrequency === 'weekly' && weeksSinceLastServed < 0.8) return false;
          if (vol.preferredFrequency === 'fortnightly' && weeksSinceLastServed < 1.8) return false;
          if (vol.preferredFrequency === 'monthly' && weeksSinceLastServed < 3.8) return false;
        }
        return true;
      });
      
      // Sort candidates:
      // 1. Volunteers who haven't served yet this year OR served longest ago
      // 2. Volunteers who have been assigned fewest times (to balance load)
      potentialCandidates.sort((a, b) => {
        if (a.lastServedRosterDate && b.lastServedRosterDate) {
          if (a.lastServedRosterDate.getTime() !== b.lastServedRosterDate.getTime()) {
            return a.lastServedRosterDate.getTime() - b.lastServedRosterDate.getTime(); // Earlier date first (more overdue)
          }
        } else if (a.lastServedRosterDate) { // a served, b didn't
          return 1; // Prioritize b (who has null lastServedRosterDate)
        } else if (b.lastServedRosterDate) { // b served, a didn't
          return -1; // Prioritize a
        }
        // If both haven't served or served at the same time, prioritize by fewest assignments
        return a.assignmentsThisYear - b.assignmentsThisYear;
      });

      if (potentialCandidates.length > 0) {
        const chosenVolunteer = potentialCandidates[0]; // Assign one volunteer per Sunday for now
        sundayEntry.assignedVolunteers.push(chosenVolunteer.id);

        // Update the chosen volunteer's info in the schedulableVolunteers array
        const volunteerInPool = schedulableVolunteers.find(v => v.id === chosenVolunteer.id);
        if (volunteerInPool) {
          volunteerInPool.lastServedRosterDate = currentSundayDate;
          volunteerInPool.assignmentsThisYear += 1;
        }
      } else {
        sundayEntry.assignedVolunteers.push('UNASSIGNED');
      }
    });

    setRoster(newRoster);
    alert("Roster generated for " + ROSTER_YEAR);
  };


  return (
    <div className="app-container">
      <header>
        <h1>AutoRoster - {ROSTER_YEAR}</h1>
      </header>
      <main>
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