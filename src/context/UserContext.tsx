import { jwtDecode } from 'jwt-decode';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { LoggedInUser } from '../types/LoggedInUser';
import { TokenStorage } from '../utils/TokenStorage';

interface UserContextType {
  loggedInUser: LoggedInUser | null;
  setLoggedInUser: React.Dispatch<React.SetStateAction<LoggedInUser | null>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);

  useEffect(() => {
    const fetchUser = () => {
      const accessToken = TokenStorage.getAccessToken();
      if (accessToken) {
        try {
          const decodedToken: LoggedInUser = jwtDecode(accessToken);
          setLoggedInUser(decodedToken);
        } catch (error) {
          console.error('Failed to decode token:', error);
        }
      }
    };

    fetchUser();
  }, []);

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
