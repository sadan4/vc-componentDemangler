/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { StartAt } from "@utils/types";
import { filters, moduleListeners, waitFor } from "@webpack";

const SYM_FORWARD_REF = Symbol.for("react.forward_ref");
const SYM_MEMO = Symbol.for("react.memo");
const logger = new Logger("ComponentDemangler/Extra", "#3e00ff");
/**
 * calls {@link setComponentName} on the given component
 * @returns maybeComponent
 */
function wrapComponentName<T>(maybeComponent: T, name?: string): T {
    // don't set if name is falsy
    if (name) setComponentName(maybeComponent, name);
    return maybeComponent;
}

function setComponentName(maybeComponent: any, name: string, opts: any = {}): void {
    name !== "Icon" && logger.debug(`setting component name for ${name}`);

    function defineComponentName(propName: "name" | "displayName") {
        if (Object.hasOwn(maybeComponent, propName)) {
            const desc = Object.getOwnPropertyDescriptor(maybeComponent, propName);
            if (desc?.configurable) {
                Object.defineProperty(maybeComponent, propName, {
                    configurable: desc.configurable,
                    writable: desc.writable ?? true,
                    value: name
                });
            }
        } else {
            Object.defineProperty(maybeComponent, propName, {
                configurable: true,
                value: name
            });
        }
    }
    try {
        if (opts.prop) {
            defineComponentName(opts.prop);
        }
        else if (
            typeof maybeComponent === "function" &&
            "toString" in maybeComponent &&
            typeof maybeComponent.toString === "function"
        ) {
            const str: string = (() => { }).toString.call(maybeComponent);
            if (typeof str !== "string") void 0;
            else if (str.startsWith("class")) {
                defineComponentName("displayName");
            } else {
                // because typeof v === "function" and v is not a class
                // v must be a function or an arrow function
                defineComponentName("name");
            }
        } else if (
            "$$typeof" in maybeComponent &&
            typeof maybeComponent.$$typeof === "symbol" &&
            (maybeComponent.$$typeof === SYM_FORWARD_REF || maybeComponent.$$typeof === SYM_MEMO)
        ) {
            defineComponentName("displayName");
        } else {
            throw new Error("Unknown component type, not a function, class, memo or a forwardRef");
        }

    } catch (e) {
        (IS_DEV ? console.warn : console.debug)(e, maybeComponent, name);
    }
}

