# dsh-message-collapse

DSH Web 用户消息折叠插件。发送的消息超过 10 行自动折叠，点击「展开全部」查看完整内容。

## 安装

```bash
dsh plugin --profile web add github:masknull/dsh-message-collapse
```

安装后**重启 DSH** 生效。

## 使用

无需任何配置。给助手发一条长消息，消息气泡右下角会出现「展开全部」按钮：

- 单击「展开全部」→ 显示完整内容，按钮变为「收起」
- 单击「收起」→ 恢复折叠
- 短消息（≤10 行）不显示按钮，与默认行为一致

## 卸载

```bash
dsh plugin --profile web remove dsh-message-collapse
```

重启 DSH 后恢复默认。

## License

[MIT](./LICENSE)