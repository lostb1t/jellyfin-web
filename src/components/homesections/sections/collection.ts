import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import type { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";
import { CollectionType } from "@jellyfin/sdk/lib/generated-client/models/collection-type";
import escapeHtml from "escape-html";
import type { ApiClient } from "jellyfin-apiclient";

import layoutManager from "components/layoutManager";
import { appRouter } from "components/router/appRouter";
import globalize from "lib/globalize";
import ServerConnections from "components/ServerConnections";
import cardBuilder from "components/cardbuilder/cardBuilder";
import { getBackdropShape, getPortraitShape, getSquareShape } from "utils/card";
import type { UserSettings } from "scripts/settings/userSettings";

import type { SectionContainerElement, SectionOptions } from "./section";

function getFetchCollectionItemsFn(
    serverId: string,
    parentId: string | undefined,
    { enableOverflow }: SectionOptions
) {
    return function () {
        console.log("FETCHING");
        const apiClient = ServerConnections.getApiClient(serverId);

        const options = {
            Limit: enableOverflow ? 24 : 15,
            ParentId: parentId,
        };

        return apiClient.getItems(apiClient.getCurrentUserId(), options);
    };
}

function getCollectionHtmlFn(
    itemType: BaseItemKind | string | undefined,
    { enableOverflow }: SectionOptions
) {
    return function (items: BaseItemDto[]) {
        console.log("YOOOO");
        const cardLayout = false;
        return cardBuilder.getCardsHtml({
            items: items,
            preferThumb: true,
            shape: getBackdropShape(enableOverflow),
            overlayText: false,
            showTitle: true,
            showParentTitle: true,
            lazy: true,
            overlayPlayButton: true,
            context: 'home',
            centerText: !cardLayout,
            allowBottomPadding: !enableOverflow,
            cardLayout: cardLayout
        });
    };
}

export function loadCollection(
    elem: HTMLElement,
    apiClient: ApiClient,
    // parent: BaseItemDto,
    parentId: string,
    user: any,
    // userSettings: UserSettings,
    options: SectionOptions
) {
    return apiClient.getItem(user.Id, parentId).then((parent) => {
        // loadCollection(elem, apiClient, item, userSettings, options);

        let html = "";

        html +=
            '<div class="sectionTitleContainer sectionTitleContainer-cards padded-left">';
        if (!layoutManager.tv) {
            html +=
                '<a is="emby-linkbutton" href="' +
                appRouter.getRouteUrl(parent, {
                    section: "latest",
                }) +
                '" class="more button-flat button-flat-mini sectionTitleTextButton">';
            html += '<h2 class="sectionTitle sectionTitle-cards">';
            html += escapeHtml(parent.Name);
            html += "</h2>";
            html +=
                '<span class="material-icons chevron_right" aria-hidden="true"></span>';
            html += "</a>";
        } else {
            html +=
                '<h2 class="sectionTitle sectionTitle-cards">' +
                escapeHtml(parent.Name) +
                "</h2>";
        }
        html += "</div>";

        if (options.enableOverflow) {
            html +=
                '<div is="emby-scroller" class="padded-top-focusscale padded-bottom-focusscale" data-centerfocus="true">';
            html +=
                '<div is="emby-itemscontainer" class="itemsContainer scrollSlider focuscontainer-x">';
        } else {
            html +=
                '<div is="emby-itemscontainer" class="itemsContainer focuscontainer-x padded-left padded-right vertical-wrap">';
        }

        if (options.enableOverflow) {
            html += "</div>";
        }
        html += "</div>";

        elem.innerHTML = html;

        const itemsContainer: SectionContainerElement | null =
            elem.querySelector(".itemsContainer");

        if (!itemsContainer) return;
        console.log(itemsContainer);
        itemsContainer.fetchData = getFetchCollectionItemsFn(
            apiClient.serverId(),
            parent.Id,
            options
        );
        itemsContainer.getItemsHtml = getCollectionHtmlFn(
            parent.Type,
            options
        );
        itemsContainer.parentContainer = elem;
    });
}
