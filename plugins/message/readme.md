# @satoriapp/plugin-message

用于 Satori Desktop 的消息服务插件。

## Sequence 算法

插件的 sequence 脱胎自 `snowflake` 算法，确保生成唯一且有序的 ID。

### 结构

```
+-------------------------------+
| 10 Bit Zero                   |
+-------------------------------+
| 42 Bit Timestamp (ms)         |
+-------------------------------+
| 12 Bit Sequence Number        |
+-------------------------------+
```

- **10 Bit Zero**: 保留位，始终为 0。
- **42 Bit Timestamp (ms)**: 毫秒时间戳，以 Unix Epoch 为基准，即 1970 至 2109 年间的时间。
- **12 Bit Sequence Number**: 序列号，范围为 0-4095，用于在同一毫秒内生成多个唯一 ID。

### 工作原理
