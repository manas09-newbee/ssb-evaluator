import axios from "axios";

// Fall back safely to port 5000 in local development if environment variables are not set
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = `${BASE_URL}/api/interview`;

const getHeaders = () => {
  const token = localStorage.getItem("olqinsight_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const startInterview = async (piq) => {
  const res = await axios.post(`${API}/start`, { piq }, getHeaders());
  return res.data;
};

export const getHistory = async (sessionId) => {
  const res = await axios.get(`${API}/history/${sessionId}`, getHeaders());
  return res.data;
};

export const submitAnswer = async (sessionId, answer) => {
  const res = await axios.post(`${API}/answer`, { sessionId, answer }, getHeaders());
  return res.data;
};

export const endInterview = async (sessionId) => {
  const res = await axios.post(`${API}/end`, { sessionId }, getHeaders());
  return res.data;
};

export const logoutAndCleanup = async (userId) => {
  const res = await axios.post(`${BASE_URL}/api/logout`, { userId }, getHeaders());
  return res.data;
};