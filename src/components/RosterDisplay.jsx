// src/components/RosterDisplay.jsx
import React, { useState } from 'react';
import { formatDate, MONTH_NAMES } from '../utils/dateUtils';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';

// MODIFIED: Accept full period props and a roster update function
function RosterDisplay({ roster, volunteers, ministries, startYear, startMonth, endYear, endMonth, setRoster }) {
  // Add state for drag and drop functionality
  const [draggedVolunteer, setDraggedVolunteer] = useState(null);
  const [draggedMinistryId, setDraggedMinistryId] = useState(null);
  const [draggedDateKey, setDraggedDateKey] = useState(null);
  
  // Add state for editing volunteers
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingVolunteerId, setEditingVolunteerId] = useState(null);
  const [editingMinistryId, setEditingMinistryId] = useState(null);
  const [editingDateKey, setEditingDateKey] = useState(null);
  const [selectedReplacement, setSelectedReplacement] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  
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

  // Handle opening the edit dialog
  const handleEditClick = (volunteerId, ministryId, dateKey) => {
    setEditingVolunteerId(volunteerId);
    setEditingMinistryId(ministryId);
    setEditingDateKey(dateKey);
    setSelectedReplacement('');
    setIsAddingNew(false);
    setEditDialogOpen(true);
  };

  // Handle opening the add volunteer dialog for empty ministries
  const handleAddVolunteerClick = (ministryId, dateKey) => {
    setEditingVolunteerId(null);
    setEditingMinistryId(ministryId);
    setEditingDateKey(dateKey);
    setSelectedReplacement('');
    setIsAddingNew(true);
    setEditDialogOpen(true);
  };

  // Get eligible volunteers for the selected ministry
  const getEligibleVolunteersForMinistry = (ministryId) => {
    return volunteers.filter(volunteer => 
      volunteer.ministryIds && volunteer.ministryIds.includes(ministryId)
    );
  };

  // Handle the volunteer replacement or addition
  const handleReplaceVolunteer = () => {
    if (!selectedReplacement) {
      setEditDialogOpen(false);
      return;
    }

    const entryIndex = roster.findIndex(entry => {
      const entryDateKey = `${entry.date.getFullYear()}-${entry.date.getMonth()}-${entry.date.getDate()}`;
      return entryDateKey === editingDateKey;
    });

    if (entryIndex !== -1) {
      // Create a deep copy of the roster
      const updatedRoster = JSON.parse(JSON.stringify(roster));
      
      // Convert date strings back to Date objects
      updatedRoster.forEach(entry => {
        entry.date = new Date(entry.date);
      });

      if (isAddingNew) {
        // Adding a new volunteer to the ministry
        if (!updatedRoster[entryIndex].assignmentsByMinistry[editingMinistryId]) {
          updatedRoster[entryIndex].assignmentsByMinistry[editingMinistryId] = [];
        }
        updatedRoster[entryIndex].assignmentsByMinistry[editingMinistryId].push(selectedReplacement);
      } else {
        // Replacing an existing volunteer
        const volunteerIndex = updatedRoster[entryIndex].assignmentsByMinistry[editingMinistryId].indexOf(editingVolunteerId);
        
        if (volunteerIndex !== -1) {
          // Replace the volunteer
          updatedRoster[entryIndex].assignmentsByMinistry[editingMinistryId][volunteerIndex] = selectedReplacement;
        }
      }
      
      // Update the roster state
      setRoster(updatedRoster);
    }
    
    setEditDialogOpen(false);
  };

  // Enhance volunteer list items with drag and drop capabilities and click to edit
  const renderVolunteerItem = (volId, ministryId, dateKey) => {
    const isDragging = volId === draggedVolunteer && dateKey === draggedDateKey && ministryId === draggedMinistryId;
    
    return (
      <li 
        key={volId} 
        draggable 
        onDragStart={(e) => handleDragStart(e, volId, ministryId, dateKey)} 
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, volId, ministryId, dateKey)}
        onClick={() => handleEditClick(volId, ministryId, dateKey)}
        style={{
          cursor: 'pointer',
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
      <p><small>Drag and drop volunteers to swap positions between the same ministry roles on different dates, or click on a volunteer to edit directly.</small></p>
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
                            <div 
                              className="empty-volunteer-slot"
                              onClick={() => handleAddVolunteerClick(ministry.id, dateKey)}
                            >
                              <p><small>No volunteers assigned. Click to add.</small></p>
                            </div>
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
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isAddingNew ? "Add Volunteer Assignment" : "Edit Volunteer Assignment"}
        </DialogTitle>
        <DialogContent>
          {!isAddingNew && (
            <Typography variant="body2" gutterBottom style={{ marginBottom: '16px' }}>
              Current assignment: <strong>{editingVolunteerId ? getVolunteerName(editingVolunteerId) : ''}</strong>
            </Typography>
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel id="replacement-volunteer-label">
              {isAddingNew ? "Assign volunteer" : "Replace with"}
            </InputLabel>
            <Select
              labelId="replacement-volunteer-label"
              id="replacement-volunteer"
              value={selectedReplacement}
              onChange={(e) => setSelectedReplacement(e.target.value)}
              label={isAddingNew ? "Assign volunteer" : "Replace with"}
            >
              {editingMinistryId && getEligibleVolunteersForMinistry(editingMinistryId).map((volunteer) => (
                <MenuItem key={volunteer.id} value={volunteer.id}>
                  {volunteer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" style={{ marginTop: '8px', display: 'block' }}>
            Only volunteers who serve in this ministry can be selected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={handleReplaceVolunteer} 
            color="primary" 
            disabled={!selectedReplacement}
          >
            {isAddingNew ? "Add" : "Replace"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default RosterDisplay;