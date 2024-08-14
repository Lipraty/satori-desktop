import { useCallback, useState } from 'react'
import { Avatar, Button, TabList, Tab, TabValue, Input } from '@fluentui/react-components'
import { List, ListItem } from '@fluentui/react-list-preview'

import './style.scss'

import { useMessageEvent, Contact } from '@renderer/hooks/satori-bridge'
import { Icon } from '@renderer/components/Icon'
import { ViewBox } from '@renderer/components/ViewBox'
import { List as ListComponent } from '@renderer/components/List'

import { MessageChat } from './MessageChat'
import { MessageFiles } from './MessageFiles'
import { MessagePhotos } from './MessagePhotos'
import { MessageSender } from './MessageSender'



export const MessagingView = () => {
  const { messages, contact } = useMessageEvent()
  const [selectedTab, setSelectedTab] = useState<TabValue>('chat')
  // const [pinnedContact] = useState<string[]>([])
  const [currentContact, setCurrentContact] = useState<Contact>()
  const [selectedId, setSelectedId] = useState<(number)[]>([0])

  const selectUpdated = (index: number[]) => {
    setSelectedId(index)
  }
  const useSelecteChange = useCallback(
    (_e: any, {
      selectedItems
    }: {
      selectedItems: (string | number)[]
    }) => selectUpdated(selectedItems as number[]), [])
  const useFocus = useCallback((event: any) => {
    // Ignore bubbled up events from the children
    if (event.target !== event.currentTarget) {
      return
    }
    selectUpdated([event.target.dataset.value])
  }, [])

  return (
    <>
      <ViewBox fixed width="260px" rightRadius style={{
        flexDirection: 'column',
      }}>
        <Input style={{
          marginBottom: '0.5rem',
        }} placeholder="Search" contentBefore={<Icon name='Search' />} />
        <div style={{
          margin: '0 -12px',
          overflow: 'hidden auto',
          height: 'calc(100% - 2.5rem)',
        }}>
          <span style={{
            padding: '0 1.2rem',
          }}>MESSAGES</span>
          <List
            className='list'
            selectionMode='single'
            navigationMode="composite"
            selectedItems={selectedId}
            onSelectionChange={useSelecteChange}
          >
            {contact.map((contact, index) => (
              <ListItem
                key={contact.id}
                value={index}
                onFocus={useFocus}
                onClick={() => setCurrentContact(contact)}
                checkmark={null}
              // style={{
              //   backgroundColor: selectedId.includes(index) ? tokens.colorNeutralBackground1 : undefined,
              // }}
              >
                <ListComponent.Item
                  title={contact.name}
                  subtitle={contact.lastContent}
                  avatar={contact.avatar}
                  selected={currentContact?.id === contact.id}
                />
              </ListItem>
            ))}
          </List>
        </div>
      </ViewBox>
      <ViewBox transparent style={{
        flexDirection: 'column',
        padding: '0',
      }}>
        {currentContact && <>
          <div className='message-titlebar'>
            <Avatar name={currentContact?.name} size={28} />
            <span className='message-titlebar__title'>{currentContact?.name}</span>
            <TabList size='large' selectedValue={selectedTab} onTabSelect={(_e, d) => { setSelectedTab(d.value) }}>
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
            {selectedTab === 'chat' && <>
              <MessageChat messages={messages} selfId={messages[0]?.selfId} platform={currentContact.platform} contactId={currentContact.id} />
              <MessageSender />
            </>}
            {selectedTab === 'files' && <MessageFiles />}
            {selectedTab === 'photos' && <MessagePhotos />}
          </div>
        </>}
      </ViewBox>
    </>
  )
}
