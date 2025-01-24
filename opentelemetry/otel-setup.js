const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Configure Jaeger Exporter
const jaegerExporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces', // Default Jaeger endpoint
});

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'ecommerce-api', // Your service name
  }),
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

try {
  sdk.start(); // Start OpenTelemetry
  console.log('OpenTelemetry is running');
} catch (err) {
  console.error('Error starting OpenTelemetry:', err);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await sdk.shutdown();
    console.log('OpenTelemetry terminated');
    process.exit(0);
  } catch (err) {
    console.error('Error shutting down OpenTelemetry:', err);
    process.exit(1);
  }
});
