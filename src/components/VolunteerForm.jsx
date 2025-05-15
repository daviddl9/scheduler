// src/components/VolunteerForm.jsx
import { useState, useEffect } from 'react';
import { MONTH_NAMES } from '../utils/dateUtils';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
  Grid,
  Box,
  Paper
} from '@mui/material';

const INITIAL_FORM_STATE = {
  name: '',
  preferredFrequency: 'monthly',
  unavailableMonths: [],
  ministryIds: [], // NEW: For storing selected ministry IDs
};

// MODIFIED: Add ministries prop
function VolunteerForm({ onSubmit, existingVolunteer, ministries }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  useEffect(() => {
    if (existingVolunteer) {
      setFormData({
        name: existingVolunteer.name || '',
        preferredFrequency: existingVolunteer.preferredFrequency || 'monthly',
        unavailableMonths: (existingVolunteer.unavailableMonths || []).map(String),
        ministryIds: existingVolunteer.ministryIds || [],
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
  }, [existingVolunteer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMonthChange = (e) => {
    const { value, checked } = e.target;
    const monthIndex = parseInt(value);
    setFormData(prev => {
      const newUnavailableMonths = checked
        ? [...prev.unavailableMonths, monthIndex.toString()]
        : prev.unavailableMonths.filter(m => m !== monthIndex.toString());
      return { ...prev, unavailableMonths: newUnavailableMonths };
    });
  };

  // NEW: Handler for ministry selection
  const handleMinistryChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newMinistryIds = checked
        ? [...prev.ministryIds, value]
        : prev.ministryIds.filter(id => id !== value);
      return { ...prev, ministryIds: newMinistryIds };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please enter a volunteer name.');
      return;
    }
    onSubmit({
      ...formData,
      unavailableMonths: formData.unavailableMonths.map(Number),
      // ministryIds are already in correct format (array of strings)
    });
    if (!existingVolunteer) {
      setFormData(INITIAL_FORM_STATE);
    }
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} className="volunteer-form card" elevation={0}>
      <Typography variant="h5" component="h3" gutterBottom>
        {existingVolunteer ? 'Edit People' : 'Add New Person'}
      </Typography>

      <Grid container spacing={3}>
        {/* Name Input */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Name"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            variant="outlined"
          />
        </Grid>

        {/* Preferred Frequency Dropdown */}
        <Grid item xs={12}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="preferred-frequency-label">Preferred Frequency</InputLabel>
            <Select
              labelId="preferred-frequency-label"
              id="preferredFrequency"
              name="preferredFrequency"
              value={formData.preferredFrequency}
              onChange={handleChange}
              label="Preferred Frequency"
            >
              <MenuItem value="weekly">Once a week</MenuItem>
              <MenuItem value="fortnightly">Once every two weeks</MenuItem>
              <MenuItem value="monthly">Once a month (approx. every 4 weeks)</MenuItem>
              <MenuItem value="bimonthly">Once every two months (approx. every 8 weeks)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Unavailable Months Checkboxes */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Unavailable Months:
          </Typography>
          <FormGroup row>
            {MONTH_NAMES.map((month, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    id={`month-${index}`}
                    value={index.toString()}
                    checked={formData.unavailableMonths.includes(index.toString())}
                    onChange={handleMonthChange}
                  />
                }
                label={month}
              />
            ))}
          </FormGroup>
        </Grid>

        {/* Ministry Selection */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Can Take on the following Roles:
          </Typography>
          {ministries.length === 0 ? (
            <>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                No roles defined yet. Please add roles first.
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                >
                  {existingVolunteer ? 'Save Changes' : 'Add Person'}
                </Button>
                {existingVolunteer && (
                  <Button 
                    type="button" 
                    variant="outlined" 
                    onClick={() => onSubmit(null, true)}
                  >
                    Cancel Edit
                  </Button>
                )}
              </Box>
            </>
          ) : (
            <>
              <FormGroup row>
                {ministries.map(ministry => (
                  <FormControlLabel
                    key={ministry.id}
                    control={
                      <Checkbox
                        id={`ministry-${ministry.id}`}
                        value={ministry.id}
                        checked={formData.ministryIds.includes(ministry.id)}
                        onChange={handleMinistryChange}
                      />
                    }
                    label={ministry.name}
                  />
                ))}
              </FormGroup>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                >
                  {existingVolunteer ? 'Save Changes' : 'Add Person'}
                </Button>
                {existingVolunteer && (
                  <Button 
                    type="button" 
                    variant="outlined" 
                    onClick={() => onSubmit(null, true)}
                  >
                    Cancel Edit
                  </Button>
                )}
              </Box>
            </>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}

export default VolunteerForm;