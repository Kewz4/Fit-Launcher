import { Accessor, For, Show } from "solid-js"
import { DownloadedGame } from "../../../bindings"
import { InfoContainer } from "../components/InfoContainer"

export type FeaturesSectionProps = {
    game: Accessor<DownloadedGame | null | undefined>
}

export const FeaturesSection = (props: FeaturesSectionProps) => {
    return (
        <Show when={props.game()?.gameplay_features}>
            <InfoContainer>
                <div class="flex gap-2 mb-4 border-b items-center transition-all duration-300 border-secondary-20/40">
                    <div class="w-1 h-4 bg-accent rounded-full"></div>
                    <span class="px-4 py-2 text-lg font-bold text-text">
                        Game Features
                    </span>
                </div>
                <InfoContainer class="p-4 max-h-80 overflow-y-auto custom-scrollbar">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted leading-6">
                        <For
                            each={props.game()?.gameplay_features
                                ?.split("\n")
                                .map(f => f.trim())
                                .filter(Boolean)
                                .sort((a, b) => b.length - a.length)
                            }
                        >
                            {(feature) => (
                                <div class="flex gap-2">
                                    <span class="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                                    <p>{feature}</p>
                                </div>
                            )}
                        </For>
                    </div>
                </InfoContainer>
            </InfoContainer>
        </Show>
    )
}