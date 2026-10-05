import { useState, useEffect, useCallback } from 'react';
import { Drawnix, DrawnixToolState } from '@drawnix/drawnix';
import { PlaitElement, PlaitTheme, Viewport } from '@plait/core';
import localforage from 'localforage';
import { getMapData, saveMap } from '../mapsApi';
import '../drawnix.css';
import '../plait-board.css';

type AppValue = {
  children: PlaitElement[];
  viewport?: Viewport;
  theme?: PlaitTheme;
};

localforage.config({
  name: 'OneThing',
  storeName: 'board_store',
  driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE],
});

let saveTimeout: any;

export default function DrawnixBoard({ mapId }: { mapId: string }) {
  const [value, setValue] = useState<AppValue>({ children: [] });
  const [initialToolState, setInitialToolState] = useState<Partial<DrawnixToolState>>();
  const [loaded, setLoaded] = useState(false);

  const CONTENT_KEY = `board_content_${mapId}`;
  const TOOL_STATE_KEY = `board_tool_state_${mapId}`;

  useEffect(() => {
    localStorage.setItem('language', 'vi');

    const loadData = async () => {
      setLoaded(false);
      try {
        let serverData = null;
        try {
          const res = await getMapData({ data: { id: mapId } });
          if (res.data) serverData = res.data;
        } catch (e) {
          console.warn('Server fetch error or map empty', e);
        }

        const [storedData, storedToolState] = await Promise.all([
          localforage.getItem<AppValue>(CONTENT_KEY),
          localforage.getItem<Partial<DrawnixToolState>>(TOOL_STATE_KEY),
        ]);
        
        // Prefer server data if present, otherwise localforage, otherwise empty
        if (serverData && serverData.children && serverData.children.length > 0) {
          setValue(serverData);
          localforage.setItem(CONTENT_KEY, serverData);
        } else if (storedData) {
          setValue(storedData);
        } else {
          setValue({ children: [] });
        }
        
        if (storedToolState) {
          setInitialToolState(storedToolState);
        } else {
          setInitialToolState(undefined);
        }
      } catch (err) {
        console.warn('Could not load board data:', err);
      }
      setLoaded(true);
    };
    loadData();
  }, [mapId]);

  const handleSaveToServer = useCallback((data: AppValue) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveMap({ data: { id: mapId, data } }).catch(console.error);
    }, 2000); // 2s debounce
  }, [mapId]);

  if (!loaded) {
    return (
      <div className="grid h-full w-full place-items-center bg-canvas text-muted-foreground text-sm font-semibold">
        Đang tải không gian vẽ...
      </div>
    );
  }

  return (
    <div className="h-full w-full" style={{ position: 'absolute', inset: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Drawnix
        className="h-full w-full flex-1"
        value={value.children}
        viewport={value.viewport}
        theme={value.theme}
        initialToolState={initialToolState}
        initialLanguage="vi"
        onChange={(val: any) => {
          const newValue = val as AppValue;
          localforage.setItem(CONTENT_KEY, newValue);
          // Do NOT call setValue(newValue) here to avoid re-rendering the Drawnix component 
          // while the user is typing (which causes IME duplication bugs like "ĐâyĐâyl").
          handleSaveToServer(newValue);
        }}
        onToolStateChange={(toolState: any) => {
          localforage.setItem(TOOL_STATE_KEY, toolState);
        }}
      />
    </div>
  );
}

