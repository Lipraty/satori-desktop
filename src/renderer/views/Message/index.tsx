import { useCallback, useState } from 'react'
import { Message, List as PList } from "@satorijs/protocol"
import { Avatar, Button, Caption1, TabList, Tab, TabValue } from '@fluentui/react-components'

import './style.scss'

import { Icon, IconNames } from '@renderer/components/Icon'
import { List } from '@renderer/components/List'
import { ViewBox } from '@renderer/components/ViewBox'
import { Contact } from '@shared/types'

import { MessageChat } from './MessageChat'
import { MessageFiles } from './MessageFiles'
import { MessagePhotos } from './MessagePhotos'

export const MessagingView = () => {

  const ListItem = useCallback(
    ({ title, subtitle, selected, avatar, icon }: { title: string, subtitle?: string, selected?: boolean, avatar?: string | boolean, icon?: IconNames }) =>
      <List.Item title={title} subtitle={subtitle} selected={selected ?? false} avatar={avatar} icon={icon} />
    , [])

  const [selectedTab, setSelectedTab] = useState<TabValue>('chat')
  //#region fake data
  const [pinnedContact] = useState<string[]>([])
  const [contact] = useState({
    data: [
      {
        id: '1919810',
        platform: 'discord',
        type: Contact.Type.DIRECT,
        user: {
          id: '1919810',
          name: 'Shigma',
          avatar: 'https://koishi.chat/logo.png',
          nick: '关门歇业',
          isBot: false,
        },
        message: {
          id: '5',
          content: '你说的对，但是《koishi》是由关门歇业自主研发的一款跨平台，高性能的机器人框架。p框架发生在一个被称作「node.js」的幻想世界，在这里，被内存选中的元素将被授予「类型」导引typescript之力。你将扮演一位名为「开发者」的神秘角色在自由的旅行中邂逅报错各异、能力独特的彩色括号们，和他们一起击败any，找回失散的类型——同时，逐步发掘「世革马」的真相。',
          createdAt: 1631145600000,
          updatedAt: 1631133330000,
        },
        children: [],
      },
      {
        id: 'guild:19101',
        platform: 'discord',
        type: Contact.Type.GUILD,
        avatar: 'https://koishi.chat/logo.png',
        name: "Shigma's Server",
        children: [],
      },
    ],
    next: ''
  })
  const [messages] = useState<PList<Message>>({
    data: [
      {
        id: '1',
        content: '这是一个消息',
        channel: {
          id: '114514',
          type: 1,
          name: 'Shigma',
        },
        user: {
          id: '1919810',
          name: 'Shigma',
          avatar: 'https://koishi.chat/logo.png',
          nick: '关门歇业',
          isBot: false,
        },
        createdAt: 1631145600000,
        updatedAt: 1631133330000,
      },
      {
        id: '2',
        content: '又发了一条',
        channel: {
          id: '114514',
          type: 1,
          name: 'Shigma',
        },
        user: {
          id: '1919810',
          name: 'Shigma',
          avatar: 'https://koishi.chat/logo.png',
          nick: '关门歇业',
          isBot: false,
        },
        createdAt: 1631145600000,
        updatedAt: 1631133330000,
      },
      {
        id: '3',
        content: '这次该我回复了',
        channel: {
          id: '114514',
          type: 1,
          name: 'Shigma',
        },
        user: {
          id: '1111',
          name: 'You',
          isBot: false,
        },
        createdAt: 1631145600000,
        updatedAt: 1631133330000,
      },
      {
        id: '4',
        content: '你说的对，但是《koishi》是由关门歇业自主研发的一款跨平台，高性能的机器人框架。p框架发生在一个被称作「node.js」的幻想世界，在这里，被内存选中的元素将被授予「类型」导引typescript之力。你将扮演一位名为「开发者」的神秘角色在自由的旅行中邂逅报错各异、能力独特的彩色括号们，和他们一起击败any，找回失散的类型——同时，逐步发掘「世革马」的真相。',
        channel: {
          id: '114514',
          type: 1,
          name: 'Shigma',
        },
        user: {
          id: '1919810',
          name: 'Shigma',
          avatar: 'https://koishi.chat/logo.png',
          nick: '关门歇业',
          isBot: false,
        },
        createdAt: 1631145600000,
        updatedAt: 1631133330000,
      },
      {
        id: '5',
        content: '你说的对，但是《koishi》是由关门歇业自主研发的一款跨平台，高性能的机器人框架。p框架发生在一个被称作「node.js」的幻想世界，在这里，被内存选中的元素将被授予「类型」导引typescript之力。你将扮演一位名为「开发者」的神秘角色在自由的旅行中邂逅报错各异、能力独特的彩色括号们，和他们一起击败any，找回失散的类型——同时，逐步发掘「世革马」的真相。',
        channel: {
          id: '114514',
          type: 1,
          name: 'Shigma',
        },
        user: {
          id: '1111',
          name: 'You',
          isBot: false,
        },
        createdAt: 1631145600000,
        updatedAt: 1631133330000,
      },
    ],
    next: ''
  })
  //#endregion

  return (
    <>
      <ViewBox fixed width="260px" rightRadius style={{
        flexDirection: 'column',
      }}>
        {/* 
        message filter, search, etc.
        <Input placeholder="Search" contentBefore={<Icon name='Search' />} /> 
        */}
        <List line="two" style={{
          margin: '0 -12px',
        }}>
          {
            pinnedContact.length > 0 && (
              <>
                <List.Subheader title='PINNED' />
                {
                  contact.data.filter((contact) => pinnedContact.includes(contact.id)).map((contact) => {
                    return (
                      <ListItem
                        key={`${contact.platform}:${contact.id}`}
                        title={contact.user?.name ?? contact.name ?? 'Unknown'}
                        subtitle={contact.message?.content ?? ''}
                        avatar={contact.user?.avatar ?? true}
                      />
                    )
                  })
                }
              </>
            )
          }
          <List.Subheader title='MESSAGES' />
          {
            contact.data.filter((contact) => {
              return !pinnedContact.includes(contact.id)
            }).map((contact) => {
              return (
                <ListItem
                  key={`${contact.platform}:${contact.id}`}
                  title={contact.user?.name ?? contact.name ?? 'Unknown'}
                  subtitle={contact.message?.content ?? ''}
                  avatar={contact.user?.avatar ?? true}
                />
              )
            })
          }
          <List.Item>
            <Caption1 style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
            }}>
              <Icon name='Add' />
              New Message
            </Caption1>
          </List.Item>
        </List>
      </ViewBox>
      <ViewBox transparent style={{
        flexDirection: 'column',
        padding: '0',
      }}>
        <div className='message-titlebar'>
          <Avatar name="Shigma" size={28} />
          <span className='message-titlebar__title'>Shigma</span>
          <TabList size='large' selectedValue={selectedTab} onTabSelect={(e, d) => { setSelectedTab(d.value) }}>
            <Tab id='Chat' value='chat'>Chat</Tab>
            <Tab id='Files' value='files'>Files</Tab>
            <Tab id='Photos' value='photos'>Photos</Tab>
          </TabList>
          <div style={{
            flex: '1',
            maxWidth: '100%',
          }} />
          <Button shape='circular' appearance='transparent' icon={<Icon name='PersonInfo' bundle />} />
        </div>
        <div className='message-context'>
          {selectedTab === 'chat' && <MessageChat messages={messages.data} selfId='1111' />}
          {selectedTab === 'files' && <MessageFiles />}
          {selectedTab === 'photos' && <MessagePhotos />}
        </div>
      </ViewBox>
    </>
  )
}
