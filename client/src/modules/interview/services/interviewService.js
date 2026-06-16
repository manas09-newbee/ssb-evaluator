import axios from "axios";

const API = "http://localhost:5000/api/interview";

export const startInterview = async () => {
  const res = await axios.get(`${API}/start`);
  return res.data;
};

export const submitAnswer = async (answer) => {
  const res = await axios.post(`${API}/answer`, {
    answer,
  });

  return res.data;
};