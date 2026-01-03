import axiosInstance from "@/lib/axiosInstance";

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error: any) {
    throw {
      message: error?.response?.data?.message || "Invalid credentials",
      status: error?.response?.status,
    };
  }
};

