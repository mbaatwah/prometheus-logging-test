const express = require('express');
const promClient = require('prom-client');
const os = require('os');
const app = express();
const port = 3000;

// Create a Registry which registers the metrics
const register = new promClient.Registry();
const defaultNetworkInterface = os.networkInterfaces()[Object.keys(os.networkInterfaces())[0]]
const defaultNetworkInterfaceIPv4 = defaultNetworkInterface.find(networkInterface => networkInterface.family === 'IPv4')
register.setDefaultLabels({
    app: 'my-app',
    ip: `${defaultNetworkInterfaceIPv4.address || 'localhost'}`,
  });

// Add a default metrics collection (like process and system metrics)
promClient.collectDefaultMetrics({ register});

// Create a custom metric to measure the duration of the process
const exampleDuration = new promClient.Summary({
  name: 'example_process_duration_seconds',
  help: 'Duration of the example process in seconds',
  labelNames: ['status'],
  registers: [register],
});

// Define an example endpoint that simulates a long-running process
app.get('/example', async (req, res) => {
  // Start measuring the duration of the process
  const start = new Date();

  // Simulate a long-running process (e.g., processing data, performing calculations)
  await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate a 3-second process

  // Calculate the duration of the process
  const duration = (new Date() - start) / 1000; // Convert to seconds

  // Record the duration in the metric
  exampleDuration.observe({ status: 'success' }, duration);

  // Send a response
  res.send('Example process completed');
});

// Expose the metrics at the /metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
