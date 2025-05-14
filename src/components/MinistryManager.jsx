// src/components/MinistryManager.jsx
import { useState } from 'react';
import { nanoid } from 'nanoid';
import { 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Box,
  Typography,
  Grid
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

function MinistryManager({ ministries, onAddMinistry, onDeleteMinistry }) {
  const [newMinistryName, setNewMinistryName] = useState('');
  const [minVolunteers, setMinVolunteers] = useState(1);

  const handleAdd = () => {
    if (!newMinistryName.trim()) {
      alert('Please enter a ministry name.');
      return;
    }
    if (minVolunteers < 1) {
      alert('Minimum volunteers must be at least 1.');
      return;
    }
    onAddMinistry({ id: `m_${nanoid()}`, name: newMinistryName.trim(), minVolunteers: parseInt(minVolunteers, 10) });
    setNewMinistryName('');
    setMinVolunteers(1);
  };

  return (
    <div className="ministry-manager card">
      <h3>Manage Roles</h3>
      <Grid container spacing={2} className="add-ministry-form" alignItems="center">
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="New Role Name"
            variant="outlined"
            value={newMinistryName}
            onChange={(e) => setNewMinistryName(e.target.value)}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField
            fullWidth
            type="number"
            label="Min. People"
            variant="outlined"
            value={minVolunteers}
            onChange={(e) => setMinVolunteers(e.target.value)}
            inputProps={{ min: "1" }}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAdd}
            fullWidth
          >
            Add Role
          </Button>
        </Grid>
      </Grid>
      
      <Typography variant="h6" sx={{ mt: 2 }}>Existing Roles:</Typography>
      {ministries.length === 0 ? (
        <Typography variant="body1">No roles defined yet.</Typography>
      ) : (
        <List>
          {ministries.map(m => (
            <ListItem key={m.id} divider>
              <ListItemText 
                primary={m.name} 
                secondary={`Minimum Volunteers: ${m.minVolunteers}`} 
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={() => onDeleteMinistry(m.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
}

export default MinistryManager;