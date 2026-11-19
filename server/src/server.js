require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`PathPilot API listening on port ${PORT}`));
  } catch (error) {
    console.error("Unable to start PathPilot API:", error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) startServer();

module.exports = app;
