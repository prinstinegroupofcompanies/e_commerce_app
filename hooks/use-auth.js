import { useSession } from "next-auth/react";

export function useAuth() {
  const { data, status } = useSession();
  return {
    user: data?.user,
    status,
    isLoading: status === "loading",
    isCustomer: data?.user?.role === "customer",
    isAdmin: data?.user?.role === "admin",
    isSeller: data?.user?.role === "seller",
  };
}
