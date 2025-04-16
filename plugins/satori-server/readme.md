# @satoriapp/plugin-satori-server

Satori 协议的缓存、记录与扩展。

## 扩展的资源

### 会话(Coversation)

#### 类型定义

##### Conversation

| 字段   | 类型             | 描述         |
| ------ | ---------------- | ------------ |
| id     | string           | 会话 ID      |
| type   | string           | 会话频道类型 |
| unread | number           | 未读消息数   |
| flag  | ConversationFlag | 会话标记     |
| draft  | Message          | 草稿消息     |

##### ConversationFlag

| 字段   | 值  | 描述           |
| ------ | --- | -------------- |
| MUTE   | 0   | 不再提示该会话 |
| PINNED | 1   | 置顶的会话     |

#### API

##### 创建会话
> IPC: `conversation.create`

| 字段 | 类型         | 描述     |
| ---- | ------------ | -------- |
| data | Conversation | 会话数据 |

创建一个新的会话，返回会话 ID。

##### 更新会话状态
> IPC: `conversation.flag`

| 字段 | 类型             | 描述     |
| ---- | ---------------- | -------- |
| id   | string           | 会话 ID  |
| flag | ConversationFlag | 会话标记 |

更新一个会话的状态。

##### 更新会话草稿
> IPC: `conversation.draft`

| 字段    | 类型   | 描述     |
| ------- | ------ | -------- |
| id      | string | 会话 ID  |
| content | string | 草稿内容 |

缓存草稿到这个会话中。

##### 阅读会话
> IPC: `conversation.reading`

| 字段 | 类型   | 描述     |
| ---- | ------ | ------- |
| id   | string | 会话 ID |

标记会话为阅读状态，清除且不更新该会话的未读消息数。

##### 删除会话
> IPC: `conversation.delete`

| 字段 | 类型   | 描述    |
| ---- | ------ | ------- |
| id   | string | 会话 ID |

删除一个会话。

##### 获取会话列表
> IPC: `conversation.list`

| 字段 | 类型   | 描述    |
| ---- | ------ | ------- |
| next | string | 分页 ID |
| limit | number | 分页大小 |

获取完整的会话列表。返回一个 Conversation 的分页列表。

#### 事件

##### conversation-created

会话被创建时触发，必须资源：channel、message、user、conversation

##### conversation-updated

会话更新时触发，必须资源：channel、message、user、conversation

## 状态(Presence)

TODO
