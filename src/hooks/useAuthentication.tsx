
import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

// Create a context for authentication
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  isAdmin: false,
});

// Mock data for development until Supabase is integrated
const MOCK_USERS = [
  {
    id: "1",
    email: "admin@example.com",
    full_name: "Admin User",
    role: "admin",
    password: "admin123",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    email: "sales@example.com",
    full_name: "Sales User",
    role: "sales",
    password: "sales123",
    created_at: new Date().toISOString(),
  },
];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for existing session on initial load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem("salesforce_user");
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // This would be replaced with actual Supabase auth
      const foundUser = MOCK_USERS.find(
        (u) => u.email === email && u.password === password
      );

      if (foundUser) {
        // Remove password before storing
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword as User);
        localStorage.setItem("salesforce_user", JSON.stringify(userWithoutPassword));
        
        toast({
          title: "Welcome back!",
          description: `You are now signed in as ${foundUser.full_name}.`,
        });
        
        return;
      }
      
      throw new Error("Invalid email or password");
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: "Invalid email or password. Please try again.",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // This would be replaced with actual Supabase auth
      setUser(null);
      localStorage.removeItem("salesforce_user");
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthentication = () => useContext(AuthContext);

// Auth guard hook
export const useAuthGuard = (requireAdmin = false) => {
  const { user, isLoading, isAdmin } = useAuthentication();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login", { replace: true });
    } else if (!isLoading && requireAdmin && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate, requireAdmin, isAdmin]);

  return { isLoading, isAuthenticated: !!user };
};
