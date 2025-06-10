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

function setComponentName(maybeComponent: any, name: string): void {
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
        if (
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
const map = [
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
    [filters.componentByCode('"MenuCheckboxItem"'), "Menu.MenuCheckboxItem"],
    [filters.componentByCode('"MenuRadioItem"'), "Menu.MenuRadioItem"],
    [filters.componentByCode("menuItemProps", "control"), "Menu.MenuControlItem"],
    [filters.componentByCode("'[tabindex=\"0\"]'"), "Menu.MenuCompositeControlItem"],
    [filters.componentByCode('"span":"label"'), "Checkbox"],
    [filters.componentByCode("checkboxDisabled]:"), "Checkbox.Box"],
    [filters.componentByCode("radioItemIconClassName", "withTransparentBackground", "radioBarClassName"), "RadioGroup"],
    [filters.componentByCode(".onlyShineOnHover"), "ShinyButton"],
    [filters.componentByCode("subMenuClassName", "renderSubmenu"), "Menu.MenuSubMenuItem"],
    [filters.componentByCode('="expressive"==='), "ExpressiveButton"],
    [filters.componentByCode("xMinYMid meet"), "Switch.Toggle"],
    [filters.componentByCode("this.renderTooltip()]"), "Tooltip"],
    [filters.componentByCode('="div"'), "TooltipContainer"],

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
                if ((filters.componentByCode(".colors.INTERACTIVE_NORMAL,colorClass")(m[exp]))) {
                    setComponentName(m[exp], "Icon");
                }
            }
        });
        for (const [filter, name] of map) {
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
