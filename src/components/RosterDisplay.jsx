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
  Typography,
  Snackbar,
  IconButton,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  
  // Add state for share URL functionality
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  if (ministries.length === 0) {
    return <p className="card">Please define roles first to see the roster display.</p>;
  }
  if (!roster.length) {
    return <p className="card">No roster generated yet. Configure period/rule, add people, and click "Generate Roster".</p>;
  }

  const getVolunteerName = (id) => {
    if (id === 'UNASSIGNED') return <span style={{ color: 'orange' }}>UNASSIGNED</span>;
    const volunteer = volunteers.find(v => v.id === id);
    return volunteer ? volunteer.name : 'Unknown Person';
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
      alert("People can only be swapped for the same ministry role.");
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

  // Function to generate unique colors for each volunteer
  const generateColorMap = () => {
    const colorMap = {};
    const hueStep = 360 / (volunteers.length || 1);
    
    volunteers.forEach((volunteer, index) => {
      const hue = index * hueStep;
      colorMap[volunteer.id] = hslToHex(hue, 70, 80);
    });
    
    return colorMap;
  };

  // Convert HSL to Hex for Excel
  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r, g, b;
    
    if (0 <= h && h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (60 <= h && h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (120 <= h && h < 180) {
      [r, g, b] = [0, c, x];
    } else if (180 <= h && h < 240) {
      [r, g, b] = [0, x, c];
    } else if (240 <= h && h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }
    
    const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');
    
    return rHex + gHex + bHex;
  };
  
  // Function to generate and copy share URL
  const generateShareUrl = () => {
    try {
      // Convert roster to a format suitable for URL sharing
      const shareData = {
        roster: roster.map(entry => ({
          ...entry,
          date: entry.date.toISOString(), // Convert date to string for JSON serialization
        })),
        volunteers,
        ministries,
        startYear,
        startMonth,
        endYear,
        endMonth
      };
      
      // Encode data as base64 to make URL shorter and avoid special character issues
      const compressedData = btoa(JSON.stringify(shareData));
      
      // Create the URL with the data as a query parameter
      const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(compressedData)}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setSnackbarOpen(true);
        })
        .catch(err => {
          console.error('Failed to copy URL: ', err);
          alert('Failed to copy URL to clipboard');
        });
    } catch (error) {
      console.error('Error generating share URL: ', error);
      alert('Failed to generate share URL');
    }
  };

  // Export roster to Excel
  const exportToExcel = () => {
    const colorMap = generateColorMap();
    // Add a special color for UNASSIGNED
    colorMap['UNASSIGNED'] = "FFCC00"; // Orange for UNASSIGNED
    
    const sortedRoster = [...roster].sort((a, b) => a.date - b.date);
    const headerRow = ['Date', ...ministries.map(m => m.name)];
    const dataRows = [];
    
    sortedRoster.forEach((entry) => {
      const formattedDate = formatDate(entry.date);
      const rowData = [formattedDate];
      
      ministries.forEach(ministry => {
        const assignedVolunteers = entry.assignmentsByMinistry[ministry.id] || [];
        const cellValue = assignedVolunteers.length > 0 
          ? assignedVolunteers.map(id => getVolunteerName(id).props ? 'UNASSIGNED' : getVolunteerName(id)).join('\n')
          : '';
        
        rowData.push(cellValue);
      });
      
      dataRows.push(rowData);
    });
    
    // Create worksheet with basic data
    const allRows = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(allRows);
    
    // Define range to prevent extra column
    const range = XLSX.utils.decode_range(ws['!ref']);
    range.e.c = ministries.length; // Limit to date column + ministry columns only
    ws['!ref'] = XLSX.utils.encode_range(range);
    
    // Apply styling to cells with volunteer names
    for (let rowIndex = 1; rowIndex < allRows.length; rowIndex++) {
      const entry = sortedRoster[rowIndex - 1];
      
      // For each ministry column
      ministries.forEach((ministry, colIdx) => {
        const colIndex = colIdx + 1; // +1 because first column is date
        const assignedVolunteers = entry.assignmentsByMinistry[ministry.id] || [];
        
        if (assignedVolunteers.length > 0) {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
          
          // Set cell styles for each volunteer
          if (!ws[cellRef].s) {
            const volunteerId = assignedVolunteers[0];
            const colorToUse = colorMap[volunteerId] || "FFFFFF"; // Default to white if no color found
              
            ws[cellRef].s = {
              font: { color: { rgb: "000000" } },
              alignment: { vertical: 'top', wrapText: true },
              fill: {
                patternType: 'solid',
                fgColor: { rgb: colorToUse }
              }
            };
          }
        }
      });
    }
    
    // Set column widths
    const colWidths = [{ wch: 15 }];
    ministries.forEach(() => colWidths.push({ wch: 25 }));
    ws['!cols'] = colWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Roster');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const fileName = `Roster_${MONTH_NAMES[startMonth]}_${startYear}-${MONTH_NAMES[endMonth]}_${endYear}.xlsx`;
    
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
  };

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
      <div className="roster-header">
        <h3>{rosterPeriodTitle}</h3>
        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
          <Tooltip title="Copy shareable link to clipboard">
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={generateShareUrl}
              size="small"
              startIcon={<ContentCopyIcon />}
            >
              Copy Share Link
            </Button>
          </Tooltip>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={exportToExcel}
            size="small"
          >
            Export to Excel
          </Button>
        </div>
      </div>
      <p><small>Drag and drop a person's name to swap positions between the same roles on different dates, or click on a person to edit directly.</small></p>
      {sortedYearMonthKeys.map(ymKey => {
        const group = groupedByYearMonth[ymKey];
        return (
          <div key={ymKey} className="roster-month-year-group">
            <h4>{MONTH_NAMES[group.month]} {group.year}</h4>
            {group.dateEntries.map(entry => {
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
                              <p><small>Nobody assigned. Click to add.</small></p>
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
          {isAddingNew ? "Add Person Assignment" : "Edit Person Assignment"}
        </DialogTitle>
        <DialogContent>
          {!isAddingNew && (
            <Typography variant="body2" gutterBottom style={{ marginBottom: '16px' }}>
              Current assignment: <strong>{editingVolunteerId ? getVolunteerName(editingVolunteerId) : ''}</strong>
            </Typography>
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel id="replacement-volunteer-label">
              {isAddingNew ? "Assign Person" : "Replace with"}
            </InputLabel>
            <Select
              labelId="replacement-volunteer-label"
              id="replacement-volunteer"
              value={selectedReplacement}
              onChange={(e) => setSelectedReplacement(e.target.value)}
              label={isAddingNew ? "Assign person" : "Replace with"}
            >
              {editingMinistryId && getEligibleVolunteersForMinistry(editingMinistryId).map((volunteer) => (
                <MenuItem key={volunteer.id} value={volunteer.id}>
                  {volunteer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" style={{ marginTop: '8px', display: 'block' }}>
            Only people who serve in this role can be selected.
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

      {/* Snackbar for share URL copied notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Share URL copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </div>
  );
}

export default RosterDisplay;