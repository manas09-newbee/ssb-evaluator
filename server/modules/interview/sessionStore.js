// In-memory session store for active interview sessions
// Each session: { history: [{question, answer}], createdAt }
// Deleted after report generation

const sessions = new Map();

module.exports = sessions;
