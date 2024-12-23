/* eslint-disable no-unused-vars */
import { Backdrop, CircularProgress } from '@mui/material';
import { AxiosError } from 'axios';
import { debounce } from 'lodash-es';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import apiClient from '../services/ApiService';
import log from '../utils/logger';

interface SettingsContextType {
  settings: Record<string, any> | null;
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
) => {
  if (!defaultValue) {
    return userSettings;
  }

  Object.keys(defaultValue).forEach((key) => {
    if (!(key in userSettings)) {
      userSettings[key] = defaultValue[key];
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
  2500,
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
    return (
      <Backdrop
        sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
        open={true}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  return (
    <SettingsContext.Provider
      value={{
        settings: userSettings.settings,
        update: (newSettings) => {
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