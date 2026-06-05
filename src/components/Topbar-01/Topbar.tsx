import { A, useNavigate } from "@solidjs/router";
import { Compass, Download, Home, Library, Settings, ChevronLeft, ChevronRight, X } from "lucide-solid";
import { createMemo, createSignal, onMount, Show } from "solid-js";
import Searchbar from "./Topbar-Components-01/Searchbar-01/Searchbar";
import { listen, Event } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { sendNotification, isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import createBasicChoicePopup from "../../Pop-Ups/Basic-Choice-PopUp/Basic-Choice-PopUp";
import { GlobalSettingsApi } from "../../api/settings/api";
import { commands } from "../../bindings";
import { routeHistory } from "../../stores/routeStore";
import { DownloadsStore } from "../../stores/download";
import { GlobalStatsStore } from "../../stores/globalStats";
import { formatSpeed } from "../../helpers/format";

export default function Topbar() {
  const [isMaximized, setIsMaximized] = createSignal(false);
  const [isFullscreen, setIsFullscreen] = createSignal(false);
  const navigate = useNavigate();
  const { jobs } = DownloadsStore;

  const isActive = (path: string) => {
    return routeHistory.at(-1) === path;
  };

  const activeDownloadCount = createMemo(() =>
    jobs().filter(j => j.state === "active" || j.state === "installing" || j.state === "waiting").length
  );

  const downloadSpeed = createMemo(() => {
    const speed = GlobalStatsStore.stats()?.downloadSpeed;
    if (!speed || speed === "0") return null;
    return formatSpeed(speed);
  });

  const appWindow = getCurrentWebviewWindow();

  async function handleWindowClose() {
    const settings = await GlobalSettingsApi.getGamehubSettings();

    if (settings.close_to_tray) {
      await appWindow.hide();

      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === "granted";
      }
      if (permissionGranted) {
        sendNotification({
          title: "GameHub Launcher is running in the tray",
          body: "The app was minimized to the system tray. You can change this behavior in Settings."
        });
      }
      return;
    }

    // Close instantly mode - check if controller is running
    const controllerRunning = await commands.isControllerRunning();

    if (controllerRunning) {
      // Warn user that controller will be killed
      createBasicChoicePopup({
        infoTitle: "Installation In Progress",
        infoMessage: "An installation is currently running. Closing will stop the installation.\n\nAre you sure you want to exit?",
        confirmLabel: "Exit Anyway",
        cancelLabel: "Cancel",
        action: async () => {
          await commands.quitApp();
        },
      });
      return;
    }

    // No controller running, exit immediately
    await commands.quitApp();
  }

  async function handleMaximize() {
    if (isFullscreen()) {
      await appWindow.setFullscreen(false);
      setIsFullscreen(false);
      if (isMaximized()) {
        await appWindow.maximize();
      }
    } else {
      await appWindow.toggleMaximize();
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    }
  }

  async function toggleFullscreen() {
    if (isMaximized()) {
      await appWindow.toggleMaximize();
    }
    const newFullscreenState = !isFullscreen();
    await appWindow.setFullscreen(newFullscreenState);
    setIsFullscreen(newFullscreenState);

    if (newFullscreenState) {

      const wasMaximized = await appWindow.isMaximized();
      setIsMaximized(wasMaximized);
    } else {

      if (isMaximized()) {
        await appWindow.maximize();
      }
    }
  }



  onMount(async () => {
    setIsMaximized(await appWindow.isMaximized());
    setIsFullscreen(await appWindow.isFullscreen());

    const unlistenResize = await appWindow.onResized(async () => {
      setIsFullscreen(await appWindow.isFullscreen());
      setIsMaximized(await appWindow.isMaximized());
    });

    document.addEventListener("keydown", async (e) => {
      if (e.key === "F11") {
        e.preventDefault();
        await toggleFullscreen();
      }
      // Alt+1–5 navigation shortcuts
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const shortcuts: Record<string, string> = {
          "1": "/",
          "2": "/discovery-page",
          "3": "/library",
          "4": "/downloads-page",
          "5": "/settings",
        };
        if (shortcuts[e.key]) {
          e.preventDefault();
          navigate(shortcuts[e.key]);
        }
      }
    });

    document.getElementById('titlebar-minimize')?.addEventListener('click', () => appWindow.minimize());
    document.getElementById('titlebar-maximize')?.addEventListener('click', handleMaximize);
    document.getElementById('titlebar-close')?.addEventListener('click', () => handleWindowClose());

    listen('network-failure', (event: Event<{ message: string }>) => {
      console.error(`Network failure: ${event.payload.message}`);
    });

    listen('scraping_failed_event', (event: Event<{ message: string }>) => {
      console.error('Scraping failed:', event.payload.message);
    });

    return () => {
      unlistenResize();
    };
  });

  return (
    <div
      class="w-full h-16 px-4 flex items-center justify-between bg-popup-background border-b border-secondary-20 select-none"
      data-tauri-drag-region
    >
      {/* K Logo + app name + back/forward navigation */}
      <div class="flex items-center gap-2" style="-webkit-app-region: no-drag;">
        {/* K brand icon */}
        <div class="w-8 h-8 rounded-md bg-accent flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/30">
          <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 4v16M5 12l9-8M5 12l9 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-background" />
          </svg>
        </div>
        <span class="text-sm font-bold text-text hidden lg:block" style="-webkit-app-region: no-drag;">GameHub</span>
        <div class="w-px h-5 bg-secondary-20 mx-1 hidden lg:block" />
        <button
          onClick={() => history.back()}
          title="Go back (Alt+←)"
          class="p-1.5 rounded-full text-muted hover:bg-secondary-20/30 hover:text-accent transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => history.forward()}
          title="Go forward (Alt+→)"
          class="p-1.5 rounded-full text-muted hover:bg-secondary-20/30 hover:text-accent transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Right Section - Searchbar */}
      <div class="flex items-center gap-3 flex-1 max-w-fit ml-4" style="-webkit-app-region: no-drag;">
        <Searchbar isTopBar={true} />
        <Show when={downloadSpeed()}>
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent">
            <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            {downloadSpeed()}
          </div>
        </Show>
      </div>

      {/* Middle Section - Navigation Links */}
      <div class="flex items-center gap-1 h-full" style="-webkit-app-region: no-drag;">
        <A
          href="/"
          class={`flex items-center gap-2 px-4 h-full transition-colors ${isActive("/") ? "text-accent border-b-2 border-accent" : "text-muted hover:text-text"
            }`}
          end
        >
          <Home size={18} />
          <span class="font-medium">GameHub</span>
        </A>

        <A
          href="/discovery-page"
          class={`flex items-center gap-2 px-4 h-full transition-colors ${isActive("/discovery-page") ? "text-accent border-b-2 border-accent" : "text-muted hover:text-text"
            }`}
        >
          <Compass size={18} />
          <span class="font-medium">Discovery</span>
        </A>

        <A
          href="/library"
          class={`flex items-center gap-2 px-4 h-full transition-colors ${isActive("/library") ? "text-accent border-b-2 border-accent" : "text-muted hover:text-text"
            }`}
        >
          <Library size={18} />
          <span class="font-medium">Library</span>
        </A>

        <A
          href="/downloads-page"
          class={`flex items-center gap-2 px-4 h-full transition-colors ${isActive("/downloads-page") ? "text-accent border-b-2 border-accent" : "text-muted hover:text-text"
            }`}
        >
          <div class="relative">
            <Download size={18} />
            <Show when={activeDownloadCount() > 0}>
              <span class="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-accent text-background text-[10px] font-bold flex items-center justify-center leading-none">
                {activeDownloadCount()}
              </span>
            </Show>
          </div>
          <span class="font-medium">Downloads</span>
        </A>

        <A
          href="/settings"
          class={`flex items-center gap-2 px-4 h-full transition-colors ${isActive("/settings") ? "text-accent border-b-2 border-accent" : "text-muted hover:text-text"
            }`}
        >
          <Settings size={18} />
          <span class="font-medium">Settings</span>
        </A>
      </div>

      {/* Right Section - close button only */}
      <div class="flex items-center" style="-webkit-app-region: no-drag;">
        <button
          id="titlebar-close"
          onClick={handleWindowClose}
          class="p-2 rounded-md text-muted hover:bg-red-500/20 hover:text-red-400 transition-colors"
          title="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}