import { jwtDecode } from 'jwt-decode';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import BackdropLoader from '../components/BackdropLoader';
import apiClient from '../services/ApiService';
import { LoggedInUser } from '../types/LoggedInUser';
import { User } from '../types/User';
import log from '../utils/logger';
import { TokenStorage } from '../utils/TokenStorage';

interface UserContextType {
  loggedInUser: LoggedInUser | null;
  users: User[] | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
  const [users, setUsers] = useState<User[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      const accessToken = TokenStorage.getAccessToken();
      if (accessToken) {
        setLoading(true);
        try {
          const decodedToken: LoggedInUser = jwtDecode(accessToken);
          setLoggedInUser(decodedToken);

          const userResponse = await apiClient.get('/users');
          const usersData = userResponse.data;
          setUsers(usersData);
        } catch (error) {
          log.error('Failed to load user data:', error);
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
    <UserContext.Provider value={{ loggedInUser, users }}>
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
