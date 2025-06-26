
export interface SettingsConfig {
  theme: 'light' | 'dark' | 'system';
  contacts: {
    columns: {
      status: boolean;
      type: boolean;
      source: boolean;
      company: boolean;
      contactInfo: boolean;
      activity: boolean;
      lastContact: boolean;
      owner: boolean;
    };
    defaultView: 'table' | 'grid';
    pageSize: number;
  };
  dashboard: {
    layout: 'default' | 'compact';
    showWelcome: boolean;
  };
  general: {
    timezone: string;
    dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
    timeFormat: '12h' | '24h';
  };
}

export const defaultSettings: SettingsConfig = {
  theme: 'system',
  contacts: {
    columns: {
      status: true,
      type: true,
      source: true,
      company: true,
      contactInfo: true,
      activity: true,
      lastContact: true,
      owner: true,
    },
    defaultView: 'table',
    pageSize: 10,
  },
  dashboard: {
    layout: 'default',
    showWelcome: true,
  },
  general: {
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  },
};

export class SettingsStorage {
  private static readonly STORAGE_KEY = 'solar-crm-settings';

  static getSettings(): SettingsConfig {
    if (typeof window === 'undefined') {
      return defaultSettings;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return defaultSettings;
      }

      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all properties exist
      return this.mergeWithDefaults(parsed);
    } catch (error) {
      console.error('Error reading settings from localStorage:', error);
      return defaultSettings;
    }
  }

  static updateSettings(updates: Partial<SettingsConfig>): SettingsConfig {
    if (typeof window === 'undefined') {
      return defaultSettings;
    }

    try {
      const current = this.getSettings();
      const updated = this.deepMerge(current, updates);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
      return defaultSettings;
    }
  }

  static resetSettings(): SettingsConfig {
    if (typeof window === 'undefined') {
      return defaultSettings;
    }

    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return defaultSettings;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return defaultSettings;
    }
  }

  private static mergeWithDefaults(stored: any): SettingsConfig {
    return this.deepMerge(defaultSettings, stored);
  }

  private static deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}
