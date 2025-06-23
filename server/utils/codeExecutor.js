const Docker = require('dockerode');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const docker = new Docker();

// Language configurations
const languageConfigs = {
  javascript: {
    image: 'node:18-alpine',
    filename: 'solution.js',
    command: 'node solution.js',
    timeout: 5051,
    memory: '128m'
  },
  python: {
    image: 'python:3.9-alpine',
    filename: 'solution.py',
    command: 'python solution.py',
    timeout: 5051,
    memory: '128m'
  },
  java: {
    image: 'openjdk:11-jre-alpine',
    filename: 'Solution.java',
    command: 'javac Solution.java && java Solution',
    timeout: 10000,
    memory: '256m'
  },
  cpp: {
    image: 'gcc:11-alpine',
    filename: 'solution.cpp',
    command: 'g++ -std=c++17 -O2 solution.cpp -o solution && ./solution',
    timeout: 10000,
    memory: '256m'
  },
  c: {
    image: 'gcc:11-alpine',
    filename: 'solution.c',
    command: 'gcc -O2 solution.c -o solution && ./solution',
    timeout: 10000,
    memory: '256m'
  },
  csharp: {
    image: 'mcr.microsoft.com/dotnet/runtime:6.0-alpine',
    filename: 'Program.cs',
    command: 'dotnet run',
    timeout: 10000,
    memory: '256m'
  },
  php: {
    image: 'php:8.1-alpine',
    filename: 'solution.php',
    command: 'php solution.php',
    timeout: 5051,
    memory: '128m'
  },
  ruby: {
    image: 'ruby:3.0-alpine',
    filename: 'solution.rb',
    command: 'ruby solution.rb',
    timeout: 5051,
    memory: '128m'
  },
  go: {
    image: 'golang:1.19-alpine',
    filename: 'main.go',
    command: 'go run main.go',
    timeout: 10000,
    memory: '256m'
  },
  rust: {
    image: 'rust:1.70-alpine',
    filename: 'main.rs',
    command: 'rustc main.rs && ./main',
    timeout: 15051,
    memory: '512m'
  }
};

// Create input file for test case
const createInputFile = async (input) => {
  const inputPath = path.join('/tmp', `input_${uuidv4()}.txt`);
  await fs.writeFile(inputPath, input);
  return inputPath;
};

