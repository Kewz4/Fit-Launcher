import PopularGames from "./Gamehub-Components-01/Popular-Games-01/Popular-Games";
import NewlyAddedGames from "./Gamehub-Components-01/Newly-Added-Games-01/Newly-Added-Games";
import RecentlyUpdatedGames from "./Gamehub-Components-01/Recently-Updated-Games-01/Recently-Updated-Games";
import FilterBar from "../../components/FilterBar/FilterBar";
import { GamehubProvider, useGamehub } from "./GamehubContext";
import { createSignal, Show } from "solid-js";
import { ChevronUp } from "lucide-solid";

function GamehubContent() {
    const { filters, setFilters, availableGenres, repackSizeRange, originalSizeRange } = useGamehub();
    const [showScrollTop, setShowScrollTop] = createSignal(false);
    let scrollRef: HTMLDivElement | undefined;

    function onScroll() {
        setShowScrollTop((scrollRef?.scrollTop ?? 0) > 300);
    }

    function scrollToTop() {
        scrollRef?.scrollTo({ top: 0, behavior: "smooth" });
    }

    return (
        <div
            ref={scrollRef}
            onScroll={onScroll}
            class="relative flex flex-col gap-4 divide-y divide-accent/70 w-full h-full overflow-y-auto no-scrollbar"
        >
            <PopularGames />
            <div class="px-4 pb-3">
                <FilterBar
                    availableGenres={availableGenres()}
                    repackSizeRange={repackSizeRange()}
                    originalSizeRange={originalSizeRange()}
                    filters={filters()}
                    onFilterChange={setFilters}
                />
            </div>
            <NewlyAddedGames />
            <RecentlyUpdatedGames />

            {/* Scroll to top FAB */}
            <Show when={showScrollTop()}>
                <button
                    onClick={scrollToTop}
                    class="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-accent/90 hover:bg-accent text-background shadow-lg shadow-accent/20 transition-all hover:scale-110"
                    title="Scroll to top"
                >
                    <ChevronUp class="w-5 h-5" />
                </button>
            </Show>
        </div>
    );
}

export default function Gamehub() {
    return (
        <GamehubProvider>
            <GamehubContent />
        </GamehubProvider>
    );
}