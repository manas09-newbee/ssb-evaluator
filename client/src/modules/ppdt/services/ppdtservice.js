import axios from "axios";

const API = "http://localhost:5000/api/ppdt";

// This is the named export that PPDTPage.jsx is looking for
export const evaluateHandwrittenStory = async (imageBase64) => {
  const response = await axios.post(
    `${API}/evaluate`,
    {
      image: imageBase64,
    }
  );

  return response.data;
};

// This is the named export used to fetch the dynamic card list
export const getPpdtImages = async () => {
  const response = await axios.get(`${API}/images`);
  return response.data;
};