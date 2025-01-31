import React from 'react';
import classnames from 'classnames';
import { ProjectItemProps } from "fxdk/project/browser/ProjectExplorer/item";
import { itemsStyles } from "fxdk/project/browser/ProjectExplorer/item.styles";
import { observer } from "mobx-react-lite";
import { FXWorldAssetConfig, FXWORLD_FILE_EXT } from '../fxworld-types';
import { WEState } from 'personalities/world-editor/store/WEState';
import { useItem, useItemDrag } from 'fxdk/project/browser/ProjectExplorer/ProjectExplorer.hooks';
import { ContextMenu, ContextMenuItemsCollection, ContextMenuItemSeparator } from 'fxdk/ui/controls/ContextMenu/ContextMenu';
import { useOpenFlag } from 'utils/hooks';
import { checkedIcon, deleteIcon, fxworldIcon, renameIcon, uncheckedIcon } from 'constants/icons';
import { ProjectExplorerItemContext } from 'fxdk/project/browser/ProjectExplorer/item.context';
import { FXWorldRenamer } from './FXWorldRenamer/FXWorldRenamer';
import { ProjectState } from 'store/ProjectState';
import { APIRQ } from 'shared/api.requests';
import { ResourceAssetConfig } from 'assets/resource/resource-types';
import { projectApi } from 'shared/api.events';
import { ItemState } from 'fxdk/project/browser/ProjectExplorer/ItemState';
import { Title } from 'fxdk/ui/controls/Title/Title';
import { projectExplorerItemType } from 'fxdk/project/browser/ProjectExplorer/item.types';
import mergeRefs from 'utils/mergeRefs';
import { fxworldRecompile } from '../fxworld-constants';
import { Api } from 'fxdk/browser/Api';

const defaultFXWorldConfig: FXWorldAssetConfig = {
  enabled: false,
};

export const FXWorld = observer(function FXWorld(props: ProjectItemProps) {
  const { entry } = props;

  const assetPath = entry.path;
  const assetName = entry.name;
  const mapName = assetName.replace(FXWORLD_FILE_EXT, '');

  const config: FXWorldAssetConfig = ProjectState.project.getAssetConfig(entry.path, defaultFXWorldConfig);

  const [renamerOpen, openRenamer, closeRenamer] = useOpenFlag(false);

  const options = React.useContext(ProjectExplorerItemContext);
  const isEnabled = !!config?.enabled;

  const handleOpen = React.useCallback(() => {
    WEState.openMap(props.entry);
  }, [assetPath]);

  const handleToggleEnabled = React.useCallback(() => {
    const request: APIRQ.ProjectSetAssetConfig<ResourceAssetConfig> = {
      assetPath,
      config: {
        enabled: !isEnabled,
      },
    };

    Api.send(projectApi.setAssetConfig, request);
  }, [assetPath, isEnabled]);

  const handleDelete = React.useCallback(() => {
    ProjectState.project.deleteEntryConfirmFirst(entry.path, `Delete "${mapName}" map?`, () => null);
  }, [entry, mapName]);

  const handleRecompile = React.useCallback(() => {
    Api.sendScoped(fxworldRecompile, assetName);
  }, [assetName]);

  const { requiredContextMenuItems } = useItem(props);

  const contextMenuItems: ContextMenuItemsCollection = React.useMemo(() => [
    {
      id: 'open',
      icon: fxworldIcon,
      text: 'Open map',
      onClick: handleOpen,
    },
    ContextMenuItemSeparator,
    {
      id: 'toggle-enabled',
      icon: isEnabled
        ? checkedIcon
        : uncheckedIcon,
      text: isEnabled
        ? 'Disable map'
        : 'Enable map',
      onClick: handleToggleEnabled,
    },
    {
      id: 'recompile',
      text: 'Recompile map',
      onClick: handleRecompile,
    },
    ContextMenuItemSeparator,
    {
      id: 'delete',
      icon: deleteIcon,
      text: 'Delete map',
      disabled: options.disableAssetDelete,
      onClick: handleDelete,
    },
    {
      id: 'rename',
      icon: renameIcon,
      text: 'Rename map',
      disabled: options.disableAssetRename,
      onClick: openRenamer,
    },
    ContextMenuItemSeparator,
    ...requiredContextMenuItems,
  ], [options, isEnabled, requiredContextMenuItems, handleToggleEnabled, handleOpen, handleDelete, openRenamer, handleRecompile]);

  const { isDragging, dragRef } = useItemDrag(entry, projectExplorerItemType.ASSET);

  const rootClassName = classnames(itemsStyles.wrapper, {
    [itemsStyles.dragging]: isDragging,
  });

  const title = `${mapName} • ${config.enabled ? 'Enabled' : 'Disabled'}`;

  return (
    <div className={rootClassName}>
      <Title title={title}>
        {(ref) => (
          <ContextMenu
            ref={mergeRefs(ref, dragRef)}
            className={classnames(itemsStyles.item)}
            activeClassName={itemsStyles.itemActive}
            onClick={handleOpen}
            items={contextMenuItems}
          >
            <ItemState
              enabled={config.enabled}
            />
            <div className={itemsStyles.itemIcon}>
              {fxworldIcon}
            </div>
            <div className={itemsStyles.itemTitle}>
              {mapName}
            </div>
          </ContextMenu>
        )}
      </Title>

      {renamerOpen && (
        <FXWorldRenamer
          name={mapName}
          path={entry.path}
          onClose={closeRenamer}
        />
      )}
    </div>
  );
});
