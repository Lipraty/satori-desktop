import { useCallback, useState } from 'react'
import { Avatar, Button, TabList, Tab, TabValue, Input } from '@fluentui/react-components'
import { List, ListItem } from '@fluentui/react-list-preview'

import { useMessageEvent, Contact } from '@renderer/hooks/satori-bridge'
import { useCurrentView } from '@renderer/hooks/view-manager'
import { Icon } from '@renderer/components/Icon'
import { ViewBox } from '@renderer/components/ViewBox'
import { List as ListComponent } from '@renderer/components/List'

import { MessageChat } from './MessageChat'
import { MessageFiles } from './MessageFiles'
import { MessagePhotos } from './MessagePhotos'
import { MessageSender } from './MessageSender'

import './style.scss'

export const MessagingView = () => {
  const { setCurrentView } = useCurrentView()
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
      <ViewBox fixed width="260px" rightRadius title='All Chats' titleStyle={false}
        titleAppend={
          <>
            <Button shape='circular' appearance='transparent' icon={<Icon name='ChatAdd' bundle sized='24' />} />
          </>
        }
        style={{
          flexDirection: 'column',
        }}>
        <div className='message-contact scrollable'>
          {
            contact.length === 0 ? <Button style={{
              width: '100%',
              marginTop: '22px',
            }} onClick={() => { setCurrentView('Network') }}>Check Network</Button>
              :
              <>
                <span className='message-contact__subheader'>Messages</span>
                <List
                  className='list'
                  selectionMode='single'
                  navigationMode="composite"
                  selectedItems={selectedId}
                  onSelectionChange={useSelecteChange}
                >
                  {contact.map((contact, index) => (
                    <ListItem
                      key={`contact-${contact.id}list${index}`}
                      value={index}
                      onFocus={useFocus}
                      onClick={() => setCurrentContact(contact)}
                      checkmark={null}
                    // style={{
                    //   backgroundColor: selectedId.includes(index) ? tokens.colorNeutralBackground1 : undefined,
                    // }}
                    >
                      <ListComponent.Item
                        as='div'
                        title={contact.name}
                        subtitle={contact.lastContent}
                        avatar={contact.avatar}
                        selected={currentContact?.id === contact.id}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
          }
        </div>
      </ViewBox>
      <>{
        currentContact
          ? <ViewBox transparent style={{
            flexDirection: 'column',
            padding: '0',
          }}>
            {currentContact && <>
              <div className='message-titlebar'>
                <Avatar name={currentContact?.name} size={28} image={{ src: currentContact?.avatar }} />
                <span className='message-titlebar__title'>{currentContact?.name}</span>
                <div style={{
                  flex: '1',
                  maxWidth: '100%',
                }} />
                <TabList size='large' selectedValue={selectedTab} onTabSelect={(_e, d) => { setSelectedTab(d.value) }}>
                  <Tab id='Chat' value='chat'>Chat</Tab>
                  <Tab id='Files' value='files' disabled>Files</Tab>
                  <Tab id='Photos' value='photos' disabled>Photos</Tab>
                </TabList>
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
          : <ViewBox style={{
            flexDirection: 'column',
            padding: '0',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <span className='message-tooltip'>
              {contact.length === 0 ? `No contacts. Pleace check your network settings.` : 'Select a contact to start chatting.'}
            </span>
          </ViewBox>
      }</>
    </>
  )
}
