import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/api/ppdt`;

export const evaluateHandwrittenStory = async (imageBase64) => {
  const response = await axios.post(`${API}/evaluate`, {
    image: imageBase64,
  });

  return response.data;
};

export const getPpdtImages = async () => {
  const response = await axios.get(`${API}/images`);
  return response.data;
};