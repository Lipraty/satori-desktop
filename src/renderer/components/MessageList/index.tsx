import { useCallback } from "react"

import { ViewBox } from "@renderer/components/ViewBox"
import { List } from "@renderer/components/List"
import { IconNames } from "@renderer/components/Icon"


export const MessagingList = () => {
  const ListItem = useCallback(
    ({ title, subtitle, selected, avatar, icon }: { title: string, subtitle?: string, selected?: boolean, avatar?: string | boolean, icon?: IconNames }) =>
      <List.Item title={title} subtitle={subtitle} selected={selected ?? false} avatar={avatar} icon={icon} />
    , [])

  return (
    <>
      <ViewBox fixed width="260px">
        <List line="two" style={{
          margin: '0 -12px',
        }}>
          <ListItem key={'key1'} title="Shigma" avatar subtitle="你说的对，但是《原神》是由米哈游自主研发的一款全新开放世界冒险游戏。游戏发生在一个被称作「提瓦特」的幻想世界，在这里，被神选中的人将被授予「神之眼」，导引元素之力。你将扮演一位名为「旅行者」的神秘角色在自由的旅行中邂逅性格各异、能力独特的同伴们，和他们一起击败强敌，找回失散的亲人——同时，逐步发掘「原神」的真相。" />
        </List>
      </ViewBox>
    </>
  )
}
