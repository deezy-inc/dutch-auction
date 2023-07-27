import axios from "axios";
import { AxiosError } from "axios";

export interface ApiError {
  error: boolean;
  message: string;
  data: any;
}

const API = `https://auction-api-testnet.deezy.io/v1`;

describe("publishEvent endpoint", () => {
  const apiUrl = `${API}/nostr`;
  it("should respond with error when provided invalid data", async () => {
    const body = {};
    try {
      await axios.post(apiUrl, body);
    } catch (e) {
      const error = e as AxiosError<ApiError>;
      expect(error.response?.status).toBe(422);
    }
  });
});
