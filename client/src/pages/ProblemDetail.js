import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container, Typography, Paper, Box, Button, MenuItem, Select, CircularProgress, Alert, Grid, Tabs, Tab, Divider
} from '@mui/material';
import { problemsAPI } from '../services/api';
import Editor from '@monaco-editor/react';
import ErrorDisplay from '../components/ErrorDisplay';

const languageOptions = [
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
];

const defaultCode = {
  c: '#include <stdio.h>\nint main() {\n    // Write your code here\n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    // Write your code here\n    return 0;\n}',
  python: '# Write your solution here\n',
  java: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}',
};

const tabLabels = ['Description', 'Sample Input', 'Sample Output', 'Constraints'];

const ProblemDetail = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('c');
  const [code, setCode] = useState(defaultCode['c']);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [testCaseResults, setTestCaseResults] = useState([]);
  const [allPassed, setAllPassed] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sampleRunResult, setSampleRunResult] = useState(null);
  const [runningSample, setRunningSample] = useState(false);
  const [tab, setTab] = useState(0);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    setLoading(true);
    problemsAPI.getById(id)
      .then(res => {
        setProblem(res.data.problem);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    setCode(defaultCode[e.target.value]);
    setTestCaseResults([]);
    setAllPassed(false);
    setResult(null);
    setError(null);
    setSampleRunResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestCaseResults([]);
    setAllPassed(false);
    setError(null);
    try {
      const res = await problemsAPI.test(id, { code, language });
      if (Array.isArray(res.data.testCaseResults)) {
        setTestCaseResults(res.data.testCaseResults);
        setAllPassed(res.data.allPassed);
      } else {
        setError(res.data.error || 'Test failed.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Test failed.');
    }
    setTesting(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    setError(null);
    try {
      const res = await problemsAPI.submit(id, { code, language });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    }
    setSubmitting(false);
  };

  const handleRunSample = async () => {
    setRunningSample(true);
    setSampleRunResult(null);
    setError(null);
    try {
      const res = await problemsAPI.runSample(id, { code, language, customInput });
      if (res.data.input !== undefined) {
        setSampleRunResult(res.data);
      } else {
        setSampleRunResult({ error: res.data.error || 'Sample run failed.' });
      }
    } catch (err) {
      setSampleRunResult({ error: err.response?.data?.error || 'Sample run failed.' });
    }
    setRunningSample(false);
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  console.log('problem.testCases', problem && problem.testCases);
  console.log('sampleRunResult', sampleRunResult);
  console.log('testCaseResults', testCaseResults);
  console.log('result', result);

  if (loading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (!problem) return <Alert severity="error">Problem not found.</Alert>;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Left Panel: Problem Statement */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 2, minHeight: 500 }} elevation={3}>
            <Typography variant="h4" gutterBottom>{problem.title}</Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              Difficulty: {problem.difficulty} | Category: {problem.category}
            </Typography>
            <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="Description" />
              <Tab label="Sample Input" />
              <Tab label="Sample Output" />
              <Tab label="Constraints" />
            </Tabs>
            <Divider sx={{ mb: 2 }} />
            {tab === 0 && (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{problem.description}</Typography>
            )}
            {tab === 1 && (
              <Box>
                <Typography variant="subtitle2">Sample Input:</Typography>
                <Paper sx={{ p: 2, mt: 1, background: '#f7f7f7' }}>
                  <pre style={{ margin: 0 }}>{problem.sampleInput}</pre>
                </Paper>
              </Box>
            )}
            {tab === 2 && (
              <Box>
                <Typography variant="subtitle2">Sample Output:</Typography>
                <Paper sx={{ p: 2, mt: 1, background: '#f7f7f7' }}>
                  <pre style={{ margin: 0 }}>{problem.sampleOutput}</pre>
                </Paper>
              </Box>
            )}
            {tab === 3 && (
              <Box>
                <Typography variant="subtitle2">Constraints:</Typography>
                <Paper sx={{ p: 2, mt: 1, background: '#f7f7f7' }}>
                  <pre style={{ margin: 0 }}>{problem.constraints}</pre>
                </Paper>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Panel: Code Editor and Actions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, minHeight: 500 }} elevation={3}>
            {problem.testCases && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">
                  Test Cases: {problem.testCases.length} &nbsp;|&nbsp; 
                  Public: {problem.testCases.filter(tc => !tc.isHidden).length} &nbsp;|&nbsp; 
                  Hidden: {problem.testCases.filter(tc => tc.isHidden).length}
                </Typography>
                {Array.isArray(problem.testCases) && problem.testCases.length > 0 && problem.testCases.every(tc => tc && typeof tc === 'object') && (
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Public Test Cases:</Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {problem.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                        <li key={idx}>
                          <div><b>Description:</b> {tc.description ? tc.description : <i>No description</i>}</div>
                          {tc.input !== undefined ? (
                            <div><b>Input:</b> <pre style={{ display: 'inline', color: '#90ee90' }}>{tc.input}</pre></div>
                          ) : null}
                          {tc.expectedOutput !== undefined ? (
                            <div><b>Expected Output:</b> <pre style={{ display: 'inline', color: '#add8e6' }}>{tc.expectedOutput}</pre></div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </Box>
                )}
              </Box>
            )}
            <Box display="flex" alignItems="center" mb={2}>
              <Typography sx={{ mr: 2 }}>Language:</Typography>
              <Select value={language} onChange={handleLanguageChange} size="small">
                {languageOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </Box>
            <Editor
              height="300px"
              defaultLanguage={language}
              language={language}
              value={code}
              onChange={value => setCode(value)}
              theme="vs-dark"
              options={{ fontSize: 14, minimap: { enabled: false } }}
            />
            <Box mt={2}>
              <Typography variant="subtitle2">Custom Input (optional):</Typography>
              <textarea
                rows={4}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: 14, background: '#181818', color: '#fff', border: '1px solid #444', borderRadius: 4, padding: 8 }}
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                placeholder="Enter custom input here..."
              />
            </Box>
            <Box mt={2} display="flex" gap={2}>
              <Button variant="outlined" color="info" onClick={handleRunSample} disabled={runningSample}>
                {runningSample ? 'Running...' : 'Run Code'}
              </Button>
              <Button variant="outlined" color="secondary" onClick={handleTest} disabled={testing}>
                {testing ? 'Testing...' : 'Test Code'}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={submitting || !allPassed}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </Box>
            {/* Output/Results Area */}
            {sampleRunResult && typeof sampleRunResult === 'object' && 'input' in sampleRunResult && sampleRunResult.input !== undefined ? (
              <Paper sx={{ p: 2, mt: 2, background: '#222', color: '#fff' }}>
                <Typography variant="subtitle2">Sample Run Output:</Typography>
                <div><b>Input:</b> <pre style={{ display: 'inline', color: '#90ee90' }}>{sampleRunResult.input}</pre></div>
                <div><b>Expected:</b> <pre style={{ display: 'inline', color: '#90ee90' }}>{sampleRunResult.expected}</pre></div>
                <div><b>Output:</b> <pre style={{ display: 'inline', color: '#add8e6' }}>{sampleRunResult.output}</pre></div>
                <div><b>Status:</b> {sampleRunResult.passed ? '✅ Passed' : '❌ Failed'}</div>
                {sampleRunResult.error && (
                  <ErrorDisplay 
                    error={sampleRunResult.error}
                    type="compilation"
                    title="Compiler/Runtime Error"
                    showTips={true}
                  />
                )}
              </Paper>
            ) : sampleRunResult && sampleRunResult.error ? (
              <ErrorDisplay 
                error={sampleRunResult.error}
                type="system"
                title="Execution Error"
                showTips={true}
              />
            ) : null}
            {Array.isArray(testCaseResults) && testCaseResults.length > 0 && testCaseResults.every(tc => tc && typeof tc === 'object') ? (
              <Box mt={2}>
                <Typography variant="subtitle2">Test Case Results:</Typography>
                <Paper sx={{ p: 2, mt: 1, background: '#222', color: '#fff' }}>
                  <ul style={{ paddingLeft: 20 }}>
                    {testCaseResults.map((tc, idx) => (
                      <li key={idx} style={{ marginBottom: 12 }}>
                        {tc.input !== undefined && (
                          <><b>Input:</b> <pre style={{ display: 'inline', color: '#90ee90' }}>{tc.input}</pre>{' '}</>
                        )}
                        {tc.expected !== undefined && (
                          <><b>Expected:</b> <pre style={{ display: 'inline', color: '#90ee90' }}>{tc.expected}</pre>{' '}</>
                        )}
                        {tc.output !== undefined && (
                          <><b>Output:</b> <pre style={{ display: 'inline', color: '#add8e6' }}>{tc.output}</pre>{' '}</>
                        )}
                        <b>Status:</b> {tc.passed ? "✅ Passed" : "❌ Failed"}
                        {tc.error && (
                          <ErrorDisplay 
                            error={tc.error}
                            type="runtime"
                            title={`Error in Test Case ${idx + 1}`}
                            showTips={true}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                  <Typography sx={{ mt: 1 }}>
                    {allPassed ? "🎉 All test cases passed! You can now submit." : "Please pass all test cases to enable submission."}
                  </Typography>
                </Paper>
              </Box>
            ) : error ? (
              <ErrorDisplay 
                error={error}
                type="system"
                title="System Error"
                showTips={true}
              />
            ) : null}
            {result && (
              <Box mt={3}>
                <Alert severity={result.message?.toLowerCase().includes('accepted') ? 'success' : 'info'}>
                  {result.message || 'Submission received.'}
                </Alert>
                {result.submissionId && (
                  <Typography variant="body2" sx={{ mt: 1 }}>Submission ID: {result.submissionId}</Typography>
                )}
                {Array.isArray(result.testResults) && result.testResults.length > 0 ? (
                  <Box mt={2}>
                    <Typography variant="subtitle2">Test Results:</Typography>
                    <Paper sx={{ p: 2, mt: 1 }}>
                      <ul style={{ paddingLeft: 20 }}>
                        {result.testResults.map((tc, idx) => (
                          <li key={idx} style={{ marginBottom: 12 }}>
                            <b>Input:</b> <pre style={{ display: 'inline', color: '#90ee90' }}>{tc.input}</pre>{' '}
                            <b>Expected:</b> <pre style={{ display: 'inline', color: '#90ee90' }}>{tc.expected}</pre>{' '}
                            <b>Output:</b> <pre style={{ display: 'inline', color: '#add8e6' }}>{tc.output}</pre>{' '}
                            <b>Status:</b> {tc.passed ? "✅ Passed" : "❌ Failed"}
                            {tc.error && (
                              <ErrorDisplay 
                                error={tc.error}
                                type="runtime"
                                title={`Error in Test Case ${idx + 1}`}
                                showTips={true}
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    </Paper>
                  </Box>
                ) : result.error ? (
                  <ErrorDisplay 
                    error={result.error}
                    type="system"
                    title="Submission Error"
                    showTips={true}
                  />
                ) : null}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProblemDetail; 