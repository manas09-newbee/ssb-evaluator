import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = `${BASE_URL}/api/oir`;

const getHeaders = () => {
  const token = localStorage.getItem("olqinsight_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const getQuestions = async (difficulty, limit) => {
  const res = await axios.get(`${API}/questions?difficulty=${difficulty}&limit=${limit}`, getHeaders());
  return res.data;
};

export const submitAnswers = async (payload) => {
  const res = await axios.post(`${API}/submit`, payload, getHeaders());
  return res.data;
};

export const getDashboardStats = async () => {
  const res = await axios.get(`${API}/stats`, getHeaders());
  return res.data;
};

export const getReportDetails = async (id) => {
  const res = await axios.get(`${API}/report/${id}`, getHeaders());
  return res.data;
};