// thanks to https://github.com/moonlight-mod/mappings/blob/2c6620b9b2827266310bfdf35bc4c65077a0ab34/src/mappings/discord/components/common/index.ts#L1472
//  for the icons
// icons
// use https://gist.github.com/sadan4/cd3111613f590d5f942248fa1cebaad2 to easily extract them
const iconMap = Object.entries({
    PlayIcon: "M9.25 3.35C7.87 2.45 6 3.38 6 4.96v14.08c0 1.58",
    PauseIcon: "M6 4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3a1",
    ScreenIcon: "M5 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h14a3",
    MobilePhoneIcon: "M5 4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v16a3 3 0 0 1-3",
    GlobeEarthIcon: "M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0Zm-4.16 5.85A9",
    GameControllerIcon: "M20.97 4.06c0 .18.08.35.24.43.55.28.9.82 1.04 1.42.3",
    RetryIcon: "M4 12a8 8 0 0 1 14.93-4H15a1 1 0 1 0 0 2h6a1",
    ChevronSmallUpIcon: "M5.3 14.7a1 1 0 0 0 1.4 0L12 9.42l5.3 5.3a1",
    ChevronSmallDownIcon: "M5.3 9.3a1 1 0 0 1 1.4 0l5.3 5.29 5.3-5.3a1",
    CircleInformationIcon:
        "M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0Zm-9.5-4.75a1.25 1.25",
    CircleWarningIcon:
        "M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm1.44-15.94L13.06",
    AngleBracketsIcon: "M9.6 7.8 4 12l5.6 4.2a1 1 0 0 1 .4.8v1.98c0",
    ChannelListIcon: "M2 4a1 1 0 0 1 1-1h18a1 1 0 1 1 0 2H3a1 1 0 0 1-1-1ZM2",
    HeartIcon: "M12.47 21.73a.92.92 0 0 1-.94 0C9.43 20.48 1 15.09",
    WindowTopOutlineIcon:
        "M4 5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v.18a1 1 0 1 0 2 0V5a3",
    ScienceIcon: "M19.5 15.46a13.2 13.2 0 0 0-.72-1.62",
    WarningIcon: "M10 3.1a2.37 2.37 0 0 1 4 0l8.71 14.75c.84",
    TrashIcon: "14.25 1c.41 0 .75.34.75.75V3h5.25c.41",
    DownloadIcon: "M12 2a1 1 0 0 1 1 1v10.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-5",
    ArrowsUpDownIcon: "M16.3 21.7a1 1 0 0 0 1.4 0l4-4a1 1 0 0",
    XSmallIcon: "M17.3 18.7a1 1 0 0 0 1.4-1.4L13.42 12l5.3-5.3a1",
    BookCheckIcon: "M15 2a3 3 0 0 1 3 3v12H5.5a1.5 1.5 0 0 0 0 3h14a.5.5",
    ClydeIcon: "M19.73 4.87a18.2 18.2 0 0 0-4.6-1.44c-.21.4-.4.8-.58",
    CircleXIcon: "M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm4.7-15.7a1",
    XLargeIcon: "M19.3 20.7a1 1 0 0 0 1.4-1.4L13.42",
    CopyIcon: "M3 16a1 1 0 0 1-1-1v-5a8 8 0 0 1 8-8h5a1",
    LinkIcon: "M16.32 14.72a1 1 0 0 1 0-1.41l2.51-2.51a3.98",
    PlusLargeIcon: "M13 3a1 1 0 1 0-2 0v8H3a1 1 0 1 0 0 2h8v8a1",
    MinusIcon: "M22 12a1 1 0 0 1-1 1H3a1 1 0 1 1 0-2h18a1 1 0 0 1 1 1Z",
    FullscreenEnterIcon:
        "2h3ZM20 18a2 2 0 0 1-2 2h-3a1 1 0 1 0 0 2h3a4 4 0 0 0 4-4v-3a1 1 0 1 0-2 0v3Z",
    ArrowAngleLeftUpIcon:
        "M2.3 7.3a1 1 0 0 0 0 1.4l5 5a1 1 0 0 0 1.4-1.4L5.42 9H11a7",
    ArrowAngleRightUpIcon:
        "M21.7 7.3a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4-1.4L18.58 9H13a7",
    WindowLaunchIcon: "1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6a1",
    MaximizeIcon: "M14 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V5.41l-5.3",
    StarIcon: "M10.81 2.86c.38-1.15 2-1.15 2.38 0l1.89 5.83h6.12c1.2 0 1.71",
} as const).map(([name, path]) => {
    return [filters.componentByCode(path), name] as const;
});

console.log(iconMap.map(([, name]) => name));

