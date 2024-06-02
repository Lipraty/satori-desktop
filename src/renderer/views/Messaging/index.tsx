import { StrictMode, useCallback, useMemo, useState } from 'react'
import { Avatar, Button, Caption1, Input, TabList, Tab, TabValue } from '@fluentui/react-components'
import { Editor } from '@shikitor/react'
// import provideCompletions from '@shikitor/core/dist/plugins/provide-completions'

import './style.scss'

import { Icon, IconNames } from '@renderer/components/Icon'
import { List } from '@renderer/components/List'
import { ViewBox } from '@renderer/components/ViewBox'

import { MessageChat } from './MessageChat'
import { MessageFiles } from './MessageFiles'
import { MessagePhotos } from './MessagePhotos'


export const MessagingView = () => {
  // const bundledEditorPlugins = [
  //   provideCompletions({
  //     popupPlacement: 'top',
  //     footer: false
  //   })
  // ]

  const ListItem = useCallback(
    ({ title, subtitle, selected, avatar, icon }: { title: string, subtitle?: string, selected?: boolean, avatar?: string | boolean, icon?: IconNames }) =>
      <List.Item title={title} subtitle={subtitle} selected={selected ?? false} avatar={avatar} icon={icon} />
    , [])

  const [selectedTab, setSelectedTab] = useState<TabValue>('chat')
  const [messageText, setMessageText] = useState('')

  return (
    <>
      <ViewBox fixed width="260px" rightRadius style={{
        flexDirection: 'column',
      }}>
        <Input placeholder="Search" contentBefore={<Icon name='Search' />} />
        <List line="two" style={{
          margin: '0 -12px',
        }}>
          <List.Subheader title="PINNED" />
          <ListItem key={'key1'} title="Shigma" avatar subtitle={'content'} />
          <List.Subheader title="MESSAGES" />
          <ListItem key={'key2'} title="Maiko Tan" avatar subtitle={'content'} />
          <ListItem key={'key3'} title="Il Harper" avatar subtitle={'content'} />
          <ListItem key={'key4'} title="Koishi" avatar subtitle={'content'} />
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
        <div className='messaging-titlebar'>
          <Avatar name="Shigma" size={28} />
          <span className='messaging-titlebar__title'>Shigma</span>
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
        <div className='messaging-context'>
          {selectedTab === 'chat' && <MessageChat />}
          {selectedTab === 'files' && <MessageFiles />}
          {selectedTab === 'photos' && <MessagePhotos />}
        </div>
        <div className='messaging-sender'>
          <div className='messaging-sender__actions'>
            <Button appearance='transparent' icon={<Icon name='TextEditStyle' bundle />} />
            <Button appearance='transparent' icon={<Icon name='Image' bundle />} />
            <Button appearance='transparent' icon={<Icon name='Attach' bundle />} />
            <Button appearance='transparent' icon={<Icon name='Emoji' bundle />} />
            <div style={{
              flex: '1',
              maxWidth: '100%'
            }} />
            <Button appearance='transparent' icon={<Icon name='ChevronUpDown' bundle />} />
          </div>
          <span className='fui-Input'>
            <div className='fui-Input__input'>
              <StrictMode>
                <Editor value={messageText} onChange={setMessageText} options={useMemo(() => ({
                  theme: 'github-dark',
                  language: 'markdown',
                  lineNumbers: 'off',
                  placeholder: 'Type a message...',
                  autoSize: { maxRows: 7, minRows: 1 }
                }), [])} />
              </StrictMode>
            </div>
            <span className='fui-Input__contentAfter'>
              <Button appearance='transparent' icon={<Icon name='Send' bundle />} />
            </span>
          </span>
        </div>
      </ViewBox>
    </>
  )
}
