/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { filters, waitFor } from "@webpack";

export const Avatar = waitFor(filters.componentByCode(".size-1.375*"), m => {
    Object.defineProperty(m, "name", { value: "Avatar" });
});
export default definePlugin({
    name: "ComponentDemangler",
    description: "",
    authors: [Devs.sadan],

    patches: [
        {
            find: "FocusRing was given",
            replacement: {
                match: /function (\i)\(\i\)\{.{0,300}FocusRing was/,
                replace: (_, funcIdent) => {
                    return `Object.defineProperty(${funcIdent},"name", {value: "FocusRing"});${_}`;
                }
            }
        },
        {
            find: "20+20*Math.random()",
            replacement: {
                match: /class \i extends.+?{/,
                replace: _ => {
                    return `${_}static displayName = "Popout";`;
                }
            }
        },
        {
            find: "this.context?this.renderNonInteractive():",
            replacement: {
                match: /class \i extends.+?{/,
                replace: _ => {
                    return `${_}static displayName = "Clickable";`;
                }
            }
        },
        {
            find: ".tooltipTop,bottom:",
            // Tooltip is the class
            // TooltipContainer is the function
            replacement: [
                {
                    match: /class \i extends.+?\{/,
                    replace: "$&static displayName = \"Tooltip\";"
                },
                {
                    match: /let (\i)=\i=>\{.{0,200}="div"/,
                    replace: "setTimeout(() => Object.defineProperty($1, \"name\", {value: \"TooltipContainer\"}));$&"
                }
            ]
        },
    ]
}
);
