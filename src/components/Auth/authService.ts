import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import type { AuthUser, LoginResponse } from "@/types/auth";

export const loginUser = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });

    return response.data;
  } catch (error: any) {
    throw {
      message: getApiErrorMessage(error, "Invalid credentials"),
      status: error?.response?.status,
    };
  }
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

export const logoutUser = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const updateCurrentUserProfile = async (
  userId: number | string,
  payload: Record<string, any>,
) => {
  const response = await axiosInstance.patch(`/user/${userId}`, payload);
  return response.data;
};

export const changeCurrentPassword = async (
  currentPassword: string,
  newPassword: string,
) => {
  const response = await axiosInstance.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

