import { AxiosError } from 'axios';
import deepEqual from 'deep-equal';
import { debounce } from 'lodash-es';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import BackdropLoader from '../components/BackdropLoader';
import apiClient from '../services/ApiService';
import log from '../utils/logger';

interface SettingsContextType {
  settings: Record<string, any> | null;
  loading: boolean;
  // eslint-disable-next-line no-unused-vars
  update: (newSettings: Record<string, any>) => void;
}

interface SettingsProviderProps {
  children: ReactNode;
  settingsKey: string;
  defaultValue: Record<string, any>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

const fillMissingSettings = (
  userSettings: Record<string, any>,
  defaultValue: Record<string, any>,
): Record<string, any> => {
  if (!defaultValue) {
    return userSettings;
  }

  Object.keys(defaultValue).forEach((key) => {
    if (!(key in userSettings)) {
      userSettings[key] = defaultValue[key];
    } else if (
      typeof userSettings[key] === 'object' &&
      typeof defaultValue[key] === 'object' &&
      !Array.isArray(userSettings[key]) &&
      !Array.isArray(defaultValue[key])
    ) {
      userSettings[key] = fillMissingSettings(
        userSettings[key],
        defaultValue[key],
      );
    }
  });

  return userSettings;
};

const readUserSettings = async ({
  settingsKey,
  setUserSettings,
  defaultValue,
}: {
  settingsKey: string;
  setUserSettings: React.Dispatch<
    React.SetStateAction<{
      settings: Record<string, any> | null;
      loading: boolean;
    }>
  >;
  defaultValue: Record<string, any>;
}) => {
  try {
    const { data } = await apiClient.get(`/settings/${settingsKey}`);
    const settings = data.settingValue
      ? fillMissingSettings(JSON.parse(data.settingValue), defaultValue)
      : defaultValue;

    setUserSettings({
      settings,
      loading: false,
    });
  } catch (error) {
    if (
      error instanceof AxiosError &&
      error.response &&
      error.response.status === 404
    ) {
      await writeUserSettings(settingsKey, defaultValue);
      setUserSettings({
        settings: defaultValue,
        loading: false,
      });
    } else {
      log.error('Failed to fetch setting:', error);
    }
  }
};

const writeUserSettings = debounce(
  async (settingsKey: string, settings: Record<string, any>) => {
    try {
      await apiClient.post('/settings', {
        settingKey: settingsKey,
        settingValue: JSON.stringify(settings),
      });
    } catch (error) {
      log.error('Failed to save setting:', error);
    }
  },
  1000,
);

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
  settingsKey,
  defaultValue,
}) => {
  const [userSettings, setUserSettings] = useState<{
    settings: Record<string, any> | null;
    loading: boolean;
  }>({
    settings: null,
    loading: true,
  });

  useEffect(() => {
    readUserSettings({
      settingsKey,
      setUserSettings,
      defaultValue,
    });
  }, [defaultValue, settingsKey]);

  if (userSettings.loading) {
    return <BackdropLoader />;
  }

  return (
    <SettingsContext.Provider
      value={{
        settings: userSettings.settings,
        loading: userSettings.loading,
        update: (newSettings) => {
          if (deepEqual(userSettings.settings, newSettings, { strict: true })) {
            return;
          }
          setUserSettings({
            loading: false,
            settings: newSettings,
          });
          writeUserSettings(settingsKey, newSettings);
        },
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
