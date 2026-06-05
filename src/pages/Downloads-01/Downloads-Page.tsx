import { Component, createMemo, createSignal, Show, For, onMount, onCleanup } from "solid-js";
import { CloudDownload, Funnel, Magnet, DownloadCloud, Zap, Trash2, ArrowDown, ArrowUp, Activity, PauseCircle, PlayCircle, CheckSquare, HardDrive, ChevronsUpDown, AlertTriangle, X } from "lucide-solid";
import Button from "../../components/UI/Button/Button";
import { useNavigate } from "@solidjs/router";
import InstallQueueStatus from "../../components/InstallQueue/QueueStatus";
import DownloadList from "./Downloads-List";
import { formatSpeed, formatBytes } from "../../helpers/format";
import { DM } from "../../api/manager/api";
import { DownloadSource } from "../../bindings";
import { DownloadsStore } from "../../stores/download";
import { GlobalStatsStore } from "../../stores/globalStats";
import { ManagerStatusStore, isDiskSpaceError } from "../../stores/managerStatus";
import { message } from "@tauri-apps/plugin-dialog";

type FilterType = DownloadSource | "All" | "Active";
type SortType = "none" | "name" | "progress_asc" | "progress_desc" | "size_desc";

const DownloadPage: Component = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = createSignal<FilterType>("All");
    const [sortType, setSortType] = createSignal<SortType>("none");
    const [showSortMenu, setShowSortMenu] = createSignal(false);
    const { jobs } = DownloadsStore;
    const { errors, dismissError } = ManagerStatusStore;

    onMount(() => {
        const unsub = DM.onError(async (msg) => {
            if (isDiskSpaceError(msg)) {
                await message(
                    "Not enough disk space to continue this download.\n\nFree up space on your drive and try again.",
                    { title: "Not Enough Space", kind: "error" }
                );
            }
        });
        onCleanup(unsub);
    });

    const filteredItems = createMemo(() => {
        const f = activeFilter();
        const filtered = jobs().filter((job) => {
            if (f === "All") return true;
            if (f === "Torrent") return job.source === "Torrent";
            if (f === "Ddl") return job.source === "Ddl";
            if (f === "Active") return job.state === "active" || job.state === "installing" || job.state === "waiting";
            return true;
        });

        const sort = sortType();
        if (sort === "name") return [...filtered].sort((a, b) => a.game.title.localeCompare(b.game.title));
        if (sort === "progress_desc") return [...filtered].sort((a, b) => (b.status?.progress_percentage ?? 0) - (a.status?.progress_percentage ?? 0));
        if (sort === "progress_asc") return [...filtered].sort((a, b) => (a.status?.progress_percentage ?? 0) - (b.status?.progress_percentage ?? 0));
        if (sort === "size_desc") return [...filtered].sort((a, b) => (b.status?.total_length ?? 0) - (a.status?.total_length ?? 0));
        return filtered;
    });

    const downloadStats = createMemo(() => {
        let torrentCount = 0;
        let ddlCount = 0;
        let activeCount = 0;
        let completedCount = 0;
        let totalBytes = 0;

        for (const job of jobs()) {
            if (job.source === "Torrent") torrentCount++;
            else ddlCount++;
            if (job.state === "active" || job.state === "installing" || job.state === "waiting") activeCount++;
            if (job.state === "complete") completedCount++;
            if (job.status?.total_length) totalBytes += job.status.total_length;
        }
        return { torrentCount, ddlCount, activeCount, completedCount, totalBytes };
    });

    async function deleteAllDownloads() {
        const confirmed = window.confirm(`Remove all ${jobs().length} downloads from the list?`);
        if (!confirmed) return;
        for (const job of jobs()) {
            await DM.remove(job.id);
        }
    }

    async function pauseAll() {
        for (const job of jobs()) {
            if (job.state === "active") await DM.pause(job.id);
        }
    }

    async function resumeAll() {
        for (const job of jobs()) {
            if (job.state === "paused" || job.state === "waiting") await DM.resume(job.id);
        }
    }

    async function clearCompleted() {
        const completed = jobs().filter(j => j.state === "complete");
        for (const job of completed) {
            await DM.remove(job.id);
        }
    }

    const sortLabels: Record<SortType, string> = {
        none: "Default",
        name: "Name (A–Z)",
        progress_desc: "Progress ↓",
        progress_asc: "Progress ↑",
        size_desc: "Size (largest)",
    };



    return (
        <div class="min-h-screen bg-background p-4 w-full">
            <div class="max-w-[1800px] mx-auto mb-8">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <h1 class="text-3xl font-bold flex items-center gap-3">
                        <div class="p-2 rounded-xl bg-accent/10 border border-accent/20 backdrop-blur-sm">
                            <CloudDownload class="w-6 h-6 text-accent animate-pulse" />
                        </div>
                        <span class="text-text tracking-widest">DOWNLOAD MANAGER</span>
                    </h1>

                    <div class="flex flex-wrap gap-3 w-full md:w-auto items-center">
                        <button
                            onClick={() => setActiveFilter("All")}
                            class={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 ${activeFilter() === "All" ? "bg-primary/20 border-primary/50 text-primary" : "bg-secondary-20/10 hover:bg-secondary-20/20 border-secondary-20/30"} border transition-all group`}
                        >
                            <Funnel class="w-5 h-5 opacity-70" />
                            <span>All</span>
                            <span class="px-2 py-0.5 rounded-full bg-secondary-20/30 text-xs font-bold">{jobs().length}</span>
                        </button>

                        <button
                            onClick={() => setActiveFilter("Torrent")}
                            class={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 ${activeFilter() === "Torrent" ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-blue-500/10 hover:bg-blue-500/20 border-blue-400/30"} border transition-all group`}
                        >
                            <Magnet class="w-5 h-5 text-blue-400 group-hover:animate-pulse" />
                            <span>Torrents</span>
                            <span class="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">{downloadStats().torrentCount}</span>
                        </button>

                        <button
                            onClick={() => setActiveFilter("Ddl")}
                            class={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 ${activeFilter() === "Ddl" ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-green-500/10 hover:bg-green-500/20 border-green-400/30"} border transition-all group`}
                        >
                            <DownloadCloud class="w-5 h-5 text-green-400 group-hover:animate-bounce" />
                            <span>Direct</span>
                            <span class="px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-bold">{downloadStats().ddlCount}</span>
                        </button>

                        <button
                            onClick={() => setActiveFilter("Active")}
                            class={`px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 ${activeFilter() === "Active" ? "bg-amber-500/20 border-amber-500/50 text-amber-400" : "bg-amber-500/10 hover:bg-amber-500/20 border-amber-400/30"} border transition-all group`}
                        >
                            <Zap class="w-5 h-5 text-amber-400 group-hover:animate-pulse" />
                            <span>Active</span>
                            <span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">{downloadStats().activeCount}</span>
                        </button>

                        {/* Sort dropdown */}
                        <div class="relative">
                            <button
                                onClick={() => setShowSortMenu(p => !p)}
                                class="px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 bg-secondary-20/10 hover:bg-secondary-20/20 border border-secondary-20/30 transition-all"
                            >
                                <ChevronsUpDown class="w-4 h-4 opacity-70" />
                                <span>{sortLabels[sortType()]}</span>
                            </button>
                            <Show when={showSortMenu()}>
                                <div class="absolute right-0 mt-2 w-44 bg-popup-background border border-secondary-20 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {(Object.keys(sortLabels) as SortType[]).map(s => (
                                        <button
                                            class={`w-full text-left px-4 py-2.5 text-sm hover:bg-secondary-20/30 transition-colors ${sortType() === s ? "text-accent font-medium" : "text-text"}`}
                                            onClick={() => { setSortType(s); setShowSortMenu(false); }}
                                        >
                                            {sortLabels[s]}
                                        </button>
                                    ))}
                                </div>
                            </Show>
                        </div>
                    </div>
                </div>

                {/* Bulk action buttons */}
                <div class="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={pauseAll}
                        class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-secondary-20/10 hover:bg-secondary-20/20 border border-secondary-20/30 transition-all text-muted hover:text-text"
                        title="Pause all active downloads"
                    >
                        <PauseCircle class="w-4 h-4" />
                        <span>Pause All</span>
                    </button>
                    <button
                        onClick={resumeAll}
                        class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-secondary-20/10 hover:bg-secondary-20/20 border border-secondary-20/30 transition-all text-muted hover:text-text"
                        title="Resume all paused downloads"
                    >
                        <PlayCircle class="w-4 h-4" />
                        <span>Resume All</span>
                    </button>
                    <Show when={downloadStats().completedCount > 0}>
                        <button
                            onClick={clearCompleted}
                            class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-secondary-20/10 hover:bg-secondary-20/20 border border-secondary-20/30 transition-all text-muted hover:text-text"
                            title="Remove all completed downloads from list"
                        >
                            <CheckSquare class="w-4 h-4 text-green-400" />
                            <span>Clear Completed ({downloadStats().completedCount})</span>
                        </button>
                    </Show>
                    <button
                        onClick={deleteAllDownloads}
                        class={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 transition-all border border-red-400/30 hover:border-red-400/50 group ${jobs().length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={jobs().length === 0}
                    >
                        <Trash2 class="w-4 h-4 text-red-400" />
                        <span class="text-red-400">Delete All</span>
                    </button>
                </div>

                <div class="flex gap-4 overflow-x-auto p-4 mb-8 no-scrollbar">
                    <div class="flex items-center gap-3 px-6 py-3 rounded-xl border border-cyan-500/40 bg-popup/80 backdrop-blur-sm">
                        <div class="p-2 rounded-lg bg-cyan-500/10">
                            <ArrowDown class="w-5 h-5" />
                        </div>
                        <div class="flex flex-col">
                            <span class="text-xs uppercase tracking-wider text-muted/80">Download Speed</span>
                            <span class="font-bold text-lg">{formatSpeed(GlobalStatsStore.stats()?.downloadSpeed)}</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 px-6 py-3 rounded-xl border border-purple-500/40 bg-popup/80 backdrop-blur-sm">
                        <div class="p-2 rounded-lg bg-purple-500/10">
                            <ArrowUp class="w-5 h-5" />
                        </div>
                        <div class="flex flex-col">
                            <span class="text-xs uppercase tracking-wider text-muted/80">Upload Speed</span>
                            <span class="font-bold text-lg">{formatSpeed(GlobalStatsStore.stats()?.uploadSpeed)}</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3 px-6 py-3 rounded-xl border border-amber-500/40 bg-popup/80 backdrop-blur-sm">
                        <div class="p-2 rounded-lg bg-amber-500/10">
                            <Activity class="w-5 h-5" />
                        </div>
                        <div class="flex flex-col">
                            <span class="text-xs uppercase tracking-wider text-muted/80">Active Transfers</span>
                            <span class="font-bold text-lg">{GlobalStatsStore.stats()?.numActive ?? 0}</span>
                        </div>
                    </div>

                    <Show when={downloadStats().totalBytes > 0}>
                        <div class="flex items-center gap-3 px-6 py-3 rounded-xl border border-emerald-500/40 bg-popup/80 backdrop-blur-sm">
                            <div class="p-2 rounded-lg bg-emerald-500/10">
                                <HardDrive class="w-5 h-5 text-emerald-400" />
                            </div>
                            <div class="flex flex-col">
                                <span class="text-xs uppercase tracking-wider text-muted/80">Total Size</span>
                                <span class="font-bold text-lg">{formatBytes(downloadStats().totalBytes)}</span>
                            </div>
                        </div>
                    </Show>
                </div>

                {/* Error notifications */}
                <Show when={errors().length > 0}>
                    <div class="space-y-2 mb-4">
                        <For each={errors()}>
                            {(err) => (
                                <div class={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
                                    err.isDiskSpace
                                        ? "bg-error/10 border-error/40 text-text"
                                        : "bg-secondary-20/20 border-secondary-20 text-muted"
                                }`}>
                                    <AlertTriangle class={`w-4 h-4 mt-0.5 flex-shrink-0 ${err.isDiskSpace ? "text-error" : "text-warning-orange"}`} />
                                    <span class="flex-1">
                                        {err.isDiskSpace
                                            ? "Not enough disk space — free up space and retry the download."
                                            : err.message}
                                    </span>
                                    <button onClick={() => dismissError(err.id)} class="text-muted hover:text-text transition-colors">
                                        <X class="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>

                {/* Installation Queue Status */}
                <div class="mt-4">
                    <InstallQueueStatus />
                </div>
            </div>

            <div class="max-w-[1800px] mx-auto">
                <DownloadList
                    items={filteredItems}
                    refreshDownloads={async () => {
                        //** 
                        // * nothing :3
                        // */
                    }}
                />
                {jobs().length === 0 && (
                    <div class="flex flex-col items-center justify-center py-24 text-center bg-popup/30 backdrop-blur-sm rounded-3xl border-2 border-dashed border-accent/30 hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/10">
                        <div class="relative mb-8">
                            <div class="absolute inset-0 bg-accent/10 rounded-full animate-ping opacity-20"></div>
                            <CloudDownload class="w-20 h-20 text-accent animate-bounce" />
                        </div>
                        <h3 class="text-3xl font-bold mb-3 text-text">Ready for Downloads!</h3>
                        <p class="text-muted/80 max-w-md mb-8 text-lg">Your download queue is empty. Let's find some awesome games!</p>
                        <Button label="Explore Game Library" icon={<></>} onClick={() => navigate("/discovery-page")} class="text-lg py-3 px-6 hover:scale-105 transition-transform" variant="glass" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DownloadPage;
