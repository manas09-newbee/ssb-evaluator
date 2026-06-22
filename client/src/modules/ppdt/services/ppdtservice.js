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