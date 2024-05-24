import { useCallback } from 'react'
import { Avatar, Body1, Button, Caption1, Card, CardFooter, CardHeader, CardPreview, Input } from '@fluentui/react-components'
import { VirtualizerScrollViewDynamic } from '@fluentui/react-components/unstable'
import { } from '@shikitor/core'
// import {} from '@shikitor/react'

import './Messaging.scss'

import { Icon, IconNames } from '@renderer/components/Icon'
import { List } from '@renderer/components/List'
import { ViewBox } from '@renderer/components/ViewBox'


export const MessagingView = () => {
  const ListItem = useCallback(
    ({ title, subtitle, selected, avatar, icon }: { title: string, subtitle?: string, selected?: boolean, avatar?: string | boolean, icon?: IconNames }) =>
      <List.Item title={title} subtitle={subtitle} selected={selected ?? false} avatar={avatar} icon={icon} />
    , [])

  const content = '你说的对，但是《koishi》是由关门歇业自主研发的一款跨平台，高性能的机器人框架。p框架发生在一个被称作「node.js」的幻想世界，在这里，被内存选中的元素将被授予「类型」导引typescript之力。你将扮演一位名为「开发者」的神秘角色在自由的旅行中邂逅报错各异、能力独特的彩色括号们，和他们一起击败any，找回失散的类型——同时，逐步发掘「世革马」的真相。'

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
          <ListItem key={'key2'} title="Shigma" avatar />
          <ListItem key={'key1'} title="Shigma" avatar subtitle={content} />
        </List>
      </ViewBox>
      <ViewBox transparent style={{
        flexDirection: 'column',
        padding: '0',
      }}>
        <div className='messaging-titlebar'>
          <h2 className='messaging-titlebar__title'>Shigma</h2>
          <hr />
        </div>
        <div className='messaging-context'>
          <VirtualizerScrollViewDynamic numItems={2} itemSize={20}>
            {(index: number) => {
              return (
                <div className='message'>
                  <Avatar name="Shigma" size={40} />
                  <div className='message__content'>
                    <Body1 style={{
                      margin: '0 12px',
                    }}>
                      Shigma
                    </Body1>
                    <Card appearance='filled' style={{
                      margin: '0 12px 1rem 12px',
                      boxShadow: 'var(--shadow2)',
                    }}>
                      <CardPreview style={{
                        padding: '12px',
                      }}>
                        {content}
                      </CardPreview>

                      <CardFooter>
                        <Button>Btn1</Button>
                        <Button>Btn2</Button>
                      </CardFooter>
                    </Card>
                    
                    <Card appearance='filled' style={{
                      margin: '0 12px 1rem 12px',
                      boxShadow: 'var(--shadow2)',
                    }}>
                      <CardPreview style={{
                        padding: '12px',
                      }}>
                        {content}
                      </CardPreview>

                      <CardFooter>
                        <Button>Btn1</Button>
                        <Button>Btn2</Button>
                      </CardFooter>
                    </Card>
                  </div>

                </div>
              )
            }}
          </VirtualizerScrollViewDynamic>
        </div>

        <div className='messaging-sender'>
          await <code>@shikitor/react</code>
        </div>
      </ViewBox>
    </>
  )
}
