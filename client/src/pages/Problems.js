import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { problemsAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Problems = () => {
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    problemsAPI.getAll().then(res => setProblems(res.data.problems || []));
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Programming Problems
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Category</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {problems.map(problem => (
              <TableRow key={problem.id || problem._id}>
                <TableCell>
                  <Link to={`/problems/${problem.id || problem._id}`}>{problem.title}</Link>
                </TableCell>
                <TableCell>{problem.difficulty}</TableCell>
                <TableCell>{problem.category}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default Problems; 