# Uniswap-v2 Interface
- 该分支用来部署uniswap-v2的前端代码
- 从master的20200807提交中创建分支
- 合约代码已部署到BSCTestNet
- 修改的合约地址可在提交记录中查看
- 启动tokenList服务
    - cd token_server
    - node TokenList.js
    - 返回token list
- 启动web服务
    - npm install
    - npm run start
- [合约地址](https://github.com/sicw/uniswap-v2-contracts)
- [新增chainId](https://github.com/sicw/uniswap-v2-sdk)

- webstorm启动后端调试
-- npm run start 正常启动服务
-- 编辑configuration add JavaScriptDebug
-- url: http://localhost:3000