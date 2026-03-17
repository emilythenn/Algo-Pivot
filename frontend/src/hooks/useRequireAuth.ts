import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const isDemo = localStorage.getItem("demo_mode") === "true";

  useEffect(() => {
    if (!loading && !user && !isDemo) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate, isDemo]);

  return { user, loading, isDemo };
}
