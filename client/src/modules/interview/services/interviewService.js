import axios from "axios";

const API = "http://localhost:5000/api/interview";

export const startInterview =
  async (piq) => {

  const res =
    await axios.post(
      `${API}/start`,
      {
        piq
      }
    );

  return res.data;
};


export const getHistory = async (
  sessionId
) => {
  const res = await axios.get(
    `${API}/history/${sessionId}`
  );

  return res.data;
};

export const submitAnswer = async (
  sessionId,
  answer
) => {
  const res = await axios.post(
    `${API}/answer`,
    {
      sessionId,
      answer,
    }
  );

  return res.data;
};

export const endInterview = async (
  sessionId
) => {
  const res = await axios.post(
    `${API}/end`,
    {
      sessionId,
    }
  );

  return res.data;
};