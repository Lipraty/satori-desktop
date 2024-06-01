import { Avatar, Body1, Card, CardPreview, CardFooter, Button } from "@fluentui/react-components"
import { VirtualizerScrollViewDynamic } from "@fluentui/react-components/unstable"
import { memo } from "react"

export const MessageChat = memo(() => {
  const content = '你说的对，但是《koishi》是由关门歇业自主研发的一款跨平台，高性能的机器人框架。p框架发生在一个被称作「node.js」的幻想世界，在这里，被内存选中的元素将被授予「类型」导引typescript之力。你将扮演一位名为「开发者」的神秘角色在自由的旅行中邂逅报错各异、能力独特的彩色括号们，和他们一起击败any，找回失散的类型——同时，逐步发掘「世革马」的真相。'

  return (<>
    <span className='message-timestamp'>Today</span>
    <VirtualizerScrollViewDynamic reversed numItems={118} itemSize={20}>
      {(_index: number) => {
        return (
          <div className='message'>
            <Avatar className='message-avatar' name="Shigma" size={40} style={{
              position: 'sticky',
              bottom: '1rem',
            }} />
            <div className='message-content'>
              <Body1 className='message-content__username'>
                Shigma
              </Body1>
              <Card appearance='filled'>
                <CardPreview style={{
                  padding: '12px',
                  userSelect: 'text'
                }}>
                  {'content'}
                </CardPreview>
              </Card>
              <Card appearance='filled'>
                <CardPreview style={{
                  padding: '12px',
                  userSelect: 'text'
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
  </>)
})
