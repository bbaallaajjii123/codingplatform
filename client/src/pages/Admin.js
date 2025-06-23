import React, { useState } from 'react';
import {
  Container, Typography, Paper, TextField, Button, Box, Grid, MenuItem, IconButton, Alert, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { problemsAPI, authAPI } from '../services/api';
import useAuthStore from '../stores/authStore';

const defaultTestCase = { input: '', output: '', isHidden: false };

const Admin = () => {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: '',
    category: '',
    tags: '',
    points: 100,
    timeLimit: 1000,
    memoryLimit: 128,
    sampleInput: '',
    sampleOutput: '',
    constraints: '',
    hints: '',
    testCases: [ { ...defaultTestCase } ]
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">Access denied. Admins/Teachers only.</Alert>
      </Container>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestCaseChange = (idx, e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const testCases = [...prev.testCases];
      testCases[idx][name] = type === 'checkbox' ? checked : value;
      return { ...prev, testCases };
    });
  };

  const addTestCase = () => {
    setForm((prev) => ({ ...prev, testCases: [...prev.testCases, { ...defaultTestCase }] }));
  };

  const removeTestCase = (idx) => {
    setForm((prev) => {
      const testCases = prev.testCases.filter((_, i) => i !== idx);
      return { ...prev, testCases };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        hints: form.hints.split('\n').map((h) => h.trim()).filter(Boolean),
      };
      await problemsAPI.create(payload);
      setSuccess('Problem created successfully!');
      setForm({
        title: '', description: '', difficulty: '', category: '', tags: '', points: 100, timeLimit: 1000, memoryLimit: 128, sampleInput: '', sampleOutput: '', constraints: '', hints: '', testCases: [ { ...defaultTestCase } ]
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create problem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>Add New Problem</Typography>
      <Paper sx={{ p: 4, mb: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Title" name="title" value={form.title} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Category" name="category" value={form.category} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Difficulty" name="difficulty" value={form.difficulty} onChange={handleChange} select fullWidth required>
                <MenuItem value="Easy">Easy</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Hard">Hard</MenuItem>
                <MenuItem value="Expert">Expert</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Points" name="points" type="number" value={form.points} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth required multiline minRows={3} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Tags (comma separated)" name="tags" value={form.tags} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Constraints" name="constraints" value={form.constraints} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Sample Input" name="sampleInput" value={form.sampleInput} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Sample Output" name="sampleOutput" value={form.sampleOutput} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Time Limit (ms)" name="timeLimit" type="number" value={form.timeLimit} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Memory Limit (MB)" name="memoryLimit" type="number" value={form.memoryLimit} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Hints (one per line)" name="hints" value={form.hints} onChange={handleChange} fullWidth multiline minRows={2} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2 }}>Test Cases</Typography>
              {form.testCases.map((tc, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                  <TextField label="Input" name="input" value={tc.input} onChange={e => handleTestCaseChange(idx, e)} size="small" sx={{ flex: 2 }} required />
                  <TextField label="Output" name="output" value={tc.output} onChange={e => handleTestCaseChange(idx, e)} size="small" sx={{ flex: 2 }} required />
                  <TextField label="Hidden" name="isHidden" type="checkbox" checked={tc.isHidden} onChange={e => handleTestCaseChange(idx, e)} size="small" sx={{ flex: 1 }} inputProps={{ style: { width: 20, height: 20 } }} />
                  <IconButton onClick={() => removeTestCase(idx)} disabled={form.testCases.length === 1} color="error"><RemoveIcon /></IconButton>
                  {idx === form.testCases.length - 1 && (
                    <IconButton onClick={addTestCase} color="primary"><AddIcon /></IconButton>
                  )}
                </Box>
              ))}
            </Grid>
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Create Problem'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export function AddTeacherForm({ open, onClose }) {
  const { user } = useAuthStore();
  const [teacherForm, setTeacherForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: ''
  });
  const [teacherError, setTeacherError] = useState(null);
  const [teacherSuccess, setTeacherSuccess] = useState(null);
  const [teacherLoading, setTeacherLoading] = useState(false);

  const handleTeacherChange = (e) => {
    const { name, value } = e.target;
    setTeacherForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setTeacherError(null);
    setTeacherSuccess(null);
    setTeacherLoading(true);
    try {
      await authAPI.createTeacher(teacherForm);
      setTeacherSuccess('Teacher created successfully!');
      setTeacherForm({ firstName: '', lastName: '', username: '', email: '', password: '' });
      if (onClose) onClose();
    } catch (err) {
      setTeacherError(err.response?.data?.error || 'Failed to create teacher.');
    } finally {
      setTeacherLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Teacher</DialogTitle>
      <DialogContent>
        {teacherError && <Alert severity="error" sx={{ mb: 2 }}>{teacherError}</Alert>}
        {teacherSuccess && <Alert severity="success" sx={{ mb: 2 }}>{teacherSuccess}</Alert>}
        <Box component="form" onSubmit={handleTeacherSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="First Name" name="firstName" value={teacherForm.firstName} onChange={handleTeacherChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Last Name" name="lastName" value={teacherForm.lastName} onChange={handleTeacherChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Username" name="username" value={teacherForm.username} onChange={handleTeacherChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" name="email" value={teacherForm.email} onChange={handleTeacherChange} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Password" name="password" type="password" value={teacherForm.password} onChange={handleTeacherChange} fullWidth required />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" disabled={teacherLoading}>
                {teacherLoading ? 'Submitting...' : 'Create Teacher'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default Admin; 