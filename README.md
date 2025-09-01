> # <a id="文档顶部" href="#文档目录">文档目录↘</a>

# LazierServer
一个可以快速搭建的服务器

# 基于 [LocalServer](#lazierserver) 改进的一个可以快速搭建伪站点的服务器

# 核心技术栈
**`Brain` + `Koa` + `Vue` + `NaiveUI`**

# 快速启动

### 1. 下载项目
* 使用git命令克隆main分支 `git clone https://github.com/lazier334/LazierServer.git`
* 或[下载main分支压缩包](https://github.com/lazier334/LazierServer/archive/refs/heads/main.zip)
* 或[下载手动滚动发布版本main分支](https://github.com/lazier334/LazierServer/releases/download/%E6%89%8B%E5%8A%A8%E6%BB%9A%E5%8A%A8%E5%8F%91%E5%B8%83/LazierServer-main.zip)，**滚动发布版本tag中的源码不是最新版**

### 2. 在项目目录中使用命令 `npm i` 安装依赖
* 运行命令 `npm i`

### 3. 使用命令 `npm start` 启动项目
* 运行命令 `npm start`
* 或运行 [strat.bat](./bin/start.bat) / [strat.sh](./bin/start.sh) 脚本

# 文件夹说明
```c
LazierServer
├─ bin              // 脚本工具
├─ ld               // 本地数据，主要
│  ├─ banner.txt    // banner图
│  ├─ config.json   // 本地配置
│  ├─ logs          // .日志文件夹
│  ├─ plugins       // 本地插件，以及插件的相关代码
│  │  ├─ classes    // 插件用到的类
│  │  ├─ externals  // 第三方插件的主代码
│  │  ├─ libs       // 插件用到的库
│  │  ├─ utils      // 插件用到的工具
│  │  ├─ pluginTemp // .插件的临时上传、下载、解压文件夹
│  │  └─ other file // 插件文件
│  └─ web           // 项目资源站
│     ├─ example    // 文件夹 站点，示例站点
│     ├─ index      // 文件夹 站点，主站点
│     ├─ plugin     // 文件夹 站点，插件示例站点
│     ├─ a.com.har  // 文件   站点，har站点
│     └─ other      // 其他站点，名字自取
├─ public           // 系统公开的资源
├─ src              // 代码
│  ├─ app.js        // 主程序
│  └─ libs          // 系统库(包)
└─ tests            // 测试项
```

# 其他
* git 忽略跟踪指定文件 `git update-index --assume-unchanged tests/testApi.js`
* git 恢复跟踪指定文件 `git update-index --no-assume-unchanged tests/testApi.js`

> # <a id="文档目录" href="#文档顶部">文档顶部↗</a>
- [LazierServer](#lazierserver)
- [基于 LocalServer 改进的一个可以快速搭建伪站点的服务器](#基于-localserver-改进的一个可以快速搭建伪站点的服务器)
- [核心技术栈](#核心技术栈)
- [快速启动](#快速启动)
    - [1. 下载项目](#1-下载项目)
    - [2. 在项目目录中使用命令 `npm i` 安装依赖](#2-在项目目录中使用命令-npm-i-安装依赖)
    - [3. 使用命令 `npm start` 启动项目](#3-使用命令-npm-start-启动项目)
- [文件夹说明](#文件夹说明)
- [其他](#其他)
> ---