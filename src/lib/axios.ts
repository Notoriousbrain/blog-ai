import axios from "axios";

export const aiClient = axios.create({
  timeout: 60000,
  headers: {
    Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY || ""}`,
    "Content-Type": "application/json",
  },
});

export const http = axios.create({
  baseURL: "",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});
