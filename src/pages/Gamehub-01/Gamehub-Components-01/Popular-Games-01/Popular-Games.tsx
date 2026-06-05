import { createSignal, createEffect, onCleanup, Show, For, createMemo, type JSX } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { commands } from '../../../../bindings';
import { ChevronLeft, ChevronRight, Star, HardDrive, Languages, Building2, ArrowRight } from 'lucide-solid';
import LoadingPage from '../../../LoadingPage-01/LoadingPage';
import { useGamehub } from '../../GamehubContext';
import LazyImage from '../../../../components/LazyImage/LazyImage';
import { extractCompany, extractLanguage, parseGameSize, formatBytesToSize } from '../../../../helpers/gameFilters';

export default function PopularGames() {
  const { popular, loading } = useGamehub();
  const [selected, setSelected] = createSignal(0);
  const [isHovered, setIsHovered] = createSignal(false);
  const navigate = useNavigate();

  createEffect(() => {
    if (popular().length === 0) return;
    const interval = setInterval(() => {
      if (!isHovered()) setSelected(i => (i + 1) % popular().length);
    }, 10000);
    onCleanup(() => clearInterval(interval));
  });

  const current = createMemo(() => popular()[selected()]);

  const details = createMemo(() => {
    const desc = current()?.details;
    if (!desc) return { tags: 'N/A', companies: 'N/A', language: 'N/A', repackSize: 'N/A' };
    const tagsMatch = desc.match(/Genres\/Tags:\s*([^\n]+)/);
    const repackBytes = parseGameSize(desc, 'repack');
    return {
      tags: tagsMatch?.[1]?.trim() ?? 'N/A',
      companies: extractCompany(desc),
      language: extractLanguage(desc),
      repackSize: repackBytes > 0 ? formatBytesToSize(repackBytes) : 'N/A'
    };
  });

  const displayTitle = createMemo(() =>
    current()?.title
      ?.replace(/(?: - |, | )?(Digital Deluxe|Ultimate Edition|Deluxe Edition)\s*[:\-]?.*|(?: - |, ).*/, '')
      .replace(/\s*[:\-]\s*$/, '')
      .replace(/\(.*?\)/g, '')
      .replace(/[\–].*$/, '') || current()?.title || ''
  );

  const handleGameClick = async () => {
    const game = current();
    if (!game) return;
    const uuid = await commands.hashUrl(game.href);
    navigate(`/game/${uuid}`, { state: { gameHref: game.href, gameTitle: game.title } });
  };

  const prev = () => setSelected(i => (i - 1 + popular().length) % popular().length);
  const next = () => setSelected(i => (i + 1) % popular().length);

  return (
    <div class="relative w-full" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <Show when={loading()}><LoadingPage /></Show>

      <Show when={!loading() && popular().length > 0}>
        <div class="relative h-[340px] overflow-hidden border-b border-secondary-20/30 bg-background flex w-full">

          {/* Left — game details panel */}
          <div class="relative z-10 flex flex-col justify-between p-8 w-[480px] shrink-0 bg-background border-r border-secondary-20/20">
            {/* Title */}
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="text-[10px] font-bold uppercase tracking-widest text-accent border border-accent/40 px-2 py-0.5 rounded-sm">
                  Featured
                </span>
              </div>
              <h2 class="text-3xl font-bold text-text leading-tight line-clamp-2 mb-1">{displayTitle()}</h2>
              <p class="text-xs text-muted line-clamp-1 mb-5">{current()?.title}</p>

              {/* Details grid */}
              <div class="grid grid-cols-2 gap-3">
                <DetailItem icon={<Star size={14} />} label="Genre" value={details().tags} />
                <DetailItem icon={<Building2 size={14} />} label="Publisher" value={details().companies} />
                <DetailItem icon={<Languages size={14} />} label="Languages" value={details().language} />
                <DetailItem icon={<HardDrive size={14} />} label="Download Size" value={details().repackSize} />
              </div>
            </div>

            {/* Actions */}
            <div class="flex items-center gap-3 mt-4">
              <button
                onClick={handleGameClick}
                class="flex items-center gap-2 px-5 py-2.5 bg-accent text-background font-semibold text-sm rounded-lg hover:bg-accent/90 transition-all"
              >
                View Details <ArrowRight size={15} />
              </button>

              {/* Pagination dots */}
              <Show when={popular().length > 1}>
                <div class="flex gap-1.5 ml-2">
                  <For each={popular()}>
                    {(_, i) => (
                      <button
                        onClick={() => setSelected(i())}
                        class={`h-1.5 rounded-full transition-all duration-300 ${selected() === i() ? 'bg-accent w-5' : 'bg-secondary-20 w-1.5 hover:bg-accent/50'}`}
                      />
                    )}
                  </For>
                </div>
              </Show>

              {/* Nav */}
              <div class="flex gap-1 ml-auto">
                <NavButton onClick={prev}><ChevronLeft size={16} /></NavButton>
                <NavButton onClick={next}><ChevronRight size={16} /></NavButton>
              </div>
            </div>
          </div>

          {/* Right — unblurred cover art */}
          <div class="relative flex-1 overflow-hidden cursor-pointer" onClick={handleGameClick}>
            <LazyImage
              src={current()?.img}
              class="absolute inset-0 w-full h-full"
              style={{ "object-fit": "cover", "object-position": "top center" }}
            />
            {/* subtle left-edge fade into the panel */}
            <div class="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          </div>
        </div>
      </Show>
    </div>
  );
}

const NavButton = (props: { onClick: () => void; children: JSX.Element }) => (
  <button
    onClick={(e) => { e.stopPropagation(); props.onClick(); }}
    class="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary-20/40 border border-secondary-20 hover:bg-accent/20 hover:border-accent/40 transition-all"
  >
    <span class="text-text">{props.children}</span>
  </button>
);

const DetailItem = (props: { icon: JSX.Element; label: string; value: string }) => (
  <div class="flex items-start gap-2">
    <div class="mt-0.5 text-accent shrink-0">{props.icon}</div>
    <div class="min-w-0">
      <p class="text-[10px] text-muted uppercase tracking-wider">{props.label}</p>
      <p class="text-xs text-text font-medium truncate">{props.value}</p>
    </div>
  </div>
);
