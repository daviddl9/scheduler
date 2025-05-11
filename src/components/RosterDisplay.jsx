// src/components/RosterDisplay.jsx
import React, { useState } from 'react';
import { formatDate, MONTH_NAMES } from '../utils/dateUtils';

// MODIFIED: Accept full period props and a roster update function
function RosterDisplay({ roster, volunteers, ministries, startYear, startMonth, endYear, endMonth, setRoster }) {
  // Add state for drag and drop functionality
  const [draggedVolunteer, setDraggedVolunteer] = useState(null);
  const [draggedMinistryId, setDraggedMinistryId] = useState(null);
  const [draggedDateKey, setDraggedDateKey] = useState(null);
  
  if (ministries.length === 0) {
    return <p className="card">Please define ministries first to see the roster display.</p>;
  }
  if (!roster.length) {
    return <p className="card">No roster generated yet. Configure period/rule, add volunteers, and click "Generate Roster".</p>;
  }

  const getVolunteerName = (id) => {
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

  // Handle drag start
  const handleDragStart = (e, volunteerId, ministryId, dateKey) => {
    setDraggedVolunteer(volunteerId);
    setDraggedMinistryId(ministryId);
    setDraggedDateKey(dateKey);
    
    // Set data for drag operation
    e.dataTransfer.setData('text/plain', JSON.stringify({
      volunteerId,
      ministryId,
      dateKey
    }));
    
    // Set drag image and effects
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e) => {
    // Prevent default to allow drop
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop to swap volunteers
  const handleDrop = (e, targetVolunteerId, targetMinistryId, targetDateKey) => {
    e.preventDefault();
    
    // Ensure we're not dropping onto the same item
    if (draggedDateKey === targetDateKey && draggedVolunteer === targetVolunteerId) {
      return;
    }
    
    // Ensure we're swapping within the same ministry
    if (draggedMinistryId !== targetMinistryId) {
      alert("Volunteers can only be swapped for the same ministry role.");
      return;
    }

    // Find source and target roster entries
    const sourceDate = roster.findIndex(entry => {
      const entryDateKey = `${entry.date.getFullYear()}-${entry.date.getMonth()}-${entry.date.getDate()}`;
      return entryDateKey === draggedDateKey;
    });

    const targetDate = roster.findIndex(entry => {
      const entryDateKey = `${entry.date.getFullYear()}-${entry.date.getMonth()}-${entry.date.getDate()}`;
      return entryDateKey === targetDateKey;
    });

    if (sourceDate !== -1 && targetDate !== -1) {
      // Create a deep copy of the roster
      const updatedRoster = JSON.parse(JSON.stringify(roster));
      
      // Convert date strings back to Date objects
      updatedRoster.forEach(entry => {
        entry.date = new Date(entry.date);
      });
      
      // Get the position of the dragged volunteer in source ministry
      const sourceAssignments = updatedRoster[sourceDate].assignmentsByMinistry[draggedMinistryId] || [];
      const draggedVolunteerIndex = sourceAssignments.indexOf(draggedVolunteer);

      // Get the position of the target volunteer in target ministry
      const targetAssignments = updatedRoster[targetDate].assignmentsByMinistry[targetMinistryId] || [];
      const targetVolunteerIndex = targetAssignments.indexOf(targetVolunteerId);

      // Swap the volunteers
      if (draggedVolunteerIndex !== -1 && targetVolunteerIndex !== -1) {
        updatedRoster[sourceDate].assignmentsByMinistry[draggedMinistryId][draggedVolunteerIndex] = targetVolunteerId;
        updatedRoster[targetDate].assignmentsByMinistry[targetMinistryId][targetVolunteerIndex] = draggedVolunteer;
        
        // Update the roster state
        setRoster(updatedRoster);
      }
    }

    // Clear drag state
    setDraggedVolunteer(null);
    setDraggedMinistryId(null);
    setDraggedDateKey(null);
  };

  // Enhance volunteer list items with drag and drop capabilities
  const renderVolunteerItem = (volId, ministryId, dateKey) => {
    const isDragging = volId === draggedVolunteer && dateKey === draggedDateKey && ministryId === draggedMinistryId;
    
    return (
      <li 
        key={volId} 
        draggable 
        onDragStart={(e) => handleDragStart(e, volId, ministryId, dateKey)} 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, volId, ministryId, dateKey)}
        style={{
          cursor: 'move',
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: isDragging ? '#f0f0f0' : 'transparent',
          padding: '4px',
          borderRadius: '4px',
          transition: 'all 0.2s ease'
        }}
        className="draggable-volunteer"
      >
        {getVolunteerName(volId)}
      </li>
    );
  };

  return (
    <div className="roster-display card">
      <h3>{rosterPeriodTitle}</h3>
      <p><small>Drag and drop volunteers to swap positions between the same ministry roles on different dates.</small></p>
      {sortedYearMonthKeys.map(ymKey => {
        const group = groupedByYearMonth[ymKey];
        return (
          <div key={ymKey} className="roster-month-year-group">
            <h4>{MONTH_NAMES[group.month]} {group.year}</h4>
            {group.dateEntries.map(entry => {
              // Create a unique date key for drag/drop
              const dateKey = `${entry.date.getFullYear()}-${entry.date.getMonth()}-${entry.date.getDate()}`;
              
              return (
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
                            <ul>
                              {assignedToThisMinistry.map(volId => renderVolunteerItem(volId, ministry.id, dateKey))}
                            </ul>
                          ) : (
                            <p><small>No volunteers assigned.</small></p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default RosterDisplay;