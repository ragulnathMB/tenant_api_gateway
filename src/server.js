const { app, initializeApp } = require('./app');
const { closeDatabases } = require('./config/database');

const PORT = process.env.PORT || 3003;

const startServer = async () => {
  try {
    await initializeApp();
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Tenant Portal Server running at http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed');
        await closeDatabases();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