const map = [
    ...iconMap,
    [filters.byCode("useStateFromStores"), "useStateFromStores"],
    // use https://www.npmjs.com/package/react-focus-rings to find the components and their names
    [filters.componentByCode("FocusRing was given a focusTarget"), "FocusRing"],
    [filters.componentByCode(".current]", "setThemeOptions"), "FocusRingScope"],
    // discords context menu is horrifying
    // use the demangled module to get the finds for each menu item type
    [filters.componentByCode(".sparkles", "dontCloseOnActionIfHoldingShiftKey"), "Menu.MenuItem"],
    [filters.componentByCode('role:"separator",', ".separator"), "Menu.MenuSeparator"],
    // for some reason, this is marked as groupend
    [filters.componentByCode('role:"group"', "contents:"), "Menu.MenuGroup"],
    [filters.componentByCode(".customItem"), "Menu.MenuCustomItem"],
    // https://gist.github.com/sadan4/556a3559a08d762fc38e7ef285a69551
    [filters.componentByCode("Shapes.BOX", "CHECKBOX"), "Menu.MenuCheckboxItem"],
    // https://gist.github.com/sadan4/e3a27cc7d20695f1862272013dcf2977
    [filters.componentByCode(",menuItemProps:", ".RADIO"), "Menu.MenuRadioItem"],
    [filters.componentByCode("menuItemProps", "control"), "Menu.MenuControlItem"],
    [filters.componentByCode("'[tabindex=\"0\"]'"), "Menu.MenuCompositeControlItem"],
    [filters.componentByCode("isUsingKeyboardNavigation", "keyboardModeEnabled"), "Menu.Root"],
    [filters.componentByCode('"span":"label"'), "Checkbox"],
    [filters.componentByCode("checkboxDisabled]:"), "Checkbox.Box"],
    // https://gist.github.com/sadan4/d65dabe5486bfc68dc575d713a1a3d54
    // TODO: get radio bar
    [filters.componentByCode("radioItemIconClassName", "withTransparentBackground", "radioBarClassName"), "RadioGroup"],
    [filters.componentByCode(".onlyShineOnHover"), "ShinyButton"],
    [filters.componentByCode("subMenuClassName", "renderSubmenu"), "Menu.MenuSubMenuItem"],
    // https://gist.github.com/sadan4/6a71dcdd9687f3b56094aeca2542f5ad
    // TODO: get the loader wrapper `N` in the gist;
    [filters.componentByCode('="expressive"==='), "Button"],
    [filters.componentByCode("xMinYMid meet"), "Switch.Toggle"],
    [filters.componentByCode("this.renderTooltip()]"), "Tooltip"],
    [filters.componentByCode('="div"'), "TooltipContainer"],
    // src/components/PluginSettings/PluginModal.tsx
    [filters.componentByCode("defaultRenderUser", "showDefaultAvatarsForNullUsers"), "UserSummaryItem"],
    // https://gist.github.com/sadan4/fd9d37c2a469df6c45876fbf1bfbb6fe
    [filters.componentByCode("getDefaultLinkInterceptor", '"noreferrer noopener"'), "Anchor"],
    // https://gist.github.com/sadan4/482d9d4b20ae3dfd92964c53ef8fa469
    [filters.componentByCode(/type:\i=\i\.DEFAULT/, '"text-sm/normal"'), "FormText"],
    // https://gist.github.com/sadan4/92931156f8f8934037c7287ae69d8910
    [filters.componentByCode('"data-justify":'), "FlexStack"],
    // https://gist.github.com/sadan4/6188f94676cd78b791ef3fadc01bf3b3
    [filters.componentByCode("colors.TEXT_DANGER.css"), "TextInputError"],
    // src/plugins/voiceMessages/VoicePreview.tsx
    [filters.componentByCode("waveform:", "onVolumeChange"), "VoiceMessage"],
    // https://gist.github.com/sadan4/77c650e358423186147e8ab0e25e0d75
    [filters.componentByCode("guildBadge:", "disableGuildProfile:"), "ClanTagChiplet"],
    // https://gist.github.com/sadan4/b3539949d30d7a85ae5585c2a8a975ab
    [filters.componentByCode(",unicodeEmoji:", ".allNamesString,"), "RoleIcon"],
    // https://gist.github.com/sadan4/c536a0031e9706adb6d06984c5c10912
    // TODO: also get animated emoji wrapper and emoji from that module
    [filters.componentByCode(".animated&&void 0==="), "EmojiWrapper"],
    // https://gist.github.com/sadan4/12e9d92ad370d06749704eccb9928638
    // TODO: also get LottieSticker and Sticker from the same module
    [filters.componentByCode("enlargeOnInteraction:", "LOTTIE?"), "StickerWrapper"],
    // https://gist.github.com/sadan4/916027c5e1b0dc1a426af68e93cdba03
    [filters.componentByCode("renderableSticker:", ".clickableSticker"), "MessageSticker"],
    // https://gist.github.com/sadan4/cac3e0bc030d43d7fd0c0584361d107c
    [filters.componentByCode("#{intl::REMOVE_ATTACHMENT_BODY}"), "MessageAccessories"],
    // https://gist.github.com/sadan4/17d89f4d979d925f7a6997f0b91451af
    [filters.componentByCode('parentComponent:"ConfirmModal"'), "ConfirmModal"],
    // https://gist.github.com/sadan4/7db3e341033b993f0fa2e23fd03a5450
    [filters.componentByCode("#{intl::PLAY}),icon"), "PlayButton"],
    // https://gist.github.com/sadan4/eded9e63fe497a4c4920e94d670aa484
    // [filters.componentByCode(""), "ChannelAreaTextForm"]
    // https://gist.github.com/sadan4/89c58635e6841fe153cdbc8d3daf458b
    // forward ref, can't easily wrap
    // [filters.componentByCode(".videoGridWrapper,"), "ChannelCallContent"],
    // https://gist.github.com/sadan4/9d0c0e7529ba06f6e8c7c194b22a93e3
    [filters.componentByCode("#{intl::PINNED_MESSAGES}", "TOGGLE_CHANNEL_PINS"), "ChannelPinsButton"],
    // https://gist.github.com/sadan4/b08e046c93f5ed27c874eaba2d067bf2
    [filters.componentByCode(/dateFormat:\i=\i/), "DateInput"],
    // https://gist.github.com/sadan4/7deacace255f7325831465037061cfcf
    [filters.componentByCode("isQuestEnrollmentBlocked", "isFetchingRewardCode"), "QuestTileCta"],
    // https://gist.github.com/sadan4/541495b5127c8a165a8aad9e81bde238
    [filters.componentByCode(/"aria-label":\i,id:\i\}/), "ListSelectionItem"],
    [filters.componentByCode(",{voiceChannel:", "nameplate:", "lostPermissionTooltipText"), "MemberListItem"],
    // https://gist.github.com/sadan4/715409653078eb1c75355aefe895ad3a
    [filters.componentByCode("MINI_PREVIEW,["), "MemberListNameplate"],
] as const;
export function allEntries<T extends object, K extends keyof T & (string | symbol)>(obj: T): (readonly [K, T[K]])[] {
    const SYM_NON_ENUMERABLE = Symbol("non-enumerable");
    const keys: (string | symbol)[] = Object.getOwnPropertyNames(obj);

    keys.push(...Object.getOwnPropertySymbols(obj));

    return keys.map(key => {
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);

        if (!descriptor)
            throw new Error("Descriptor is undefined");

        if (!descriptor.enumerable)
            return SYM_NON_ENUMERABLE;

        return [key as K, obj[key] as T[K]] as const;
    })
        .filter(x => x !== SYM_NON_ENUMERABLE);
}
const unseenValues = new Set<string>(map.map(([filter, name]) => name));
const iconFilter = filters.componentByCode(".colors.INTERACTIVE_NORMAL,colorClass");
export default definePlugin({
    // Avoid conflict with https://github.com/Vendicated/Vencord/pull/3257
    name: "ComponentDemangler_",
    description: "",
    authors: [Devs.sadan],
    startAt: StartAt.Init,
    patches: [
        {
            find: '"focus-rings-ring"',
            replacement: {
                match: /function (\i).{0,200}"focus-rings-ring"/,
                replace: "$self.setComponentName($1, 'Ring');$&"
            }
        },
        // Add a debug value to useStateFromStores
        {
            find: 'attach("useStateFromStores")',
            replacement: {
                match: /(?=let.{0,200}(\i)\.useRef)/,
                replace: "$1.useRef($self.getStoreNames(arguments[0]));"
            }
        },
        // Radio items, as they're not exported
        // https://gist.github.com/sadan4/d65dabe5486bfc68dc575d713a1a3d54
        {
            find: ".radioIndicatorDisabled",
            replacement: {
                match: /(?=render\(\)\{)/,
                replace: "static displayName=\"RadioItem\";"
            }
        },
        // Tabs in a TabBar
        {
            find: ".tabBarRef",
            replacement: {
                match: /(?=getStyle\(\)\{)/,
                replace: "static displayName=\"Tab\";"
            }
        },
        {
            find: "?\"tooltip\":\"empty\"",
            replacement: {
                match: /(\i)=\i=>.{0,10}isVisible.+?\?"tooltip":"empty".*?;(?=class)/,
                replace: "$&$self.setComponentName($1,'TooltipPlaceholder');"
            }
        },
        {
            find: '="expressive"===',
            replacement: {
                match: /(.+?;)(.+?PULSING_ELLIPSIS)(?<=function (\i).+?)/,
                replace: "$1$self.setComponentName(typeof $3 != 'undefined' ? $3 : void 0, 'ButtonSpinnerWrapper');$2"
            }
        },
        {
            // https://gist.github.com/sadan4/bf3f4f8552da343a8d8cab39bc449741
            find: "frecencyWithoutFetchingLatest.favoriteGifs",
            replacement: {
                match: /let \i=\i\.memo\(\i\.forwardRef\((\i)\)\)/,
                replace: "$&;$self.setComponentName($1, 'ChannelGIFPickerButton');"
            }
        }
    ],
    setComponentName,
    start() {
        moduleListeners.add(m => {
            if (m == null || typeof m !== "object") return;
            for (const exp in m) {
                try {
                    m[exp];
                } catch {
                    continue;
                }
                if (m[exp]?.displayName == null && m[exp]?.name?.length < 4 && iconFilter(m[exp])) {
                    setComponentName(m[exp], "Icon");
                }
            }
        });
        for (const [filter, name, opts = {}] of map) {
            waitFor(filter, m => {
                unseenValues.delete(name);
                setComponentName(m, name);
            });
        }
    },
    getStoreNames(stores: any[]): string {
        return stores.map(s => s[Symbol.toStringTag]).join(", ");
    },
    listUnseen() {
        for (const value of unseenValues.values()) {
            logger.warn(`Unseen component: ${value}`);
        }
    }
});
