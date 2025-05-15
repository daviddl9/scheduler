// File: /Users/davidvallyblessed/Projects/scheduler/src/components/RoleManager.jsx
// Renamed from MinistryManager.jsx
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
  Grid,
  Paper, // Added for consistent card look
  Tooltip // Added for icon button clarity
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';


function RoleManager({ roles, onAddRole, onDeleteRole }) {
  const [newRoleName, setNewRoleName] = useState('');
  const [minVolunteers, setMinVolunteers] = useState(1);

  const handleAdd = () => {
    if (!newRoleName.trim()) {
      // Consider using a Snackbar for alerts, passed from App.jsx
      alert('Please enter a role name.');
      return;
    }
    if (minVolunteers < 1) {
      alert('Minimum people must be at least 1.');
      return;
    }
    onAddRole({ id: `r_${nanoid()}`, name: newRoleName.trim(), minVolunteers: parseInt(minVolunteers, 10) });
    setNewRoleName('');
    setMinVolunteers(1);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}> {/* Consistent card styling */}
      <Typography variant="h6" component="h3" gutterBottom>Manage Roles</Typography>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={5}>
          <TextField
            fullWidth
            label="New Role Name"
            variant="outlined"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            size="small"
          />
        </Grid>
        <Grid item xs={6} sm={3} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Min. Volunteers"
            variant="outlined"
            value={minVolunteers}
            onChange={(e) => setMinVolunteers(Math.max(1, parseInt(e.target.value,10) || 1))} // Ensure positive number
            inputProps={{ min: "1" }}
            size="small"
          />
        </Grid>
        <Grid item xs={6} sm={3} md={4}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAdd}
            fullWidth
            startIcon={<AddCircleOutlineIcon />}
            size="medium" // MUI default is medium
          >
            Add Role
          </Button>
        </Grid>
      </Grid>

      {roles.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{mt: 2}}>No roles defined yet.</Typography>
      ) : (
        <List dense> {/* dense for a more compact list */}
          {roles.map(role => (
            <ListItem
              key={role.id}
              divider
              sx={{
                backgroundColor: 'background.paper',
                '&:hover': { backgroundColor: 'action.hover' },
                mb: 0.5,
                borderRadius: 1
              }}
            >
              <ListItemText
                primary={role.name}
                secondary={`Requires: ${role.minVolunteers} volunteer(s)`}
              />
              <ListItemSecondaryAction>
                <Tooltip title="Delete Role">
                  <IconButton
                    edge="end"
                    aria-label="delete role"
                    onClick={() => onDeleteRole(role.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}

export default RoleManager;