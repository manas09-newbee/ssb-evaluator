import axios from "axios";

// Fall back safely to port 5000 in local development if environment variables are not set
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = `${BASE_URL}/api/ppdt`;

const getHeaders = () => {
  const token = localStorage.getItem("olqinsight_token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const evaluateHandwrittenStory = async (imageBase64) => {
  const response = await axios.post(`${API}/evaluate`, {
    image: imageBase64,
  }, getHeaders());

  return response.data;
};

export const getPpdtImages = async () => {
  const response = await axios.get(`${API}/images`, getHeaders());
  return response.data;
};