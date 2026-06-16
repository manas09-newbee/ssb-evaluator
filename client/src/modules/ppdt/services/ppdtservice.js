import axios from "axios";

export const evaluateStory = async (story) => {
  const response = await axios.post(
    "http://localhost:5000/api/ppdt/evaluate",
    {
      story,
    }
  );

  return response.data;
};