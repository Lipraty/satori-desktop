import { Avatar, Body1, Card, CardPreview } from "@fluentui/react-components"
import { VirtualizerScrollViewDynamic } from "@fluentui/react-components/unstable"
import { memo } from "react"
import { Event, User } from "@satorijs/protocol"
import { h } from "@satorijs/core"

import { Elementer } from "@renderer/components/Elementer"

export interface MessageChatProps {
  contactId: string
  platform: string
  messages: Event[]
  selfId: string
}

interface MergedMessage {
  user: User,
  nick?: string,
  messages: Event[]
}

export const MessageChat = memo(({ messages, selfId, platform, contactId }: MessageChatProps) => {
  const mergedMessages: MergedMessage[] = messages
    .slice()
    .filter((message) => {
      const id = message.guild?.id || message.channel?.id
      return id === contactId && message.platform === platform
    })
    .reduce((acc, message) => {
      if (acc.length === 0) {
        return [{ user: message.user!, nick: message.member?.nick, messages: [message] }]
      }
      const last = acc[acc.length - 1]
      if (last.user?.id === message.user?.id) {
        last.messages.push(message)
        return acc
      }
      return [...acc, { user: message.user!, nick: message.member?.nick, messages: [message] }]
    }, [] as MergedMessage[])
    .reverse()

  return (<>
    <span className='message-timestamp'>Today</span>
    <VirtualizerScrollViewDynamic reversed numItems={mergedMessages.length} itemSize={10}>
      {(index: number) => {
        const mergedMessage = mergedMessages[index]

        return (
          <div key={index} className='message' style={{
            flexDirection: selfId === mergedMessage.user?.id ? 'row-reverse' : 'row',
          }}>
            <Avatar
              className='message-avatar'
              name={mergedMessage?.nick ?? mergedMessage.user?.name}
              image={mergedMessage.user?.avatar ? { src: mergedMessage.user?.avatar } : undefined}
              size={40}
              style={{
                position: 'sticky',
                bottom: '1rem',
              }} />
            <div className='message-content' style={{
              alignItems: selfId === mergedMessage.user?.id ? 'flex-end' : 'flex-start',
            }}>
              <Body1 className='message-content__username' style={{
                textAlign: selfId === mergedMessage.user?.id ? 'right' : 'left',
              }}>
                {mergedMessage?.nick ?? mergedMessage.user?.name ?? mergedMessage.user.id}
              </Body1>
              {mergedMessage.messages.map((message, index) => {
                const { content } = message.message!
                const elements = content ? h.parse(content) : []

                return (<Card key={index} appearance='filled'>
                  <CardPreview style={{
                    padding: '12px',
                    userSelect: 'text'
                  }}>
                    <div className="elementer-content">{
                      elements.map(Elementer)
                    }</div>
                  </CardPreview>
                </Card>)
              })}
            </div>
          </div>
        )
      }}
    </VirtualizerScrollViewDynamic>
  </>)
})
