import { Avatar, Body1, Card, CardPreview, CardFooter, Button } from "@fluentui/react-components"
import { VirtualizerScrollViewDynamic } from "@fluentui/react-components/unstable"
import { memo } from "react"
import { Message, User } from "@satorijs/protocol"

import { MessageSender } from "./MessageSender"

export interface MessageChatProps {
  messages: Message[]
  selfId: string
}

interface MergedMessage {
  user: User,
  messages: Message[]
}

export const MessageChat = memo(({ messages, selfId }: MessageChatProps) => {
  const mergedMessages: MergedMessage[] = messages.reduce((acc, message) => {
    if (acc.length === 0) {
      return [{ user: message.user!, messages: [message] }]
    }
    const last = acc[acc.length - 1]
    if (last.user.id === message.user?.id) {
      last.messages.push(message)
      return acc
    }
    return [...acc, { user: message.user!, messages: [message] }]
  }, [] as MergedMessage[]).slice().reverse()

  return (<>
    <span className='message-timestamp'>Today</span>
    <VirtualizerScrollViewDynamic reversed numItems={mergedMessages.length} itemSize={10}>
      {(index: number) => {
        const mergedMessage = mergedMessages[index]

        return (
          <div key={index} className='message' style={{
            flexDirection: selfId === mergedMessage.user.id ? 'row-reverse' : 'row',
          }}>
            <Avatar className='message-avatar' name={mergedMessages[index].user.name} size={40} style={{
              position: 'sticky',
              bottom: '1rem',
            }} />
            <div className='message-content'>
              <Body1 className='message-content__username' style={{
                textAlign: selfId === mergedMessage.user.id ? 'right' : 'left',
              }}>
                {mergedMessages[index].user.name}
              </Body1>
              {mergedMessages[index].messages.map((message, index) =>
                <Card key={index} appearance='filled'>
                  <CardPreview style={{
                    padding: '12px',
                    userSelect: 'text'
                  }}>
                    {message.content}
                  </CardPreview>
                  {/* <CardFooter>
                <Button>Btn1</Button>
                <Button>Btn2</Button>
              </CardFooter> */}
                </Card>)}
            </div>
          </div>
        )
      }}
    </VirtualizerScrollViewDynamic>
    <MessageSender />
  </>)
})
