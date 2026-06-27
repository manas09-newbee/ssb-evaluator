require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const sessions = require("./modules/interview/sessionStore");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
};

startServer();

setInterval(() => {
  const now = Date.now();

  sessions.forEach(
    (session, sessionId) => {

      const age =
        now - session.createdAt;

      if (
        age >
        1000 * 60 * 60
      ) {
        console.log(
          "Deleting expired session:",
          sessionId
        );

        sessions.delete(sessionId);
        console.log(
  "Session deleted:",
  sessionId
);
      }
    }
  );
}, 1000 * 60 * 10);