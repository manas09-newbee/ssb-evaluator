import axios from "axios";

const API = "http://localhost:5000/api/ppdt";

export const evaluateHandwrittenStory = async (imageBase64) => {
  const response = await axios.post(
    `${API}/evaluate`,
    {
      image: imageBase64,
    }
  );

  return response.data;
};

// Fetches the dynamic list of image cards from the backend's folder scanning service
export const getPpdtImages = async () => {
  const response = await axios.get(`${API}/images`);
  return response.data;
};