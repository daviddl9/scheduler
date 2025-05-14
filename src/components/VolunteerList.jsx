// src/components/VolunteerList.jsx
import React from 'react';
import { MONTH_NAMES } from '../utils/dateUtils';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// MODIFIED: Add ministries prop
function VolunteerList({ volunteers, onEdit, onDelete, ministries }) {
  if (!volunteers.length) {
    return (
      <div className="volunteer-list card">
        <Typography variant="h5" component="h3">Current Volunteers</Typography>
        <Typography variant="body1">No volunteers added yet.</Typography>
      </div>
    );
  }

  const getMinistryNames = (ministryIds) => {
    if (!ministryIds || ministryIds.length === 0) return 'None';
    return ministryIds.map(id => {
      const ministry = ministries.find(m => m.id === id);
      return ministry ? ministry.name : 'Unknown Ministry';
    }).join(', ');
  };

  const getFrequencyLabel = (freq) => {
    switch(freq) {
      case 'weekly': return 'Once a week';
      case 'fortnightly': return 'Once every two weeks';
      case 'monthly': return 'Once a month';
      case 'bimonthly': return 'Once every two months';
      default: return freq;
    }
  };

  return (
    <div className="volunteer-list card">
      <Typography variant="h5" component="h3" gutterBottom>Current Volunteers</Typography>
      <List>
        {volunteers.map((volunteer, index) => (
          <React.Fragment key={volunteer.id}>
            {/* {index > 0 && <Divider variant="inset" component="li" />} */}
            <ListItem
              alignItems="flex-start"
              secondaryAction={
                <Box>
                  <IconButton edge="end" color="primary" onClick={() => onEdit(volunteer)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" color="error" onClick={() => onDelete(volunteer.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={
                  <Typography variant="h6" component="div">
                    {volunteer.name}
                  </Typography>
                }
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      Frequency: {getFrequencyLabel(volunteer.preferredFrequency)}
                    </Typography>
                    <Box mt={1}>
                      <Typography component="span" variant="body2">
                        Unavailable Months: {volunteer.unavailableMonths.length > 0 ? 
                          volunteer.unavailableMonths.map(mIdx => MONTH_NAMES[mIdx]).join(', ') : 'None'}
                      </Typography>
                    </Box>
                    <Box mt={1}>
                      <Typography component="span" variant="body2">
                        Role(s): {getMinistryNames(volunteer.ministryIds)}
                      </Typography>
                    </Box>
                  </>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </div>
  );
}

export default VolunteerList;