import React, { useEffect, useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { TranslatedText } from "./TranslatedText";

const PrivateRoute = ({ children }) => {
  const { session } = UserAuth();

  if (session === undefined) {
    return <div><TranslatedText>Loading...</TranslatedText></div>;
  }

  return <div>{session ? <>{children}</> : <Navigate to="/signup" />}</div>;
};

export default PrivateRoute;