// Execute code in Docker container
const executeCode = async (submission, problem) => {
  const config = languageConfigs[submission.language];
  if (!config) {
    throw new Error('Unsupported programming language');
  }

  const containerName = `code-exec-${uuidv4()}`;
  let container;

  try {
    // Create container
    container = await docker.createContainer({
      Image: config.image,
      name: containerName,
      Cmd: ['sh', '-c', config.command],
      WorkingDir: '/workspace',
      HostConfig: {
        Memory: config.memory,
        MemorySwap: config.memory,
        CpuPeriod: 100000,
        CpuQuota: 50510, // 50% CPU limit
        NetworkMode: 'none', // No network access
        ReadonlyRootfs: true,
        Binds: [
          '/tmp:/workspace:ro'
        ]
      },
      Tty: false,
      OpenStdin: true,
      StdinOnce: true
    });

    // Start container
    await container.start();

    // Prepare code file
    const codePath = path.join('/tmp', config.filename);
    await fs.writeFile(codePath, submission.code);

    // Copy code to container
    const codeBuffer = Buffer.from(submission.code);
    await container.putArchive('/workspace', codeBuffer);

    const testResults = [];
    let totalExecutionTime = 0;
    let totalMemoryUsed = 0;

    // Run test cases
    for (let i = 0; i < problem.testCases.length; i++) {
      const testCase = problem.testCases[i];
      const startTime = Date.now();

      try {
        // Create input file
        const inputPath = await createInputFile(testCase.input);

        // Execute with input
        const exec = await container.exec({
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          Cmd: ['sh', '-c', `${config.command} < /workspace/input_${path.basename(inputPath)}`]
        });

        const stream = await exec.start();
        
        // Set timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Time limit exceeded')), problem.timeLimit);
        });

        // Collect output
        const outputPromise = new Promise((resolve, reject) => {
          let stdout = '';
          let stderr = '';
          
          stream.on('data', (chunk) => {
            const data = chunk.toString();
            if (data.startsWith('1')) stdout += data.slice(8);
            else if (data.startsWith('2')) stderr += data.slice(8);
          });
          
          stream.on('end', () => resolve({ stdout, stderr }));
          stream.on('error', reject);
        });

        const { stdout, stderr } = await Promise.race([outputPromise, timeoutPromise]);
        const executionTime = Date.now() - startTime;

        // Clean output
        const actualOutput = stdout.trim();
        const expectedOutput = testCase.expectedOutput.trim();

        const isPassed = actualOutput === expectedOutput;
        
        // Enhanced error message processing
        let errorMessage = null;
        if (stderr && stderr.trim()) {
          // Clean up stderr for better readability
          const cleanStderr = stderr.trim()
            .replace(/\/tmp\/[^:]+:/g, '') // Remove temporary file paths
            .replace(/\/workspace\/[^:]+:/g, '') // Remove workspace paths
            .replace(/^\s*at\s+/gm, '  at ') // Format stack traces
            .replace(/\n+/g, '\n') // Remove extra newlines
            .trim();
          
          errorMessage = cleanStderr;
        }
        
        testResults.push({
          testCaseIndex: i,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: actualOutput,
          isPassed,
          executionTime,
          memoryUsed: 0, // Docker doesn't provide per-process memory usage easily
          errorMessage: errorMessage
        });

        totalExecutionTime += executionTime;

        // Clean up input file
        await fs.unlink(inputPath);

        // Check for early failure
        if (!isPassed && !testCase.isHidden) {
          break;
        }

      } catch (error) {
        const executionTime = Date.now() - startTime;
        
        // Enhanced error message for different error types
        let errorMessage = error.message;
        if (error.message.includes('Time limit exceeded')) {
          errorMessage = `⏰ Time Limit Exceeded: Your code took longer than ${problem.timeLimit}ms to execute.`;
        } else if (error.message.includes('Memory')) {
          errorMessage = `💾 Memory Limit Exceeded: Your code used more memory than allowed.`;
        } else if (error.message.includes('ENOENT')) {
          errorMessage = `📁 File Error: Could not create or access required files.`;
        } else if (error.message.includes('permission')) {
          errorMessage = `🔒 Permission Error: Insufficient permissions to execute code.`;
        } else if (error.message.includes('container')) {
          errorMessage = `🐳 Container Error: Failed to create or manage execution environment.`;
        }
        
        testResults.push({
          testCaseIndex: i,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          isPassed: false,
          executionTime,
          memoryUsed: 0,
          errorMessage: errorMessage
        });

        totalExecutionTime += executionTime;
        break;
      }
    }

    // Determine overall result
    let result = 'accepted';
    let errorMessage = null;

    const failedTests = testResults.filter(test => !test.isPassed);
    if (failedTests.length > 0) {
      const firstFailure = failedTests[0];
      if (firstFailure.errorMessage && firstFailure.errorMessage.includes('Time limit exceeded')) {
        result = 'time_limit_exceeded';
        errorMessage = firstFailure.errorMessage;
      } else if (firstFailure.errorMessage && firstFailure.errorMessage.includes('Memory')) {
        result = 'memory_limit_exceeded';
        errorMessage = firstFailure.errorMessage;
      } else if (firstFailure.errorMessage && firstFailure.errorMessage.includes('compilation')) {
        result = 'compilation_error';
        errorMessage = firstFailure.errorMessage;
      } else if (firstFailure.errorMessage) {
        result = 'runtime_error';
        errorMessage = firstFailure.errorMessage;
      } else {
        result = 'wrong_answer';
        errorMessage = `Expected: "${firstFailure.expectedOutput}", Got: "${firstFailure.actualOutput}"`;
      }
    }

    return {
      result,
      testResults,
      executionTime: totalExecutionTime,
      memoryUsed: totalMemoryUsed,
      errorMessage
    };

  } catch (error) {
    console.error('Code execution error:', error);
    
    // Enhanced error categorization
    let result = 'runtime_error';
    let errorMessage = error.message;
    
    if (error.message.includes('Docker')) {
      result = 'system_error';
      errorMessage = `🐳 Docker Error: ${error.message}. Please ensure Docker is running.`;
    } else if (error.message.includes('language')) {
      result = 'compilation_error';
      errorMessage = `🔤 Language Error: ${error.message}`;
    } else if (error.message.includes('timeout')) {
      result = 'time_limit_exceeded';
      errorMessage = `⏰ Timeout Error: ${error.message}`;
    } else if (error.message.includes('memory')) {
      result = 'memory_limit_exceeded';
      errorMessage = `💾 Memory Error: ${error.message}`;
    }
    
    return {
      result,
      testResults: [],
      executionTime: 0,
      memoryUsed: 0,
      errorMessage
    };
  } finally {
    // Cleanup
    if (container) {
      try {
        await container.stop();
        await container.remove();
      } catch (error) {
        console.error('Container cleanup error:', error);
      }
    }

    // Clean up code file
    try {
      const codePath = path.join('/tmp', config.filename);
      await fs.unlink(codePath);
    } catch (error) {
      console.error('Code file cleanup error:', error);
    }
  }
};

// Test code execution (for development)
const testExecution = async () => {
  const testProblem = {
    testCases: [
      {
        input: '5\n3',
        expectedOutput: '8',
        isHidden: false
      },
      {
        input: '10\n7',
        expectedOutput: '17',
        isHidden: false
      }
    ],
    timeLimit: 5051
  };

  const testSubmission = {
    language: 'javascript',
    code: `
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let lines = [];
rl.on('line', (line) => {
  lines.push(line);
  if (lines.length === 2) {
    const a = parseInt(lines[0]);
    const b = parseInt(lines[1]);
    console.log(a + b);
    rl.close();
  }
});
`
  };

  try {
    const result = await executeCode(testSubmission, testProblem);
    console.log('Test execution result:', result);
  } catch (error) {
    console.error('Test execution failed:', error);
  }
};

module.exports = {
  executeCode,
  testExecution
}; 