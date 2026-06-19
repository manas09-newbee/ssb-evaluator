require("dotenv").config();
const app = require("./app");
const sessions = require(
  "./modules/interview/sessionStore"
);
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
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