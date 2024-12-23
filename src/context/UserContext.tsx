import { jwtDecode } from 'jwt-decode';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import BackdropLoader from '../components/BackdropLoader';
import { LoggedInUser } from '../types/LoggedInUser';
import log from '../utils/logger';
import { TokenStorage } from '../utils/TokenStorage';

interface UserContextType {
  loggedInUser: LoggedInUser | null;
  setLoggedInUser: React.Dispatch<React.SetStateAction<LoggedInUser | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = () => {
      const accessToken = TokenStorage.getAccessToken();
      if (accessToken) {
        setLoading(true);
        try {
          const decodedToken: LoggedInUser = jwtDecode(accessToken);
          setLoggedInUser(decodedToken);
        } catch (error) {
          log.error('Failed to decode token:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return <BackdropLoader />;
  }

  return (
    <UserContext.Provider value={{ setLoggedInUser, loggedInUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
