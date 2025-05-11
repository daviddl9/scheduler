// src/components/MinistryManager.jsx
import { useState } from 'react';
import { nanoid } from 'nanoid';

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
      <h3>Manage Ministries</h3>
      <div className="add-ministry-form">
        <input
          type="text"
          placeholder="New Ministry Name"
          value={newMinistryName}
          onChange={(e) => setNewMinistryName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Min. Volunteers"
          value={minVolunteers}
          onChange={(e) => setMinVolunteers(e.target.value)}
          min="1"
        />
        <button onClick={handleAdd}>Add Ministry</button>
      </div>
      <h4>Existing Ministries:</h4>
      {ministries.length === 0 ? (
        <p>No ministries defined yet.</p>
      ) : (
        <ul>
          {ministries.map(m => (
            <li key={m.id}>
              {m.name} (Min: {m.minVolunteers})
              <button onClick={() => onDeleteMinistry(m.id)} style={{marginLeft: '10px', backgroundColor: '#dc3545'}}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MinistryManager;