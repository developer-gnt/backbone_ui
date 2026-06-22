import React from "react";
import { ToastContainer, ToastContainerProps } from "react-toastify";
// @ts-ignore: side-effect CSS import without type declarations
import "react-toastify/dist/ReactToastify.css";

export function AppToaster(props: ToastContainerProps) {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
      {...props}
    />
  );
}
